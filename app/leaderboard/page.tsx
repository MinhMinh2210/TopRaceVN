'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'speed' | 'acceleration'>('speed');
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
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

    // Lọc theo khu vực và loại xe
    if (regionFilter !== 'all') query = query.eq('region', regionFilter);
    if (typeFilter !== 'all') query = query.eq('vehicles.vehicle_type', typeFilter);

    // Sắp xếp + chỉ lấy run hợp lệ - ĐÃ SỬA (bỏ .gt('max_speed', 0) để cho phép 0 km/h)
    if (activeTab === 'speed') {
      query = query
        .order('max_speed', { ascending: false })
        .not('max_speed', 'is', null);
    } else {
      query = query
        .order('zero_to_hundred', { ascending: true })
        .not('zero_to_hundred', 'is', null);
    }

    const { data: result, error } = await query.limit(50);

    if (error) {
      console.error('Lỗi load leaderboard chi tiết:', error);
      setData([]);
      setLoading(false);
      return;
    }

    // Rank thật = vị trí sau khi sắp xếp
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
  };

  useEffect(() => {
    loadData();

    // Realtime
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'runs' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, regionFilter, typeFilter]);

  return (
    <div className="space-y-6 pb-20 px-3">
      <h1 className="text-3xl font-black text-center">Bảng Xếp Hạng</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="speed">Top Speed</TabsTrigger>
          <TabsTrigger value="acceleration">0-100 km/h</TabsTrigger>
        </TabsList>

        <div className="flex gap-3 mt-6 mb-4">
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toàn quốc</SelectItem>
              <SelectItem value="TP.HCM">TP.HCM</SelectItem>
              <SelectItem value="Hà Nội">Hà Nội</SelectItem>
              <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="flex-1">
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
          <LeaderboardTable data={data} type="speed" loading={loading} />
        </TabsContent>

        <TabsContent value="acceleration" className="mt-2">
          <LeaderboardTable data={data} type="acceleration" loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderboardTable({ 
  data, 
  type, 
  loading 
}: { 
  data: any[]; 
  type: 'speed' | 'acceleration'; 
  loading: boolean 
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
    <Card className="bg-zinc-900 border-zinc-800 w-full">
      <CardHeader>
        <CardTitle className="text-xl">
          {type === 'speed' ? 'Top Speed' : '0-100 km/h'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="text-left py-4 px-5 font-medium w-12">Hạng</th>
                <th className="text-left py-4 px-5 font-medium">Xe</th>
                <th className="text-left py-4 px-5 font-medium">Loại</th>
                <th className="text-right py-4 px-5 font-medium">
                  {type === 'speed' ? 'Tốc độ' : '0-100'}
                </th>
                <th className="text-right py-4 px-5 font-medium">Khu vực</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr 
                  key={item.rank} 
                  className="border-b border-zinc-800 last:border-none hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => window.location.href = `/profile/${item.user_id}`}
                >
                  <td className="px-5 py-5 font-bold text-green-400">#{item.rank}</td>
                  <td className="px-5 py-5 font-medium">{item.nickname}</td>
                  <td className="px-5 py-5 capitalize text-zinc-400">
                    {item.vehicle_type.replace('_', ' ')}
                  </td>
                  <td className="px-5 py-5 text-right font-bold text-green-400">
                    {item.value} {type === 'speed' ? 'km/h' : 's'}
                  </td>
                  <td className="px-5 py-5 text-right text-zinc-400">{item.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}