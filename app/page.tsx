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
  const [currentRank, setCurrentRank] = useState<number | null>(null);   // ← Rank thật
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

      // Lấy run tốt nhất
      const { data: bestRunData } = await supabase
        .from('runs')
        .select('max_speed, zero_to_hundred, region')
        .eq('user_id', userId)
        .order('max_speed', { ascending: false })
        .limit(1)
        .single();

      setBestRun(bestRunData);

      // Tính rank thật (dựa trên max_speed)
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

        {/* 4. Rank hiện tại - ĐÃ LÀ DỮ LIỆU THẬT */}
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
              <p className="text-zinc-400 text-sm">TP.HCM • Top Speed</p>
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
      <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0">
        <CardContent className="p-10 text-center">
          <Car className="w-16 h-16 mx-auto mb-6 text-black" />
          <h2 className="text-4xl font-bold mb-3">Sẵn sàng chạy chưa?</h2>
          <p className="text-green-100 mb-8">Bấm để bắt đầu ghi GPS ngay</p>
          <Button
            size="lg"
            className="bg-black hover:bg-zinc-900 text-white text-xl px-16 py-8 rounded-2xl w-full"
          >
            🚀 BẮT ĐẦU RUN NGAY
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}