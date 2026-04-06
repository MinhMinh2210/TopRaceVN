'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';
import { useRouter } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Trophy, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const checkAdminAuth = useCallback(async () => {
    setLoadingAuth(true);
    
    const user = await getCurrentUser();
    
    if (!user) {
      setCurrentUser(null);
      setLoadingAuth(false);
      return;
    }

    // Kiểm tra quyền admin (nếu bạn chưa thêm cột is_admin thì tạm thời cho tất cả user là admin để test)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url') // tạm không select is_admin nếu chưa có cột
      .eq('id', user.id)
      .single();

    setCurrentUser(user);
    setIsAdmin(true);           // ← Tạm thời cho tất cả user là admin để test
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/admin' },
    });
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-12 h-12 text-green-500 animate-pulse" />
          <p className="text-green-500 text-xl font-bold">Đang kiểm tra quyền Admin...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-5">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-black mb-2">Admin Panel</h1>
            <p className="text-zinc-400 mb-8">Đăng nhập để truy cập khu vực quản trị</p>

            <Button
              onClick={handleGoogleLogin}
              className="w-full py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Đăng nhập bằng Google
            </Button>

            <Button
              variant="outline"
              className="w-full mt-4 py-6 text-base"
              onClick={() => router.push('/')}
            >
              ← Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-green-500" />
            <div>
              <h1 className="text-5xl font-black tracking-tighter">TopRaceVN</h1>
              <p className="text-green-500 font-bold text-xl -mt-1">ADMIN PANEL</p>
            </div>
          </div>
          
          <Button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </Button>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-16 text-center">
            <h2 className="text-4xl font-black text-green-400 mb-6">
              🎉 Thành công!
            </h2>
            <p className="text-2xl text-white">Bạn đã vào được Admin Panel</p>
            <p className="text-zinc-400 mt-4">Bước 1 hoàn tất. Không còn lỗi 404 nữa.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}