import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/components/app-sidebar';
import { MobileBottomNav } from '@/app/components/mobile-bottom-nav';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'TopRaceVN - Sân chơi rank tốc độ xe',
  description: 'Chạy thật - Đo thật - Rank thật',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-white`}>
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar Desktop */}
            <div className="hidden md:block">
              <AppSidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header Mobile */}
              <header className="h-14 md:hidden border-b border-zinc-800 bg-zinc-950 flex items-center px-4 z-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                    <span className="text-black font-black text-xl">T</span>
                  </div>
                  <h1 className="font-black text-xl text-green-500">TopRaceVN</h1>
                </div>
              </header>

              {/* Page Content - Giảm padding mạnh trên mobile để fill hết */}
<main className="flex-1 overflow-auto pb-20 md:pb-6 px-2 md:px-6 py-4 md:py-6">
  {children}
</main>

              {/* Bottom Nav */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <MobileBottomNav />
              </div>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}