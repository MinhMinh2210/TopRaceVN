import { createClient } from '@/lib/supabase/server';
import { loginWithGoogle } from '@/app/features/auth/login';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { Car, Trophy, Clock, Gauge, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DonateModal = dynamic(() => import('./components/donate-modal'), {
  ssr: false,
  loading: () => <div className="h-8 bg-zinc-900 rounded-2xl animate-pulse" />,
});

// ==================== LANDING (CHƯA LOGIN) - VẪN LÀ CLIENT COMPONENT ====================
'use client';

import { useState, useEffect, useMemo } from 'react';

type Slide = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bg: string;
};

function LandingContent() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = useMemo(() => [
    { title: "ĐUA TỐC ĐỘ THẬT", subtitle: "GPS chính xác • Rank toàn quốc", icon: <Gauge className="w-12 h-12 text-green-500" />, bg: "from-green-600 to-emerald-700" },
    { title: "0-100 KM/H", subtitle: "Thử thách tăng tốc nhanh nhất", icon: <Gauge className="w-12 h-12 text-yellow-400" />, bg: "from-yellow-500 to-orange-600" },
    { title: "BẢNG XẾP HẠNG", subtitle: "Top racer Việt Nam", icon: <Trophy className="w-12 h-12 text-amber-400" />, bg: "from-amber-500 to-red-600" },
    { title: "CỘNG ĐỒNG RACER", subtitle: "Kết nối - Thi đấu - Thách đấu", icon: <User className="w-12 h-12 text-cyan-400" />, bg: "from-cyan-500 to-blue-600" },
  ], []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden pb-20">
      <div className="pt-12 px-6 text-center">
        <h1 className="text-[2.8rem] md:text-[3.2rem] font-black leading-none tracking-tighter">
          81 VIETNAM SPEED RANK
        </h1>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 mx-4 mt-10 max-w-[340px] mx-auto shadow-2xl">
        <CardContent className="p-8">
          <div className="relative h-[320px] overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 flex flex-col items-center justify-center text-center px-4
                  ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              >
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.bg} flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                  {slide.icon}
                </div>
                <h2 className="text-3xl font-black mb-2">{slide.title}</h2>
                <p className="text-lg text-green-400">{slide.subtitle}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentSlide ? 'bg-green-500 w-8' : 'bg-zinc-600'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="px-6 mt-12">
        <Button
          onClick={handleGoogleLogin}
          size="lg"
          className="w-full py-8 text-xl font-semibold bg-white text-black hover:bg-zinc-100 rounded-3xl flex items-center justify-center gap-3"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
          Google Login
        </Button>
      </div>

      <div className="flex justify-center items-center gap-2 text-zinc-500 text-sm mt-4">
        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
        <span>Powered by Google</span>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 py-2 px-6 flex justify-around text-xs text-zinc-400 z-50">
        <div className="flex flex-col items-center text-green-500"><Car className="w-6 h-6" /><span className="mt-1">Trang chủ</span></div>
        <div className="flex flex-col items-center"><Clock className="w-6 h-6" /><span className="mt-1">Run</span></div>
        <div className="flex flex-col items-center"><Car className="w-6 h-6" /><span className="mt-1">Xe</span></div>
        <div className="flex flex-col items-center"><Trophy className="w-6 h-6" /><span className="mt-1">Rank</span></div>
        <div className="flex flex-col items-center"><User className="w-6 h-6" /><span className="mt-1">Tôi</span></div>
      </div>
    </div>
  );
}

// ==================== SERVER COMPONENT - DASHBOARD (ĐÃ LOGIN) ====================
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingContent />;
  }

  const userId = user.id;

  // Fetch parallel
  const [vehicleRes, bestRunRes, todayCountRes] = await Promise.all([
    supabase.from('vehicles').select('*').eq('user_id', userId).limit(1).single(),
    supabase.from('runs').select('max_speed, zero_to_hundred, region').eq('user_id', userId).order('max_speed', { ascending: false }).limit(1).single(),
    supabase.from('runs').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', new Date().toISOString().split('T')[0]),
  ]);

  const vehicle = vehicleRes.data;
  const bestRun = bestRunRes.data;
  const runCountToday = todayCountRes.count || 0;

  // Tính rank (đã fix lỗi any type)
  let currentRank = '--';
  if (bestRun?.max_speed) {
    const { count } = await supabase
      .from('runs')
      .select('*', { count: 'exact', head: true })
      .gt('max_speed', bestRun.max_speed);
    currentRank = ((count || 0) + 1).toString();
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-black">VietNam Racingboy</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-5 h-5 text-green-500" />
              Top Speed tốt nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-500">
              {bestRun?.max_speed?.toFixed(1) || '--'}
            </p>
            <p className="text-zinc-400 text-sm">km/h</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5 text-green-500" />
              0-100 nhanh nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-500">
              {bestRun?.zero_to_hundred?.toFixed(1) || '--'}
            </p>
            <p className="text-zinc-400 text-sm">giây</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Car className="w-5 h-5 text-green-500" />
              Hệ xe hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white capitalize">
              {vehicle?.vehicle_type?.replace('_', ' ') || 'Chưa có xe'}
            </p>
            <p className="text-zinc-400 text-sm">
              {vehicle ? `${vehicle.nickname} • ${vehicle.mod_level}` : 'Hãy tạo xe trước'}
            </p>
          </CardContent>
        </Card>

        <Link href="/leaderboard" prefetch={false} className="block">
          <Card className="bg-zinc-900 border-zinc-800 cursor-pointer hover:bg-zinc-800 active:scale-[0.985] transition-all h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="w-5 h-5 text-green-500" />
                Rank hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-green-500">#{currentRank}</p>
              <p className="text-zinc-400 text-sm">
                {bestRun?.region || 'Chưa xác định'} • Top Speed
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-zinc-900 border-zinc-800 col-span-2 md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Số Run hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{runCountToday}</p>
          </CardContent>
        </Card>
      </div>

      <DonateModal />
    </div>
  );
}