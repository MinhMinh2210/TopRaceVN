'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRuns = async () => {
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
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const deleteRun = async (id: number) => {
    if (confirm('Xóa run này?')) {
      await supabase.from('runs').delete().eq('id', id);
      loadRuns();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black mb-6">Quản lý Run</h1>

      {loading ? (
        <p>Đang tải...</p>
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