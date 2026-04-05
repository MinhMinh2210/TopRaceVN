'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Car, Trophy, Clock, Gauge, User } from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { loginWithGoogle } from '@/app/features/auth/login';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
  mod_level: string;
};

type Run = {
  max_speed: number;
  zero_to_hundred: number;
  region: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [bestRun, setBestRun] = useState<Run | null>(null);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [runCountToday, setRunCountToday] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "ĐUA TỐC ĐỘ THẬT",
      subtitle: "GPS chính xác • Rank toàn quốc",
      icon: <Gauge className="w-12 h-12 text-green-500" />,
      bg: "from-green-600 to-emerald-700",
    },
    {
      title: "0-100 KM/H",
      subtitle: "Thử thách tăng tốc nhanh nhất",
      icon: <Gauge className="w-12 h-12 text-yellow-400" />,
      bg: "from-yellow-500 to-orange-600",
    },
    {
      title: "BẢNG XẾP HẠNG",
      subtitle: "Top racer Việt Nam",
      icon: <Trophy className="w-12 h-12 text-amber-400" />,
      bg: "from-amber-500 to-red-600",
    },
    {
      title: "CỘNG ĐỒNG RACER",
      subtitle: "Kết nối - Thi đấu - Thách đấu",
      icon: <User className="w-12 h-12 text-cyan-400" />,
      bg: "from-cyan-500 to-blue-600",
    },
  ];

  // ==================== CAROUSEL AUTO SLIDE ====================
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // ==================== INIT USER + DASHBOARD DATA ====================
  const init = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);

    if (!u) {
      setIsAuthLoading(false);
      return;
    }

    const userId = u.id;

    // Fetch vehicle
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();
    setVehicle(vehicleData);

    // Fetch best run
    const { data: bestRunData } = await supabase
      .from('runs')
      .select('max_speed, zero_to_hundred, region')
      .eq('user_id', userId)
      .order('max_speed', { ascending: false })
      .limit(1)
      .single();
    setBestRun(bestRunData);

    // Calculate current rank (global)
    if (bestRunData?.max_speed) {
      const { count } = await supabase
        .from('runs')
        .select('*', { count: 'exact', head: true })
        .gt('max_speed', bestRunData.max_speed);
      setCurrentRank((count || 0) + 1);
    }

    // Count runs today
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
      .from('runs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today);
    setRunCountToday(todayCount || 0);

    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const handleGoogleLogin = useCallback(async () => {
    await loginWithGoogle();
  }, []);

  // ==================== LOADING ====================
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  // ==================== CHƯA ĐĂNG NHẬP ====================
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white overflow-hidden pb-20">
        {/* SPEED RANK */}
        <div className="pt-12 px-6 text-center">
          <h1 className="text-[2.8rem] md:text-[3.2rem] font-black leading-none tracking-tighter">
            81 VIETNAM SPEED RANK
          </h1>
        </div>

        {/* CAROUSEL CARD */}
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

            {/* Dots */}
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

        {/* Nút Google */}
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

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 py-2 px-6 flex justify-around text-xs text-zinc-400 z-50">
          <div className="flex flex-col items-center text-green-500">
            <Car className="w-6 h-6" />
            <span className="mt-1">Trang chủ</span>
          </div>
          <div className="flex flex-col items-center">
            <Clock className="w-6 h-6" />
            <span className="mt-1">Run</span>
          </div>
          <div className="flex flex-col items-center">
            <Car className="w-6 h-6" />
            <span className="mt-1">Xe</span>
          </div>
          <div className="flex flex-col items-center">
            <Trophy className="w-6 h-6" />
            <span className="mt-1">Rank</span>
          </div>
          <div className="flex flex-col items-center">
            <User className="w-6 h-6" />
            <span className="mt-1">Tôi</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== ĐÃ ĐĂNG NHẬP - DASHBOARD ====================
  return (
    <div className="space-y-6">
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

        <Link href="/leaderboard" className="block">
          <Card className="bg-zinc-900 border-zinc-800 cursor-pointer hover:bg-zinc-800 active:scale-[0.985] transition-all h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="w-5 h-5 text-green-500" />
                Rank hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-green-500">
                #{currentRank || '--'}
              </p>
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

      <Card className="bg-gradient-to-br from-zinc-900 to-emerald-950 border border-emerald-500/30 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-emerald-400 text-sm font-medium tracking-widest">KHU VỰC HIỆN TẠI</p>
              <p className="text-3xl font-bold text-white">TP.HCM</p>
            </div>
            <div className="text-right">
              <div className="text-6xl mb-1">☀️</div>
              <p className="text-4xl font-semibold text-white">33°C</p>
              <p className="text-emerald-300 text-sm">Nắng nóng • Độ ẩm 62%</p>
            </div>
          </div>

          <div className="bg-black/40 rounded-3xl p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-zinc-400 text-sm">SỐ VỆ TINH GPS ĐANG KẾT NỐI</p>
                <p className="text-5xl font-black text-cyan-400">17 <span className="text-2xl text-cyan-300">/ 24</span></p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-sm font-medium px-4 py-2 rounded-2xl">
                  <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                  TÍN HIỆU RẤT TỐT
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-zinc-400 text-sm mb-4">KHU VỰC LÂN CẬN</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center bg-black/30 rounded-2xl p-4">
                <p className="text-xs text-zinc-400">Bình Dương</p>
                <p className="text-2xl">34°C</p>
                <p className="text-amber-400 text-sm">🌤️ 14 vệ tinh</p>
              </div>
              <div className="text-center bg-black/30 rounded-2xl p-4">
                <p className="text-xs text-zinc-400">Đồng Nai</p>
                <p className="text-2xl">32°C</p>
                <p className="text-amber-400 text-sm">⛅ 15 vệ tinh</p>
              </div>
              <div className="text-center bg-black/30 rounded-2xl p-4">
                <p className="text-xs text-zinc-400">Long An</p>
                <p className="text-2xl">35°C</p>
                <p className="text-amber-400 text-sm">☀️ 16 vệ tinh</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}