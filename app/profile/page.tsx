'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';
import { logout } from '@/app/features/auth/logout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Car, Edit, Trophy, LogOut, Clock } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DonateModal from '../components/donate-modal';

type Profile = {
  nickname: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type RunHistory = {
  id: number;
  max_speed: number;
  zero_to_sixty: number | null;
  zero_to_hundred: number | null;
  distance_to_max_speed: number | null;
  gps_accuracy: string | null;
  is_low_accuracy: boolean | null;
  region: string;
  created_at: string;
  vehicles: { nickname: string; vehicle_type: string } | null;
};

// ==================== AVATAR OPTIMIZER (VŨ TRỤ) ====================
const compressImage = async (file: File, maxWidth = 400): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' }));
            } else resolve(file);
          },
          'image/webp',
          0.82
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const getOptimizedAvatarUrl = (url: string | null | undefined, size = 300): string => {
  if (!url) return '';
  return `${url}?width=${size}&height=${size}&resize=contain&format=webp&quality=82`;
};

export default function MyProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [runsHistory, setRunsHistory] = useState<RunHistory[]>([]);
  const [stats, setStats] = useState({ runs: 0, bestSpeed: 0, rank: '—' as string | number });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Profile>({ nickname: '', full_name: '', avatar_url: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunHistory | null>(null);

  // ==================== LOAD ALL DATA ====================
  const loadAllData = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (!currentUser) {
      setIsAuthLoading(false);
      setIsDataLoaded(true);
      return;
    }

    const [profileRes, vehiclesRes, runsRes, statsRes, bestRes] = await Promise.all([
      supabase.from('profiles').select('nickname, full_name, avatar_url, bio').eq('id', currentUser.id).single(),
      supabase.from('vehicles').select('*').eq('user_id', currentUser.id),
      supabase
        .from('runs')
        .select(`
          id, max_speed, zero_to_sixty, zero_to_hundred, distance_to_max_speed,
          gps_accuracy, is_low_accuracy, region, created_at,
          vehicles (nickname, vehicle_type)
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase.from('runs').select('*', { count: 'exact' }).eq('user_id', currentUser.id),
      supabase.from('runs').select('max_speed').eq('user_id', currentUser.id).order('max_speed', { ascending: false }).limit(1),
    ]);

    setProfile(profileRes.data);
    setEditForm(profileRes.data || { nickname: '', full_name: '', avatar_url: '', bio: '' });
    setVehicles(vehiclesRes.data || []);

    setRunsHistory(
      (runsRes.data || []).map((r: any) => ({
        ...r,
        region: r.region || 'Không xác định',
        vehicles: r.vehicles || null,
      }))
    );

    const runCount = statsRes.count || 0;
    const bestSpeed = bestRes.data?.[0]?.max_speed || 0;

    let rank: string | number = '—';
    if (bestSpeed > 0) {
      const { count: higher } = await supabase
        .from('runs')
        .select('*', { count: 'exact', head: true })
        .gt('max_speed', bestSpeed);
      rank = (higher || 0) + 1;
    }

    setStats({ runs: runCount, bestSpeed, rank });
    setIsAuthLoading(false);
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ==================== LOGOUT ====================
  const handleLogout = useCallback(async () => {
    await logout();
  }, []);

  // ==================== AVATAR HANDLER ====================
  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh đại diện không được vượt quá 5MB!');
      e.target.value = '';
      return;
    }
    const compressed = await compressImage(file);
    setAvatarFile(compressed);
    setPreviewUrl(URL.createObjectURL(compressed));
  }, []);

  // ==================== UPDATE PROFILE ====================
  const handleUpdateProfile = useCallback(async () => {
    if (!user) return;
    let avatarUrl = editForm.avatar_url;

    if (avatarFile) {
      const fileName = `${user.id}-${Date.now()}.webp`;
      await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          upsert: true,
          cacheControl: '2592000', // 30 ngày
        });

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatarUrl = data.publicUrl;
    }

    await supabase
      .from('profiles')
      .update({
        nickname: editForm.nickname,
        full_name: editForm.full_name,
        avatar_url: avatarUrl,
        bio: editForm.bio,
      })
      .eq('id', user.id);

    setProfile({ ...editForm, avatar_url: avatarUrl });
    setEditOpen(false);
    setAvatarFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  }, [user, editForm, avatarFile, previewUrl]);

  const optimizedAvatarUrl = useMemo(
    () => getOptimizedAvatarUrl(profile?.avatar_url),
    [profile?.avatar_url]
  );

  // ==================== RENDER ====================
  if (isAuthLoading || !isDataLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 bg-zinc-950 text-green-500 text-lg">
        Đang tải profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-5">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <Car className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-black mb-2">Chào mừng trở lại!</h1>
            <p className="text-zinc-400 mb-8">Đăng nhập để xem profile và lịch sử Run của bạn</p>
            <Button
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: window.location.origin + '/profile' },
                })
              }
              className="w-full py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center gap-3"
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

  const isTopRank = typeof stats.rank === 'number' && stats.rank <= 3;

  return (
    <div className="space-y-6 pb-20 px-4 max-w-2xl mx-auto">
      {/* Avatar + Info */}
      <div className="flex flex-col items-center text-center pt-4">
        <div className="relative">
          <Avatar className="w-28 h-28 mb-4 border-4 border-green-500">
            <AvatarImage src={optimizedAvatarUrl} />
            <AvatarFallback className="text-5xl bg-zinc-800">
              {profile?.nickname?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          {isTopRank && (
            <div className="absolute bottom-1 right-1 bg-gradient-to-br from-yellow-400 to-amber-500 text-black text-xs font-bold px-3 py-0.5 rounded-2xl shadow-2xl shadow-yellow-500/50 flex items-center gap-1 border-2 border-white">
              <Trophy className="w-3 h-3" />#{stats.rank}
            </div>
          )}
        </div>

        <h1 className="text-3xl font-black">{profile?.nickname}</h1>
        {profile?.full_name && <p className="text-zinc-400">{profile.full_name}</p>}
        {profile?.bio && <p className="text-sm text-zinc-300 mt-6 max-w-md">{profile.bio}</p>}

        <Button className="mt-8 gap-2" size="lg" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4" /> Chỉnh sửa profile
        </Button>
      </div>

      {/* Xe của tôi */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" /> Xe của tôi ({vehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">Bạn chưa có xe nào.</div>
          ) : (
            vehicles.map((v: any) => (
              <div key={v.id} className="flex justify-between items-center bg-zinc-800 p-4 rounded-2xl">
                <div>
                  <p className="font-medium">{v.nickname}</p>
                  <p className="text-xs text-zinc-400">{v.brand} {v.model} • {v.vehicle_type}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Thống kê */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Thống kê
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-green-400">{stats.runs}</p>
            <p className="text-xs text-zinc-400">Run đã ghi</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">{stats.bestSpeed}</p>
            <p className="text-xs text-zinc-400">Top Speed cao nhất</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400">
              {typeof stats.rank === 'number' ? `#${stats.rank}` : '—'}
            </p>
            <p className="text-xs text-zinc-400">Rank hiện tại</p>
          </div>
        </CardContent>
      </Card>

      {/* Lịch sử Run */}
      <Card className="bg-zinc-900 border-zinc-800 cursor-pointer hover:bg-zinc-800 transition-colors" onClick={() => setHistoryOpen(true)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Lịch sử Run ({runsHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-zinc-400 py-6">
          Nhấn để xem 3 lần chạy gần nhất của bạn
        </CardContent>
      </Card>

      <Button onClick={handleLogout} variant="destructive" className="w-full mt-6 py-6 text-base gap-2">
        <LogOut className="h-5 w-5" /> Đăng xuất
      </Button>

      {/* Dialog Lịch sử Run */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Lịch sử Run gần nhất</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto space-y-3 py-2">
            {runsHistory.map((run) => (
              <div
                key={run.id}
                className="flex justify-between items-center bg-zinc-800 p-5 rounded-3xl cursor-pointer hover:bg-zinc-700 transition-colors"
                onClick={() => {
                  setSelectedRun(run);
                  setHistoryOpen(false);
                }}
              >
                <div>
                  <p className="font-medium">{run.vehicles?.nickname || 'Xe không tên'}</p>
                  <p className="text-xs text-zinc-400">{new Date(run.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{run.max_speed} km/h</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog CHI TIẾT RUN */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Run</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <p className="text-7xl font-black text-green-400">{selectedRun.max_speed}</p>
                <p className="text-zinc-400 text-2xl">km/h</p>
              </div>
              <div className="grid grid-cols-2 gap-6 border-t border-zinc-700 pt-6">
                {selectedRun.zero_to_sixty && (
                  <div className="text-center">
                    <p className="text-zinc-400 text-sm">0 - 60 km/h</p>
                    <p className="text-4xl font-bold text-cyan-400">{selectedRun.zero_to_sixty}s</p>
                  </div>
                )}
                {selectedRun.zero_to_hundred && (
                  <div className="text-center">
                    <p className="text-zinc-400 text-sm">0 - 100 km/h</p>
                    <p className="text-4xl font-bold text-cyan-400">{selectedRun.zero_to_hundred}s</p>
                  </div>
                )}
                {selectedRun.distance_to_max_speed && (
                  <div className="text-center">
                    <p className="text-zinc-400 text-sm">Khoảng cách đạt max</p>
                    <p className="text-4xl font-bold text-amber-400">{selectedRun.distance_to_max_speed}m</p>
                  </div>
                )}
              </div>
              <div className="space-y-4 text-sm border-t border-zinc-700 pt-6">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Khu vực</span>
                  <span className="font-medium">{selectedRun.region}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Thời gian</span>
                  <span className="font-medium">{new Date(selectedRun.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Xe</span>
                  <span className="font-medium">{selectedRun.vehicles?.nickname || 'Không có'}</span>
                </div>
                {selectedRun.gps_accuracy && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Độ chính xác GPS</span>
                    <span className="font-medium">{selectedRun.gps_accuracy}</span>
                  </div>
                )}
                {selectedRun.is_low_accuracy !== null && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">GPS thấp</span>
                    <span className={`font-medium ${selectedRun.is_low_accuracy ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedRun.is_low_accuracy ? 'Có' : 'Không'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa profile */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label>Ảnh đại diện (tối đa 5MB - tự nén)</Label>
              <Input type="file" accept="image/*" onChange={handleAvatarChange} className="h-12" />
              {previewUrl && <img src={previewUrl} alt="preview" className="mt-4 w-20 h-20 object-cover rounded-xl" />}
            </div>
            <div>
              <Label>Nickname</Label>
              <Input value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} className="h-12" />
            </div>
            <div>
              <Label>Họ và tên</Label>
              <Input value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="h-12" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={editForm.bio || ''} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button onClick={handleUpdateProfile}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DonateModal />
    </div>
  );
}