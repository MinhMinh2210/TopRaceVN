'use client';

import { useState, useEffect, useCallback, useRef} from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Trophy, Users, Car, TrendingUp, Search, Trash2, Edit, Shield, LogOut, 
  Menu, Download, Save, RotateCcw, User, Plus 
} from 'lucide-react';
import html2canvas from 'html2canvas';

// ====================== HƯỚNG DẪN CẤU HÌNH SUPABASE (CHỈ LÀM 1 LẦN) ======================
// 1. Vào Supabase Dashboard → Table Editor → profiles
//    Thêm cột mới: 
//      - is_admin (boolean, default: false, nullable: false)
//
// 2. Set quyền Admin cho tài khoản của bạn:
//    SQL Editor chạy lệnh sau:
//    UPDATE profiles 
//    SET is_admin = true 
//    WHERE id = 'UUID_CỦA_BẠN';   ← thay UUID_CỦA_BẠN bằng id từ auth.users
//
// 3. (Khuyến khích) Bật RLS cho bảng runs, vehicles, profiles:
//    - Policy cho admin: CREATE POLICY "Admins can do everything" ON runs FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
//
// 4. Đặt trang này vào route: /admin
// ========================================================================================

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

type Vehicle = {
  id: number;
  user_id: string;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

type Run = {
  id: number;
  user_id: string;
  vehicle_id: number;
  max_speed: number;
  zero_to_hundred: number | null;
  region: string;
  created_at: string;
  ai_verified: boolean;
  profiles: { full_name: string | null } | null;
  vehicles: { nickname: string } | null;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'vehicles' | 'runs' | 'fake'>('overview');

  // Data states
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fake Result (tái sử dụng từ tool cũ)
  const resultRef = useRef<HTMLDivElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    maxSpeed: 178,
    zeroToHundred: 2.9,
    region: 'Gia Lai',
    date: 'Chủ Nhật, 05 Tháng 4, 2026 - 22:48',
    rank: '#1',
    vehicleNickname: 'Supra MK4',
  });

  // ==================== CHECK ADMIN AUTH (ĐÃ LÀM SẴN) ====================
  const checkAdminAuth = useCallback(async () => {
    setLoadingAuth(true);
    const user = await getCurrentUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch full profile với is_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      alert('🚫 Bạn không có quyền truy cập Admin Panel!');
      router.push('/');
      return;
    }

    setCurrentUser(user);
    setIsAdmin(true);
    setLoadingAuth(false);
  }, [router]);

  useEffect(() => {
    checkAdminAuth();
  }, [checkAdminAuth]);

  // ==================== LOAD DATA ====================
  const loadProfiles = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    setProfiles(data || []);
  }, []);

  const loadVehicles = useCallback(async () => {
    const { data } = await supabase
      .from('vehicles')
      .select(`
        *,
        profiles!user_id (full_name)
      `)
      .order('created_at', { ascending: false });
    setVehicles(data || []);
  }, []);

  const loadRuns = useCallback(async () => {
    const { data } = await supabase
      .from('runs')
      .select(`
        *,
        profiles!user_id (full_name),
        vehicles!vehicle_id (nickname)
      `)
      .order('created_at', { ascending: false });
    setRuns(data || []);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadProfiles();
      loadVehicles();
      loadRuns();
    }
  }, [isAdmin, loadProfiles, loadVehicles, loadRuns]);

  // ==================== FAKE RESULT FUNCTIONS (tái sử dụng) ====================
  const downloadResultAsImage = useCallback(async () => {
    const card = resultRef.current;
    if (!card) return;
    try {
      const canvas = await html2canvas(card, { scale: 3, backgroundColor: '#18181b' });
      const link = document.createElement('a');
      link.download = `TopRaceVN_FAKE_${formData.maxSpeed}kmh_${new Date().toISOString().slice(0,19)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {}
  }, [formData.maxSpeed]);

  const createFakeRun = async () => {
    if (!selectedUserId || !selectedVehicleId) return alert('Vui lòng chọn user và xe!');
    
    const payload = {
      user_id: selectedUserId,
      vehicle_id: selectedVehicleId,
      max_speed: formData.maxSpeed,
      zero_to_hundred: formData.zeroToHundred,
      region: formData.region,
      created_at: new Date().toISOString(),
      ai_verified: true,
    };

    const { error } = await supabase.from('runs').insert(payload);
    if (!error) {
      alert('✅ Đã thêm run giả thành công!');
      loadRuns();
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-green-500 text-xl font-bold">Đang xác thực quyền Admin...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* SIDEBAR - Desktop */}
      <div className="hidden lg:flex w-72 bg-zinc-900 border-r border-zinc-800 flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Trophy className="w-9 h-9 text-green-500" />
            <div>
              <span className="text-3xl font-black tracking-tighter">TopRace</span>
              <span className="text-green-500 font-black">VN</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1">ADMIN PANEL</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { key: 'overview', label: 'Tổng quan', icon: TrendingUp },
            { key: 'users', label: 'Quản lý User', icon: Users },
            { key: 'vehicles', label: 'Quản lý Xe', icon: Car },
            { key: 'runs', label: 'Quản lý Runs', icon: Trophy },
            { key: 'fake', label: 'Fake Result Tool', icon: Plus },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.key}
                variant={activeTab === item.key ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 h-12 text-lg ${activeTab === item.key ? 'bg-green-600 text-white' : ''}`}
                onClick={() => setActiveTab(item.key as any)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-zinc-800">
          <Button onClick={logout} variant="outline" className="w-full gap-2">
            <LogOut className="w-4 h-4" />
            Đăng xuất Admin
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto">
        {/* MOBILE HEADER */}
        <div className="lg:hidden bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-green-500" />
            <span className="font-black text-2xl">Admin</span>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-zinc-900 border-zinc-800">
              {/* Mobile menu same as sidebar */}
              <nav className="flex flex-col gap-2 mt-8">
                {[
                  { key: 'overview', label: 'Tổng quan', icon: TrendingUp },
                  { key: 'users', label: 'Quản lý User', icon: Users },
                  { key: 'vehicles', label: 'Quản lý Xe', icon: Car },
                  { key: 'runs', label: 'Quản lý Runs', icon: Trophy },
                  { key: 'fake', label: 'Fake Result Tool', icon: Plus },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.key}
                      variant={activeTab === item.key ? 'default' : 'ghost'}
                      className="justify-start gap-3"
                      onClick={() => setActiveTab(item.key as any)}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* PAGE CONTENT */}
        <div className="p-6 max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            
            {/* ==================== OVERVIEW ==================== */}
            <TabsContent value="overview" className="mt-0">
              <h1 className="text-4xl font-black mb-8 flex items-center gap-3">
                <Shield className="w-10 h-10 text-green-500" />
                Admin Dashboard
              </h1>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-zinc-400">Tổng User</p>
                        <p className="text-5xl font-black text-white">{profiles.length}</p>
                      </div>
                      <Users className="w-12 h-12 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-zinc-400">Tổng Xe</p>
                        <p className="text-5xl font-black text-white">{vehicles.length}</p>
                      </div>
                      <Car className="w-12 h-12 text-cyan-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-zinc-400">Tổng Run</p>
                        <p className="text-5xl font-black text-white">{runs.length}</p>
                      </div>
                      <Trophy className="w-12 h-12 text-amber-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-zinc-400">Admin Online</p>
                        <p className="text-5xl font-black text-emerald-400">1</p>
                      </div>
                      <Shield className="w-12 h-12 text-emerald-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ==================== USERS ==================== */}
            <TabsContent value="users" className="mt-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Quản lý Users</h2>
                <div className="relative w-72">
                  <Search className="absolute left-4 top-3 text-zinc-400" />
                  <Input 
                    placeholder="Tìm user..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avatar</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <Avatar>
                            <AvatarImage src={profile.avatar_url || ''} />
                            <AvatarFallback>👤</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{profile.full_name || 'Chưa đặt tên'}</TableCell>
                        <TableCell className="text-zinc-400 text-sm">{profile.id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <Badge variant={profile.is_admin ? 'default' : 'secondary'}>
                            {profile.is_admin ? 'ADMIN' : 'USER'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2">Sửa</Button>
                          <Button variant="destructive" size="sm">Xóa</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* ==================== VEHICLES ==================== */}
            <TabsContent value="vehicles" className="mt-0">
              <h2 className="text-3xl font-bold mb-6">Quản lý Xe</h2>
              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nickname</TableHead>
                      <TableHead>Chủ xe</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-semibold">{v.nickname}</TableCell>
                        <TableCell>{v.profiles?.full_name}</TableCell>
                        <TableCell>
                          <Badge>{v.vehicle_type.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">Sửa</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* ==================== RUNS ==================== */}
            <TabsContent value="runs" className="mt-0">
              <h2 className="text-3xl font-bold mb-6">Quản lý Leaderboard</h2>
              <Card className="bg-zinc-900 border-zinc-800">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Xe</TableHead>
                      <TableHead>Top Speed</TableHead>
                      <TableHead>0-100</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>{run.profiles?.full_name}</TableCell>
                        <TableCell>{run.vehicles?.nickname}</TableCell>
                        <TableCell className="font-black text-green-400">{run.max_speed} km/h</TableCell>
                        <TableCell>{run.zero_to_hundred}s</TableCell>
                        <TableCell>{run.region}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button variant="outline" size="sm">Sửa</Button>
                          <Button variant="destructive" size="sm" onClick={() => {
                            if (confirm('Xóa run này?')) supabase.from('runs').delete().eq('id', run.id).then(() => loadRuns());
                          }}>
                            Xóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* ==================== FAKE RESULT TOOL ==================== */}
            <TabsContent value="fake" className="mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Form */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-6 h-6" /> Tạo Kết Quả Giả
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Chọn user & xe */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>User</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Chọn user" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Xe</Label>
                        <Select value={selectedVehicleId?.toString() || ''} onValueChange={(v) => setSelectedVehicleId(Number(v))}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Chọn xe" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.filter(v => v.user_id === selectedUserId).map((v) => (
                              <SelectItem key={v.id} value={v.id.toString()}>{v.nickname}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label>Top Speed (km/h)</Label>
                        <Input type="number" value={formData.maxSpeed} onChange={(e) => setFormData({...formData, maxSpeed: Number(e.target.value)})} className="text-4xl h-14 font-black text-center" />
                      </div>
                      <div>
                        <Label>0-100 (giây)</Label>
                        <Input type="number" step="0.1" value={formData.zeroToHundred} onChange={(e) => setFormData({...formData, zeroToHundred: Number(e.target.value)})} className="text-4xl h-14 font-black text-center" />
                      </div>
                    </div>

                    <div>
                      <Label>Khu vực</Label>
                      <Input value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} />
                    </div>

                    <div className="flex gap-4">
                      <Button onClick={createFakeRun} className="flex-1 bg-green-600 hover:bg-green-700">
                        <Save className="mr-2" /> Thêm vào Leaderboard
                      </Button>
                      <Button onClick={downloadResultAsImage} variant="outline" className="flex-1">
                        <Download className="mr-2" /> Tải ảnh preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* PREVIEW CARD */}
                <Card ref={resultRef} className="bg-zinc-900 border-zinc-800 max-w-md mx-auto">
                  <CardContent className="p-8 space-y-6 text-center">
                    <div className="text-green-500 font-black text-4xl">TopRaceVN</div>
                    <div className="text-8xl font-black text-green-400">{formData.maxSpeed}</div>
                    <div className="text-2xl text-zinc-400">km/h • {formData.region}</div>
                    <div className="text-6xl font-black text-cyan-300">{formData.rank}</div>
                    <div className="text-sm text-zinc-400">{formData.vehicleNickname}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}