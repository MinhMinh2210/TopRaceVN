'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Edit } from 'lucide-react';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    display_name: '',
    price: 0,
    duration_type: 'hours',        // mặc định giờ vì bạn bán gói giờ
    duration_value: 2,
    max_runs: 999,
    description: '',
    is_active: true,
  });

  const loadPackages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('price');

    if (error) {
      console.error(error);
      setErrorMsg('Lỗi tải dữ liệu: ' + error.message);
    } else {
      setPackages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const savePackage = async () => {
    setErrorMsg('');
    try {
      if (editingPkg) {
        const { error } = await supabase
          .from('packages')
          .update(form)
          .eq('id', editingPkg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('packages').insert(form);
        if (error) throw error;
      }
      setOpen(false);
      setEditingPkg(null);
      loadPackages();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Lỗi lưu gói: ' + err.message);
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Xóa gói này?')) return;
    const { error } = await supabase.from('packages').delete().eq('id', id);
    if (error) setErrorMsg('Lỗi xóa: ' + error.message);
    else loadPackages();
  };

  const openEdit = (pkg: any) => {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name || '',
      display_name: pkg.display_name || '',
      price: pkg.price || 0,
      duration_type: pkg.duration_type || 'hours',
      duration_value: pkg.duration_value || 2,
      max_runs: pkg.max_runs || 999,
      description: pkg.description || '',
      is_active: pkg.is_active ?? true,
    });
    setOpen(true);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black">Quản lý Gói Cước</h1>
        <Button 
          onClick={() => {
            setEditingPkg(null);
            setForm({ name: '', display_name: '', price: 0, duration_type: 'hours', duration_value: 2, max_runs: 999, description: '', is_active: true });
            setOpen(true);
          }}
        >
          + Thêm gói mới
        </Button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-300 rounded-2xl">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <p className="text-center py-12">Đang tải gói cước...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{pkg.display_name}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deletePackage(pkg.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-5xl font-black text-cyan-400">
                  {pkg.price.toLocaleString()}đ
                </div>
                <div className="text-sm flex justify-between">
                  <span className="text-zinc-400">Thời hạn</span>
                  <span className="font-medium">
                    {pkg.duration_value} {pkg.duration_type === 'minutes' ? 'phút' : pkg.duration_type === 'hours' ? 'giờ' : 'ngày'}
                  </span>
                </div>
                <div className="text-sm flex justify-between">
                  <span className="text-zinc-400">Số run tối đa</span>
                  <span className="font-medium">{pkg.max_runs} lần</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog thêm/sửa */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingPkg ? 'Sửa gói cước' : 'Thêm gói cước mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label>Tên gói (code)</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="PRO2H" />
            </div>
            <div>
              <Label>Tên hiển thị</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} placeholder="Gói Pro 2 giờ" />
            </div>
            <div>
              <Label>Giá (VND)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số lượng</Label>
                <Input type="number" value={form.duration_value} onChange={(e) => setForm({ ...form, duration_value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Đơn vị</Label>
                <Select value={form.duration_type} onValueChange={(v) => setForm({ ...form, duration_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Phút</SelectItem>
                    <SelectItem value="hours">Giờ</SelectItem>
                    <SelectItem value="days">Ngày</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Số run tối đa</Label>
              <Input type="number" value={form.max_runs} onChange={(e) => setForm({ ...form, max_runs: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button onClick={savePackage}>Lưu gói</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}