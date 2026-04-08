'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ==================== LOAD DATA ====================
  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: payments, error: payError } = await supabase
        .from('payment_logs')
        .select(`
          *,
          profiles!payment_logs_user_id_fkey (nickname),
          packages!payment_logs_package_id_fkey (display_name, price, duration_type, duration_value, max_runs)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (payError) throw payError;

      setPendingPayments(payments || []);

      const [uRes, pRes] = await Promise.all([
        supabase.from('profiles').select('id, nickname').order('nickname'),
        supabase.from('packages').select('*').eq('is_active', true).order('price'),
      ]);

      setUsers(uRes.data || []);
      setPackages(pRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // ==================== REALTIME (đã fix TS error) ====================
  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('payment_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_logs',
          filter: 'status=eq.pending',
        },
        () => {
          // Fire-and-forget (không await)
          loadData();
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status);
      });

    // Cleanup function (bắt buộc để fix TS error)
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ==================== DUYỆT TỪ PENDING ====================
  const approvePending = async (payment: any) => {
    if (!confirm(`Xác nhận cấp gói cho ${payment.profiles?.nickname || 'User'}?`)) return;

    setLoading(true);
    try {
      const pkg = payment.packages;
      const endDate = new Date();
      if (pkg.duration_type === 'minutes') endDate.setMinutes(endDate.getMinutes() + pkg.duration_value);
      else if (pkg.duration_type === 'hours') endDate.setHours(endDate.getHours() + pkg.duration_value);
      else endDate.setDate(endDate.getDate() + pkg.duration_value);

      const { error: subError } = await supabase.from('user_subscriptions').insert({
        user_id: payment.user_id,
        package_id: payment.package_id,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        remaining_runs: pkg.max_runs,
        status: 'active',
      });
      if (subError) throw subError;

      const { error: updateError } = await supabase
        .from('payment_logs')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', payment.id);
      if (updateError) throw updateError;

      alert(`✅ Đã cấp gói ${pkg.display_name} cho ${payment.profiles?.nickname}`);
      loadData();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deletePending = async (id: string) => {
    if (!confirm('Xóa yêu cầu thanh toán này?')) return;
    await supabase.from('payment_logs').delete().eq('id', id);
    loadData();
  };

  // ==================== DUYỆT THỦ CÔNG ====================
  const handleApproveManual = async () => {
    if (!selectedUserId || !selectedPackageId) return;
    setLoading(true);
    setError('');

    try {
      const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', selectedPackageId)
        .single();
      if (pkgError || !pkg) throw new Error('Không tìm thấy gói');

      const endDate = new Date();
      if (pkg.duration_type === 'minutes') endDate.setMinutes(endDate.getMinutes() + pkg.duration_value);
      else if (pkg.duration_type === 'hours') endDate.setHours(endDate.getHours() + pkg.duration_value);
      else endDate.setDate(endDate.getDate() + pkg.duration_value);

      const { error: subError } = await supabase.from('user_subscriptions').insert({
        user_id: selectedUserId,
        package_id: pkg.id,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        remaining_runs: pkg.max_runs,
        status: 'active',
      });
      if (subError) throw subError;

      alert(`✅ Đã cấp gói ${pkg.display_name} thủ công!`);
      setSelectedUserId('');
      setSelectedPackageId('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cấp gói');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black">Duyệt Thanh Toán</h1>
        <Button onClick={loadData} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </Button>
      </div>

      {/* DANH SÁCH PENDING */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Yêu cầu thanh toán đang chờ ({pendingPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <p className="text-zinc-400 py-12 text-center text-lg">
              Không có yêu cầu thanh toán nào đang chờ
            </p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((p) => (
                <Card key={p.id} className="bg-zinc-900 border-zinc-700">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{p.profiles?.nickname || 'Unknown'}</p>
                      <p className="text-sm text-zinc-400">
                        {p.packages?.display_name} • {p.amount.toLocaleString('vi-VN')}đ
                      </p>
                      <p className="text-xs text-cyan-400 font-mono mt-1 break-all">{p.memo}</p>
                      <p className="text-xs text-zinc-500 mt-2">
                        {new Date(p.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => approvePending(p)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Cấp gói ngay
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deletePending(p.id)}
                      >
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

      {/* DUYỆT THỦ CÔNG */}
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
                    {p.display_name} - {p.price.toLocaleString('vi-VN')}đ
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleApproveManual}
            disabled={loading || !selectedUserId || !selectedPackageId}
            className="w-full py-6 text-lg"
          >
            {loading ? 'Đang cấp gói...' : 'Duyệt & Cấp Gói Ngay'}
          </Button>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}