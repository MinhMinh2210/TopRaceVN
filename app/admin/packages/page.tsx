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
  const [open, setOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    display_name: '',
    price: 0,
    duration_type: 'days',
    duration_value: 30,
    max_runs: 999,
    description: '',
  });

  const loadPackages = async () => {
    const { data } = await supabase.from('packages').select('*').order('price');
    setPackages(data || []);
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const savePackage = async () => {
    if (editingPkg) {
      await supabase.from('packages').update(form).eq('id', editingPkg.id);
    } else {
      await supabase.from('packages').insert(form);
    }
    setOpen(false);
    setEditingPkg(null);
    loadPackages();
  };

  const deletePackage = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa gói này?')) {
      await supabase.from('packages').delete().eq('id', id);
      loadPackages();
    }
  };

  const openEdit = (pkg: any) => {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name,
      display_name: pkg.display_name,
      price: pkg.price,
      duration_type: pkg.duration_type || 'days',
      duration_value: pkg.duration_value || pkg.duration_days || 30,
      max_runs: pkg.max_runs,
      description: pkg.description || '',
    });
    setOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">Quản lý Gói Cước</h1>
        <Button onClick={() => { setEditingPkg(null); setForm({ name: '', display_name: '', price: 0, duration_type: 'days', duration_value: 30, max_runs: 999, description: '' }); setOpen(true); }}>
          + Thêm gói mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="bg-zinc-900 border-zinc-700">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
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
            <CardContent className="space-y-4">
              <div className="text-4xl font-black text-cyan-400">{pkg.price.toLocaleString()}đ</div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Thời hạn</span>
                <span className="font-medium">
                  {pkg.duration_value} {pkg.duration_type === 'minutes' ? 'phút' : pkg.duration_type === 'hours' ? 'giờ' : 'ngày'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Số run</span>
                <span className="font-medium">{pkg.max_runs} lần</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog thêm / sửa gói */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingPkg ? 'Sửa gói cước' : 'Thêm gói cước mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label>Tên gói (code)</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Tên hiển thị</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div>
              <Label>Giá (VND)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Thời hạn</Label>
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
              <Label>Số lần run được lưu rank</Label>
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