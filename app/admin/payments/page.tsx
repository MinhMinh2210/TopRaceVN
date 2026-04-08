'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Load danh sách yêu cầu đang chờ + user + gói
  const loadData = async () => {
    setLoading(true);

    // Load pending payments
    const { data: payments } = await supabase
      .from('payment_logs')
      .select(`
        *,
        profiles!user_id (nickname),
        packages!package_id (display_name, price)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setPendingPayments(payments || []);

    // Load users và packages (cho phần duyệt thủ công)
    const [uRes, pRes] = await Promise.all([
      supabase.from('profiles').select('id, nickname').order('nickname'),
      supabase.from('packages').select('*').eq('is_active', true),
    ]);

    setUsers(uRes.data || []);
    setPackages(pRes.data || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cấp gói ngay từ pending request
  const approvePending = async (payment: any) => {
    if (!confirm(`Xác nhận cấp gói cho ${payment.profiles?.nickname}?`)) return;

    setLoading(true);

    try {
      const pkg = payment.packages;
      const endDate = new Date();
      if (pkg.duration_type === 'minutes') endDate.setMinutes(endDate.getMinutes() + pkg.duration_value);
      else if (pkg.duration_type === 'hours') endDate.setHours(endDate.getHours() + pkg.duration_value);
      else endDate.setDate(endDate.getDate() + pkg.duration_value);

      await supabase.from('user_subscriptions').insert({
        user_id: payment.user_id,
        package_id: payment.package_id,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        remaining_runs: pkg.max_runs,
        status: 'active'
      });

      // Cập nhật status payment_logs
      await supabase
        .from('payment_logs')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', payment.id);

      alert(`✅ Đã cấp gói ${pkg.display_name} cho user ${payment.profiles?.nickname}`);
      loadData(); // refresh danh sách
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xóa yêu cầu pending
  const deletePending = async (id: string) => {
    if (!confirm('Xóa yêu cầu thanh toán này?')) return;
    await supabase.from('payment_logs').delete().eq('id', id);
    loadData();
  };

  // Duyệt thủ công (giữ lại như cũ)
  const handleApproveManual = async () => {
    if (!selectedUserId || !selectedPackageId) return;
    setLoading(true);
    setError('');

    try {
      const { data: pkg } = await supabase.from('packages').select('*').eq('id', selectedPackageId).single();
      if (!pkg) throw new Error('Không tìm thấy gói');

      const endDate = new Date();
      if (pkg.duration_type === 'minutes') endDate.setMinutes(endDate.getMinutes() + pkg.duration_value);
      else if (pkg.duration_type === 'hours') endDate.setHours(endDate.getHours() + pkg.duration_value);
      else endDate.setDate(endDate.getDate() + pkg.duration_value);

      await supabase.from('user_subscriptions').insert({
        user_id: selectedUserId,
        package_id: pkg.id,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        remaining_runs: pkg.max_runs,
        status: 'active'
      });

      setResult({ success: true, userId: selectedUserId, package: pkg });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cấp gói');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-black mb-8">Duyệt Thanh Toán</h1>

      {/* DANH SÁCH YÊU CẦU ĐANG CHỜ */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Yêu cầu thanh toán đang chờ ({pendingPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <p className="text-zinc-400 py-8 text-center">Không có yêu cầu thanh toán nào đang chờ</p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((p) => (
                <Card key={p.id} className="bg-zinc-900 border-zinc-700">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{p.profiles?.nickname || 'Unknown User'}</p>
                      <p className="text-sm text-zinc-400">
                        {p.packages?.display_name} • {p.amount.toLocaleString()}đ
                      </p>
                      <p className="text-xs text-cyan-400 font-mono mt-1">{p.memo}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={() => approvePending(p)} className="bg-green-600 hover:bg-green-700">
                        Cấp gói ngay
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => deletePending(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DUYỆT THỦ CÔNG (giữ lại) */}
      <Card>
        <CardHeader>
          <CardTitle>Duyệt Thanh Toán Thủ Công</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Chọn User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nickname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Chọn gói cước</Label>
            <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn gói..." />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name} - {p.price.toLocaleString()}đ
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleApproveManual} disabled={loading || !selectedUserId || !selectedPackageId} className="w-full py-6 text-lg">
            {loading ? 'Đang cấp gói...' : 'Duyệt & Cấp Gói Ngay'}
          </Button>

          {error && <p className="text-red-400 text-center">{error}</p>}
          {result && (
            <div className="bg-green-900/30 border border-green-500 text-green-300 p-6 rounded-3xl text-center">
              Đã cấp gói <strong>{result.package.display_name}</strong> cho user <strong>{result.userId}</strong>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}