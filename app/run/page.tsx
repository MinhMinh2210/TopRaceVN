'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Play, Square, RotateCcw, AlertCircle, Car } from 'lucide-react';

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
};

// ==================== THUẬT TOÁN HAVERSINE ĐÃ TỐI ƯU ====================
const DEG_TO_RAD = Math.PI / 180;
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const φ1 = lat1 * DEG_TO_RAD;
  const φ2 = lat2 * DEG_TO_RAD;
  const Δφ = (lat2 - lat1) * DEG_TO_RAD;
  const Δλ = (lon2 - lon1) * DEG_TO_RAD;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371e3 * c;
};

// ==================== REAL REGION DETECTION ====================
const getRegionFromCoords = (lat: number, lng: number): string => {
  if (lat >= 10.5 && lat <= 11.1 && lng >= 106.3 && lng <= 107.0) return 'TP.HCM';
  if (lat >= 20.8 && lat <= 21.3 && lng >= 105.6 && lng <= 106.1) return 'Hà Nội';
  if (lat >= 15.8 && lat <= 16.2 && lng >= 107.9 && lng <= 108.4) return 'Đà Nẵng';
  if (lat >= 12.1 && lat <= 12.4 && lng >= 109.0 && lng <= 109.3) return 'Nha Trang';
  if (lat >= 10.9 && lat <= 11.2 && lng >= 108.8 && lng <= 109.1) return 'Phan Thiết';
  if (lat >= 21.9 && lat <= 22.1 && lng >= 106.6 && lng <= 106.9) return 'Hạ Long';
  return 'Việt Nam';
};

// ==================== GPS STATUS 6 CẤP ĐỘ ====================
const getGPSStatusInfo = (accuracy: number, speedAvailable: boolean = false) => {
  if (!accuracy || accuracy > 10000) return { text: 'Không có tín hiệu 📡', color: 'text-red-400' };
  if (accuracy < 5 && speedAvailable) return { text: 'VŨ TRỤ SIÊU VIP PRO 🌌', color: 'text-emerald-400' };
  if (accuracy < 5) return { text: 'SIÊU CHÍNH XÁC VIP 🌟', color: 'text-emerald-400' };
  if (accuracy < 10) return { text: 'SIÊU CHÍNH XÁC 🔥', color: 'text-cyan-400' };
  if (accuracy < 20) return { text: 'Tuyệt vời ✅', color: 'text-green-400' };
  if (accuracy < 35) return { text: 'Tốt 👍', color: 'text-lime-400' };
  if (accuracy < 60) return { text: 'Trung bình ⚠️', color: 'text-yellow-400' };
  return { text: 'Yếu 📡', color: 'text-orange-400' };
};

export default function RunPage() {
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('Not checked');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [watchId, setWatchId] = useState<number | null>(null);

  const [currentRegion, setCurrentRegion] = useState<string>('Determining...');

  const [showResult, setShowResult] = useState(false);
  const [runResult, setRunResult] = useState({
    maxSpeed: 0,
    zeroToHundred: 0,
    distance: 0,
    region: '',
    date: '',
    rankInRegionToday: 0,
    personalBestImprovement: 0,
    isNewPersonalBest: false,
  });

  const resultRef = useRef<HTMLDivElement>(null);
  const positionHistory = useRef<{ lat: number; lng: number; timestamp: number }[]>([]);
  const speedHistory = useRef<{ timestamp: number; speed: number }[]>([]);

  // ==================== TỐI ƯU GPS ====================
  const lastUpdateRef = useRef<number>(0);
  const displayedSpeedRef = useRef<number>(0);

  // ==================== COUNTDOWN 5 GIÂY + RECORDING FLAG + SMOOTHING BUFFER ====================
  const [countdown, setCountdown] = useState<number | null>(null);
  const recordingStartedRef = useRef(false);
  const speedBufferRef = useRef<number[]>([]);           
  const lastValidSpeedRef = useRef(0);                   
  const velocityTrendRef = useRef(0);                    

  // ==================== KIỂM TRA ĐĂNG NHẬP ====================
  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser();
      setUser(u);

      if (u) {
        const { data } = await supabase
          .from('vehicles')
          .select('id, nickname, brand, model, vehicle_type')
          .eq('user_id', u.id);
        
        setVehicles(data || []);
        
        if (data && data.length > 0 && !selectedVehicle) {
          setSelectedVehicle(data[0]);
        }
      }
    };
    init();
  }, []);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/run',
      },
    });
  };

  const checkGPS = async () => {
    setErrorMessage('');
    setGpsStatus('Đang kiểm tra...');

    if (!navigator.geolocation) {
      setErrorMessage('Thiết bị không hỗ trợ GPS');
      setGpsStatus('Không có tín hiệu 📡');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { accuracy, speed } = position.coords;
        const speedAvailable = speed !== null && speed !== undefined;
        const info = getGPSStatusInfo(accuracy, speedAvailable);
        setGpsStatus(info.text);
        setGpsAccuracy(Math.round(accuracy));
      },
      (error) => {
        if (error.code === 1) setErrorMessage('Bạn chưa cấp quyền GPS');
        else setErrorMessage('Lỗi GPS: ' + error.message);
        setGpsStatus('Không có tín hiệu 📡');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // ==================== TỐI ƯU SMOOTHING + ADAPTIVE ANTI-JUMP (DÀNH CHO XE 1000CC SIÊU MẠNH) ====================
  const calculateSmoothedSpeed = (rawSpeed: number): number => {
    speedBufferRef.current.push(rawSpeed);
    if (speedBufferRef.current.length > 5) speedBufferRef.current.shift();

    const avg = speedBufferRef.current.reduce((a, b) => a + b, 0) / speedBufferRef.current.length;

    const alpha = 0.48;
    let smoothed = lastValidSpeedRef.current * (1 - alpha) + avg * alpha;

    // ==================== ADAPTIVE ANTI-JUMP - TỐI ƯU CHO XE 1000CC ====================
    // Xe mạnh (1000cc đề 3) có thể tăng 20-35km/h trong 1 tick GPS → cần ngưỡng linh hoạt
    const currentSpeedForCalc = lastValidSpeedRef.current;
    let maxAllowedJump = 18; // base

    // Tăng ngưỡng khi đang tăng tốc mạnh (dựa trên trend)
    if (velocityTrendRef.current > 8) maxAllowedJump = 26;           // đang "đè ga" mạnh
    else if (velocityTrendRef.current > 4) maxAllowedJump = 22;
    
    // Tăng thêm theo tốc độ hiện tại (xe càng nhanh càng cho phép nhảy lớn hơn)
    if (currentSpeedForCalc > 80) maxAllowedJump += 8;
    if (currentSpeedForCalc > 120) maxAllowedJump += 6;

    const diff = smoothed - lastValidSpeedRef.current;

    if (Math.abs(diff) > maxAllowedJump) {
      smoothed = lastValidSpeedRef.current + (diff > 0 ? maxAllowedJump : -maxAllowedJump);
    }

    // Theo dõi trend để ramp mượt
    const trend = smoothed - lastValidSpeedRef.current;
    velocityTrendRef.current = velocityTrendRef.current * 0.65 + trend * 0.35;

    lastValidSpeedRef.current = Math.max(0, Math.round(smoothed));
    return lastValidSpeedRef.current;
  };

  const startRun = () => {
    if (!selectedVehicle) {
      setErrorMessage('Vui lòng chọn xe trước khi bắt đầu Run!');
      return;
    }
    setErrorMessage('');
    setShowResult(false);
    setCurrentRegion('Đang xác định...');
    positionHistory.current = [];
    speedHistory.current = [];
    setMaxSpeed(0);
    displayedSpeedRef.current = 0;
    setCurrentSpeed(0);
    speedBufferRef.current = [];
    lastValidSpeedRef.current = 0;
    velocityTrendRef.current = 0;
    recordingStartedRef.current = false;

    setCountdown(5);
    let count = 5;

    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count > 0 ? count : null);

      if (count <= 0) {
        clearInterval(countdownInterval);

        if (!navigator.geolocation) return;

        const id = navigator.geolocation.watchPosition(
          (position) => {
            const now = Date.now();
            const { latitude, longitude, speed: gpsSpeed, accuracy } = position.coords;

            setCurrentRegion(getRegionFromCoords(latitude, longitude));

            positionHistory.current.push({ lat: latitude, lng: longitude, timestamp: now });
            if (positionHistory.current.length > 8) positionHistory.current.shift();

            let calculatedSpeed = 0;
            if (positionHistory.current.length >= 3) {
              const p1 = positionHistory.current[positionHistory.current.length - 3];
              const p2 = positionHistory.current[positionHistory.current.length - 2];
              const p3 = positionHistory.current[positionHistory.current.length - 1];
              const d1 = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
              const d2 = haversineDistance(p2.lat, p2.lng, p3.lat, p3.lng);
              const distance = (d1 + d2) / 2;
              const timeDiff = (p3.timestamp - p1.timestamp) / 1000;
              if (timeDiff > 0) calculatedSpeed = (distance / timeDiff) * 3.6;
            }

            let rawSpeed = Math.max(calculatedSpeed || gpsSpeed || 0, 0);
            rawSpeed = Math.round(rawSpeed * 0.96);
            if (rawSpeed < 3) rawSpeed = 0;

            const shouldRecord = rawSpeed >= 10;
            if (shouldRecord && !recordingStartedRef.current) {
              recordingStartedRef.current = true;
              positionHistory.current = [positionHistory.current[positionHistory.current.length - 1]!];
              speedHistory.current = [];
            }

            const targetSpeed = calculateSmoothedSpeed(rawSpeed);

            const timeSinceLast = now - lastUpdateRef.current;
            const adaptiveInterval = targetSpeed < 30 ? 800 : targetSpeed < 60 ? 500 : 300;
            if (timeSinceLast < adaptiveInterval && targetSpeed > 0) return;

            lastUpdateRef.current = now;
            displayedSpeedRef.current = targetSpeed;

            setCurrentSpeed(prev => {
              const diff = displayedSpeedRef.current - prev;
              return Math.round(prev + diff * 0.42);
            });

            // MAX SPEED luôn lấy giá trị đã smooth (đã adaptive anti-jump)
            if (targetSpeed > maxSpeed) setMaxSpeed(targetSpeed);

            if (recordingStartedRef.current) {
              speedHistory.current.push({ timestamp: now, speed: targetSpeed });
            }

            const speedAvailable = gpsSpeed !== null && gpsSpeed !== undefined;
            const info = getGPSStatusInfo(accuracy, speedAvailable);
            setGpsStatus(info.text);
            setGpsAccuracy(Math.round(accuracy));
          },
          (error) => {
            if (error.code === 1) setErrorMessage('Bạn chưa cấp quyền GPS');
            else setErrorMessage('Lỗi GPS: ' + error.message);
          },
          { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
        );

        setWatchId(id);
        setIsRunning(true);
      }
    }, 1000);
  };

  const stopRun = async () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setIsRunning(false);
    setCountdown(null);

    let zeroToHundred = 0;
    if (speedHistory.current.length >= 2) {
      const sorted = [...speedHistory.current].sort((a, b) => a.timestamp - b.timestamp);
      const reach100 = sorted.find(entry => entry.speed >= 100);
      if (reach100) {
        zeroToHundred = parseFloat(((reach100.timestamp - sorted[0].timestamp) / 1000).toFixed(1));
      }
    }

    const userData = await getCurrentUser();
    if (!userData || !selectedVehicle) return;

    await supabase.from('runs').insert({
      user_id: userData.id,
      vehicle_id: selectedVehicle.id,
      max_speed: maxSpeed,
      zero_to_sixty: null,
      zero_to_hundred: zeroToHundred,
      distance_to_max_speed: null,
      gps_data: [],
      start_lat: null,
      start_lng: null,
      end_lat: null,
      end_lng: null,
      region: currentRegion,
      gps_accuracy: 'Good',
      is_low_accuracy: false,
      ai_analysis: null,
      ai_verified: false,
    });

    const today = new Date().toISOString().split('T')[0];
    const { data: todayRuns } = await supabase
      .from('runs')
      .select(`max_speed, vehicles (vehicle_type)`)
      .eq('region', currentRegion)
      .gte('created_at', today);

    const higherCount = (todayRuns || []).filter((run: any) => 
      run.vehicles?.vehicle_type === selectedVehicle.vehicle_type && run.max_speed > maxSpeed
    ).length;

    const rankInRegionToday = higherCount + 1;

    const { data: prevBest } = await supabase
      .from('runs')
      .select('max_speed')
      .eq('user_id', userData.id)
      .order('max_speed', { ascending: false })
      .limit(1);

    const previousMax = prevBest?.[0]?.max_speed || 0;
    const isNewPersonalBest = maxSpeed > previousMax;
    const personalBestImprovement = isNewPersonalBest ? parseFloat((maxSpeed - previousMax).toFixed(1)) : 0;

    const now = new Date();
    setRunResult({
      maxSpeed: maxSpeed,
      zeroToHundred: zeroToHundred,
      distance: Math.round(maxSpeed * 2.5),
      region: currentRegion,
      date: now.toLocaleString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rankInRegionToday: rankInRegionToday,
      personalBestImprovement: personalBestImprovement,
      isNewPersonalBest: isNewPersonalBest,
    });

    setShowResult(true);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  const resetRun = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setShowResult(false);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    setGpsStatus('Chưa kiểm tra');
    setGpsAccuracy(null);
    setCurrentRegion('Đang xác định...');
    setCountdown(null);
    positionHistory.current = [];
    speedHistory.current = [];
    recordingStartedRef.current = false;
    speedBufferRef.current = [];
  };

  // ==================== CHƯA ĐĂNG NHẬP ====================
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-5">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          <CardContent className="p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
              <Car className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-black mb-2">BẮT ĐẦU RUN</h1>
            <p className="text-zinc-400 mb-8">Đăng nhập để bắt đầu ghi tốc độ và lưu kết quả</p>

            <Button
              onClick={async () => {
                await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: window.location.origin + '/run' },
                });
              }}
              className="w-full py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Đăng nhập bằng Google
            </Button>

            <Button
              variant="outline"
              className="w-full mt-4 py-6 text-base"
              onClick={() => window.location.href = '/'}
            >
              ← Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== ĐÃ ĐĂNG NHẬP - GIAO DIỆN RUN ====================
  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-8 space-y-5">



      {/* CARD TỐC ĐỘ LIVE */}
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
        <CardContent className="p-10 text-center">
          <p className="text-zinc-400 text-base mb-3">SPEED</p>
          <div className="text-[clamp(110px,26vw,170px)] font-black text-green-500 leading-none">
            {countdown !== null ? (
              <span className="text-yellow-400">{countdown}</span>
            ) : (
              currentSpeed
            )}
          </div>
          <p className="text-zinc-400 text-4xl mt-2">
            {countdown !== null ? 'GET READY' : 'km/h'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-[360px] mx-auto">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-center text-lg">
            <span className="text-zinc-400">GPS</span>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${getGPSStatusInfo(gpsAccuracy || 999, true).color}`}>
                {gpsStatus}
              </span>
              {gpsAccuracy && <span className="text-xs text-zinc-500">({gpsAccuracy}m)</span>}
            </div>
          </div>

          <Button 
            onClick={checkGPS}
            className="w-full py-6 text-lg font-semibold bg-white hover:bg-zinc-100 text-zinc-900 rounded-2xl"
          >
            GPS Checking
          </Button>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="bg-red-950 border border-red-800 text-red-400 p-7 rounded-3xl flex items-start gap-4 text-xl whitespace-pre-line">
          <AlertCircle className="h-7 w-7 mt-0.5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

     <div className="flex justify-center -mt-2">
        {!isRunning && !showResult ? (
          <Button 
            onClick={startRun}
            className="w-[90%] py-12 text-4xl bg-green-600 hover:bg-green-700 rounded-3xl"
            disabled={!selectedVehicle}
          >
            <Play className="mr-6 h-10 w-10" />
            START
          </Button>
        ) : isRunning ? (
          <Button 
            onClick={stopRun}
            className="w-full py-12 text-4xl bg-red-600 hover:bg-red-700 rounded-3xl"
          >
            <Square className="mr-6 h-10 w-10" />
            END
          </Button>
        ) : null}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-3 py-8 text-2xl">
            <Car className="mr-4 h-7 w-7" />
            {selectedVehicle ? selectedVehicle.nickname : 'Chọn xe để chạy'}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] max-w-[95vw] mx-2 sm:mx-auto sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chọn xe của bạn</DialogTitle>
            <DialogDescription>Chọn phương tiện để ghi run</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-auto py-4">
            {vehicles.map((v) => (
              <Button
                key={v.id}
                variant={selectedVehicle?.id === v.id ? "default" : "outline"}
                className="w-full justify-start text-2xl py-7"
                onClick={() => setSelectedVehicle(v)}
              >
                {v.nickname} — {v.brand} {v.model}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {showResult && (
        <div ref={resultRef} className="pt-8">
          <Card className="bg-zinc-900 border-zinc-800 w-full">
            <CardContent className="p-10 text-center space-y-8">
              <h2 className="text-3xl font-bold text-green-500">End!</h2>

              <div>
                <p className="text-zinc-400 text-base">Top Speed cao nhất</p>
                <p className="text-8xl font-black text-green-500">{runResult.maxSpeed}</p>
                <p className="text-zinc-400 text-2xl">km/h</p>
                <p className="text-xs text-zinc-500 mt-3">{runResult.date}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-zinc-800 pt-8">
                <div>
                  <p className="text-zinc-400 text-sm">0 - 100 km/h</p>
                  <p className="text-5xl font-bold text-cyan-400">
                    {runResult.zeroToHundred > 0 ? `${runResult.zeroToHundred}s` : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Khu vực</p>
                  <p className="font-medium text-2xl">{runResult.region}</p>
                </div>
              </div>

              <div>
                <p className="text-zinc-400 text-sm"></p>
                <p className="text-6xl font-black text-green-400">#{runResult.rankInRegionToday}</p>
              </div>

              <div className="space-y-3 text-left border-t border-zinc-800 pt-6">
                {runResult.isNewPersonalBest && (
                  <div className="flex justify-between items-center bg-zinc-800 rounded-2xl px-5 py-4">
                    <span className="text-green-400 font-medium">🚀 Kỷ lục cá nhân</span>
                    <span className="text-green-400">+{runResult.personalBestImprovement.toFixed(1)} km/h</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={resetRun} variant="outline" className="flex-1 py-6 text-base">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Again
                </Button>
                <Button onClick={() => window.location.href = '/leaderboard'} className="flex-1 py-6 text-base">
                  Rank
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="text-center py-20">
        <h1 className="text-[2.8rem] md:text-[3.2rem] font-black leading-none tracking-tighter">
          81 VIETNAM SPEED RANK 
        </h1>
      </div>
    </div>
  );
}