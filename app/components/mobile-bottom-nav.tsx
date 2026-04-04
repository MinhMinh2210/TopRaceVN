'use client';

import { Home, Car, Trophy, History, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { title: 'Trang chủ', url: '/', icon: Home },
  { title: 'Run', url: '/run', icon: Car },
  { title: 'Xe', url: '/vehicles', icon: Car },
  { title: 'Rank', url: '/leaderboard', icon: Trophy },
  { title: 'Tôi', url: '/profile', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="bg-zinc-950 border-t border-zinc-800 py-2 px-4">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.url;
          return (
            <Link
              key={item.url}
              href={item.url}
              className={`flex flex-col items-center py-1 px-3 transition-colors ${
                isActive ? 'text-green-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}