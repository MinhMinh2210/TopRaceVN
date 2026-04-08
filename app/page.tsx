import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Car, Trophy, Clock, Gauge, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import LandingContent from './landing-content';
import DonateModal from './components/donate-modal';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Chưa login → render Landing (giữ nguyên code cũ)
  if (!user) {
    return <LandingContent />;
  }

  // Đã login → fetch trên Server (tối ưu Edge Requests)
  const userId = user.id;

  const [vehicleRes, bestRunRes, todayCountRes] = await Promise.all([
    supabase.from('vehicles').select('*').eq('user_id', userId).limit(1).single(),
    supabase.from('runs').select('max_speed, zero_to_hundred, region').eq('user_id', userId).order('max_speed', { ascending: false }).limit(1).single(),
    supabase.from('runs').select('*', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', new Date().toISOString().split('T')[0]),
  ]);

  const vehicle = vehicleRes.data;
  const bestRun = bestRunRes.data;
  const runCountToday = todayCountRes.count || 0;

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