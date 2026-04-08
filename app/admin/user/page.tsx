'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Edit, Ban, UserCheck, Search } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ nickname: '', full_name: '', bio: '' });

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, 
        nickname, 
        full_name, 
        avatar_url, 
        bio,
        is_banned,
        user_subscriptions!user_id (
          status, 
          end_date, 
          packages (display_name)
        )
      `)
      .order('nickname');

    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  // ==================== BAN / UNBAN ====================
  const toggleBan = async (userId: string, currentBanned: boolean) => {
    if (confirm(currentBanned ? 'Bỏ ban user này?' : 'Ban user này?')) {
      await supabase
        .from('profiles')
        .update({ is_banned: !currentBanned })
        .eq('id', userId);
      loadUsers();
    }
  };

  // ==================== SỬA USER ====================
  const openEdit = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      nickname: user.nickname || '',
      full_name: user.full_name || '',
      bio: user.bio || '',
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedUser) return;
    await supabase
      .from('profiles')
      .update({
        nickname: editForm.nickname,
        full_name: editForm.full_name,
        bio: editForm.bio,
      })
      .eq('id', selectedUser.id);

    setEditOpen(false);
    loadUsers();
  };

  // ==================== XÓA USER ====================
  const deleteUser = async (userId: string) => {
    if (confirm('XÓA user này và toàn bộ dữ liệu liên quan?')) {
      await supabase.from('profiles').delete().eq('id', userId);
      loadUsers();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-black">Quản lý User</h1>
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
          <Input
            placeholder="Tìm theo nickname..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center py-12">Đang tải danh sách user...</p>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((u) => {
            const sub = u.user_subscriptions?.[0];
            return (
              <Card key={u.id} className="bg-zinc-900 border-zinc-700 hover:border-zinc-600 transition-colors">
                <CardContent className="p-6 flex items-center gap-6">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback>{u.nickname?.[0] || '?'}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-xl">{u.nickname}</p>
                      {u.is_banned && <Badge variant="destructive">ĐÃ BAN</Badge>}
                    </div>
                    <p className="text-zinc-400">{u.full_name}</p>
                    {sub && (
                      <p className="text-sm text-cyan-400 mt-1">
                        {sub.packages?.display_name} • Còn {sub.remaining_runs} run
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEdit(u)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={u.is_banned ? "default" : "destructive"}
                      size="icon"
                      onClick={() => toggleBan(u.id, u.is_banned)}
                    >
                      {u.is_banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => deleteUser(u.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Sửa User */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Sửa thông tin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label>Nickname</Label>
              <Input value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} />
            </div>
            <div>
              <Label>Họ và tên</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button onClick={saveEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}