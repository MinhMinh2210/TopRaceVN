'use client';

import { useEffect, useState } from 'react';

import { loginWithGoogle } from '@/app/features/auth/login';
import { logout } from '@/app/features/auth/logout';
import { getCurrentUser } from '@/app/features/auth/getUser';
import { createProfile } from '@/app/features/auth/createProfile';
import { testConnection } from '@/app/features/test/testConnection';

export default function Home() {
  const [message, setMessage] = useState('Đang kiểm tra...');
  const [errorDetail, setErrorDetail] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      // test DB
      const { error } = await testConnection();

      if (error) {
        setMessage('❌ Có lỗi khi kết nối');
        setErrorDetail(error.message);
      } else {
        setMessage('✅ Kết nối Supabase thành công!');
      }

      // lấy user
      const u = await getCurrentUser();

      if (u) {
        setUser(u);
        await createProfile(u);
      }
    };

    init();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-bold mb-4 text-green-500">TopRaceVN</h1>
        <p className="text-2xl mb-10">Sân chơi rank tốc độ xe</p>

        <div className="bg-zinc-900 p-8 rounded-2xl text-left">
          <p className="text-xl mb-4">{message}</p>

          {errorDetail && (
            <p className="text-red-400 text-sm mt-4 break-all">
              Chi tiết lỗi: {errorDetail}
            </p>
          )}
        </div>

        {/* 👇 AUTH UI */}
        <div className="mt-6">
          {user ? (
            <>
              <img
                src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                width={60}
                className="mx-auto rounded-full mb-2"
              />
              <p>{user.email}</p>

              <button
                onClick={logout}
                className="mt-4 bg-red-500 px-4 py-2 rounded-xl"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="bg-white text-black px-6 py-3 rounded-xl"
            >
              Login Google
            </button>
          )}
        </div>

        <p className="mt-8 text-gray-500 text-sm">
          Nếu vẫn lỗi, hãy chụp ảnh file .env.local (ẩn key) và gửi mình xem
        </p>
      </div>
    </div>
  );
}