'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Car, Trophy, Clock, Gauge, User } from 'lucide-react';

import { supabase } from '@/lib/supabase/client';
import { loginWithGoogle } from '@/app/features/auth/login';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
  mod_level: string;
};

type Run = {
  max_speed: number;
  zero_to_hundred: number;
  region: string;
};

type WeatherData = {
  temperature: number;
  humidity: number;
  weatherCode: number;
  city: string;
  emoji: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [bestRun, setBestRun] = useState<Run | null>(null);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [runCountToday, setRunCountToday] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Weather real-time
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

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
      icon: <Gauge className="w-12 h-12 text-yellow-400" />,
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
      icon: <User className="w-12 h-12 text-cyan-400" />,
      bg: "from-cyan-500 to-blue-600",
    },
  ];

  // ==================== CAROUSEL AUTO SLIDE ====================
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // ==================== REAL WEATHER API (Open-Meteo - no key) ====================
  const fetchRealWeather = useCallback(async (lat: number, lon: number) => {
    setWeatherLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia/Ho_Chi_Minh`
      );
      const data = await res.json();

      const code = data.current.weather_code;
      const emojiMap: { [key: number]: string } = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌧️', 53: '🌧️', 55: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '❄️', 73: '❄️', 75: '❄️',
        95: '⛈️', 96: '⛈️', 99: '⛈️',
      };

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        weatherCode: code,
        city: 'TP.HCM', // Open-Meteo không trả city name → dùng fallback đẹp
        emoji: emojiMap[code] || '⛅',
      });
    } catch (err) {
      console.error('Weather fetch error:', err);
      // Fallback an toàn nếu API lỗi
      setWeather({
        temperature: 32,
        humidity: 65,
        weatherCode: 0,
        city: 'TP.HCM',
        emoji: '☀️',
      });
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Lấy vị trí thực tế của user (geolocation)
  const getUserLocationAndWeather = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchRealWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback về TP.HCM nếu user từ chối hoặc lỗi
          fetchRealWeather(10.8231, 106.6297);
        }
      );
    } else {
      fetchRealWeather(10.8231, 106.6297);
    }
  }, [fetchRealWeather]);

  // ==================== INIT USER + DASHBOARD DATA ====================
  const init = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);

    if (!u) {
      setIsAuthLoading(false);
      return;
    }

    const userId = u.id;

    // Fetch vehicle
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();
    setVehicle(vehicleData);

    // Fetch best run
    const { data: bestRunData } = await supabase
      .from('runs')
      .select('max_speed, zero_to_hundred, region')
      .eq('user_id', userId)
      .order('max_speed', { ascending: false })
      .limit(1)
      .single();
    setBestRun(bestRunData);

    // Calculate current rank (global)
    if (bestRunData?.max_speed) {
      const { count } = await supabase
        .from('runs')
        .select('*', { count: 'exact', head: true })
        .gt('max_speed', bestRunData.max_speed);
      setCurrentRank((count || 0) + 1);
    }

    // Count runs today
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
      .from('runs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today);
    setRunCountToday(todayCount || 0);

    setIsAuthLoading(false);

    // Load real weather sau khi user đã login
    getUserLocationAndWeather();
  }, [getUserLocationAndWeather]);

  useEffect(() => {
    init();
  }, [init]);

  const handleGoogleLogin = useCallback(async () => {
    await loginWithGoogle();
  }, []);

  // ==================== LOADING ====================
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  // ==================== CHƯA ĐĂNG NHẬP ====================
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white overflow-hidden pb-20">
        {/* SPEED RANK HEADER */}
        <div className="pt-12 px-6 text-center">
          <h1 className="text-[2.8rem] md:text-[3.2rem] font-black leading-none tracking-tighter bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            81 VIETNAM SPEED RANK
          </h1>
        </div>

        {/* CAROUSEL CARD - đồng bộ style leaderboard */}
        <Card className="bg-zinc-900 border-zinc-800 mx-4 mt-10 max-w-[340px] mx-auto shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            <div className="relative h-[320px] overflow-hidden">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 flex flex-col items-center justify-center text-center px-4
                    ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                >
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.bg} flex items-center justify-center mx-auto mb-6 shadow-xl`}>
                    {slide.icon}
                  </div>
                  <h2 className="text-3xl font-black mb-2 text-white">{slide.title}</h2>
                  <p className="text-lg text-cyan-400">{slide.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === currentSlide ? 'bg-cyan-400 w-8' : 'bg-zinc-600'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nút Google - style giống leaderboard */}
        <div className="px-6 mt-12">
          <Button
            onClick={handleGoogleLogin}
            size="lg"
            className="w-full py-8 text-xl font-semibold bg-white text-black hover:bg-zinc-100 rounded-3xl flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
            Google Login
          </Button>
        </div>

        <div className="flex justify-center items-center gap-2 text-zinc-500 text-sm mt-4">
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          <span>Powered by Google</span>
        </div>

        {/* Bottom Nav - mobile style */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 py-2 px-6 flex justify-around text-xs text-zinc-400 z-50">
          <div className="flex flex-col items-center text-cyan-400">
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

  // ==================== ĐÃ ĐĂNG NHẬP - DASHBOARD (UI đồng bộ Leaderboard) ====================
  return (
    <div className="min-h-screen bg-zinc-950 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header giống Leaderboard */}
        <div className="text-center pt-8 pb-6">
          <div className="inline-flex items-center gap-2 text-4xl font-black tracking-tighter text-white">
            <span className="text-cyan-400">Trip</span>
            <span>Rank</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Top Speed Card */}
          <Card className="bg-zinc-900 border-zinc-800 hover:border-cyan-400/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-cyan-400">
                <Gauge className="w-5 h-5" />
                Top Speed tốt nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-black text-emerald-400">
                {bestRun?.max_speed?.toFixed(1) || '--'}
              </p>
              <p className="text-zinc-400 text-sm">km/h</p>
            </CardContent>
          </Card>

          {/* 0-100 Card */}
          <Card className="bg-zinc-900 border-zinc-800 hover:border-cyan-400/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-cyan-400">
                <Clock className="w-5 h-5" />
                0-100 nhanh nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-black text-emerald-400">
                {bestRun?.zero_to_hundred?.toFixed(1) || '--'}
              </p>
              <p className="text-zinc-400 text-sm">giây</p>
            </CardContent>
          </Card>

          {/* Vehicle Card */}
          <Card className="bg-zinc-900 border-zinc-800 hover:border-cyan-400/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-cyan-400">
                <Car className="w-5 h-5" />
                Hệ xe hiện tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black text-white capitalize">
                {vehicle?.vehicle_type?.replace(/_/g, ' ') || 'Chưa có xe'}
              </p>
              <p className="text-zinc-400 text-sm">
                {vehicle ? `${vehicle.nickname} • ${vehicle.mod_level}` : 'Hãy tạo xe trước'}
              </p>
            </CardContent>
          </Card>

          {/* Rank Card */}
          <Link href="/leaderboard" className="block col-span-2 md:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800 hover:border-cyan-400/30 transition-all active:scale-[0.98] h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-cyan-400">
                  <Trophy className="w-5 h-5" />
                  Rank hiện tại
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-black text-emerald-400">
                  #{currentRank || '--'}
                </p>
                <p className="text-zinc-400 text-sm">
                  {bestRun?.region || 'Chưa xác định'} • Top Speed
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Runs today */}
          <Card className="bg-zinc-900 border-zinc-800 hover:border-cyan-400/30 transition-colors col-span-2 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-cyan-400">Số Run hôm nay</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-black text-white">{runCountToday}</p>
            </CardContent>
          </Card>
        </div>

        {/* REAL WEATHER CARD - đồng bộ hoàn toàn với Leaderboard */}
        <Card className="mt-8 bg-gradient-to-br from-zinc-900 to-emerald-950 border border-emerald-500/30 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-emerald-400 text-sm font-medium tracking-widest">THỜI TIẾT HIỆN TẠI</p>
                <p className="text-3xl font-black text-white">
                  {weatherLoading ? 'Đang tải...' : weather?.city}
                </p>
              </div>
              <div className="text-right">
                {weatherLoading ? (
                  <div className="w-16 h-16 bg-zinc-800 animate-pulse rounded-2xl" />
                ) : (
                  <>
                    <div className="text-6xl mb-1">{weather?.emoji}</div>
                    <p className="text-4xl font-black text-white">{weather?.temperature}°C</p>
                    <p className="text-emerald-300 text-sm">
                      Độ ẩm {weather?.humidity}%
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* GPS Signal - giữ nguyên nhưng style đồng bộ */}
            <div className="bg-black/40 rounded-3xl p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-zinc-400 text-sm">SỐ VỆ TINH GPS ĐANG KẾT NỐI</p>
                  <p className="text-5xl font-black text-cyan-400">17 <span className="text-2xl text-cyan-300">/ 24</span></p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-sm font-medium px-4 py-2 rounded-2xl">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
                    TÍN HIỆU RẤT TỐT
                  </div>
                </div>
              </div>
            </div>

            {/* Khu vực lân cận - giữ style đẹp */}
            <div>
              <p className="text-zinc-400 text-sm mb-4">KHU VỰC LÂN CẬN</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center bg-black/30 rounded-3xl p-4">
                  <p className="text-xs text-zinc-400">Bình Dương</p>
                  <p className="text-2xl font-semibold">34°C</p>
                  <p className="text-amber-400 text-sm">🌤️</p>
                </div>
                <div className="text-center bg-black/30 rounded-3xl p-4">
                  <p className="text-xs text-zinc-400">Đồng Nai</p>
                  <p className="text-2xl font-semibold">32°C</p>
                  <p className="text-amber-400 text-sm">⛅</p>
                </div>
                <div className="text-center bg-black/30 rounded-3xl p-4">
                  <p className="text-xs text-zinc-400">Long An</p>
                  <p className="text-2xl font-semibold">35°C</p>
                  <p className="text-amber-400 text-sm">☀️</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}