'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
      mod_level: form.mod_level,
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500">
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
            <p className="text-zinc-400 mb-8">Đăng nhập để quản lý xe và ghi run</p>
            <Button
              onClick={handleGoogleLogin}
              className="w-full mx-auto py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-3xl flex items-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google Login
            </Button>

            <Button variant="outline" className="w-full mt-4 py-6 text-base rounded-3xl" onClick={() => window.location.href = '/'}>
              ← Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== ĐÃ ĐĂNG NHẬP - DANH SÁCH XE (GIAO DIỆN TỐI ƯU) ====================
  if (loading) {
    return <div className="text-center py-20 text-zinc-400">Đang tải danh sách xe...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black pt-8 pb-6">Xe của tôi</h1>

        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-3xl flex items-center justify-center mb-6">
                <Car className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="text-xl font-medium text-zinc-400">Bạn chưa có xe nào</p>
              <p className="text-zinc-500 text-sm mt-2">Hãy thêm xe để bắt đầu ghi run</p>
            </Card>
          ) : (
            vehicles.map((v) => (
              <Card
                key={v.id}
                className="bg-zinc-900 border-zinc-800 hover:border-green-500/30 transition-all group"
              >
                <CardContent className="p-6 flex items-center gap-4">
                  {/* Icon xe */}
                  <Avatar className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                    <AvatarFallback className="text-3xl text-white">
                      <Car className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Thông tin chính */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <CardTitle className="text-3xl font-black tracking-tight truncate">
                        {v.nickname}
                      </CardTitle>
                      <span className="text-xs px-3 py-1 bg-emerald-950 text-emerald-400 rounded-2xl font-medium">
                        {v.vehicle_type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                      <span>{v.brand} {v.model}</span>
                      {v.year && <span className="text-zinc-500">• {v.year}</span>}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-medium px-4 py-1.5 bg-zinc-800 text-green-400 rounded-3xl">
                        {v.mod_level}
                      </span>
                    </div>
                  </div>

                  {/* Nút Sửa & Xóa - hiện đẹp hơn */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-2xl border-zinc-700 hover:border-green-400 hover:text-green-400"
                      onClick={() => openDialog(v)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 rounded-2xl"
                      onClick={() => handleDeleteVehicle(v.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Nút Thêm xe mới - fixed bottom như trang chủ */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto bg-green-600 hover:bg-green-700 py-7 text-lg font-semibold rounded-3xl shadow-2xl flex items-center justify-center gap-3">
              <Plus className="h-6 w-6" />
              Thêm xe mới
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[95vw] max-w-[420px] mx-auto rounded-3xl bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-black tracking-tight">
                {editingVehicle ? 'Sửa xe' : 'Thêm xe mới'}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Thông tin xe sẽ được dùng để ghi run
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Nickname */}
              <div>
                <Label className="text-base font-medium">Nickname xe <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="SH350 Black Edition"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className="h-14 text-lg mt-2 bg-zinc-950 border-zinc-700 focus:border-green-400 rounded-2xl"
                />
              </div>

              {/* Hãng + Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Hãng xe</Label>
                  <Input
                    placeholder="Honda"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="h-14 text-lg mt-2 bg-zinc-950 border-zinc-700 focus:border-green-400 rounded-2xl"
                  />
                </div>
                <div>
                  <Label className="text-base font-medium">Model</Label>
                  <Input
                    placeholder="SH 350i"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="h-14 text-lg mt-2 bg-zinc-950 border-zinc-700 focus:border-green-400 rounded-2xl"
                  />
                </div>
              </div>

              {/* Loại xe + Năm */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium">Loại xe</Label>
                  <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v as any })}>
                    <SelectTrigger className="h-14 text-lg mt-2 bg-zinc-950 border-zinc-700 focus:border-green-400 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xe_ga">Xe ga</SelectItem>
                      <SelectItem value="xe_số">Xe số</SelectItem>
                      <SelectItem value="xe_côn_tay">Xe côn tay</SelectItem>
                      <SelectItem value="oto">Ô tô</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-medium">Năm sản xuất</Label>
                  <Input
                    type="number"
                    placeholder="2024"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="h-14 text-lg mt-2 bg-zinc-950 border-zinc-700 focus:border-green-400 rounded-2xl"
                  />
                </div>
              </div>

              {/* Mức độ độ */}
              <div>
                <Label className="text-base font-medium">Mức độ độ</Label>
                <Select value={form.mod_level} onValueChange={(v) => setForm({ ...form, mod_level: v })}>
                  <SelectTrigger className="h-14 text-lg mt-2 bg-zinc-950 border-zinc-700 focus:border-green-400 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stock">Stock</SelectItem>
                    <SelectItem value="Stage 1">PXL</SelectItem>
                    <SelectItem value="Stage 2">CXN</SelectItem>
                    <SelectItem value="God Mode">NPXG</SelectItem>
                    <SelectItem value="God Mode">54zz</SelectItem>
                    <SelectItem value="God Mode">62zz</SelectItem>
                    <SelectItem value="God Mode">65zz</SelectItem>
                    <SelectItem value="God Mode">68zz</SelectItem>
                    <SelectItem value="God Mode">72+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 h-14 text-lg font-medium rounded-3xl border-zinc-700"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddOrUpdateVehicle}
                className="flex-1 h-14 text-lg font-semibold rounded-3xl bg-white text-black hover:bg-zinc-100"
              >
                {editingVehicle ? 'Lưu thay đổi' : 'Thêm xe'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}