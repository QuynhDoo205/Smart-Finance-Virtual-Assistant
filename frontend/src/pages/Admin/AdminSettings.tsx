import { motion } from 'framer-motion';
import { Settings, Globe, Shield, Bell, Save, Smartphone, Palette, Coffee } from 'lucide-react';

export default function AdminSettings() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-sky-400" />
          Cài đặt hệ thống
        </h1>
        <p className="text-sm text-slate-500 mt-1">Cấu hình các tham số vận hành chung của toàn bộ ứng dụng.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" /> Cấu hình chung
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Tên ứng dụng</label>
              <input type="text" defaultValue="NovaFinance" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-sky-500/50 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Khẩu hiệu (Slogan)</label>
              <input type="text" defaultValue="Quản lý tài chính thông minh hơn với AI" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-sky-500/50 outline-none transition-all" />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">Chế độ bảo trì</p>
                <p className="text-[10px] text-slate-500">Tạm dừng truy cập từ người dùng thông thường.</p>
              </div>
              <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer p-1">
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" /> Bảo mật & Quyền riêng tư
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">Đăng ký người dùng mới</p>
                <p className="text-[10px] text-slate-500">Cho phép người dùng tạo tài khoản mới.</p>
              </div>
              <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer p-1">
                <div className="w-4 h-4 bg-white rounded-full shadow-md translate-x-6" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <p className="text-sm font-bold text-white">Xác thực 2 yếu tố (2FA)</p>
                <p className="text-[10px] text-slate-500">Yêu cầu bảo mật cấp cao cho Admin.</p>
              </div>
              <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer p-1">
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Appearance & UX */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" /> Giao diện & Trải nghiệm
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-sky-500/20 text-center">
              <p className="text-xs font-bold text-sky-400 uppercase">Chế độ tối</p>
              <div className="mt-2 text-[10px] text-slate-500">Mặc định</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center grayscale opacity-50">
              <p className="text-xs font-bold text-slate-400 uppercase">Chế độ sáng</p>
              <div className="mt-2 text-[10px] text-slate-500">Sắp ra mắt</div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Coffee className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Xóa bộ nhớ đệm hệ thống</h3>
            <p className="text-xs text-slate-500 mt-1">Giải phóng bộ nhớ và đồng bộ lại dữ liệu.</p>
          </div>
          <button className="px-6 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/20 hover:bg-orange-500/30 transition-all">
            THỰC HIỆN NGAY
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="flex items-center gap-2 px-10 py-4 bg-sky-500 text-white rounded-2xl font-black text-sm hover:bg-sky-600 transition-all shadow-xl shadow-sky-500/30">
          <Save className="w-5 h-5" /> LƯU TẤT CẢ THAY ĐỔI
        </button>
      </div>
    </motion.div>
  );
}
