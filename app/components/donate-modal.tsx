'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card'; // có sẵn trong ui của mày

export default function DonateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Kiểm tra localStorage để tránh spam
    const lastShown = localStorage.getItem('donateModalLastShown');
    const now = Date.now();

    // Hiện mỗi lần vào tab, nhưng cách nhau ít nhất 30 phút (tránh reload liên tục)
    if (!lastShown || now - parseInt(lastShown) > 5 * 60 * 1000) {
      setIsOpen(true);
      localStorage.setItem('donateModalLastShown', now.toString());
    }
  }, []);

  const handleClose = (permanent = false) => {
    setIsOpen(false);
    if (permanent) {
      // Đóng vĩnh viễn 24h
      localStorage.setItem('donateModalLastShown', (Date.now() + 24 * 60 * 60 * 1000).toString());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-yellow-400">🚨 XIN DONATE LÀM PHÍ DUY TRÌ WEB 🚨</DialogTitle>
          <DialogDescription className="text-center text-lg">
            Mình làm WEB vui để bổ sung cho dự án cho năm học mới, mình không nghĩ anh em truy cập và ủng hộ nhiều, thành ra SERVER sắp hết phí <br />
            <strong>Anh em donate ít tiền giúp tao gia hạn server, mình chỉ còn phí duy trì 1 ngày thôi!</strong>
          </DialogDescription>
        </DialogHeader>

        <Card className="border-2 border-yellow-400">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-xl font-bold">💰 STK của tui:</p>
              <div className="bg-gray-900 p-4 rounded-xl text-2xl font-mono">
                {/* THAY THÔNG TIN THẬT CỦA MÀY VÀO ĐÂY */}
                [44405006666] <br />
                NGÂN HÀNG [LP_Bank] <br />
                CHỦ TK: [NGUYEN BINH MINH]
              </div>

              {/* Nếu mày có QR code thì add vô public/qr-donate.png rồi uncomment */}
              {/* <img src="/qr-donate.png" alt="QR Donate" className="mx-auto w-48 h-48" /> */}

              <p className="text-sm text-gray-400">Cảm ơn anh em đã ủng hộ! ❤️<br />Tiếp tục chơi GPS vui vẻ nha!</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => handleClose(true)} variant="outline" className="flex-1">
            Đóng tạm (24h)
          </Button>
          <Button onClick={() => handleClose(false)} className="flex-1">
            Đã donate rồi 👍
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}