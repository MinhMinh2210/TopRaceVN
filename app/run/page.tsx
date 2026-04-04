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
  DialogFooter,
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

export default function RunPage() {
  const [user, setUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('Chưa kiểm tra');
  const [errorMessage, setErrorMessage] = useState('');
  const [watchId, setWatchId] = useState<number | null>(null);

  const [showResult, setShowResult] = useState(false);
  const [runResult, setRunResult] = useState({
    maxSpeed: 0,
    zeroToHundred: 0,
    distance: 0,
    region: 'TP.HCM',
    date: '',
    rankInRegionToday: 0,
    personalBestImprovement: 0,
    isNewPersonalBest: false,
  });

  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser();
      if (u) {
        setUser(u);
        const { data } = await supabase
          .from('vehicles')
          .select('id, nickname, brand, model, vehicle_type')
          .eq('user_id', u.id);
        setVehicles(data || []);
      }
    };
    init();
  }, []);

  const checkGPS = async () => {
    setErrorMessage('');
    setGpsStatus('Đang kiểm tra...');

    if (!navigator.geolocation) {
      setErrorMessage('Thiết bị không hỗ trợ GPS');
      setGpsStatus('Không hỗ trợ');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        if (accuracy < 10) setGpsStatus('Tuyệt vời ✅');
        else if (accuracy < 20) setGpsStatus('Tốt');
        else if (accuracy < 40) setGpsStatus('Yếu');
        else setGpsStatus('Rất yếu ⚠️');
      },
      (error) => {
        if (error.code === 1) {
          setErrorMessage('Bạn chưa cấp quyền GPS');
          setGpsStatus('Chưa cấp quyền');
        } else {
          setErrorMessage('Lỗi GPS: ' + error.message);
          setGpsStatus('Lỗi');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const startRun = () => {
    if (!selectedVehicle) {
      setErrorMessage('Vui lòng chọn xe trước khi bắt đầu Run!');
      return;
    }
    setErrorMessage('');
    setShowResult(false);

    if (!navigator.geolocation) {
      setErrorMessage('Thiết bị không hỗ trợ GPS');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const speedKmh = position.coords.speed 
          ? Math.round(position.coords.speed * 3.6) 
          : 0;

        setCurrentSpeed(speedKmh);
        if (speedKmh > maxSpeed) setMaxSpeed(speedKmh);

        const accuracy = position.coords.accuracy;
        if (accuracy < 10) setGpsStatus('Tuyệt vời ✅');
        else if (accuracy < 20) setGpsStatus('Tốt');
        else if (accuracy < 40) setGpsStatus('Yếu');
        else setGpsStatus('Rất yếu ⚠️');
      },
      (error) => {
        console.error(error);
        if (error.code === 1) setErrorMessage('Bạn chưa cấp quyền GPS');
        else setErrorMessage('Lỗi GPS: ' + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setWatchId(id);
    setIsRunning(true);
    setMaxSpeed(0);
  };

  const stopRun = async () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setIsRunning(false);

    const userData = await getCurrentUser();
    if (!userData || !selectedVehicle) return;

    // ==================== LUÔN LƯU RUN VÀO DB (kể cả 0 km/h) ====================
    await supabase.from('runs').insert({
      user_id: userData.id,
      vehicle_id: selectedVehicle.id,
      max_speed: maxSpeed,
      zero_to_sixty: null,
      zero_to_hundred: null,
      distance_to_max_speed: null,
      gps_data: [],
      start_lat: null,
      start_lng: null,
      end_lat: null,
      end_lng: null,
      region: 'TP.HCM',
      gps_accuracy: 'Good',
      is_low_accuracy: false,
      ai_analysis: null,
      ai_verified: false,
    });

    // ==================== TÍNH RANK THẬT + KỶ LỤC CÁ NHÂN ====================
    const today = new Date().toISOString().split('T')[0];

    // Rank trong khu vực hôm nay (cùng hệ xe) - ĐÃ SỬA
    const { data: todayRuns } = await supabase
      .from('runs')
      .select(`
        max_speed,
        vehicles (
          vehicle_type
        )
      `)
      .eq('region', 'TP.HCM')
      .gte('created_at', today);

    const higherCount = (todayRuns || []).filter((run: any) => 
      run.vehicles?.vehicle_type === selectedVehicle.vehicle_type && 
      run.max_speed > maxSpeed
    ).length;

    const rankInRegionToday = higherCount + 1;

    // Kỷ lục cá nhân của user này
    const { data: prevBest } = await supabase
      .from('runs')
      .select('max_speed')
      .eq('user_id', userData.id)
      .order('max_speed', { ascending: false })
      .limit(1);

    const previousMax = prevBest?.[0]?.max_speed || 0;
    const isNewPersonalBest = maxSpeed > previousMax;
    const personalBestImprovement = isNewPersonalBest 
      ? parseFloat((maxSpeed - previousMax).toFixed(1)) 
      : 0;

    const now = new Date();
    setRunResult({
      maxSpeed: maxSpeed,
      zeroToHundred: 5.2,
      distance: Math.round(maxSpeed * 2.5),
      region: 'TP.HCM',
      date: now.toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
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
    setShowResult(false);
    setCurrentSpeed(0);
    setMaxSpeed(0);
    setGpsStatus('Chưa kiểm tra');
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-5 py-8 space-y-10">
      <h1 className="text-4xl font-black text-center text-green-500">BẮT ĐẦU RUN</h1>

      {selectedVehicle && (
        <Card className="bg-zinc-900 border-zinc-800 w-full">
          <CardContent className="p-8 flex items-center gap-6">
            <Car className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-medium text-3xl">{selectedVehicle.nickname}</p>
              <p className="text-lg text-zinc-400">{selectedVehicle.brand} {selectedVehicle.model}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-zinc-900 border-zinc-800 w-full">
        <CardContent className="p-28 text-center">
          <div className="text-[220px] font-black text-green-500 leading-none">
            {currentSpeed}
          </div>
          <p className="text-zinc-400 text-6xl mt-6">km/h</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 w-full">
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-between items-center text-xl">
            <span className="text-zinc-400">Tín hiệu GPS</span>
            <span className="font-medium text-green-400 text-2xl">{gpsStatus}</span>
          </div>

          <Button 
            onClick={checkGPS}
            className="w-full py-7 text-xl font-medium bg-zinc-800 hover:bg-zinc-700 rounded-2xl"
          >
            🔄 Kiểm tra GPS
          </Button>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="bg-red-950 border border-red-800 text-red-400 p-7 rounded-3xl flex items-start gap-4 text-xl">
          <AlertCircle className="h-7 w-7 mt-0.5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="pt-10">
        {!isRunning && !showResult ? (
          <Button 
            onClick={startRun}
            className="w-full py-12 text-4xl bg-green-600 hover:bg-green-700 rounded-3xl"
            disabled={!selectedVehicle}
          >
            <Play className="mr-6 h-10 w-10" />
            BẮT ĐẦU RUN
          </Button>
        ) : isRunning ? (
          <Button 
            onClick={stopRun}
            className="w-full py-12 text-4xl bg-red-600 hover:bg-red-700 rounded-3xl"
          >
            <Square className="mr-6 h-10 w-10" />
            KẾT THÚC RUN
          </Button>
        ) : null}
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-8 py-8 text-2xl">
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
            <CardContent className="p-10 text-center space-y-10">
              <h2 className="text-3xl font-bold text-green-500">Run đã kết thúc!</h2>

              <div>
                <p className="text-zinc-400 text-base">Top Speed cao nhất</p>
                <p className="text-8xl font-black text-green-500">{runResult.maxSpeed}</p>
                <p className="text-zinc-400 text-2xl">km/h</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-zinc-800 pt-8">
                <div>
                  <p className="text-zinc-400">Khu vực</p>
                  <p className="font-medium text-xl">{runResult.region}</p>
                </div>
                <div>
                  <p className="text-zinc-400">Xếp hạng hiện tại</p>
                  <p className="text-5xl font-bold text-green-400">#{runResult.rankInRegionToday}</p>
                </div>
              </div>

              <div className="space-y-3 text-left border-t border-zinc-800 pt-8">
                {runResult.rankInRegionToday <= 5 && (
                  <div className="flex justify-between items-center bg-zinc-800 rounded-2xl px-5 py-4">
                    <span className="text-green-400 font-medium">🏆 Nhanh nhất khu vực hôm nay</span>
                    <span className="text-green-400">#{runResult.rankInRegionToday}</span>
                  </div>
                )}
                {runResult.isNewPersonalBest && (
                  <div className="flex justify-between items-center bg-zinc-800 rounded-2xl px-5 py-4">
                    <span className="text-green-400 font-medium">🚀 Kỷ lục cá nhân</span>
                    <span className="text-green-400">+{runResult.personalBestImprovement.toFixed(1)} km/h</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-400">Thời gian chạy</p>
                <p className="text-base font-medium text-zinc-300">{runResult.date}</p>
              </div>

              <div className="flex gap-4 pt-6">
                <Button onClick={resetRun} variant="outline" className="flex-1 py-6 text-base">
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Run mới
                </Button>
                <Button onClick={() => window.location.href = '/leaderboard'} className="flex-1 py-6 text-base">
                  Xem bảng xếp hạng
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}