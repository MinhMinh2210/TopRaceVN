'use client';

import { useState, useEffect, useCallback } from 'react';
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

type Profile = {
  nickname: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type RunHistory = {
  id: number;
  max_speed: number;
  zero_to_hundred: number | null;
  created_at: string;
  region: string;
  vehicles: {
    nickname: string;
    vehicle_type: string;
  } | null;
};

export default function MyProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [runsHistory, setRunsHistory] = useState<RunHistory[]>([]);
  const [stats, setStats] = useState({ runs: 0, bestSpeed: 0, rank: '—' as string | number });
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Profile>({ nickname: '', full_name: '', avatar_url: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunHistory | null>(null);

  // ==================== INIT AUTH + LOAD ALL DATA ====================
  const loadAllData = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (!currentUser) {
      setIsAuthLoading(false);
      return;
    }

    // Load profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('nickname, full_name, avatar_url, bio')
      .eq('id', currentUser.id)
      .single();

    setProfile(prof);
    setEditForm(prof || { nickname: '', full_name: '', avatar_url: '', bio: '' });

    // Load vehicles
    const { data: veh } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', currentUser.id);
    setVehicles(veh || []);

    // Load run history
    const { data: history } = await supabase
      .from('runs')
      .select(`
        id,
        max_speed,
        zero_to_hundred,
        created_at,
        region,
        vehicles (nickname, vehicle_type)
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const formatted = (history || []).map((r: any) => ({
      id: r.id,
      max_speed: r.max_speed,
      zero_to_hundred: r.zero_to_hundred,
      created_at: r.created_at,
      region: r.region || 'Không xác định',
      vehicles: r.vehicles || null,           // ← Fix: hiển thị đúng tên xe
    }));

    setRunsHistory(formatted);

    // Stats
    const { count } = await supabase
      .from('runs')
      .select('*', { count: 'exact' })
      .eq('user_id', currentUser.id);

    const { data: best } = await supabase
      .from('runs')
      .select('max_speed')
      .eq('user_id', currentUser.id)
      .order('max_speed', { ascending: false })
      .limit(1);

    const bestSpeed = best?.[0]?.max_speed || 0;

    // Tính rank thực tế
    let rank: string | number = '—';
    if (bestSpeed > 0) {
      const { count: higher } = await supabase
        .from('runs')
        .select('*', { count: 'exact', head: true })
        .gt('max_speed', bestSpeed);
      rank = (higher || 0) + 1;
    }

    setStats({
      runs: count || 0,
      bestSpeed: bestSpeed,
      rank: rank,
    });

    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ==================== GOOGLE LOGIN & LOGOUT ====================
  const handleGoogleLogin = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/profile' },
    });
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
  }, []);

  // ==================== AVATAR & PROFILE UPDATE ====================
  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleUpdateProfile = useCallback(async () => {
    if (!user) return;

    let avatarUrl = editForm.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
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
    setPreviewUrl('');
  }, [user, editForm, avatarFile]);

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
            <h1 className="text-3xl font-black mb-2">Chào mừng trở lại!</h1>
            <p className="text-zinc-400 mb-8">Đăng nhập để xem profile và lịch sử Run của bạn</p>

            <Button
              onClick={handleGoogleLogin}
              className="w-full mx-auto py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google Login
            </Button>

            <Button
              variant="outline"
              className="w-full mt-4 py-6 text-base"
              onClick={() => window.location.href = '/'}
            >
              ← Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== ĐÃ ĐĂNG NHẬP - PROFILE ====================
  const isTopRank = typeof stats.rank === 'number' && stats.rank <= 3;

  return (
    <div className="space-y-6 pb-20 px-4 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center pt-4">
        {/* Avatar với badge top 1-2-3 */}
        <div className="relative">
          <Avatar className="w-28 h-28 mb-4 border-4 border-green-500">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-5xl bg-zinc-800">
              {profile?.nickname?.[0] || '?'}
            </AvatarFallback>
          </Avatar>

          {/* Badge top 1-2-3 - góc dưới phải */}
          {isTopRank && (
            <div className="absolute bottom-1 right-1 bg-gradient-to-br from-yellow-400 to-amber-500 text-black text-xs font-bold px-3 py-0.5 rounded-2xl shadow-2xl shadow-yellow-500/50 flex items-center gap-1 border-2 border-white">
              <Trophy className="w-3 h-3" />
              #{stats.rank}
            </div>
          )}
        </div>

        <h1 className="text-3xl font-black">{profile?.nickname}</h1>
        {profile?.full_name && <p className="text-zinc-400">{profile.full_name}</p>}
        {profile?.bio && <p className="text-sm text-zinc-300 mt-6 max-w-md">{profile.bio}</p>}

        <Button className="mt-8 gap-2" size="lg" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4" />
          Chỉnh sửa profile
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Xe của tôi ({vehicles.length})
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

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Thống kê
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

      <Card 
        className="bg-zinc-900 border-zinc-800 cursor-pointer hover:bg-zinc-800 transition-colors"
        onClick={() => setHistoryOpen(true)}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lịch sử Run ({runsHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-zinc-400 py-6">
          Nhấn để xem 10 lần chạy gần nhất của bạn
        </CardContent>
      </Card>

      <Button onClick={handleLogout} variant="destructive" className="w-full mt-6 py-6 text-base gap-2">
        <LogOut className="h-5 w-5" /> Đăng xuất
      </Button>

      {/* Dialog Lịch sử Run */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Lịch sử Run của bạn</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto space-y-3">
            {runsHistory.map((run) => (
              <div
                key={run.id}
                className="flex justify-between items-center bg-zinc-800 p-4 rounded-2xl cursor-pointer hover:bg-zinc-700"
                onClick={() => setSelectedRun(run)}
              >
                <div>
                  <p className="font-medium">
                    {run.vehicles?.nickname || 'Xe không tên'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(run.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-400">{run.max_speed} km/h</p>
                  {run.zero_to_hundred && (
                    <p className="text-xs text-zinc-400">0-100: {run.zero_to_hundred}s</p>
                  )}
                  <p className="text-xs text-zinc-400">{run.region}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Chi tiết Run */}
      <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết Run</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <p className="text-6xl font-black text-green-400">{selectedRun.max_speed}</p>
                <p className="text-zinc-400">km/h</p>
              </div>
              {selectedRun.zero_to_hundred && (
                <div className="text-center">
                  <p className="text-5xl font-bold text-green-400">{selectedRun.zero_to_hundred}</p>
                  <p className="text-zinc-400">giây (0-100 km/h)</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-zinc-700 pt-6">
                <div>
                  <p className="text-zinc-400">Thời gian</p>
                  <p className="font-medium">{new Date(selectedRun.created_at).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-zinc-400">Khu vực</p>
                  <p className="font-medium">{selectedRun.region}</p>
                </div>
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
              <Label>Ảnh đại diện</Label>
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
    </div>
  );
}