'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';
import { logout } from '@/app/features/auth/logout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Car, Edit, Trophy, LogOut } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
  year: number | null;
  mod_level: string;
  description: string | null;
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState({ 
    runs: 0, 
    bestSpeed: 0,
    rank: 0                     // ← Rank thật từ DB
  });
  const [loading, setLoading] = useState(true);

  // Dialog chỉnh sửa
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Profile>({
    nickname: '',
    full_name: '',
    avatar_url: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      // Profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('nickname, full_name, avatar_url, bio')
        .eq('id', user.id)
        .single();

      setProfile(prof);
      setEditForm(prof || { nickname: '', full_name: '', avatar_url: '', bio: '' });

      // Danh sách xe
      const { data: veh } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id);
      setVehicles(veh || []);

      // Thống kê run + best speed
      const { count } = await supabase
        .from('runs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      const { data: best } = await supabase
        .from('runs')
        .select('max_speed')
        .eq('user_id', user.id)
        .order('max_speed', { ascending: false })
        .limit(1);

      // Rank thật của user (overall theo max_speed)
      const { count: betterCount } = await supabase
        .from('runs')
        .select('*', { count: 'exact', head: true })
        .gt('max_speed', best?.[0]?.max_speed || 0);

      const userRank = (betterCount || 0) + 1;

      setStats({
        runs: count || 0,
        bestSpeed: best?.[0]?.max_speed || 0,
        rank: userRank,
      });

      setLoading(false);
    };

    loadData();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    let avatarUrl = editForm.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) {
        alert('Upload ảnh lỗi: ' + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: editForm.nickname,
        full_name: editForm.full_name,
        avatar_url: avatarUrl,
        bio: editForm.bio,
      })
      .eq('id', user.id);

    if (!error) {
      setProfile({ ...editForm, avatar_url: avatarUrl });
      setEditOpen(false);
      setAvatarFile(null);
      setPreviewUrl('');
    } else {
      alert('Lỗi cập nhật: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) return <div className="p-6 text-center">Đang tải...</div>;

  return (
    <div className="space-y-6 pb-20 px-4">
      <div className="flex flex-col items-center text-center pt-4">
        <Avatar className="w-28 h-28 mb-4 border-4 border-green-500">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="text-5xl bg-zinc-800">
            {profile?.nickname?.[0] || '?'}
          </AvatarFallback>
        </Avatar>

        <h1 className="text-3xl font-black">{profile?.nickname}</h1>
        {profile?.full_name && <p className="text-zinc-400">{profile.full_name}</p>}

        {profile?.bio && <p className="text-sm text-zinc-300 mt-6 max-w-md">{profile.bio}</p>}

        <Button className="mt-8 gap-2" size="lg" onClick={() => setEditOpen(true)}>
          <Edit className="h-4 w-4" />
          Chỉnh sửa profile
        </Button>
      </div>

      {/* Danh sách xe */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Xe của tôi ({vehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              Bạn chưa có xe nào.<br />Hãy thêm xe ở trang Xe
            </div>
          ) : (
            vehicles.map((v) => (
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

      {/* Thống kê thật */}
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
            <p className="text-3xl font-bold text-green-400">#{stats.rank}</p>
            <p className="text-xs text-zinc-400">Rank hiện tại</p>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button onClick={handleLogout} variant="destructive" className="w-full mt-6 py-6 text-base gap-2">
        <LogOut className="h-5 w-5" />
        Đăng xuất
      </Button>

      {/* Dialog chỉnh sửa profile */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label>Ảnh đại diện</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="h-12"
              />
              {previewUrl && (
                <img src={previewUrl} alt="preview" className="mt-4 w-20 h-20 object-cover rounded-xl" />
              )}
            </div>

            <div>
              <Label>Nickname</Label>
              <Input
                value={editForm.nickname}
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                className="h-12"
              />
            </div>

            <div>
              <Label>Họ và tên</Label>
              <Input
                value={editForm.full_name || ''}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="h-12"
              />
            </div>

            <div>
              <Label>Bio</Label>
              <Textarea
                value={editForm.bio || ''}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
              />
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