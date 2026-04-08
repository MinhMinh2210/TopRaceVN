'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, CreditCard, Database, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/packages', label: 'Gói cước', icon: Package },
    { href: '/admin/payments', label: 'Duyệt thanh toán', icon: CreditCard },
    { href: '/admin/users', label: 'Quản lý User', icon: Users },
    { href: '/admin/runs', label: 'Quản lý Run', icon: Database },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
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

      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}