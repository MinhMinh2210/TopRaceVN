'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, nickname, full_name, avatar_url, bio,
        user_subscriptions!user_id (
          status, end_date, remaining_runs,
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black mb-6">Quản lý User</h1>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="space-y-4">
          {users.map((u) => {
            const sub = u.user_subscriptions?.[0];
            return (
              <Card key={u.id} className="bg-zinc-900 border-zinc-700">
                <CardContent className="p-6 flex items-center gap-6">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback>{u.nickname?.[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <p className="font-semibold text-lg">{u.nickname}</p>
                    <p className="text-sm text-zinc-400">{u.full_name}</p>
                  </div>

                  {sub && (
                    <div className="text-right">
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                        {sub.packages?.display_name}
                      </Badge>
                      <p className="text-xs text-zinc-400 mt-1">
                        Còn {sub.remaining_runs} run • Hết {new Date(sub.end_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}