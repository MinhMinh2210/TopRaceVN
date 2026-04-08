'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    if (!memo.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Parse memo (ví dụ: USER123 PRO30)
      const match = memo.match(/USER([a-zA-Z0-9]+)/i);
      const userIdPart = match ? match[1] : memo.trim();

      // Tìm user
      const { data: user } = await supabase
        .from('profiles')
        .select('id, nickname')
        .eq('id', userIdPart)
        .single();

      if (!user) throw new Error('Không tìm thấy user');

      // Tìm gói theo tên trong memo
      const packageName = memo.toUpperCase().includes('PRO') ? 'PRO30' : 
                         memo.toUpperCase().includes('VIP') ? 'VIP90' : 'BASIC30';

      const { data: pkg } = await supabase
        .from('packages')
        .select('*')
        .eq('name', packageName)
        .single();

      if (!pkg) throw new Error('Không tìm thấy gói cước');

      // Cấp gói
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + pkg.duration_days);

      await supabase.from('user_subscriptions').insert({
        user_id: user.id,
        package_id: pkg.id,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        remaining_runs: pkg.max_runs,
        status: 'active'
      });

      // Lưu log
      await supabase.from('payment_logs').insert({
        user_id: user.id,
        package_id: pkg.id,
        amount: pkg.price,
        memo: memo,
        approved_by: null // sau này có thể thêm admin id
      });

      setResult({ success: true, user, package: pkg });
    } catch (err: any) {
      setError(err.message || 'Lỗi khi duyệt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Duyệt Thanh Toán Thủ Công</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Nội dung chuyển khoản (memo)</Label>
            <Input
              placeholder="Ví dụ: USER123 PRO30"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="h-12 text-lg"
            />
            <p className="text-xs text-zinc-400 mt-1">User sẽ ghi USERID + tên gói trong nội dung chuyển khoản</p>
          </div>

          <Button onClick={handleApprove} disabled={loading || !memo} className="w-full py-6 text-lg">
            {loading ? 'Đang xử lý...' : 'Duyệt & Cấp Gói'}
          </Button>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-2xl flex gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-900/30 border border-green-500 text-green-300 p-6 rounded-3xl">
              <CheckCircle className="w-8 h-8 mx-auto mb-4" />
              <p className="text-center text-lg font-medium">
                Đã cấp gói <strong>{result.package.display_name}</strong> cho user <strong>{result.user.nickname}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}