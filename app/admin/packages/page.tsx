'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', display_name: '', price: 0, duration_days: 30, max_runs: 999, description: '' });

  const loadPackages = async () => {
    const { data } = await supabase.from('packages').select('*').order('price');
    setPackages(data || []);
  };

  useEffect(() => { loadPackages(); }, []);

  const savePackage = async () => {
    await supabase.from('packages').insert(form);
    setOpen(false);
    loadPackages();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">Quản lý Gói Cước</h1>
        <Button onClick={() => setOpen(true)}>Thêm gói mới</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader>
              <CardTitle>{pkg.display_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black">{pkg.price.toLocaleString()}đ</p>
              <p className="text-sm text-zinc-400">{pkg.duration_days} ngày • {pkg.max_runs} run</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog thêm gói */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm gói cước</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên gói</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Tên hiển thị</Label>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giá (VND)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Thời hạn (ngày)</Label>
                <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={savePackage}>Lưu gói</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}