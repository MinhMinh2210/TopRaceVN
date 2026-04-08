'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPaymentsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [uRes, pRes] = await Promise.all([
        supabase.from('profiles').select('id, nickname').order('nickname'),
        supabase.from('packages').select('*').eq('is_active', true),
      ]);
      setUsers(uRes.data || []);
      setPackages(pRes.data || []);
    };
    loadData();
  }, []);

  const handleApprove = async () => {
    if (!selectedUserId || !selectedPackageId) return;
    setLoading(true);
    setError('');
    setResult(null);

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
      setSelectedUserId('');
      setSelectedPackageId('');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cấp gói');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
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
                    {u.nickname} ({u.id})
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

          <Button onClick={handleApprove} disabled={loading || !selectedUserId || !selectedPackageId} className="w-full py-6 text-lg">
            {loading ? 'Đang cấp gói...' : 'Duyệt & Cấp Gói Ngay'}
          </Button>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 p-4 rounded-2xl flex gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-900/30 border border-green-500 text-green-300 p-6 rounded-3xl text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-4" />
              Đã cấp gói <strong>{result.package.display_name}</strong> cho user <strong>{result.userId}</strong>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}