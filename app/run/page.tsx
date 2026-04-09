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

// ==================== OPTIMIZED REGION DETECTION (DỮ LIỆU CHUẨN 2026) ====================
const VIETNAM_REGIONS = [
  { name: 'TP.HCM', latMin: 10.65, latMax: 10.95, lngMin: 106.35, lngMax: 106.85 },
  { name: 'Hà Nội', latMin: 20.90, latMax: 21.25, lngMin: 105.65, lngMax: 106.05 },
  { name: 'Bình Dương', latMin: 10.85, latMax: 11.15, lngMin: 106.55, lngMax: 106.85 },
  { name: 'Đồng Nai', latMin: 10.70, latMax: 11.15, lngMin: 106.85, lngMax: 107.45 },
  { name: 'Bà Rịa - Vũng Tàu', latMin: 10.25, latMax: 10.75, lngMin: 107.00, lngMax: 107.55 },
  { name: 'Bắc Ninh', latMin: 20.95, latMax: 21.25, lngMin: 105.85, lngMax: 106.15 },
  { name: 'Hưng Yên', latMin: 20.65, latMax: 21.05, lngMin: 105.85, lngMax: 106.15 },
  { name: 'Hà Nam', latMin: 20.45, latMax: 20.75, lngMin: 105.65, lngMax: 106.05 },
  { name: 'Đà Nẵng', latMin: 15.85, latMax: 16.15, lngMin: 107.95, lngMax: 108.35 },
  { name: 'Quảng Nam', latMin: 15.25, latMax: 15.95, lngMin: 107.85, lngMax: 108.45 },
  { name: 'Thừa Thiên Huế', latMin: 16.10, latMax: 16.55, lngMin: 107.35, lngMax: 108.05 },
  { name: 'Khánh Hòa', latMin: 11.75, latMax: 12.45, lngMin: 108.85, lngMax: 109.45 },
  { name: 'Bình Thuận', latMin: 10.75, latMax: 11.35, lngMin: 107.75, lngMax: 108.85 },
  { name: 'Quảng Ninh', latMin: 20.65, latMax: 21.45, lngMin: 106.35, lngMax: 107.35 },
  { name: 'Bình Định', latMin: 13.65, latMax: 14.35, lngMin: 108.75, lngMax: 109.35 },
  { name: 'Cần Thơ', latMin: 9.95, latMax: 10.25, lngMin: 105.65, lngMax: 106.05 },
  { name: 'Kiên Giang', latMin: 9.45, latMax: 10.35, lngMin: 104.35, lngMax: 105.35 },
  { name: 'An Giang', latMin: 10.15, latMax: 10.75, lngMin: 104.95, lngMax: 105.65 },
  { name: 'Bạc Liêu', latMin: 9.15, latMax: 9.65, lngMin: 105.25, lngMax: 105.85 },
  { name: 'Bắc Giang', latMin: 21.05, latMax: 21.55, lngMin: 105.95, lngMax: 106.75 },
  { name: 'Bắc Kạn', latMin: 21.95, latMax: 22.55, lngMin: 105.55, lngMax: 106.35 },
  { name: 'Bến Tre', latMin: 9.95, latMax: 10.45, lngMin: 106.15, lngMax: 106.75 },
  { name: 'Bình Phước', latMin: 11.35, latMax: 12.05, lngMin: 106.65, lngMax: 107.55 },
  { name: 'Cà Mau', latMin: 8.65, latMax: 9.35, lngMin: 104.65, lngMax: 105.35 },
  { name: 'Cao Bằng', latMin: 22.35, latMax: 23.05, lngMin: 105.65, lngMax: 106.45 },
  { name: 'Đắk Lắk', latMin: 11.95, latMax: 13.05, lngMin: 107.65, lngMax: 108.95 },
  { name: 'Đắk Nông', latMin: 11.65, latMax: 12.65, lngMin: 107.35, lngMax: 108.35 },
  { name: 'Điện Biên', latMin: 21.15, latMax: 22.35, lngMin: 102.15, lngMax: 103.35 },
  { name: 'Đồng Tháp', latMin: 10.15, latMax: 10.85, lngMin: 105.35, lngMax: 106.15 },
  { name: 'Gia Lai', latMin: 12.85, latMax: 14.35, lngMin: 107.65, lngMax: 108.95 },
  { name: 'Hà Giang', latMin: 22.35, latMax: 23.35, lngMin: 104.35, lngMax: 105.65 },
  { name: 'Hà Tĩnh', latMin: 17.85, latMax: 18.55, lngMin: 105.55, lngMax: 106.75 },
  { name: 'Hải Dương', latMin: 20.65, latMax: 21.15, lngMin: 106.15, lngMax: 106.75 },
  { name: 'Hải Phòng', latMin: 20.65, latMax: 21.05, lngMin: 106.55, lngMax: 107.05 },
  { name: 'Hậu Giang', latMin: 9.65, latMax: 10.15, lngMin: 105.45, lngMax: 106.05 },
  { name: 'Hòa Bình', latMin: 20.15, latMax: 21.05, lngMin: 104.85, lngMax: 105.85 },
  { name: 'Lai Châu', latMin: 21.85, latMax: 22.55, lngMin: 102.85, lngMax: 103.85 },
  { name: 'Lâm Đồng', latMin: 11.15, latMax: 12.35, lngMin: 107.35, lngMax: 108.55 },
  { name: 'Lạng Sơn', latMin: 21.65, latMax: 22.35, lngMin: 106.05, lngMax: 107.05 },
  { name: 'Lào Cai', latMin: 21.85, latMax: 22.65, lngMin: 103.65, lngMax: 104.65 },
  { name: 'Long An', latMin: 10.45, latMax: 11.05, lngMin: 105.65, lngMax: 106.35 },
  { name: 'Nam Định', latMin: 19.95, latMax: 20.45, lngMin: 105.85, lngMax: 106.45 },
  { name: 'Nghệ An', latMin: 18.35, latMax: 19.45, lngMin: 104.45, lngMax: 105.85 },
  { name: 'Ninh Bình', latMin: 19.95, latMax: 20.45, lngMin: 105.65, lngMax: 106.35 },
  { name: 'Ninh Thuận', latMin: 11.35, latMax: 12.05, lngMin: 108.75, lngMax: 109.35 },
  { name: 'Phú Thọ', latMin: 20.85, latMax: 21.45, lngMin: 104.65, lngMax: 105.45 },
  { name: 'Phú Yên', latMin: 12.85, latMax: 13.55, lngMin: 108.95, lngMax: 109.45 },
  { name: 'Quảng Bình', latMin: 17.15, latMax: 17.95, lngMin: 105.75, lngMax: 106.95 },
  { name: 'Quảng Ngãi', latMin: 14.65, latMax: 15.35, lngMin: 108.15, lngMax: 109.05 },
  { name: 'Quảng Trị', latMin: 16.35, latMax: 17.05, lngMin: 106.85, lngMax: 107.45 },
  { name: 'Sóc Trăng', latMin: 9.45, latMax: 10.05, lngMin: 105.65, lngMax: 106.15 },
  { name: 'Sơn La', latMin: 20.65, latMax: 21.45, lngMin: 103.15, lngMax: 104.65 },
  { name: 'Tây Ninh', latMin: 11.05, latMax: 11.65, lngMin: 105.95, lngMax: 106.55 },
  { name: 'Thái Bình', latMin: 20.25, latMax: 20.75, lngMin: 106.15, lngMax: 106.75 },
  { name: 'Thái Nguyên', latMin: 21.35, latMax: 21.95, lngMin: 105.65, lngMax: 106.35 },
  { name: 'Thanh Hóa', latMin: 19.35, latMax: 20.35, lngMin: 104.75, lngMax: 106.05 },
  { name: 'Tiền Giang', latMin: 10.25, latMax: 10.75, lngMin: 105.85, lngMax: 106.45 },
  { name: 'Trà Vinh', latMin: 9.65, latMax: 10.15, lngMin: 105.85, lngMax: 106.45 },
  { name: 'Tuyên Quang', latMin: 21.65, latMax: 22.35, lngMin: 104.95, lngMax: 105.75 },
  { name: 'Vĩnh Long', latMin: 9.95, latMax: 10.35, lngMin: 105.65, lngMax: 106.15 },
  { name: 'Vĩnh Phúc', latMin: 21.15, latMax: 21.55, lngMin: 105.35, lngMax: 105.85 },
  { name: 'Yên Bái', latMin: 21.35, latMax: 22.05, lngMin: 104.15, lngMax: 105.05 },
  // Fallback
  { name: 'Việt Nam', latMin: 8.0, latMax: 24.0, lngMin: 102.0, lngMax: 110.0 },
] as const;

const getRegionFromCoords = (lat: number, lng: number): string => {
  for (const region of VIETNAM_REGIONS) {
    if (lat >= region.latMin && lat <= region.latMax && lng >= region.lngMin && lng <= region.lngMax) {
      return region.name;
    }
  }
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
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [isPageReady, setIsPageReady] = useState(false);

  const [freeRunsUsed, setFreeRunsUsed] = useState(0);
  const [hasActiveSub, setHasActiveSub] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
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

  const isStartingRunRef = useRef(false);

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

  const loadPackages = useCallback(async () => {
    if (packages.length > 0) return;
    const { data } = await supabase.from('packages').select('*').eq('is_active', true).order('price');
    setPackages(data || []);
  }, [packages.length]);

  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;
    const [{ data: profile }, { data: sub }] = await Promise.all([
      supabase.from('profiles').select('free_runs_used, nickname').eq('id', user.id).single(),
      supabase.from('user_subscriptions').select('remaining_runs').eq('user_id', user.id).eq('status', 'active').gte('end_date', new Date().toISOString()).maybeSingle()
    ]);

    if (profile) {
      setFreeRunsUsed(profile.free_runs_used || 0);
      setNickname(profile.nickname || 'user');
    }
    setHasActiveSub(!!sub && (sub.remaining_runs ?? 0) > 0);
  }, [user]);

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (!u) {
        setIsAuthLoading(false);
        setIsDataLoaded(true);
        return;
      }

      const { data: vData } = await supabase.from('vehicles').select('*').eq('user_id', u.id);
      setVehicles(vData ?? []);
      if (vData?.length) setSelectedVehicle(vData[0]);

      await refreshUserData();
      setIsDataLoaded(true);
      setIsAuthLoading(false);

      setTimeout(() => {
        setIsPageReady(true);
      }, 700);
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
    if (!selectedVehicle || isStarting || isStartingRunRef.current || !isPageReady) return;

    isStartingRunRef.current = true;

    if (!canStartRun) {
      loadPackages();
      setShowBuyModal(true);
      isStartingRunRef.current = false;
      return;
    }

    if (currentRegion === 'Đang xác định...') {
      setIsAutoCheckingOnStart(true);
      checkGPS().then(() => {
        setIsAutoCheckingOnStart(false);
        startCountdown();
        isStartingRunRef.current = false;
      });
      return;
    }

    startCountdown();
    isStartingRunRef.current = false;
  }, [selectedVehicle, isStarting, currentRegion, canStartRun, checkGPS, loadPackages, isPageReady]);

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

            if (now - lastSpeedUpdateRef.current > 60) { // tối ưu mượt hơn
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

  const stopRun = useCallback(async () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    stopDeviceMotion();

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

    setIsRunning(false);
    setRunResult(initialResult);
    setShowResult(true);
    setIsCalculatingRank(true);

    if (!user || !selectedVehicle) {
      setIsCalculatingRank(false);
      await refreshUserData();
      return;
    }

    // === FIX: Refresh subscription ngay trước khi quyết định lưu ===
    await refreshUserData(); // đảm bảo hasActiveSub mới nhất

    const isTrialRun = !hasActiveSub;

    if (isTrialRun) {
      const newUsed = freeRunsUsed + 1;
      await supabase.from('profiles').update({ free_runs_used: newUsed }).eq('id', user.id);
      setFreeRunsUsed(newUsed);
    }

    try {
      if (!isTrialRun) {
        const { error } = await supabase.from('runs').insert({
          user_id: user.id,
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
          is_trial_run: false,
        });

        if (error) console.error('Lỗi insert run:', error);
      } else {
        // trial run vẫn insert nhưng đánh dấu
        await supabase.from('runs').insert({
          user_id: user.id,
          vehicle_id: selectedVehicle.id,
          max_speed: finalMaxSpeed,
          zero_to_hundred: zeroToHundred,
          region: currentRegion,
          is_trial_run: true,
        });
      }
    } catch (err) {
      console.error('Lỗi khi lưu run:', err);
    }

    if (!isTrialRun) {
      const processInBackground = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { data: todayRuns } = await supabase
            .from('runs')
            .select(`max_speed, vehicles (vehicle_type)`)
            .eq('region', currentRegion)
            .gte('created_at', today)
            .limit(500);

          const higherCount = (todayRuns || []).filter((run: any) =>
            run.vehicles?.vehicle_type === selectedVehicle?.vehicle_type && run.max_speed > finalMaxSpeed
          ).length;

          const rankInRegionToday = higherCount + 1;

          const { data: prevBest } = await supabase
            .from('runs')
            .select('max_speed')
            .eq('user_id', user.id)
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
    } else {
      setRunResult(prev => ({ ...prev, rankInRegionToday: -1 }));
      setIsCalculatingRank(false);
    }

    await refreshUserData();
  }, [watchId, stopDeviceMotion, user, selectedVehicle, currentRegion, hasActiveSub, freeRunsUsed, refreshUserData]);

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

  if (isAuthLoading || !isDataLoaded) {
    return <div className="flex-1 flex items-center justify-center min-h-0 bg-zinc-950 text-green-500 text-lg">Đang tải dữ liệu người dùng...</div>;
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
      {!canStartRun && (
        <div className="bg-amber-900/30 border border-amber-400 text-amber-300 p-5 rounded-3xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Bạn đã dùng hết 2 lượt thử miễn phí</p>
            <p className="text-sm">Mua gói cước để tiếp tục lưu run và tính rank</p>
          </div>
          <Button onClick={() => { loadPackages(); setShowBuyModal(true); }} className="bg-amber-400 hover:bg-amber-300 text-black">Mua ngay</Button>
        </div>
      )}

      {!hasActiveSub && freeRunsUsed < 2 && (
        <div className="bg-sky-900/30 border border-sky-400 text-sky-300 p-5 rounded-3xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Bạn có 2 lần bấm GPS trải nghiệm</p>
            <p className="text-sm">Sẽ không lưu vào bảng rank. Muốn đua top hãy thử 2 lần và mua gói leo rank</p>
          </div>
        </div>
      )}

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

      <Button 
        onClick={checkGPS} 
        disabled={isCheckingGPS} 
        className={`w-full py-6 text-lg font-semibold rounded-2xl transition-all ${isCheckingGPS ? 'bg-zinc-700 text-zinc-400' : 'bg-white hover:bg-zinc-100 text-zinc-900'}`}
      >
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
            disabled={isStarting || !canStartRun || !isPageReady}
            className={`w-[90%] py-12 text-4xl rounded-3xl transition-all ${
              !canStartRun || !isPageReady
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : hasActiveSub
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-yellow-500 hover:bg-yellow-400 text-black font-bold'
            }`}
          >
            {isStarting ? (
              <>Loading</>
            ) : !canStartRun ? (
              <>Mua gói để chạy</>
            ) : hasActiveSub ? (
              <>
                <Play className="mr-6 h-10 w-10" /> START
              </>
            ) : freeRunsUsed === 1 ? (
              <>
                <Play className="mr-6 h-10 w-10" /> THỬ BẤM - LẦN CUỐI RỒI
              </>
            ) : (
              <>
                <Play className="mr-6 h-10 w-10" /> THỬ BẤM
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
                {runResult.rankInRegionToday === -1 || runResult.maxSpeed < 40 ? (
                  <p className="text-6xl font-black text-zinc-400 tracking-widest">VÔ HẠNG<br/><span className="text-xl">Không lưu dữ liệu</span></p>
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
                {runResult.rankInRegionToday !== -1 && runResult.maxSpeed >= 40 && (
                  <Button onClick={() => window.location.href = '/leaderboard'} className="flex-1 py-6 text-base">
                    Rank
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
              {isConfirmingPayment ? 'Đang gửi yêu cầu..' : 'Tôi đã chuyển khoản'}
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