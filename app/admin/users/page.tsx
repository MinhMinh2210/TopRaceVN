'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';   // ← ĐÃ THÊM
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Edit, Search } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    nickname: '',
    full_name: '',
    bio: '',
  });

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, full_name, avatar_url, bio')
      .order('nickname');

    if (error) console.error('Lỗi load users:', error);
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

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
    const { error } = await supabase
      .from('profiles')
      .update(editForm)
      .eq('id', selectedUser.id);

    if (error) alert('Lỗi lưu: ' + error.message);
    else {
      setEditOpen(false);
      loadUsers();
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Xóa user này và toàn bộ dữ liệu liên quan?')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) alert('Lỗi xóa: ' + error.message);
    else loadUsers();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black">Quản lý User</h1>
        
        <div className="relative w-80">
          <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
          <Input
            placeholder="Tìm nickname hoặc họ tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-center py-12 text-zinc-400">Đang tải danh sách user...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-center py-12 text-zinc-400">Không tìm thấy user nào.</p>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((u) => (
            <Card key={u.id} className="bg-zinc-900 border-zinc-700 hover:border-zinc-600 transition-colors">
              <CardContent className="p-6 flex items-center gap-6">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback>{u.nickname?.[0] || '?'}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-xl font-semibold truncate">{u.nickname}</p>
                  <p className="text-zinc-400 text-sm">{u.full_name || 'Chưa có họ tên'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => openEdit(u)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => deleteUser(u.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog sửa user */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Sửa thông tin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label>Nickname</Label>
              <Input 
                value={editForm.nickname} 
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} 
              />
            </div>
            <div>
              <Label>Họ và tên</Label>
              <Input 
                value={editForm.full_name} 
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} 
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea 
                value={editForm.bio} 
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} 
                rows={4}
              />
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