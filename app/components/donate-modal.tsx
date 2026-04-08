'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ==================== CONSTANTS (dễ chỉnh sau này) ====================
const SHOW_INTERVAL_MS = 30 * 60 * 1000;     // 30 phút
const PERMANENT_CLOSE_MS = 24 * 60 * 60 * 1000; // 24 giờ

export default function DonateModal() {
  const [isOpen, setIsOpen] = useState(false);

  // ==================== CHECK & SHOW MODAL ====================
  useEffect(() => {
    try {
      const lastShown = localStorage.getItem('donateModalLastShown');
      const now = Date.now();

      if (!lastShown || now - parseInt(lastShown, 10) > SHOW_INTERVAL_MS) {
        setIsOpen(true);
        localStorage.setItem('donateModalLastShown', now.toString());
      }
    } catch (err) {
      // Silent fail (private mode hoặc localStorage bị chặn)
      console.warn('localStorage không khả dụng:', err);
    }
  }, []);

  // ==================== HANDLER (đã tối ưu useCallback) ====================
  const handleClose = useCallback((permanent: boolean = false) => {
    setIsOpen(false);

    try {
      if (permanent) {
        // Đóng vĩnh viễn trong 24 giờ
        localStorage.setItem(
          'donateModalLastShown',
          (Date.now() + PERMANENT_CLOSE_MS).toString()
        );
      }
    } catch (err) {
      console.warn('Không thể lưu localStorage:', err);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-yellow-400 tracking-tight">
            🚨 THÔNG BÁO THU PHÍ - TRÁNH SPAM - FAKE GPS 🚨
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400 text-base leading-relaxed">
            Admin xin phép thu phí để tránh hiện trường vào fake gps và spam run ảo. Mức phí rất nhỏ chỉ từ 5k !
          </DialogDescription>
        </DialogHeader>

        {/* Card để bạn tự điền nội dung */}
        <Card className="border-2 border-yellow-400 bg-zinc-900">
          <CardContent className="pt-6 pb-2">
            {/* ==================== BẠN TỰ ĐIỀN NỘI DUNG VÀO ĐÂY ==================== */}
            Admin xin phép anh em thu phí để có thể tạo sân chơi lành mạnh, những ai muốn ghi danh bảng xếp hạng sẽ phải đóng phí, admin vẫn cho bấm gps free nhé !
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => handleClose(true)}
            variant="outline"
            className="flex-1 py-6 text-base font-medium rounded-2xl"
          >
            Đóng tạm (24h)
          </Button>
          <Button
            onClick={() => handleClose(false)}
            className="flex-1 py-6 text-base font-medium bg-green-600 hover:bg-green-700 rounded-2xl"
          >
            Đã ghi nhận rồi 👍
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}