'use client';

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RotateCcw, Trophy, User, Save, Car, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';

type UserProfile = {
  id: string;
  full_name: string | null;
};

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
};

type Run = {
  id: number;
  user_id: string;
  vehicle_id: number;
  max_speed: number;
  zero_to_hundred: number | null;
  region: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
  vehicles: { nickname: string; brand: string; model: string } | null;
};

export default function AdminFakeResult() {
  const resultRef = useRef<HTMLDivElement>(null);

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [vehiclesOfUser, setVehiclesOfUser] = useState<Vehicle[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);

  // Selection
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [editingRunId, setEditingRunId] = useState<number | null>(null);

  // Form
  const [formData, setFormData] = useState({
    maxSpeed: 178,
    zeroToHundred: 2.9,
    region: 'Gia Lai',
    date: 'Chủ Nhật, 05 Tháng 4, 2026 - 22:48',
    rank: '#1',
    vehicleNickname: 'Supra MK4',
    isNewPersonalBest: true,
    personalBestImprovement: 12.4,
  });

  const [badges, setBadges] = useState({
    top1MienNam: true,
    sieuHoaTien: true,
    vuaDeBa: false,
    top1GiaLai: true,
    sieuTocVietNam: false,
  });

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // ==================== LAZY LOAD FUNCTIONS ====================
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name');
    setUsers(data || []);
    setLoadingUsers(false);
  }, []);

  const loadRuns = useCallback(async () => {
    setLoadingRuns(true);
    const { data } = await supabase
      .from('runs')
      .select(`
        *,
        profiles!user_id (full_name),
        vehicles!vehicle_id (nickname, brand, model)
      `)
      .order('max_speed', { ascending: false });
    setRuns(data || []);
    setLoadingRuns(false);
  }, []);

  const loadVehicles = useCallback(async () => {
    if (!selectedUserId) return;
    setLoadingVehicles(true);
    const { data } = await supabase
      .from('vehicles')
      .select('id, nickname, brand, model, vehicle_type')
      .eq('user_id', selectedUserId)
      .order('created_at', { ascending: false });
    setVehiclesOfUser(data || []);
    if (data && data.length > 0 && !editingRunId) setSelectedVehicleId(data[0].id);
    setLoadingVehicles(false);
  }, [selectedUserId, editingRunId]);

  // ==================== FORM & ACTIONS ====================
  const saveToLeaderboard = async () => {
    if (!selectedUserId) return alert('❌ Vui lòng chọn user!');
    if (!selectedVehicleId) return alert('❌ User này chưa có xe nào. Hãy tạo xe trước.');

    setIsSaving(true);

    const payload = {
      user_id: selectedUserId,
      vehicle_id: selectedVehicleId,
      max_speed: formData.maxSpeed,
      zero_to_hundred: formData.zeroToHundred,
      region: formData.region,
      created_at: new Date().toISOString(),
      zero_to_sixty: null,
      distance_to_max_speed: null,
      gps_data: [],
      start_lat: null,
      start_lng: null,
      end_lat: null,
      end_lng: null,
      gps_accuracy: 'Excellent',
      is_low_accuracy: false,
      ai_analysis: null,
      ai_verified: true,
    };

    let error = null;

    if (editingRunId) {
      const { error: updateError } = await supabase.from('runs').update(payload).eq('id', editingRunId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('runs').insert(payload);
      error = insertError;
    }

    if (error) {
      alert('❌ Lỗi: ' + error.message);
    } else {
      alert(editingRunId ? '✅ Đã cập nhật thành công!' : '✅ Đã thêm vào leaderboard thành công!');
      // Không tự refresh, user phải nhấn "Tải bảng Rank" thủ công
      if (editingRunId) setEditingRunId(null);
      resetForm();
    }

    setIsSaving(false);
  };

  const handleEditRun = (run: Run) => {
    setSelectedUserId(run.user_id);
    setSelectedVehicleId(run.vehicle_id);

    setFormData({
      maxSpeed: run.max_speed,
      zeroToHundred: run.zero_to_hundred ?? 2.9,
      region: run.region,
      date: new Date(run.created_at).toLocaleString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      rank: '#1',
      vehicleNickname: run.vehicles?.nickname || 'Unknown',
      isNewPersonalBest: false,
      personalBestImprovement: 0,
    });

    setEditingRunId(run.id);
  };

  const deleteRun = async (id: number) => {
    if (!confirm('❌ Bạn chắc chắn muốn xóa result này?')) return;

    const { error } = await supabase.from('runs').delete().eq('id', id);
    if (error) alert('❌ Lỗi: ' + error.message);
    else alert('✅ Đã xóa thành công!');
    // Không tự refresh
  };

  const resetForm = () => {
    setFormData({
      maxSpeed: 178,
      zeroToHundred: 2.9,
      region: 'Gia Lai',
      date: 'Chủ Nhật, 05 Tháng 4, 2026 - 22:48',
      rank: '#1',
      vehicleNickname: 'Supra MK4',
      isNewPersonalBest: true,
      personalBestImprovement: 12.4,
    });
    setBadges({
      top1MienNam: true,
      sieuHoaTien: true,
      vuaDeBa: false,
      top1GiaLai: true,
      sieuTocVietNam: false,
    });
    setEditingRunId(null);
  };

  const downloadResultAsImage = useCallback(async () => {
    const card = resultRef.current;
    if (!card) return;
    try {
      const canvas = await html2canvas(card, { scale: 3, backgroundColor: '#18181b' });
      const link = document.createElement('a');
      link.download = `TopRaceVN_FAKE_${formData.maxSpeed}kmh_${new Date().toISOString().slice(0,19)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      alert('✅ Đã tải ảnh thành công!');
    } catch (e) {
      alert('❌ Lỗi khi tải ảnh!');
    }
  }, [formData.maxSpeed]);

  const selectedUserName = users.find(u => u.id === selectedUserId)?.full_name || 'Chưa chọn user';

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-green-500 mb-8 flex items-center gap-3">
          <Trophy className="w-10 h-10" />
          ADMIN FAKE RESULT TOOL
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FORM */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 space-y-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="w-6 h-6" /> Tạo / Sửa kết quả
              </h2>

              <Button onClick={loadUsers} disabled={loadingUsers} className="w-full mb-6">
                {loadingUsers ? 'Đang tải users...' : '🔄 Tải danh sách User'}
              </Button>

              <div>
                <Label>Chọn User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="h-12 mt-2">
                    <SelectValue placeholder="Chọn user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={loadVehicles} disabled={!selectedUserId || loadingVehicles} className="w-full mb-6">
                {loadingVehicles ? 'Đang tải xe...' : '🔄 Tải xe của user'}
              </Button>

              <div>
                <Label className="flex items-center gap-2">
                  <Car className="w-4 h-4" /> Chọn Xe
                </Label>
                <Select
                  value={selectedVehicleId ? String(selectedVehicleId) : ''}
                  onValueChange={(v) => setSelectedVehicleId(v ? Number(v) : null)}
                >
                  <SelectTrigger className="h-12 mt-2">
                    <SelectValue placeholder="Chọn xe của user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiclesOfUser.map((v) => (
                      <SelectItem key={v.id} value={String(v.id)}>
                        {v.nickname} — {v.brand} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Các input form giữ nguyên */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Top Speed (km/h)</Label>
                  <Input type="number" value={formData.maxSpeed} onChange={(e) => setFormData({ ...formData, maxSpeed: Number(e.target.value) })} className="text-4xl h-16 font-black text-center mt-2" />
                </div>
                <div>
                  <Label>0 - 100 km/h (giây)</Label>
                  <Input type="number" step="0.1" value={formData.zeroToHundred} onChange={(e) => setFormData({ ...formData, zeroToHundred: Number(e.target.value) })} className="text-4xl h-16 font-black text-center mt-2" />
                </div>
              </div>

              <div className="mt-6">
                <Label>Khu vực</Label>
                <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="mt-2" />
              </div>

              <div className="mt-6">
                <Label>Tên xe hiển thị</Label>
                <Input value={formData.vehicleNickname} onChange={(e) => setFormData({ ...formData, vehicleNickname: e.target.value })} className="mt-2" />
              </div>

              <div className="mt-6">
                <Label>Ngày giờ</Label>
                <Input value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="mt-2" />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-zinc-700">
                <Button onClick={resetForm} variant="outline" className="flex-1 py-7 text-lg">
                  <RotateCcw className="mr-3" /> Reset
                </Button>

                <Button
                  onClick={saveToLeaderboard}
                  disabled={isSaving || !selectedUserId || !selectedVehicleId}
                  className="flex-1 py-7 text-lg bg-green-600 hover:bg-green-700 font-bold"
                >
                  <Save className="mr-3" />
                  {isSaving ? 'Đang lưu...' : (editingRunId ? 'CẬP NHẬT' : 'THÊM VÀO LEADERBOARD')}
                </Button>

                <Button onClick={downloadResultAsImage} className="flex-1 py-7 text-lg bg-green-600 hover:bg-green-700">
                  <Download className="mr-3" /> TẢI ẢNH
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PREVIEW (giữ nguyên) */}
          <div>
            <Card ref={resultRef} className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
              {/* ... (preview card giữ nguyên hoàn toàn như code cũ) */}
              <CardContent className="p-8 space-y-6">
                {/* Nội dung preview giữ nguyên, bạn có thể copy lại từ code cũ nếu cần */}
                <div className="flex items-center justify-between">
                  <div className="w-6" />
                  <h2 className="text-3xl font-bold text-green-500 tracking-tight">TopRaceVN</h2>
                  <div className="text-zinc-400 text-sm">VIP</div>
                </div>

                <div className="text-center">
                  <p className="text-zinc-400 text-base">Top Speed cao nhất</p>
                  <p className="text-8xl font-black text-green-500 leading-none">{formData.maxSpeed}</p>
                  <p className="text-zinc-400 text-2xl">km/h</p>
                  <p className="text-xs text-zinc-500 mt-2">{formData.date}</p>
                </div>

                {/* Các phần còn lại của preview giữ nguyên như code bạn gửi */}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BẢNG RANK */}
        <div className="mt-12">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-6 h-6" /> Bảng Rank Hiện Tại
                </h2>
                <Button onClick={loadRuns} disabled={loadingRuns} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {loadingRuns ? 'Đang tải...' : 'Tải bảng Rank'}
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {/* Phần table giữ nguyên như code cũ của bạn */}
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="py-4 px-4 text-left font-medium text-zinc-400">User</th>
                      <th className="py-4 px-4 text-left font-medium text-zinc-400">Xe</th>
                      <th className="py-4 px-4 text-right font-medium text-zinc-400">Top Speed</th>
                      <th className="py-4 px-4 text-right font-medium text-zinc-400">0-100</th>
                      <th className="py-4 px-4 text-left font-medium text-zinc-400">Khu vực</th>
                      <th className="py-4 px-4 text-left font-medium text-zinc-400">Thời gian</th>
                      <th className="py-4 px-4 text-center font-medium text-zinc-400 w-28">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {runs.map((run) => (
                      <tr key={run.id} className="hover:bg-zinc-800/50">
                        <td className="py-5 px-4 font-medium">
                          {run.profiles?.full_name || run.user_id.slice(0, 8)}
                        </td>
                        <td className="py-5 px-4">
                          {run.vehicles?.nickname || '—'} <span className="text-zinc-500 text-xs">({run.vehicles?.brand} {run.vehicles?.model})</span>
                        </td>
                        <td className="py-5 px-4 text-right font-black text-green-400">
                          {run.max_speed} <span className="text-xs text-zinc-400">km/h</span>
                        </td>
                        <td className="py-5 px-4 text-right font-medium text-cyan-400">
                          {run.zero_to_hundred ? `${run.zero_to_hundred}s` : '—'}
                        </td>
                        <td className="py-5 px-4">{run.region}</td>
                        <td className="py-5 px-4 text-xs text-zinc-400">
                          {new Date(run.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-5 px-4 text-center flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditRun(run)} className="text-blue-400 hover:text-blue-300 h-8 px-3">
                            Sửa
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteRun(run.id)} className="text-red-400 hover:text-red-300 h-8 px-3">
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {runs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-zinc-500">
                          Chưa có result nào. Nhấn "Tải bảng Rank" để xem
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}