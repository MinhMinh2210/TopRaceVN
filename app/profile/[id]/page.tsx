'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getCurrentUser } from '@/app/features/auth/getUser';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Car, Trophy, Eye } from 'lucide-react';

type Profile = {
  id: string;
  nickname: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type Vehicle = {
  id: number;
  nickname: string;
  brand: string;
  model: string;
  vehicle_type: string;
};

export default function ProfilePage() {
  const { id } = useParams() as { id: string };   // ID của người đang xem
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isViewer, setIsViewer] = useState(false);   // true = đang xem profile người khác

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const cu = await getCurrentUser();
      setCurrentUser(cu);

      // Kiểm tra có phải viewer không
      setIsViewer(cu?.id !== id);

      // Lấy thông tin profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      setProfile(prof);

      // Lấy danh sách xe
      const { data: veh } = await supabase
        .from('vehicles')
        .select('id, nickname, brand, model, vehicle_type')
        .eq('user_id', id);

      setVehicles(veh || []);
      setLoading(false);
    };

    init();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-center">Đang tải profile...</div>;
  }

  return (
    <div className="space-y-6 pb-20 px-4">
      {/* Header Profile */}
      <div className="flex flex-col items-center text-center">
        {isViewer && (
          <div className="flex items-center gap-2 bg-zinc-800 text-zinc-400 text-xs px-4 py-1.5 rounded-full mb-3">
            <Eye className="h-3 w-3" />
            <span>Đang xem profile của người khác (Viewer)</span>
          </div>
        )}

        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={profile?.avatar_url || ''} />
          <AvatarFallback className="text-4xl">
            {profile?.nickname?.[0] || '?'}
          </AvatarFallback>
        </Avatar>

        <h1 className="text-3xl font-black">{profile?.nickname || 'Unknown'}</h1>
        {profile?.full_name && (
          <p className="text-zinc-400">{profile.full_name}</p>
        )}

        {profile?.bio && (
          <p className="text-sm text-zinc-300 mt-4 max-w-xs">{profile.bio}</p>
        )}
      </div>

      {/* Danh sách xe */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Xe của {profile?.nickname}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vehicles.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">Chưa có xe nào</p>
          ) : (
            vehicles.map((v) => (
              <div
                key={v.id}
                className="flex justify-between items-center bg-zinc-800 p-4 rounded-2xl"
              >
                <div>
                  <p className="font-medium">{v.nickname}</p>
                  <p className="text-xs text-zinc-400">
                    {v.brand} {v.model} • {v.vehicle_type}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Nút quay lại */}
      <Button
        onClick={() => window.history.back()}
        variant="outline"
        className="w-full"
      >
        ← Quay lại Bảng Xếp Hạng
      </Button>
    </div>
  );
}