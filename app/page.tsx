'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car, Trophy, Clock, Gauge } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser();
      if (!u) {
        setLoading(false);
        return;
      }

      setUser(u);
      const userId = u.id;

      // Lấy xe đầu tiên
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single();

      setVehicle(vehicleData);

      // Lấy run tốt nhất (có luôn region)
      const { data: bestRunData } = await supabase
        .from('runs')
        .select('max_speed, zero_to_hundred, region')
        .eq('user_id', userId)
        .order('max_speed', { ascending: false })
        .limit(1)
        .single();

      setBestRun(bestRunData);

      // Tính rank thật
      if (bestRunData?.max_speed) {
        const { count } = await supabase
          .from('runs')
          .select('*', { count: 'exact', head: true })
          .gt('max_speed', bestRunData.max_speed);

        setCurrentRank((count || 0) + 1);
      }

      // Đếm số run hôm nay
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('runs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today);

      setRunCountToday(todayCount || 0);
      setLoading(false);
    };

    init();
  }, []);

  if (loading) {
    return <div className="text-center py-20">Đang tải dữ liệu...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-black text-green-500 mb-4">TopRaceVN</h1>
          <p className="text-2xl text-zinc-400 mb-10">Sân chơi rank tốc độ xe</p>
          <Button
            onClick={loginWithGoogle}
            size="lg"
            className="bg-white text-black hover:bg-zinc-100 text-lg px-10 py-6 rounded-2xl"
          >
            Đăng nhập bằng Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Chào mừng trở lại, Racer!</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* 1. Top Speed tốt nhất */}
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

        {/* 2. 0-100 nhanh nhất */}
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

        {/* 3. Hệ xe hiện tại */}
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

        {/* 4. Rank hiện tại - REGION LẤY TỪ RUN THẬT */}
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

        {/* 5. Số Run hôm nay */}
        <Card className="bg-zinc-900 border-zinc-800 col-span-2 md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Số Run hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{runCountToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Nút Bắt đầu Run lớn */}
      {/* ==================== CARD THỜI TIẾT + VỆ TINH GPS (ĐÃ SỬA LỖI) ==================== */}
      <Card className="bg-gradient-to-br from-zinc-900 to-emerald-950 border border-emerald-500/30 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-emerald-400 text-sm font-medium tracking-widest">KHU VỰC HIỆN TẠI</p>
              <p className="text-3xl font-bold text-white">TP.HCM</p>
            </div>
            
            {/* Thời tiết hiện tại */}
            <div className="text-right">
              <div className="text-6xl mb-1">☀️</div>
              <p className="text-4xl font-semibold text-white">33°C</p>
              <p className="text-emerald-300 text-sm">Nắng nóng • Độ ẩm 62%</p>
            </div>
          </div>

          {/* Số vệ tinh GPS */}
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

          {/* Khu vực lân cận */}
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