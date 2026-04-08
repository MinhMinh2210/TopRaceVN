'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, RefreshCw } from 'lucide-react';

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ==================== LOAD RUNS (CHỈ KHI ẤN) ====================
  const loadRuns = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('runs')
      .select(`
        id, max_speed, zero_to_hundred, region, created_at,
        profiles!user_id (nickname),
        vehicles (nickname)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    setRuns(data || []);
    setLoading(false);
  }, []);

  // ==================== DELETE RUN ====================
  const deleteRun = async (id: number) => {
    if (!confirm('Xóa run này?')) return;

    const { error } = await supabase.from('runs').delete().eq('id', id);
    if (error) {
      alert('Lỗi khi xóa: ' + error.message);
    } else {
      alert('✅ Đã xóa run thành công!');
      // KHÔNG tự load lại → user phải nhấn nút "Tải danh sách Run"
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">Quản lý Run</h1>
        <Button onClick={loadRuns} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {loading ? 'Đang tải...' : 'Tải danh sách Run'}
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-zinc-400">Đang tải danh sách run...</p>
      ) : runs.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="p-12 text-center text-zinc-400">
            Chưa có run nào. Nhấn "Tải danh sách Run" để xem
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Card key={run.id} className="bg-zinc-900 border-zinc-700">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-medium">{run.profiles?.nickname || 'User'}</p>
                  <p className="text-sm text-zinc-400">
                    {run.vehicles?.nickname} • {run.region} • {new Date(run.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-green-400">{run.max_speed} km/h</p>
                  {run.zero_to_hundred && <p className="text-xs text-cyan-400">0-100: {run.zero_to_hundred}s</p>}
                </div>
                <Button variant="destructive" size="icon" onClick={() => deleteRun(run.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}