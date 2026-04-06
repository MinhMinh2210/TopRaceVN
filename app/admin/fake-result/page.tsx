'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Download, RotateCcw, Trophy } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function AdminFakeResult() {
  const resultRef = useRef<HTMLDivElement>(null);

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

  const downloadResultAsImage = useCallback(async () => {
    const card = resultRef.current;
    if (!card) return;
    try {
      const canvas = await html2canvas(card, {
        scale: 3,
        backgroundColor: '#18181b',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `TopRaceVN_FAKE_${formData.maxSpeed}kmh_${new Date().toISOString().slice(0,19)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert('Lỗi khi tải ảnh. Thử lại nhé!');
    }
  }, [formData.maxSpeed]);

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
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-green-500 mb-8 flex items-center gap-3">
          <Trophy className="w-10 h-10" />
          ADMIN FAKE RESULT TOOL
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ==================== FORM ADMIN ==================== */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Điền thông tin fake</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Top Speed (km/h)</Label>
                    <Input
                      type="number"
                      value={formData.maxSpeed}
                      onChange={(e) => setFormData({ ...formData, maxSpeed: Number(e.target.value) })}
                      className="text-4xl h-16 font-black text-center"
                    />
                  </div>
                  <div>
                    <Label>0 - 100 km/h (giây)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.zeroToHundred}
                      onChange={(e) => setFormData({ ...formData, zeroToHundred: Number(e.target.value) })}
                      className="text-4xl h-16 font-black text-center"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Label>Khu vực / Region</Label>
                  <Input
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="text-xl"
                  />
                </div>

                <div className="mt-6">
                  <Label>Ngày giờ hiển thị</Label>
                  <Input
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="mt-6">
                  <Label>Rank (ví dụ: #1 Gia Lai)</Label>
                  <Input
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="text-3xl font-black text-green-400"
                  />
                </div>

                <div className="mt-6">
                  <Label>Tên xe (nickname)</Label>
                  <Input
                    value={formData.vehicleNickname}
                    onChange={(e) => setFormData({ ...formData, vehicleNickname: e.target.value })}
                  />
                </div>

                <div className="mt-8">
                  <Label className="text-lg">Thành tích đặc biệt (badge)</Label>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={badges.top1MienNam}
                        onCheckedChange={(checked: boolean) => setBadges({ ...badges, top1MienNam: checked })}
                      />
                      <span>Top 1 Miền Nam hôm nay</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={badges.sieuHoaTien}
                        onCheckedChange={(checked: boolean) => setBadges({ ...badges, sieuHoaTien: checked })}
                      />
                      <span>Siêu Hỏa Tiễn 🔥</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={badges.vuaDeBa}
                        onCheckedChange={(checked: boolean) => setBadges({ ...badges, vuaDeBa: checked })}
                      />
                      <span>Vua Đề Ba ⚡</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={badges.top1GiaLai}
                        onCheckedChange={(checked: boolean) => setBadges({ ...badges, top1GiaLai: checked })}
                      />
                      <span>Top 1 Gia Lai</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={badges.sieuTocVietNam}
                        onCheckedChange={(checked: boolean) => setBadges({ ...badges, sieuTocVietNam: checked })}
                      />
                      <span>Siêu Tốc Việt Nam</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button onClick={resetForm} variant="outline" className="flex-1 py-7 text-lg">
                  <RotateCcw className="mr-3" /> Reset
                </Button>
                <Button onClick={downloadResultAsImage} className="flex-1 py-7 text-lg bg-green-600 hover:bg-green-700">
                  <Download className="mr-3" /> TẢI ẢNH QUẢNG BÁ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ==================== PREVIEW BẢNG KẾT QUẢ ==================== */}
          <div>
            <Card ref={resultRef} className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
              <CardContent className="p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="w-6" />
                  <h2 className="text-3xl font-bold text-green-500 tracking-tight">TopRaceVN</h2>
                  <div className="text-zinc-400 text-sm">VIP</div>
                </div>

                {/* Top Speed */}
                <div className="text-center">
                  <p className="text-zinc-400 text-base">Top Speed cao nhất</p>
                  <p className="text-8xl font-black text-green-500 leading-none">{formData.maxSpeed}</p>
                  <p className="text-zinc-400 text-2xl">km/h</p>
                  <p className="text-xs text-zinc-500 mt-2">{formData.date}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 border-t border-zinc-800 pt-8">
                  <div className="text-center">
                    <p className="text-zinc-400 text-sm">0 - 100 km/h</p>
                    <p className="text-5xl font-bold text-cyan-400">
                      {formData.zeroToHundred}s
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-400 text-sm">Khu vực</p>
                    <p className="font-medium text-2xl">{formData.region}</p>
                  </div>
                </div>

                {/* Rank */}
                <div className="text-center">
                  <p className="text-6xl font-black text-green-400">{formData.rank}</p>
                  <p className="text-sm text-zinc-400 mt-1">{formData.vehicleNickname}</p>
                </div>

                {/* Badges */}
                <div className="space-y-3 border-t border-zinc-800 pt-6">
                  {badges.top1MienNam && (
                    <div className="bg-emerald-900/50 text-emerald-400 px-5 py-3 rounded-2xl text-center font-medium">🏆 Top 1 Miền Nam hôm nay</div>
                  )}
                  {badges.sieuHoaTien && (
                    <div className="bg-orange-900/50 text-orange-400 px-5 py-3 rounded-2xl text-center font-medium">🚀 Siêu Hỏa Tiễn</div>
                  )}
                  {badges.vuaDeBa && (
                    <div className="bg-yellow-900/50 text-yellow-400 px-5 py-3 rounded-2xl text-center font-medium">⚡ Vua Đề Ba</div>
                  )}
                  {badges.top1GiaLai && (
                    <div className="bg-blue-900/50 text-blue-400 px-5 py-3 rounded-2xl text-center font-medium">🔥 Top 1 Gia Lai</div>
                  )}
                  {badges.sieuTocVietNam && (
                    <div className="bg-purple-900/50 text-purple-400 px-5 py-3 rounded-2xl text-center font-medium">🇻🇳 Siêu Tốc Việt Nam</div>
                  )}
                </div>

                {formData.isNewPersonalBest && (
                  <div className="flex justify-between items-center bg-zinc-800 rounded-2xl px-5 py-4">
                    <span className="text-green-400 font-medium">🚀 Kỷ lục cá nhân</span>
                    <span className="text-green-400">+{formData.personalBestImprovement} km/h</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}