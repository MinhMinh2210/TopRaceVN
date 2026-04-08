'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, CreditCard, Database, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/'); // chưa login → về trang chủ
        return;
      }

      // Kiểm tra quyền admin trong profiles
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .single();

      if (!data || data.is_admin !== true) {
        alert('Bạn không có quyền truy cập Admin Panel!');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
        Đang kiểm tra quyền admin...
      </div>
    );
  }

  if (!isAdmin) return null; // đã redirect rồi

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/packages', label: 'Gói cước', icon: Package },
    { href: '/admin/payments', label: 'Duyệt thanh toán', icon: CreditCard },
    { href: '/admin/users', label: 'Quản lý User', icon: Users },
    { href: '/admin/runs', label: 'Quản lý Run', icon: Database },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col">
        <div className="text-3xl font-black mb-10 text-cyan-400 tracking-tighter">ADMIN</div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
                  isActive ? 'bg-cyan-500 text-black' : 'hover:bg-zinc-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-zinc-800 rounded-2xl mt-auto"
        >
          <LogOut className="w-5 h-5" />
          Thoát Admin
        </button>
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}