import { motion } from 'framer-motion';
import { Coffee, Clock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Maintenance() {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number} | null>(null);
  const [config, setConfig] = useState({
    message: 'Hệ thống đang được nâng cấp định kỳ để mang lại trải nghiệm tốt hơn.',
    until: null as string | null
  });

  useEffect(() => {
    // Lấy thông tin từ URL hoặc LocalStorage nếu có
    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');
    const until = params.get('until');
    
    if (msg) setConfig(p => ({ ...p, message: decodeURIComponent(msg) }));
    if (until) setConfig(p => ({ ...p, until }));
  }, []);

  useEffect(() => {
    if (!config.until) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(config.until!).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        window.location.href = '/'; // Tự động load lại khi hết giờ
        return;
      }

      setTimeLeft({
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.until]);

  // Polling Real-time để tự động quay lại
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/status');
        const data = await res.json();
        
        if (data.maintenance === false) {
          window.location.href = '/app';
        } else {
          // Cập nhật thông tin nếu có thay đổi từ Admin
          setConfig({
            message: data.message || config.message,
            until: data.until
          });
        }
      } catch (err) {
        console.error("Polling status error:", err);
      }
    };

    const pollTimer = setInterval(pollStatus, 5000); // Check mỗi 5s
    pollStatus(); // Check ngay lập tức

    return () => clearInterval(pollTimer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050A18] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl text-center space-y-8"
      >
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/20"
          >
            <Coffee className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              BẢO TRÌ <span className="text-amber-400">HỆ THỐNG</span>
            </h1>
            <p className="text-slate-400 font-medium">Chúng tôi sẽ sớm quay trở lại với nhiều tính năng mới!</p>
          </div>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-[3rem] border-white/5 bg-white/[0.02] backdrop-blur-3xl space-y-8">
          <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 text-amber-200/80 text-sm leading-relaxed italic">
            "{config.message}"
          </div>

          {timeLeft && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'GIỜ', value: timeLeft.h },
                { label: 'PHÚT', value: timeLeft.m },
                { label: 'GIÂY', value: timeLeft.s },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="bg-white/5 rounded-2xl py-4 text-3xl md:text-4xl font-black text-white border border-white/5 tabular-nums">
                    {item.value.toString().padStart(2, '0')}
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          {!timeLeft && config.until && (
             <div className="flex items-center justify-center gap-3 py-4 text-emerald-400 font-black">
                <Clock className="w-5 h-5 animate-spin" />
                ĐANG MỞ LẠI HỆ THỐNG...
             </div>
          )}

          <div className="pt-4 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Chế độ an toàn đang được bật
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black text-white transition-all uppercase tracking-widest"
            >
              THỬ TẢI LẠI TRANG
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
          © 2026 NOVAFINANCE AI • PREMIUM MAINTENANCE MODE
        </p>
      </motion.div>
    </div>
  );
}
