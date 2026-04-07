'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Plus, Edit, Trash2 } from 'lucide-react';
import DonateModal from '../components/donate-modal';

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
  year: number | null;
  mod_level: string;
  description: string;
};

export default function VehiclesPage() {
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [form, setForm] = useState({
    nickname: '',
    brand: '',
    model: '',
    vehicle_type: 'xe_ga' as const,
    year: '',
    mod_level: 'Stock',
  });

  // ==================== INIT AUTH + LOAD VEHICLES ====================
  const loadData = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);

    if (!u) {
      setIsAuthLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false });

    setVehicles(data || []);
    setLoading(false);
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==================== GOOGLE LOGIN ====================
  const handleGoogleLogin = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/vehicles',
      },
    });
  }, []);

  // ==================== DIALOG HANDLERS ====================
  const openDialog = useCallback((vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setForm({
        nickname: vehicle.nickname,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        vehicle_type: vehicle.vehicle_type as any,
        year: vehicle.year ? String(vehicle.year) : '',
        mod_level: vehicle.mod_level,
      });
    } else {
      setEditingVehicle(null);
      setForm({
        nickname: '',
        brand: '',
        model: '',
        vehicle_type: 'xe_ga',
        year: '',
        mod_level: 'Stock',
      });
    }
    setOpen(true);
  }, []);

  const handleAddOrUpdateVehicle = useCallback(async () => {
    if (!user || !form.nickname.trim()) {
      alert('Vui lòng nhập ít nhất tên xe!');
      return;
    }

    setLoading(true);

    const payload = {
      nickname: form.nickname.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      vehicle_type: form.vehicle_type,
      year: form.year ? parseInt(form.year) : null,
      mod_level: form.mod_level.trim() || 'Stock',
    };

    if (editingVehicle) {
      const { error } = await supabase
        .from('vehicles')
        .update(payload)
        .eq('id', editingVehicle.id);

      if (!error) {
        const { data } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setVehicles(data || []);
        setOpen(false);
      } else alert('Lỗi: ' + error.message);
    } else {
      const { error } = await supabase.from('vehicles').insert({
        user_id: user.id,
        ...payload,
      });

      if (!error) {
        const { data } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setVehicles(data || []);
        setOpen(false);
      } else alert('Lỗi: ' + error.message);
    }

    setForm({
      nickname: '',
      brand: '',
      model: '',
      vehicle_type: 'xe_ga',
      year: '',
      mod_level: 'Stock',
    });
    setEditingVehicle(null);
    setLoading(false);
  }, [user, form, editingVehicle]);

  const handleDeleteVehicle = useCallback(async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa xe này không?')) return;

    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (!error) {
      setVehicles(vehicles.filter(v => v.id !== id));
    } else {
      alert('Lỗi khi xóa: ' + error.message);
    }
  }, [vehicles]);

  // ==================== LOADING AUTH ====================
if (isAuthLoading) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0 bg-zinc-950 text-green-500 text-lg">
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
              <Car className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-black mb-2">Xe của tôi</h1>
            <p className="text-zinc-400 mb-8">Đăng nhập để bắt đầu ghi tốc độ và lưu kết quả</p>
            <Button
              onClick={handleGoogleLogin}
              className="w-full mx-auto py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google Login
            </Button>

            <Button variant="outline" className="w-full mt-4 py-6 text-base" onClick={() => window.location.href = '/'}>
              ← Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== ĐÃ ĐĂNG NHẬP - DANH SÁCH XE ====================
  if (loading) {
    return <div className="text-center py-20 text-zinc-400">Đang tải danh sách xe...</div>;
  }

  return (
    <div className="space-y-6 pb-20 px-4">
      <h1 className="text-3xl font-black">Xe của tôi</h1>

      <div className="space-y-6">
        {vehicles.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 w-full p-12 text-center">
            <Car className="mx-auto h-12 w-12 text-zinc-500 mb-4" />
            <p className="text-zinc-400">Bạn chưa có xe nào</p>
          </Card>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="flex gap-3">
              <Card className="flex-1 bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-4xl font-black">{v.nickname}</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="text-zinc-400 text-base flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{v.brand} {v.model}</span>
                    <span className="text-emerald-400">•</span>
                    <span className="capitalize">{v.vehicle_type.replace('_', ' ')}</span>
                    <span className="text-emerald-400">•</span>
                    <span className="text-green-400 font-medium">{v.mod_level}</span>
                    {v.year && (
                      <>
                        <span className="text-emerald-400">•</span>
                        <span>{v.year}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 w-20">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-full flex-1 flex-col gap-1 text-base"
                  onClick={() => openDialog(v)}
                >
                  <Edit className="h-6 w-6" />
                  <span className="text-xs">Sửa</span>
                </Button>

                <Button
                  variant="destructive"
                  size="lg"
                  className="h-full flex-1 flex-col gap-1 text-base"
                  onClick={() => handleDeleteVehicle(v.id)}
                >
                  <Trash2 className="h-6 w-6" />
                  <span className="text-xs">Xóa</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nút Thêm xe mới */}
      <div className="fixed bottom-20 left-4 right-4 md:static md:bottom-auto md:left-auto md:right-auto md:mt-8">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-green-600 hover:bg-green-700 py-7 text-lg font-medium rounded-3xl">
              <Plus className="mr-3 h-5 w-5" />
              Thêm xe mới
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[95vw] max-w-[420px] mx-auto rounded-3xl bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl font-black">
                {editingVehicle ? 'Sửa xe' : 'Thêm xe mới'}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Nhập thông tin xe của bạn
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Nickname */}
              <div>
                <Label className="flex items-center gap-1 text-base font-medium">
                  Nickname xe <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Ví dụ:SH350 + cấu hình xe + tên chủ xe"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="h-14 text-base mt-2 bg-zinc-950 border-zinc-700 focus:border-cyan-400"
                />
              </div>

              {/* Hãng xe + Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Hãng xe</Label>
                  <Input
                    placeholder="Honda"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="h-14 text-base mt-2 bg-zinc-950 border-zinc-700 focus:border-cyan-400"
                  />
                </div>
                <div>
                  <Label className="text-base font-medium">Model</Label>
                  <Input
                    placeholder="SH 350i"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="h-14 text-base mt-2 bg-zinc-950 border-zinc-700 focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Loại xe */}
              <div>
                <Label className="text-base font-medium">Loại xe</Label>
                <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v as any })}>
                  <SelectTrigger className="h-14 text-base mt-2 bg-zinc-950 border-zinc-700 focus:border-cyan-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xe_ga">Xe ga</SelectItem>
                    <SelectItem value="xe_số">Xe số</SelectItem>
                    <SelectItem value="xe_côn_tay">Xe côn tay</SelectItem>
                    <SelectItem value="xe_điện">Xe điện</SelectItem>
                    <SelectItem value="oto">Ô tô</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Năm sản xuất + Mức độ độ (đã đổi thành Input tự nhập) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Năm sản xuất</Label>
                  <Input
                    type="number"
                    placeholder="2024"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="h-14 text-base mt-2 bg-zinc-950 border-zinc-700 focus:border-cyan-400"
                  />
                </div>
                <div>
                  <Label className="text-base font-medium">Mức độ độ (bài độ)</Label>
                  <Input
                    placeholder="Ví dụ: PXL Stage 3, 54zz, God Mode, CXN..."
                    value={form.mod_level}
                    onChange={(e) => setForm({ ...form, mod_level: e.target.value })}
                    className="h-14 text-base mt-2 bg-zinc-950 border-zinc-700 focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 h-14 text-base font-medium rounded-2xl border-zinc-700"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddOrUpdateVehicle}
                className="flex-1 h-14 text-base font-medium rounded-2xl bg-white text-black hover:bg-zinc-100"
              >
                {editingVehicle ? 'Lưu thay đổi' : 'Thêm xe'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DonateModal />
    </div>
  );
}