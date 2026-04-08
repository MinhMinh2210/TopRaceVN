'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, CreditCard, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRuns: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [users, runs, revenue, subs] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('runs').select('*', { count: 'exact', head: true }),
        supabase.from('payment_logs').select('amount', { count: 'exact', head: true }),
        supabase.from('user_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalRuns: runs.count || 0,
        totalRevenue: (revenue.count || 0) * 50000, // ước tính tạm
        activeSubscriptions: subs.count || 0,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-black mb-8 text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-400">Tổng User</CardTitle>
            <Users className="w-5 h-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white">{stats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-400">Tổng Run</CardTitle>
            <Activity className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white">{stats.totalRuns}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-400">Doanh thu</CardTitle>
            <CreditCard className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white">{stats.totalRevenue.toLocaleString()}đ</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-400">Gói đang active</CardTitle>
            <Trophy className="w-5 h-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-black text-white">{stats.activeSubscriptions}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}