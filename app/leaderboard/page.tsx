'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trophy, Car, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'speed' | 'acceleration'>('speed');
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [data, setData] = useState<any[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // ==================== INIT AUTH ====================
  const checkAuth = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ==================== GOOGLE LOGIN ====================
  const handleGoogleLogin = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/leaderboard',
      },
    });
  }, []);

  // ==================== LOAD LEADERBOARD DATA ====================
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('runs')
      .select(`
        id,
        user_id,
        max_speed,
        zero_to_hundred,
        region,
        created_at,
        vehicles (
          nickname,
          vehicle_type
        )
      `);
        
    if (regionFilter !== 'all') query = query.eq('region', regionFilter);
    if (typeFilter !== 'all') query = query.eq('vehicles.vehicle_type', typeFilter);

    if (activeTab === 'speed') {
      query = query
        .order('max_speed', { ascending: false })
        .not('max_speed', 'is', null)
        .gt('max_speed', 0);
    } else {
      query = query
        .order('zero_to_hundred', { ascending: true })
        .not('zero_to_hundred', 'is', null)
        .gt('zero_to_hundred', 0);
    }

    const { data: result, error } = await query.limit(50);

    if (error) {
      console.error('Lỗi load leaderboard chi tiết:', error);
      setData([]);
      setLoading(false);
      return;
    }

    const formatted = (result || []).map((item: any, index: number) => ({
      rank: index + 1,
      user_id: item.user_id,
      nickname: item.vehicles?.nickname || 'Không có tên',
      vehicle_type: item.vehicles?.vehicle_type || '',
      value: activeTab === 'speed' ? item.max_speed : item.zero_to_hundred,
      region: item.region || 'Không xác định',
      created_at: item.created_at,
    }));

    setData(formatted);
    setLoading(false);
  }, [user, activeTab, regionFilter, typeFilter]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [loadData]);

  // ==================== LOADING AUTH ====================
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-5">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-black mb-2">Bảng Xếp Hạng</h1>
            <p className="text-zinc-400 mb-8">Đăng nhập để xem bảng xếp hạng toàn quốc</p>

            <Button
              onClick={handleGoogleLogin}
              className="w-full mx-auto py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google Login
            </Button>

            <Button
              variant="outline"
              className="w-full mt-4 py-6 text-base"
              onClick={() => window.location.href = '/'}
            >
              ← Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== ĐÃ ĐĂNG NHẬP - BẢNG XẾP HẠNG (UI giống TripRank) ====================
  return (
    <div className="min-h-screen bg-zinc-950 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header giống TripRank */}
        <div className="text-center pt-8 pb-6">
          <div className="inline-flex items-center gap-2 text-4xl font-black tracking-tighter text-white">
            <span className="text-cyan-400">Trip</span>
            <span>Rank</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Leaderboard</h1>
          <p className="text-zinc-400 flex items-center justify-center gap-2 mt-2 text-lg">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            {regionFilter === 'all' ? 'Toàn Quốc' : regionFilter} • {activeTab === 'speed' ? 'Top Speed' : '0-100 km/h'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'speed' | 'acceleration')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-700">
            <TabsTrigger value="speed" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black font-semibold">Top Speed</TabsTrigger>
            <TabsTrigger value="acceleration" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black font-semibold">0-100 km/h</TabsTrigger>
          </TabsList>

          <div className="flex gap-3 mt-8 mb-6">
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="flex-1 bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toàn quốc</SelectItem>
                <SelectItem value="TP.HCM">TP.HCM</SelectItem>
                <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                <SelectItem value="Cần Thơ">Cần Thơ</SelectItem>

                <SelectItem value="An Giang">An Giang</SelectItem>
                <SelectItem value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</SelectItem>
                <SelectItem value="Bạc Liêu">Bạc Liêu</SelectItem>
                <SelectItem value="Bắc Giang">Bắc Giang</SelectItem>
                <SelectItem value="Bắc Kạn">Bắc Kạn</SelectItem>
                <SelectItem value="Bắc Ninh">Bắc Ninh</SelectItem>
                <SelectItem value="Bến Tre">Bến Tre</SelectItem>
                <SelectItem value="Bình Định">Bình Định</SelectItem>
                <SelectItem value="Bình Dương">Bình Dương</SelectItem>
                <SelectItem value="Bình Phước">Bình Phước</SelectItem>
                <SelectItem value="Bình Thuận">Bình Thuận</SelectItem>
                <SelectItem value="Cà Mau">Cà Mau</SelectItem>
                <SelectItem value="Cao Bằng">Cao Bằng</SelectItem>
                <SelectItem value="Đắk Lắk">Đắk Lắk</SelectItem>
                <SelectItem value="Đắk Nông">Đắk Nông</SelectItem>
                <SelectItem value="Điện Biên">Điện Biên</SelectItem>
                <SelectItem value="Đồng Nai">Đồng Nai</SelectItem>
                <SelectItem value="Đồng Tháp">Đồng Tháp</SelectItem>
                <SelectItem value="Gia Lai">Gia Lai</SelectItem>
                <SelectItem value="Hà Giang">Hà Giang</SelectItem>
                <SelectItem value="Hà Nam">Hà Nam</SelectItem>
                <SelectItem value="Hà Tĩnh">Hà Tĩnh</SelectItem>
                <SelectItem value="Hải Dương">Hải Dương</SelectItem>
                <SelectItem value="Hậu Giang">Hậu Giang</SelectItem>
                <SelectItem value="Hòa Bình">Hòa Bình</SelectItem>
                <SelectItem value="Hưng Yên">Hưng Yên</SelectItem>
                <SelectItem value="Khánh Hòa">Khánh Hòa</SelectItem>
                <SelectItem value="Kiên Giang">Kiên Giang</SelectItem>
                <SelectItem value="Kon Tum">Kon Tum</SelectItem>
                <SelectItem value="Lai Châu">Lai Châu</SelectItem>
                <SelectItem value="Lâm Đồng">Lâm Đồng</SelectItem>
                <SelectItem value="Lạng Sơn">Lạng Sơn</SelectItem>
                <SelectItem value="Lào Cai">Lào Cai</SelectItem>
                <SelectItem value="Long An">Long An</SelectItem>
                <SelectItem value="Nam Định">Nam Định</SelectItem>
                <SelectItem value="Nghệ An">Nghệ An</SelectItem>
                <SelectItem value="Ninh Bình">Ninh Bình</SelectItem>
                <SelectItem value="Ninh Thuận">Ninh Thuận</SelectItem>
                <SelectItem value="Phú Thọ">Phú Thọ</SelectItem>
                <SelectItem value="Phú Yên">Phú Yên</SelectItem>
                <SelectItem value="Quảng Bình">Quảng Bình</SelectItem>
                <SelectItem value="Quảng Nam">Quảng Nam</SelectItem>
                <SelectItem value="Quảng Ngãi">Quảng Ngãi</SelectItem>
                <SelectItem value="Quảng Ninh">Quảng Ninh</SelectItem>
                <SelectItem value="Quảng Trị">Quảng Trị</SelectItem>
                <SelectItem value="Sóc Trăng">Sóc Trăng</SelectItem>
                <SelectItem value="Sơn La">Sơn La</SelectItem>
                <SelectItem value="Tây Ninh">Tây Ninh</SelectItem>
                <SelectItem value="Thái Bình">Thái Bình</SelectItem>
                <SelectItem value="Thái Nguyên">Thái Nguyên</SelectItem>
                <SelectItem value="Thanh Hóa">Thanh Hóa</SelectItem>
                <SelectItem value="Thừa Thiên Huế">Thừa Thiên Huế</SelectItem>
                <SelectItem value="Tiền Giang">Tiền Giang</SelectItem>
                <SelectItem value="Trà Vinh">Trà Vinh</SelectItem>
                <SelectItem value="Tuyên Quang">Tuyên Quang</SelectItem>
                <SelectItem value="Vĩnh Long">Vĩnh Long</SelectItem>
                <SelectItem value="Vĩnh Phúc">Vĩnh Phúc</SelectItem>
                <SelectItem value="Yên Bái">Yên Bái</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="flex-1 bg-zinc-900 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả xe</SelectItem>
                <SelectItem value="xe_ga">Xe ga</SelectItem>
                <SelectItem value="xe_số">Xe số</SelectItem>
                <SelectItem value="xe_côn_tay">Xe côn tay</SelectItem>
                <SelectItem value="oto">Ô tô</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="speed" className="mt-2">
            <LeaderboardTable data={data} type="speed" loading={loading} user={user} />
          </TabsContent>

          <TabsContent value="acceleration" className="mt-2">
            <LeaderboardTable data={data} type="acceleration" loading={loading} user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LeaderboardTable({ 
  data, 
  type, 
  loading,
  user 
}: { 
  data: any[]; 
  type: 'speed' | 'acceleration'; 
  loading: boolean;
  user: any;
}) {
  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 w-full">
        <CardContent className="p-12 text-center text-zinc-400">
          Đang tải bảng xếp hạng...
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 w-full">
        <CardContent className="p-12 text-center text-zinc-400">
          Chưa có dữ liệu run nào. Hãy chạy và ghi lại kết quả đầu tiên!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const isCurrentUser = item.user_id === user?.id;
        const rank = item.rank;

        // Màu medal top 3
        let medalColor = 'text-zinc-400';
        if (rank === 1) medalColor = 'text-yellow-400';
        else if (rank === 2) medalColor = 'text-zinc-300';
        else if (rank === 3) medalColor = 'text-amber-600';

        return (
          <div
            key={item.rank}
            onClick={() => window.location.href = `/profile/${item.user_id}`}
            className={`
              group flex items-center gap-4 rounded-3xl p-5 transition-all hover:scale-[1.02] cursor-pointer
              ${isCurrentUser 
                ? 'bg-gradient-to-r from-cyan-950 to-zinc-900 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/30' 
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
              }
            `}
          >
            {/* Rank + Medal */}
            <div className="w-12 flex-shrink-0 flex items-center justify-center">
              {rank <= 3 ? (
                <div className={`flex items-center justify-center w-11 h-11 rounded-2xl ${medalColor}`}>
                  <Medal className="w-8 h-8 drop-shadow-md" />
                </div>
              ) : (
                <div className="text-3xl font-black text-zinc-400 group-hover:text-white transition-colors">
                  #{rank}
                </div>
              )}
            </div>

            {/* Car thumbnail (placeholder - giống hình TripRank) */}
            <div className="w-14 h-14 flex-shrink-0 bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 flex items-center justify-center">
              <Car className="w-9 h-9 text-emerald-400" />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {isCurrentUser && (
                  <span className="px-4 py-1 text-xs font-bold bg-cyan-400 text-black rounded-3xl flex items-center gap-1">
                    <span className="text-base">👤</span> YOU
                  </span>
                )}
                <p className="font-semibold text-white text-lg truncate">
                  {item.nickname}
                </p>
              </div>
              <p className="text-zinc-400 text-sm mt-0.5 flex items-center gap-1">
                {item.region} • {item.vehicle_type.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Value (giống TripRank) */}
            <div className="text-right">
              <div className="text-4xl font-black text-emerald-400 tracking-tighter">
                {item.value}
              </div>
              <div className="text-xs uppercase font-medium text-zinc-400 mt-px">
                {type === 'speed' ? 'km/h' : 'giây'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}