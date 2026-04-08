'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Play, Square, RotateCcw, AlertCircle, Car, Download, Copy } from 'lucide-react';
import html2canvas from 'html2canvas';
import DonateModal from '../components/donate-modal';

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
};

type Package = {
  id: string;
  name: string;
  display_name: string;
  price: number;
  duration_type: string;
  duration_value: number;
  max_runs: number;
};

// ==================== MANUAL REGION DETECTION ====================
const getRegionFromCoords = (lat: number, lng: number): string => {
  if (lat >= 10.4 && lat <= 11.2 && lng >= 106.2 && lng <= 107.1) return 'TP.HCM';
  if (lat >= 20.8 && lat <= 21.4 && lng >= 105.5 && lng <= 106.2) return 'Hà Nội';
  if (lat >= 10.8 && lat <= 11.1 && lng >= 106.6 && lng <= 107.0) return 'Bình Dương';
  if (lat >= 10.5 && lat <= 11.0 && lng >= 106.9 && lng <= 107.3) return 'Đồng Nai';
  if (lat >= 10.3 && lat <= 10.7 && lng >= 107.0 && lng <= 107.5) return 'Bà Rịa - Vũng Tàu';
  if (lat >= 20.9 && lat <= 21.3 && lng >= 105.8 && lng <= 106.1) return 'Bắc Ninh';
  if (lat >= 21.0 && lat <= 21.5 && lng >= 105.6 && lng <= 106.0) return 'Hưng Yên';
  if (lat >= 20.5 && lat <= 21.0 && lng >= 105.3 && lng <= 105.8) return 'Hà Nam';
  if (lat >= 15.8 && lat <= 16.3 && lng >= 107.8 && lng <= 108.5) return 'Đà Nẵng';
  if (lat >= 15.9 && lat <= 16.2 && lng >= 108.1 && lng <= 108.4) return 'Quảng Nam';
  if (lat >= 16.0 && lat <= 16.5 && lng >= 107.5 && lng <= 108.0) return 'Thừa Thiên Huế';
  if (lat >= 11.8 && lat <= 12.5 && lng >= 108.9 && lng <= 109.5) return 'Khánh Hòa';
  if (lat >= 10.9 && lat <= 11.3 && lng >= 108.7 && lng <= 109.2) return 'Bình Thuận';
  if (lat >= 21.8 && lat <= 22.3 && lng >= 106.5 && lng <= 107.0) return 'Quảng Ninh';
  if (lat >= 13.5 && lat <= 14.0 && lng >= 108.9 && lng <= 109.4) return 'Bình Định';
  if (lat >= 9.8 && lat <= 10.3 && lng >= 105.8 && lng <= 106.3) return 'Cần Thơ';
  if (lat >= 9.0 && lat <= 9.8 && lng >= 104.5 && lng <= 105.5) return 'Kiên Giang';

  if (lat >= 10.2 && lat <= 10.8 && lng >= 105.0 && lng <= 105.8) return 'An Giang';
  if (lat >= 10.0 && lat <= 10.4 && lng >= 105.4 && lng <= 106.0) return 'Bạc Liêu';
  if (lat >= 21.0 && lat <= 21.8 && lng >= 105.8 && lng <= 107.0) return 'Bắc Giang';
  if (lat >= 21.8 && lat <= 22.6 && lng >= 105.5 && lng <= 106.5) return 'Bắc Kạn';
  if (lat >= 10.0 && lat <= 10.6 && lng >= 106.0 && lng <= 106.8) return 'Bến Tre';
  if (lat >= 11.4 && lat <= 12.2 && lng >= 106.8 && lng <= 108.0) return 'Bình Phước';
  if (lat >= 8.5 && lat <= 9.5 && lng >= 104.5 && lng <= 105.5) return 'Cà Mau';
  if (lat >= 22.5 && lat <= 23.5 && lng >= 105.5 && lng <= 106.5) return 'Cao Bằng';
  if (lat >= 11.5 && lat <= 13.0 && lng >= 107.5 && lng <= 109.0) return 'Đắk Lắk';
  if (lat >= 11.8 && lat <= 12.8 && lng >= 107.0 && lng <= 108.5) return 'Đắk Nông';
  if (lat >= 21.0 && lat <= 22.5 && lng >= 102.0 && lng <= 103.5) return 'Điện Biên';
  if (lat >= 10.2 && lat <= 11.0 && lng >= 105.5 && lng <= 106.5) return 'Đồng Tháp';
  if (lat >= 13.0 && lat <= 14.5 && lng >= 107.5 && lng <= 109.0) return 'Gia Lai';
  if (lat >= 22.0 && lat <= 23.5 && lng >= 104.5 && lng <= 106.0) return 'Hà Giang';
  if (lat >= 17.5 && lat <= 18.5 && lng >= 105.5 && lng <= 107.0) return 'Hà Tĩnh';
  if (lat >= 20.5 && lat <= 21.2 && lng >= 106.0 && lng <= 107.0) return 'Hải Dương';
  if (lat >= 20.6 && lat <= 21.0 && lng >= 106.5 && lng <= 107.0) return 'Hải Phòng';
  if (lat >= 9.5 && lat <= 10.5 && lng >= 105.0 && lng <= 106.0) return 'Hậu Giang';
  if (lat >= 20.0 && lat <= 21.0 && lng >= 105.0 && lng <= 106.0) return 'Hòa Bình';
  if (lat >= 20.5 && lat <= 21.5 && lng >= 106.0 && lng <= 107.0) return 'Lai Châu';
  if (lat >= 11.0 && lat <= 12.5 && lng >= 107.5 && lng <= 108.5) return 'Lâm Đồng';
  if (lat >= 21.5 && lat <= 22.5 && lng >= 106.0 && lng <= 107.5) return 'Lạng Sơn';
  if (lat >= 21.8 && lat <= 22.8 && lng >= 103.5 && lng <= 105.0) return 'Lào Cai';
  if (lat >= 10.0 && lat <= 11.0 && lng >= 105.5 && lng <= 106.5) return 'Long An';
  if (lat >= 19.8 && lat <= 20.5 && lng >= 105.0 && lng <= 106.5) return 'Nam Định';
  if (lat >= 18.0 && lat <= 19.5 && lng >= 104.5 && lng <= 106.0) return 'Nghệ An';
  if (lat >= 19.8 && lat <= 20.5 && lng >= 105.5 && lng <= 106.5) return 'Ninh Bình';
  if (lat >= 11.0 && lat <= 12.0 && lng >= 108.5 && lng <= 109.5) return 'Ninh Thuận';
  if (lat >= 20.5 && lat <= 21.5 && lng >= 104.5 && lng <= 105.5) return 'Phú Thọ';
  if (lat >= 12.5 && lat <= 13.5 && lng >= 108.5 && lng <= 109.5) return 'Phú Yên';
  if (lat >= 17.0 && lat <= 18.0 && lng >= 105.5 && lng <= 107.0) return 'Quảng Bình';
  if (lat >= 14.5 && lat <= 16.0 && lng >= 107.5 && lng <= 109.0) return 'Quảng Ngãi';
  if (lat >= 16.5 && lat <= 17.5 && lng >= 106.5 && lng <= 107.5) return 'Quảng Trị';
  if (lat >= 9.0 && lat <= 10.0 && lng >= 105.5 && lng <= 106.5) return 'Sóc Trăng';
  if (lat >= 20.5 && lat <= 21.5 && lng >= 103.0 && lng <= 105.0) return 'Sơn La';
  if (lat >= 10.8 && lat <= 11.8 && lng >= 105.5 && lng <= 106.5) return 'Tây Ninh';
  if (lat >= 20.0 && lat <= 21.0 && lng >= 106.0 && lng <= 107.0) return 'Thái Bình';
  if (lat >= 21.0 && lat <= 22.0 && lng >= 105.0 && lng <= 106.5) return 'Thái Nguyên';
  if (lat >= 19.0 && lat <= 20.5 && lng >= 104.5 && lng <= 106.0) return 'Thanh Hóa';
  if (lat >= 10.0 && lat <= 10.8 && lng >= 105.8 && lng <= 106.5) return 'Tiền Giang';
  if (lat >= 9.5 && lat <= 10.5 && lng >= 105.5 && lng <= 106.5) return 'Trà Vinh';
  if (lat >= 21.5 && lat <= 22.5 && lng >= 105.0 && lng <= 106.0) return 'Tuyên Quang';
  if (lat >= 9.8 && lat <= 10.5 && lng >= 105.5 && lng <= 106.2) return 'Vĩnh Long';
  if (lat >= 20.8 && lat <= 21.5 && lng >= 105.2 && lng <= 106.0) return 'Vĩnh Phúc';
  if (lat >= 21.0 && lat <= 22.0 && lng >= 104.0 && lng <= 105.0) return 'Yên Bái';

  return 'Việt Nam';
};

const getGPSStatusInfo = (accuracy: number, speedAvailable: boolean = false) => {
  if (!accuracy || accuracy > 10000) return { text: 'NO SIGNAL 📡', color: 'text-red-400' };
  if (accuracy < 5 && speedAvailable) return { text: 'Universe 🌌', color: 'text-emerald-400' };
  if (accuracy < 5) return { text: '🌟', color: 'text-emerald-400' };
  if (accuracy < 10) return { text: 'On Fire 🔥', color: 'text-cyan-400' };
  if (accuracy < 20) return { text: 'Excellent ✅', color: 'text-green-400' };
  if (accuracy < 35) return { text: 'Good 👍', color: 'text-lime-400' };
  if (accuracy < 60) return { text: 'AVG ⚠️', color: 'text-yellow-400' };
  return { text: 'Weak 📡', color: 'text-orange-400' };
};

export default function RunPage() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string>('user');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [freeRunsUsed, setFreeRunsUsed] = useState(0);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  const canStartRun = hasActiveSub || freeRunsUsed < 2;

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
  });

  const [isCalculatingRank, setIsCalculatingRank] = useState(false);
  const [isCheckingGPS, setIsCheckingGPS] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAutoCheckingOnStart, setIsAutoCheckingOnStart] = useState(false);

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
  const maxSpeedRef = useRef(0);

  // ==================== DEVICE MOTION & FUSED SPEED ====================
  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (event.acceleration) {
      accelerationRef.current = { x: event.acceleration.x ?? 0, y: event.acceleration.y ?? 0, z: event.acceleration.z ?? 0 };
    } else if (event.accelerationIncludingGravity) {
      accelerationRef.current = { x: event.accelerationIncludingGravity.x ?? 0, y: event.accelerationIncludingGravity.y ?? 0, z: event.accelerationIncludingGravity.z ?? 0 };
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

    if (rawGpsKmh < 15) {
      smoothedSpeedRef.current = rawGpsKmh;
      let finalSpeed = Math.max(0, Math.round(rawGpsKmh));
      if (finalSpeed < 5) finalSpeed = 0;
      return finalSpeed;
    }

    let fusedSpeed = rawGpsKmh;
    if (isCalibrated) {
      const accel = accelerationRef.current;
      const horizontalAccel = Math.sqrt(accel.x * accel.x + accel.y * accel.y);
      if (horizontalAccel > 0.4) {
        const deltaV = horizontalAccel * dt * 3.6;
        fusedSpeed = rawGpsKmh * 0.85 + (smoothedSpeedRef.current + deltaV) * 0.15;
      }
    }

    const alpha = isCalibrated ? 0.65 : 0.4;
    smoothedSpeedRef.current = smoothedSpeedRef.current * (1 - alpha) + fusedSpeed * alpha;

    let finalSpeed = Math.max(0, Math.round(smoothedSpeedRef.current));
    if (finalSpeed < 5) finalSpeed = 0;
    return finalSpeed;
  }, []);

  // ==================== REFRESH USER DATA ====================
  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('free_runs_used, nickname')
        .eq('id', user.id)
        .single();

      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('remaining_runs')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .maybeSingle();

      if (profile) {
        setFreeRunsUsed(profile.free_runs_used || 0);
        setNickname(profile.nickname || 'user');
      }
      setHasActiveSub(!!sub && (sub.remaining_runs ?? 0) > 0);
    } catch (err) {
      console.error('❌ Refresh user data failed', err);
    }
  }, [user]);

  // ==================== INIT ====================
  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (!u) return setIsAuthLoading(false);

      const { data: vData } = await supabase.from('vehicles').select('*').eq('user_id', u.id);
      setVehicles(vData ?? []);
      if (vData?.length) setSelectedVehicle(vData[0]);

      await refreshUserData();

      const { data: pkgData } = await supabase.from('packages').select('*').eq('is_active', true).order('price');
      setPackages(pkgData || []);

      setIsAuthLoading(false);
    };
    init();
  }, [refreshUserData]);

  const handleGoogleLogin = useCallback(async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/run' } });
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
        const { accuracy, speed, latitude, longitude } = position.coords;
        const regionName = getRegionFromCoords(latitude, longitude);
        setCurrentRegion(regionName);

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

  const startRun = useCallback(() => {
    if (!selectedVehicle || isStarting) return;
    if (!canStartRun) {
      setShowBuyModal(true);
      return;
    }
    if (currentRegion === 'Đang xác định...') {
      setIsAutoCheckingOnStart(true);
      checkGPS().then(() => {
        setIsAutoCheckingOnStart(false);
        startCountdown();
      });
      return;
    }
    startCountdown();
  }, [selectedVehicle, isStarting, currentRegion, canStartRun, checkGPS]);

  const startCountdown = useCallback(() => {
    setIsStarting(true);
    setErrorMessage('');
    setShowResult(false);
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

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const regionName = getRegionFromCoords(pos.coords.latitude, pos.coords.longitude);
            setCurrentRegion(regionName);
          });
        }

        calibrationStartRef.current = Date.now();

        const id = navigator.geolocation.watchPosition(
          (position) => {
            const now = Date.now();
            const { latitude, longitude, speed: gpsSpeedMs, accuracy } = position.coords;

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
  }, [calculateFusedSpeed, startDeviceMotion]);

  // ==================== STOP RUN - LUÔN TRỪ LƯỢT (kể cả 0km/h) ====================
  const stopRun = useCallback(async () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    stopDeviceMotion();
    setIsRunning(false);
    setCountdown(null);
    setIsStarting(false);

    const finalMaxSpeed = maxSpeedRef.current;

    let zeroToHundred = 0;
    if (speedHistory.current.length >= 2) {
      const sorted = [...speedHistory.current].sort((a, b) => a.timestamp - b.timestamp);
      const reach100 = sorted.find(entry => entry.speed >= 100);
      if (reach100) zeroToHundred = parseFloat(((reach100.timestamp - sorted[0].timestamp) / 1000).toFixed(1));
    }

    const now = new Date();
    const initialResult = {
      maxSpeed: finalMaxSpeed,
      zeroToHundred: zeroToHundred,
      distance: Math.round(finalMaxSpeed * 2.5),
      region: currentRegion,
      date: now.toLocaleString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      rankInRegionToday: 0,
      personalBestImprovement: 0,
      isNewPersonalBest: false,
    };

    setRunResult(initialResult);
    setShowResult(true);
    setIsCalculatingRank(true);

    const currentUser = await getCurrentUser();
    if (!currentUser || !selectedVehicle) {
      setIsCalculatingRank(false);
      await refreshUserData();
      return;
    }

    await supabase.from('runs').insert({
      user_id: currentUser.id,
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

    if (!hasActiveSub) {
      const newUsed = freeRunsUsed + 1;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ free_runs_used: newUsed })
        .eq('id', currentUser.id);

      if (!updateError) setFreeRunsUsed(newUsed);
    }

    const processInBackground = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: todayRuns } = await supabase
          .from('runs')
          .select(`max_speed, vehicles (vehicle_type)`)
          .eq('region', currentRegion)
          .gte('created_at', today);

        const higherCount = (todayRuns || []).filter((run: any) =>
          run.vehicles?.vehicle_type === selectedVehicle?.vehicle_type && run.max_speed > finalMaxSpeed
        ).length;

        const rankInRegionToday = higherCount + 1;

        const { data: prevBest } = await supabase
          .from('runs')
          .select('max_speed')
          .eq('user_id', currentUser.id)
          .order('max_speed', { ascending: false })
          .limit(1);

        const previousMax = prevBest?.[0]?.max_speed || 0;
        const isNewPersonalBest = finalMaxSpeed > previousMax;
        const personalBestImprovement = isNewPersonalBest ? parseFloat((finalMaxSpeed - previousMax).toFixed(1)) : 0;

        setRunResult(prev => ({
          ...prev,
          rankInRegionToday,
          personalBestImprovement,
          isNewPersonalBest,
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsCalculatingRank(false);
      }
    };

    processInBackground();
    await refreshUserData();
  }, [watchId, stopDeviceMotion, selectedVehicle, currentRegion, hasActiveSub, freeRunsUsed, refreshUserData]);

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
    setIsAutoCheckingOnStart(false);
    setIsCalculatingRank(false);
    refreshUserData();
  }, [watchId, stopDeviceMotion, refreshUserData]);

  const downloadResultAsImage = useCallback(async () => {
    const card = resultRef.current;
    if (!card) return;
    try {
      const canvas = await html2canvas(card, { scale: 2, backgroundColor: '#18181b', logging: false });
      const link = document.createElement('a');
      link.download = `TopRaceVN_${new Date().toISOString().slice(0,19)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert('Không thể tải ảnh. Vui lòng thử lại!');
    }
  }, []);

  const getBigDisplay = () => {
    if (isAutoCheckingOnStart) return 'Đang kiểm tra...';
    if (countdown === null) return currentSpeed;
    if (countdown === 5) return currentRegion;
    if (countdown === 4) return 'READY';
    return countdown;
  };

  // ==================== THANH TOÁN ====================
  const openPaymentModal = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowBuyModal(false);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!selectedPackage || !user) return;
    setIsConfirmingPayment(true);

    const memo = `${nickname}_${selectedPackage.name}`;

    const { error } = await supabase.from('payment_logs').insert({
      user_id: user.id,
      package_id: selectedPackage.id,
      amount: selectedPackage.price,
      memo: memo,
      status: 'pending',
    });

    if (error) alert('Lỗi: ' + error.message);
    else {
      alert('✅ Yêu cầu thanh toán đã gửi!\nAdmin sẽ kiểm tra và cấp gói trong dashboard.');
      setShowPaymentModal(false);
      setSelectedPackage(null);
    }
    setIsConfirmingPayment(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => alert('Đã copy!'));
  };

  // ==================== GIAO DIỆN ====================
  if (isAuthLoading) {
    return <div className="flex-1 flex items-center justify-center min-h-0 bg-zinc-950 text-green-500 text-lg">Đang kiểm tra đăng nhập...</div>;
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
            <Button onClick={handleGoogleLogin} className="w-full mx-auto py-7 text-lg bg-white hover:bg-zinc-100 text-black font-semibold rounded-2xl flex items-center gap-3">
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
      {/* BANNER HẾT LƯỢT (giữ nguyên) */}
      {!canStartRun && (
        <div className="bg-amber-900/30 border border-amber-400 text-amber-300 p-5 rounded-3xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Bạn đã dùng hết 2 lượt thử miễn phí</p>
            <p className="text-sm">Mua gói cước để tiếp tục lưu run và tính rank</p>
          </div>
          <Button onClick={() => setShowBuyModal(true)} className="bg-amber-400 hover:bg-amber-300 text-black">Mua ngay</Button>
        </div>
      )}

      {/* === BANNER MỚI: 2 LẦN THỬ NGHIỆM GPS === */}
      {!hasActiveSub && freeRunsUsed < 2 && (
        <div className="bg-sky-900/30 border border-sky-400 text-sky-300 p-5 rounded-3xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Bạn có 2 lần bấm GPS trải nghiệm</p>
            <p className="text-sm">
              Sẽ không lưu vào bảng rank. Muốn đua top hãy thử 2 lần và mua gói leo rank
            </p>
          </div>
        </div>
      )}

      {/* CARD TỐC ĐỘ LIVE */}
      <Card className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
        <CardContent className="p-10 text-center">
          <p className="text-zinc-400 text-base mb-3">SPEED</p>
          <div className="text-[clamp(80px,20vw,140px)] font-black text-green-500 leading-none min-h-[160px] flex items-center justify-center">
            {getBigDisplay()}
          </div>
          <p className="text-zinc-400 text-4xl mt-2">
            {countdown !== null && countdown !== 5 && countdown !== 4 ? 'GET READY' : ''}
          </p>
        </CardContent>
      </Card>

      {/* GPS STATUS */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 text-sm space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Khu vực:</span>
          <span className="font-semibold text-white">{currentRegion}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400">Tín hiệu:</span>
          <span className={getGPSStatusInfo(gpsAccuracy || 999, true).color}>
            {gpsStatus} {gpsAccuracy ? `(${gpsAccuracy}m)` : ''}
          </span>
        </div>
      </div>

      <Button onClick={checkGPS} disabled={isCheckingGPS} className={`w-full py-6 text-lg font-semibold rounded-2xl transition-all ${isCheckingGPS ? 'bg-zinc-700 text-zinc-400' : 'bg-white hover:bg-zinc-100 text-zinc-900'}`}>
        {isCheckingGPS ? <>Đang kiểm tra GPS...</> : 'Kiểm tra GPS & Khu vực'}
      </Button>

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
            disabled={isStarting || !canStartRun}
            className={`w-[90%] py-12 text-4xl rounded-3xl transition-all ${
              !canStartRun
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : hasActiveSub
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-yellow-500 hover:bg-yellow-400 text-black font-bold' // ← NÚT MÀU VÀNG CHO 2 LẦN THỬ
            }`}
          >
            {isStarting ? (
              <>Loading</>
            ) : !canStartRun ? (
              <>Mua gói để chạy</>
            ) : hasActiveSub ? (
              <>
                <Play className="mr-6 h-10 w-10" />
                START
              </>
            ) : freeRunsUsed === 1 ? (
              <>
                <Play className="mr-6 h-10 w-10" />
                THỬ BẤM - LẦN CUỐI RỒI
              </>
            ) : (
              <>
                <Play className="mr-6 h-10 w-10" />
                THỬ BẤM
              </>
            )}
          </Button>
        ) : isRunning ? (
          <Button onClick={stopRun} className="w-full py-12 text-4xl bg-red-600 hover:bg-red-700 rounded-3xl">
            <Square className="mr-6 h-10 w-10" />
            END
          </Button>
        ) : null}
      </div>

      {/* Chọn xe */}
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
              <Button key={v.id} variant={selectedVehicle?.id === v.id ? "default" : "outline"} className="w-full justify-start text-2xl py-7" onClick={() => setSelectedVehicle(v)}>
                {v.nickname} — {v.brand} {v.model}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* KẾT QUẢ */}
      {showResult && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <Card ref={resultRef} className="bg-zinc-900 border-zinc-800 w-full max-w-md mx-auto">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-6" />
                <h2 className="text-3xl font-bold text-green-500 tracking-tight">TopRaceVN</h2>
                <button onClick={downloadResultAsImage} className="text-zinc-400 hover:text-green-400 transition-colors">
                  <Download className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center">
                <p className="text-zinc-400 text-base">Top Speed cao nhất</p>
                <p className="text-8xl font-black text-green-500 leading-none">{runResult.maxSpeed}</p>
                <p className="text-zinc-400 text-2xl">km/h</p>
                <p className="text-xs text-zinc-500 mt-2">{runResult.date}</p>
              </div>

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
                {runResult.maxSpeed < 40 ? (
                  <p className="text-6xl font-black text-zinc-400 tracking-widest">VÔ HẠNG</p>
                ) : (
                  <>
                    <p className="text-6xl font-black text-green-400">
                      {isCalculatingRank ? '...' : `#${runResult.rankInRegionToday}`}
                    </p>
                    {isCalculatingRank && <p className="text-zinc-500 text-sm mt-1">Đang tính rank...</p>}
                  </>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={resetRun} variant="outline" className="flex-1 py-6 text-base">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Again
                </Button>
                {runResult.maxSpeed >= 40 && (
                  <Button onClick={() => window.location.href = '/leaderboard'} className="flex-1 py-6 text-base">
                    Rank
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL GÓI CƯỚC + THANH TOÁN (giữ nguyên) */}
      <Dialog open={showBuyModal} onOpenChange={setShowBuyModal}>
        <DialogContent className="w-[95vw] max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black">Chọn gói cước</DialogTitle>
            <DialogDescription>Bạn đã hết lượt miễn phí. Hãy chọn gói phù hợp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-auto">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="bg-zinc-900 border-zinc-700">
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-xl">{pkg.display_name}</p>
                    <p className="text-sm text-zinc-400">
                      {pkg.duration_value} {pkg.duration_type === 'hours' ? 'giờ' : pkg.duration_type === 'days' ? 'ngày' : 'phút'} • {pkg.max_runs} run
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-cyan-400">{pkg.price.toLocaleString()}đ</p>
                    <Button size="sm" className="mt-3" onClick={() => openPaymentModal(pkg)}>Mua ngay</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button variant="outline" onClick={() => setShowBuyModal(false)} className="w-full">Đóng</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="w-[95vw] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Thanh toán {selectedPackage?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-zinc-900 rounded-2xl p-5 space-y-5">
              <div>
                <Label>Ngân hàng</Label>
                <Input value="LP BANK" readOnly className="bg-black/50" />
              </div>
              <div>
                <Label>Tên chủ tài khoản</Label>
                <Input value="NGUYEN BINH MINH" readOnly className="bg-black/50" />
              </div>
              <div>
                <Label>Số tài khoản</Label>
                <div className="flex gap-2">
                  <Input value="44405006666" readOnly className="bg-black/50 font-mono" />
                  <Button onClick={() => copyToClipboard('44405006666')}>Copy</Button>
                </div>
              </div>
              <div>
                <Label>Nội dung chuyển khoản</Label>
                <div className="flex gap-2 bg-black/50 p-3 rounded-xl items-center">
                  <span className="font-mono flex-1 break-all">
                    {nickname}_{selectedPackage?.name}
                  </span>
                  <Button size="sm" onClick={() => copyToClipboard(`${nickname}_${selectedPackage?.name}`)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-center text-4xl font-black text-cyan-400">
                {selectedPackage?.price.toLocaleString()}đ
              </div>
            </div>

            <Button onClick={confirmPayment} disabled={isConfirmingPayment} className="w-full py-7 text-lg bg-green-600 hover:bg-green-700">
              {isConfirmingPayment ? 'Đang gửi yêu cầu...' : 'Tôi đã chuyển khoản'}
            </Button>

            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="w-full">Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-center py-20">
        <h1 className="text-[2.8rem] md:text-[3.2rem] font-black leading-none tracking-tighter">
          81 VIETNAM SPEED RANK
        </h1>
      </div>
      <DonateModal />
    </div>
  );
}