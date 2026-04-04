'use client';

import { Home, Car, Trophy, History, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  { title: 'Trang chủ', url: '/', icon: Home },
  { title: 'Bắt đầu Run', url: '/run', icon: Car },
  { title: 'Xe của tôi', url: '/vehicles', icon: Car },
  { title: 'Lịch sử Run', url: '/history', icon: History },
  { title: 'Bảng xếp hạng', url: '/leaderboard', icon: Trophy },
  { title: 'Profile', url: '/profile', icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-zinc-800 bg-zinc-950">
      <SidebarHeader className="border-b border-zinc-800 p-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
            <span className="text-black font-black text-2xl">T</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-green-500">TopRaceVN</h1>
            <p className="text-xs text-zinc-500 -mt-1">Chạy thật • Rank thật</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500 px-4">MENU CHÍNH</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>TR</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-sm">
            <p className="font-medium">Bạn đang chạy</p>
            <p className="text-xs text-zinc-500">Chào mừng trở lại!</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}