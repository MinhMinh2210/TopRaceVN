import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/components/app-sidebar';
import { MobileBottomNav } from '@/app/components/mobile-bottom-nav';
import DonateModal from '@/app/components/donate-modal';

const inter = Inter({ 
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TopRaceVN - Sân chơi rank tốc độ xe',
  description: 'Chạy thật - Đo thật - Rank thật | GPS chính xác • Bảng xếp hạng toàn quốc',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  manifest: '/manifest.json',
  themeColor: '#22c55e',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="msapplication-TileColor" content="#22c55e" />
      </head>

      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar Desktop */}
            <div className="hidden md:block">
              <AppSidebar />
            </div>

            {/* Main Content Area */}
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

              {/* Page Content */}
              <main className="flex-1 min-h-0 overflow-auto pb-20 md:pb-6 px-2 md:px-6 py-4 md:py-6">
                {children}
              </main>

              {/* Bottom Navigation (Mobile) */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <MobileBottomNav />
              </div>
            </div>
          </div>
        </SidebarProvider>

        {/* Donate Modal - Global (render 1 lần cho toàn app) */}
        <DonateModal />
      </body>
    </html>
  );
}