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
      // Parse User ID từ memo (ví dụ: USER123 PRO30)
      const userMatch = memo.match(/USER([a-zA-Z0-9]+)/i);
      const userId = userMatch ? userMatch[1] : memo.trim();

      const { data: user } = await supabase.from('profiles').select('id, nickname').eq('id', userId).single();
      if (!user) throw new Error('Không tìm thấy user');

      // Tìm gói
      const packageName = memo.toUpperCase().includes('PRO') ? 'PRO30' : 
                         memo.toUpperCase().includes('VIP') ? 'VIP90' : 'BASIC30';

      const { data: pkg } = await supabase.from('packages').select('*').eq('name', packageName).single();
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
        approved_by: null
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
          <CardTitle>Duyệt Thanh Toán Thủ Công</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Nội dung chuyển khoản</Label>
            <Input
              placeholder="Ví dụ: USER123 PRO30"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="h-12 text-lg"
            />
          </div>

          <Button onClick={handleApprove} disabled={loading || !memo} className="w-full py-6 text-lg">
            {loading ? 'Đang xử lý...' : 'Duyệt & Cấp Gói Ngay'}
          </Button>

          {error && <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-2xl flex gap-3"><AlertCircle /> <p>{error}</p></div>}

          {result && (
            <div className="bg-green-900/30 border border-green-500 text-green-300 p-6 rounded-3xl text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-4" />
              Đã cấp gói <strong>{result.package.display_name}</strong> cho <strong>{result.user.nickname}</strong>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}