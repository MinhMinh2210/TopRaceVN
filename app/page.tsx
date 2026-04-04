'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { loginWithGoogle } from '@/app/features/auth/login';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Car, Trophy, Gauge, Zap, Users, Clock, User } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "ĐUA TỐC ĐỘ THẬT",
      subtitle: "GPS chính xác • Rank toàn quốc",
      icon: <Gauge className="w-12 h-12 text-green-500" />,
      bg: "from-green-600 to-emerald-700",
    },
    {
      title: "0-100 KM/H",
      subtitle: "Thử thách tăng tốc nhanh nhất",
      icon: <Zap className="w-12 h-12 text-yellow-400" />,
      bg: "from-yellow-500 to-orange-600",
    },
    {
      title: "BẢNG XẾP HẠNG",
      subtitle: "Top racer Việt Nam",
      icon: <Trophy className="w-12 h-12 text-amber-400" />,
      bg: "from-amber-500 to-red-600",
    },
    {
      title: "CỘNG ĐỒNG RACER",
      subtitle: "Kết nối - Thi đấu - Thách đấu",
      icon: <Users className="w-12 h-12 text-cyan-400" />,
      bg: "from-cyan-500 to-blue-600",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser();
      setUser(u);
    };
    init();
  }, []);

  if (user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-black text-green-500">Chào mừng quay lại!</h1>
          <p className="text-zinc-400 mt-4">Bạn đã đăng nhập thành công</p>
          <Button onClick={() => window.location.href = '/run'} className="mt-8">
            Bắt đầu Run ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden pb-20">
      {/* HERO - SPEED RANK, chữ nhỏ hơn 30% */}
      <div className="pt-12 px-6 text-center">
        <h1 className="text-[2.8rem] md:text-[3.2rem] font-black leading-none tracking-tighter">
          SPEED RANK VIETNAM
        </h1>
      </div>

      {/* KHUNG SLIDE - Nhỏ hơn 30%, fill đều, căn giữa hoàn hảo trên mọi màn hình */}
      <Card className="bg-zinc-900 border-zinc-800 mx-auto mt-10 max-w-[320px] shadow-2xl">
        <CardContent className="p-6">
          <div className="relative h-[300px] overflow-hidden">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 flex flex-col items-center justify-center text-center px-4
                  ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              >
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.bg} flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                  {slide.icon}
                </div>
                <h2 className="text-3xl font-black mb-2">{slide.title}</h2>
                <p className="text-lg text-green-400">{slide.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentSlide ? 'bg-green-500 w-8' : 'bg-zinc-600'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* NÚT ĐĂNG NHẬP + LOGO GOOGLE */}
      <div className="px-6 mt-12 space-y-6">
        <Button
          onClick={loginWithGoogle}
          size="lg"
          className="w-full py-8 text-xl font-semibold bg-white text-black hover:bg-zinc-100 rounded-3xl flex items-center justify-center gap-3"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-6 h-6"
          />
          Đăng nhập bằng Google
        </Button>

        <div className="flex justify-center items-center gap-2 text-zinc-500 text-sm">
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-4 h-4"
          />
          <span>Powered by Google</span>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 py-2 px-6 flex justify-around text-xs text-zinc-400 z-50">
        <div className="flex flex-col items-center text-green-500">
          <Car className="w-6 h-6" />
          <span className="mt-1">Trang chủ</span>
        </div>
        <div className="flex flex-col items-center">
          <Clock className="w-6 h-6" />
          <span className="mt-1">Run</span>
        </div>
        <div className="flex flex-col items-center">
          <Car className="w-6 h-6" />
          <span className="mt-1">Xe</span>
        </div>
        <div className="flex flex-col items-center">
          <Trophy className="w-6 h-6" />
          <span className="mt-1">Rank</span>
        </div>
        <div className="flex flex-col items-center">
          <User className="w-6 h-6" />
          <span className="mt-1">Tôi</span>
        </div>
      </div>
    </div>
  );
}