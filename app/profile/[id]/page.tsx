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
  const { id } = useParams() as { id: string };
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isViewer, setIsViewer] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const cu = await getCurrentUser();
      setCurrentUser(cu);

      setIsViewer(cu?.id !== id);

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      setProfile(prof);

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
    <div className="min-h-screen bg-zinc-950 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Profile - To hơn 50% */}
        <div className="flex flex-col items-center text-center pt-8 pb-10">
          {isViewer && (
            <div className="flex items-center gap-2 bg-zinc-800 text-zinc-400 text-sm px-6 py-2 rounded-full mb-6">
              <Eye className="h-4 w-4" />
              <span>Đang xem profile của người khác</span>
            </div>
          )}

          <Avatar className="w-36 h-36 mb-6 border-4 border-zinc-800 shadow-2xl">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="text-6xl bg-zinc-800">
              {profile?.nickname?.[0] || '?'}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-5xl font-black tracking-tighter">{profile?.nickname || 'Unknown'}</h1>
          
          {profile?.full_name && (
            <p className="text-2xl text-zinc-400 mt-2">{profile.full_name}</p>
          )}

          {profile?.bio && (
            <p className="text-lg text-zinc-300 mt-8 max-w-md leading-relaxed px-4">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Danh sách xe - To hơn, đầy màn hình */}
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Car className="h-7 w-7" />
              Xe của {profile?.nickname}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicles.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Car className="mx-auto h-12 w-12 mb-4 opacity-30" />
                <p>Chưa có xe nào</p>
              </div>
            ) : (
              vehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex justify-between items-center bg-zinc-800 hover:bg-zinc-700 transition-colors p-6 rounded-3xl"
                >
                  <div>
                    <p className="text-2xl font-semibold">{v.nickname}</p>
                    <p className="text-zinc-400 mt-1">
                      {v.brand} {v.model} • {v.vehicle_type.replace('_', ' ')}
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
          className="w-full mt-8 py-7 text-lg font-medium rounded-3xl"
        >
          ← Quay lại Bảng Xếp Hạng
        </Button>
      </div>
    </div>
  );
}