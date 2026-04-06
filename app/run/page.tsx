'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
import { Play, Square, RotateCcw, AlertCircle, Car, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
};

// ==================== REAL REVERSE GEOCODING (tự động từ GPS) ====================
const getRealRegionName = async (lat: number, lng: number): Promise<string> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=vi`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'TopRaceVN-App',
      },
    });
    const data = await res.json();

    // Ưu tiên lấy tên tỉnh/thành phố rõ ràng nhất
    const address = data.address || {};
    return (
      address.city ||
      address.town ||
      address.province ||
      address.state ||
      address.region ||
      address.country ||
      'Việt Nam'
    );
  } catch (err) {
    console.warn('Reverse geocoding failed:', err);
    return 'Việt Nam';
  }
};

// ==================== GPS STATUS ====================
const getGPSStatusInfo = (accuracy: number, speedAvailable: boolean = false) => {
  if (!accuracy || accuracy > 10000) return { text: 'NO SIGNAL 📡', color: 'text-red-400' };
  if (accuracy < 5 && speedAvailable) return { text: 'Universe 🌌', color: 'text-emerald-400' };
  if (accuracy < 5) return { text: ' 🌟', color: 'text-emerald-400' };
  if (accuracy < 10) return { text: 'On Fire 🔥', color: 'text-cyan-400' };
  if (accuracy < 20) return { text: 'Excellent ✅', color: 'text-green-400' };
  if (accuracy < 35) return { text: 'Good 👍', color: 'text-lime-400' };
  if (accuracy < 60) return { text: 'AVG ⚠️', color: 'text-yellow-400' };
  return { text: 'Weak 📡', color: 'text-orange-400' };
};

export default function RunPage() {
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('GPS Checking');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [watchId, setWatchId] = useState<number | null>(null);

  const [currentRegion, setCurrentRegion] = useState<string>('Đang xác định...');

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
    isValidRun: true, // ← thêm flag
  });

  const [isCheckingGPS, setIsCheckingGPS] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const speedHistory = useRef<{ timestamp: number; speed: number }[]>([]);

  const [countdown, setCountdown] = useState<number | null>(null);
  const recordingStartedRef = useRef(false);

  const smoothedSpeedRef = useRef(0);
  const displayedSpeedRef = useRef(0);
  const accelerationRef = useRef({ x: 0, y: 0, z: 0 });
  const lastMotionTimeRef = useRef(0);
  const calibrationStartRef = useRef(0);
  const isCalibratedRef = useRef(false);
  const deviceMotionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const lastSpeedUpdateRef = useRef(0);

  // ==================== FIX: TRACK PEAK SPEED REAL-TIME ====================
  const maxSpeedRef = useRef(0);

  // ==================== DEVICE MOTION & FUSED SPEED ====================
  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (event.acceleration) {
      accelerationRef.current = {
        x: event.acceleration.x ?? 0,
        y: event.acceleration.y ?? 0,
        z: event.acceleration.z ?? 0,
      };
    } else if (event.accelerationIncludingGravity) {
      accelerationRef.current = {
        x: event.accelerationIncludingGravity.x ?? 0,
        y: event.accelerationIncludingGravity.y ?? 0,
        z: event.accelerationIncludingGravity.z ?? 0,
      };
    }
  }, []);

  const startDeviceMotion = useCallback(() => {
    if ('DeviceMotionEvent' in window && !deviceMotionHandlerRef.current) {
      deviceMotionHandlerRef.current = handleDeviceMotion;
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      lastMotionTimeRef.current = Date.now();
    }
  }, [handleDeviceMotion]);

  const stopDeviceMotion = useCallback(() => {
    if (deviceMotionHandlerRef.current) {
      window.removeEventListener('devicemotion', deviceMotionHandlerRef.current);
      deviceMotionHandlerRef.current = null;
    }
  }, []);

  const calculateFusedSpeed = useCallback((rawGpsSpeedMs: number | null | undefined): number => {
    const now = Date.now();
    const dt = (now - lastMotionTimeRef.current) / 1000 || 0.016;
    lastMotionTimeRef.current = now;

    const rawGpsKmh = (rawGpsSpeedMs ?? 0) * 3.6;
    const timeSinceStart = now - calibrationStartRef.current;
    const isCalibrated = timeSinceStart > 5000;
    isCalibratedRef.current = isCalibrated;

    let fusedSpeed = rawGpsKmh;

    if (isCalibrated) {
      const accel = accelerationRef.current;
      const horizontalAccel = Math.sqrt(accel.x * accel.x + accel.y * accel.y);
      const deltaV = horizontalAccel * dt * 3.6;
      fusedSpeed = rawGpsKmh * 0.75 + (smoothedSpeedRef.current + deltaV) * 0.25;
    }

    const alpha = isCalibrated ? 0.72 : 0.48;
    smoothedSpeedRef.current = smoothedSpeedRef.current * (1 - alpha) + fusedSpeed * alpha;

    let finalSpeed = Math.max(0, Math.round(smoothedSpeedRef.current));
    if (finalSpeed < 5) finalSpeed = 0;
    return finalSpeed;
  }, []);

  // ==================== INIT USER ====================
  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (u) {
        const { data } = await supabase
          .from('vehicles')
          .select('id, nickname, brand, model, vehicle_type')
          .eq('user_id', u.id);
        const vehicleList = data ?? [];
        setVehicles(vehicleList);
        if (vehicleList.length > 0 && !selectedVehicle) setSelectedVehicle(vehicleList[0]);
      }
      setIsAuthLoading(false);
    };
    init();
  }, [selectedVehicle]);

  const handleGoogleLogin = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/run' },
    });
  }, []);

  const checkGPS = useCallback(async () => {
    setIsCheckingGPS(true);
    setErrorMessage('');
    if (!navigator.geolocation) {
      setErrorMessage('Thiết bị không hỗ trợ GPS');
      setGpsStatus('Không hỗ trợ GPS');
      setIsCheckingGPS(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { accuracy, speed } = position.coords;
        const info = getGPSStatusInfo(accuracy, speed !== null && speed !== undefined);
        setGpsStatus(info.text);
        setGpsAccuracy(Math.round(accuracy));
        setIsCheckingGPS(false);
      },
      (error) => {
        setErrorMessage(error.code === 1 ? 'Bạn chưa cấp quyền GPS' : 'Lỗi GPS: ' + error.message);
        setGpsStatus('Lỗi GPS');
        setIsCheckingGPS(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  // ==================== START RUN ====================
  const startRun = useCallback(() => {
    if (!selectedVehicle || isStarting) return;
    setIsStarting(true);
    setErrorMessage('');
    setShowResult(false);
    setCurrentRegion('Đang xác định...');
    speedHistory.current = [];
    setMaxSpeed(0);
    maxSpeedRef.current = 0;
    setCurrentSpeed(0);
    smoothedSpeedRef.current = 0;
    displayedSpeedRef.current = 0;
    recordingStartedRef.current = false;
    calibrationStartRef.current = 0;
    isCalibratedRef.current = false;

    setCountdown(5);
    let count = 5;

    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count > 0 ? count : null);

      if (count <= 0) {
        clearInterval(countdownInterval);
        calibrationStartRef.current = Date.now();

        const id = navigator.geolocation.watchPosition(
          async (position) => {
            const now = Date.now();
            const { latitude, longitude, speed: gpsSpeedMs, accuracy } = position.coords;

            // Tự động cập nhật khu vực từ GPS thực tế (chỉ gọi API khi cần)
            if (accuracy < 60) {
              const regionName = await getRealRegionName(latitude, longitude);
              setCurrentRegion(regionName);
            }

            const targetSpeed = calculateFusedSpeed(gpsSpeedMs);

            if (now - lastSpeedUpdateRef.current > 80) {
              setCurrentSpeed((prev) => {
                const newDisplayed = Math.round(prev * 0.32 + targetSpeed * 0.68);
                displayedSpeedRef.current = newDisplayed;
                return newDisplayed;
              });
              lastSpeedUpdateRef.current = now;
            }

            const displayedSpeed = displayedSpeedRef.current;

            const shouldRecord = isCalibratedRef.current && displayedSpeed >= 8;
            if (shouldRecord && !recordingStartedRef.current) {
              recordingStartedRef.current = true;
              speedHistory.current = [];
            }

            if (recordingStartedRef.current && displayedSpeed > maxSpeedRef.current) {
              maxSpeedRef.current = displayedSpeed;
              setMaxSpeed(displayedSpeed);
            }

            if (recordingStartedRef.current) {
              speedHistory.current.push({ timestamp: now, speed: displayedSpeed });
            }

            const speedAvailable = gpsSpeedMs !== null && gpsSpeedMs !== undefined;
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
        startDeviceMotion();
        setIsStarting(false);
      }
    }, 1000);
  }, [selectedVehicle, isStarting, calculateFusedSpeed, startDeviceMotion]);

  // ==================== STOP RUN + VALIDATION ====================
  const stopRun = useCallback(async () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    stopDeviceMotion();
    setIsRunning(false);
    setCountdown(null);
    setIsStarting(false);

    const finalMaxSpeed = maxSpeedRef.current;

    // ==================== VALIDATION MỚI ====================
    const isValid =
      finalMaxSpeed >= 40 && // phải chạy thật (không đứng yên)
      currentRegion !== 'Đang xác định...' &&
      currentRegion !== 'Việt Nam';

    if (!isValid) {
      setRunResult({
        maxSpeed: finalMaxSpeed,
        zeroToHundred: 0,
        distance: 0,
        region: currentRegion,
        date: new Date().toLocaleString('vi-VN'),
        rankInRegionToday: 0,
        personalBestImprovement: 0,
        isNewPersonalBest: false,
        isValidRun: false,
      });
      setShowResult(true);
      return; // KHÔNG lưu vào DB
    }

    let zeroToHundred = 0;
    if (speedHistory.current.length >= 2) {
      const sorted = [...speedHistory.current].sort((a, b) => a.timestamp - b.timestamp);
      const reach100 = sorted.find(entry => entry.speed >= 100);
      if (reach100) zeroToHundred = parseFloat(((reach100.timestamp - sorted[0].timestamp) / 1000).toFixed(1));
    }

    const userData = await getCurrentUser();
    if (!userData || !selectedVehicle) return;

    // Lưu run hợp lệ
    await supabase.from('runs').insert({
      user_id: userData.id,
      vehicle_id: selectedVehicle.id,
      max_speed: finalMaxSpeed,
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
      run.vehicles?.vehicle_type === selectedVehicle.vehicle_type && run.max_speed > finalMaxSpeed
    ).length;

    const rankInRegionToday = higherCount + 1;

    const { data: prevBest } = await supabase
      .from('runs')
      .select('max_speed')
      .eq('user_id', userData.id)
      .order('max_speed', { ascending: false })
      .limit(1);

    const previousMax = prevBest?.[0]?.max_speed || 0;
    const isNewPersonalBest = finalMaxSpeed > previousMax;
    const personalBestImprovement = isNewPersonalBest ? parseFloat((finalMaxSpeed - previousMax).toFixed(1)) : 0;

    const now = new Date();
    setRunResult({
      maxSpeed: finalMaxSpeed,
      zeroToHundred: zeroToHundred,
      distance: Math.round(finalMaxSpeed * 2.5),
      region: currentRegion,
      date: now.toLocaleString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rankInRegionToday: rankInRegionToday,
      personalBestImprovement: personalBestImprovement,
      isNewPersonalBest: isNewPersonalBest,
      isValidRun: true,
    });

    setShowResult(true);
  }, [watchId, stopDeviceMotion, selectedVehicle, currentRegion]);

  const resetRun = useCallback(() => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    stopDeviceMotion();
    setShowResult(false);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    maxSpeedRef.current = 0;
    setGpsStatus('GPS Checking');
    setGpsAccuracy(null);
    setCurrentRegion('Đang xác định...');
    setCountdown(null);
    speedHistory.current = [];
    recordingStartedRef.current = false;
    smoothedSpeedRef.current = 0;
    displayedSpeedRef.current = 0;
    setIsStarting(false);
  }, [watchId, stopDeviceMotion]);

  // ==================== TẢI ẢNH BẢNG KẾT QUẢ ====================
  const downloadResultAsImage = useCallback(async () => {
    const card = resultRef.current;
    if (!card) return;
    try {
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: '#18181b',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `TopRaceVN_${new Date().toISOString().slice(0,19)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert('Không thể tải ảnh. Vui lòng thử lại!');
    }
  }, []);

  // ==================== GIAO DIỆN ====================
  if (isAuthLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-green-500">Đang kiểm tra đăng nhập...</div>;
  }

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
              onClick={handleGoogleLogin}
              className="w-full mx-auto py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google Login
            </Button>

            <Button variant="outline" className="w-full mt-4 py-6 text-base" onClick={() => window.location.href = '/'}>
              ← Quay về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-8 space-y-5">
      {/* CARD TỐC ĐỘ LIVE */}
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
        <CardContent className="p-10 text-center">
          <p className="text-zinc-400 text-base mb-3">SPEED</p>
          <div className="text-[clamp(110px,26vw,170px)] font-black text-green-500 leading-none">
            {countdown !== null ? <span className="text-yellow-400">{countdown}</span> : currentSpeed}
          </div>
          <p className="text-zinc-400 text-4xl mt-2">
            {countdown !== null ? 'GET READY' : 'km/h'}
          </p>
        </CardContent>
      </Card>

      {/* NÚT GPS CHECKING */}
      <Button
        onClick={checkGPS}
        disabled={isCheckingGPS}
        className={`w-full py-6 text-lg font-semibold rounded-2xl transition-all ${
          isCheckingGPS ? 'bg-zinc-700 text-zinc-400' : 'bg-white hover:bg-zinc-100 text-zinc-900'
        }`}
      >
        {isCheckingGPS ? <>Đang kiểm tra GPS...</> : (
          <span className={getGPSStatusInfo(gpsAccuracy || 999, true).color}>
            {gpsStatus} {gpsAccuracy ? `(${gpsAccuracy}m)` : ''}
          </span>
        )}
      </Button>

      {errorMessage && (
        <div className="bg-red-950 border border-red-800 text-red-400 p-7 rounded-3xl flex items-start gap-4 text-xl whitespace-pre-line">
          <AlertCircle className="h-7 w-7 mt-0.5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="flex justify-center -mt-2">
        {!isRunning && !showResult ? (
          <Button onClick={startRun} disabled={isStarting} className="w-[90%] py-12 text-4xl bg-green-600 hover:bg-green-700 rounded-3xl disabled:opacity-50">
            {isStarting ? <>Đang khởi động...</> : <><Play className="mr-6 h-10 w-10" />START</>}
          </Button>
        ) : isRunning ? (
          <Button onClick={stopRun} className="w-full py-12 text-4xl bg-red-600 hover:bg-red-700 rounded-3xl">
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

      {/* ==================== BẢNG KẾT QUẢ ==================== */}
      {showResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <Card ref={resultRef} className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
            <CardContent className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="w-6" />
                <h2 className="text-3xl font-bold text-green-500 tracking-tight">TopRaceVN</h2>
                {runResult.isValidRun && (
                  <button onClick={downloadResultAsImage} className="text-zinc-400 hover:text-green-400 transition-colors">
                    <Download className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Top Speed */}
              <div className="text-center">
                <p className="text-zinc-400 text-base">Top Speed cao nhất</p>
                <p className="text-8xl font-black text-green-500 leading-none">{runResult.maxSpeed}</p>
                <p className="text-zinc-400 text-2xl">km/h</p>
                <p className="text-xs text-zinc-500 mt-2">{runResult.date}</p>
              </div>

              {!runResult.isValidRun ? (
                /* Run không hợp lệ */
                <div className="text-center py-8 bg-red-950/50 border border-red-800 rounded-3xl">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                  <p className="text-red-400 text-xl font-semibold">Run không hợp lệ</p>
                  <p className="text-zinc-400 mt-2">
                    {runResult.maxSpeed < 40
                      ? 'Tốc độ quá thấp (dưới 40 km/h) hoặc bạn chưa di chuyển.'
                      : 'Khu vực chưa được xác định rõ ràng.'}
                  </p>
                  <p className="text-zinc-400 text-sm mt-4">Kết quả này không được ghi nhận vào bảng xếp hạng.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-8 border-t border-zinc-800 pt-8">
                    <div className="text-center">
                      <p className="text-zinc-400 text-sm">0 - 100 km/h</p>
                      <p className="text-5xl font-bold text-cyan-400">
                        {runResult.zeroToHundred > 0 ? `${runResult.zeroToHundred}s` : '--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-400 text-sm">Khu vực</p>
                      <p className="font-medium text-2xl">{runResult.region}</p>
                    </div>
                  </div>

                  <div className="text-center">
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
                </>
              )}

              <div className="flex gap-4 pt-4">
                <Button onClick={resetRun} variant="outline" className="flex-1 py-6 text-base">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Again
                </Button>
                {runResult.isValidRun && (
                  <Button onClick={() => window.location.href = '/leaderboard'} className="flex-1 py-6 text-base">
                    Rank
                  </Button>
                )}
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