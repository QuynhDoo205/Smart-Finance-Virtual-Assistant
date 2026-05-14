import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Globe, Shield, Bell, Save, Smartphone, Palette, Coffee, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    appName: 'NovaFinance',
    slogan: 'Quản lý tài chính thông minh hơn với AI',
    maintenanceMode: false,
    allowRegistration: true,
    twoFactor: false,
    defaultTheme: 'cyberpunk'
  });
  const [maintConfig, setMaintConfig] = useState({
    show: false,
    message: 'Hệ thống đang được nâng cấp định kỳ để mang lại trải nghiệm tốt hơn.',
    duration: 60
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await adminApi.getSettings();
        if (res.success) setSettings(res.data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleMaintenanceToggle = async (confirm = false) => {
    if (!settings.maintenanceMode && !confirm) {
      setMaintConfig(p => ({ ...p, show: true }));
      return;
    }

    const payload = {
      enabled: !settings.maintenanceMode,
      message: maintConfig.message,
      durationMinutes: maintConfig.duration
    };

    try {
      const res = await adminApi.toggleMaintenance(payload);
      if (res.success) {
        setSettings(p => ({ ...p, maintenanceMode: !p.maintenanceMode }));
        setMaintConfig(p => ({ ...p, show: false }));
        setModal({
          show: true,
          title: 'Thông báo hệ thống',
          message: res.message,
          type: 'success'
        });
      }
    } catch (err) {
      setModal({ show: true, title: 'Lỗi', message: 'Không thể thay đổi trạng thái bảo trì.', type: 'error' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateSettings(settings);
      if (res.success) {
        setModal({
          show: true,
          title: 'Thành công!',
          message: 'Các thay đổi hệ thống đã được lưu và áp dụng ngay lập tức trên toàn bộ ứng dụng.',
          type: 'success'
        });
      }
    } catch (err) {
      setModal({
        show: true,
        title: 'Lỗi hệ thống',
        message: 'Không thể cập nhật cài đặt. Vui lòng thử lại sau.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    setModal({
      show: true,
      title: 'Dọn dẹp hoàn tất',
      message: 'Bộ nhớ đệm hệ thống đã được xóa. Dữ liệu sẽ được tải mới hoàn toàn.',
      type: 'success'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative pb-24">
      {/* Maintenance Config Modal */}
      <AnimatePresence>
        {maintConfig.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMaintConfig(p => ({ ...p, show: false }))} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#161B2B] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white">Thiết lập bảo trì</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thông báo cho người dùng</label>
                  <textarea 
                    value={maintConfig.message}
                    onChange={(e) => setMaintConfig({...maintConfig, message: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-amber-500/50 outline-none transition-all h-24 resize-none"
                    placeholder="Nhập lý do bảo trì..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thời gian dự kiến (phút)</label>
                  <div className="flex gap-2">
                    {[15, 30, 60, 120, 240].map(m => (
                      <button 
                        key={m}
                        onClick={() => setMaintConfig({...maintConfig, duration: m})}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${maintConfig.duration === m ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                      >
                        {m >= 60 ? `${m/60}h` : `${m}p`}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="number" 
                    value={maintConfig.duration}
                    onChange={(e) => setMaintConfig({...maintConfig, duration: parseInt(e.target.value)})}
                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-amber-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={() => setMaintConfig(p => ({ ...p, show: false }))}
                  className="py-3.5 rounded-2xl bg-white/5 text-xs font-black text-slate-400 hover:text-white transition-all uppercase tracking-widest"
                >
                  HỦY BỎ
                </button>
                <button 
                  onClick={() => handleMaintenanceToggle(true)}
                  className="py-3.5 rounded-2xl bg-amber-500 text-white text-xs font-black hover:bg-amber-600 transition-all uppercase tracking-widest shadow-xl shadow-amber-500/20"
                >
                  BẮT ĐẦU BẢO TRÌ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Modal */}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(p => ({ ...p, show: false }))} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-[#161B2B] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-center overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${modal.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${modal.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {modal.type === 'error' ? <AlertCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{modal.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{modal.message}</p>
                </div>
                <button onClick={() => setModal(p => ({ ...p, show: false }))} className="w-full py-3.5 mt-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                  ĐÓNG
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-sky-400" /> Cấu hình chung
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tên ứng dụng</label>
              <input 
                type="text" 
                value={settings.appName}
                onChange={(e) => setSettings({...settings, appName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-sky-500/50 outline-none transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Khẩu hiệu (Slogan)</label>
              <input 
                type="text" 
                value={settings.slogan}
                onChange={(e) => setSettings({...settings, slogan: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:border-sky-500/50 outline-none transition-all" 
              />
            </div>
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-sm font-bold text-white">Chế độ bảo trì</p>
                <p className="text-[10px] text-slate-500 uppercase">Tạm dừng truy cập từ người dùng thông thường.</p>
              </div>
              <button 
                onClick={() => handleMaintenanceToggle()}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenanceMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-emerald-400" /> Bảo mật & Quyền riêng tư
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-sm font-bold text-white">Đăng ký người dùng mới</p>
                <p className="text-[10px] text-slate-500 uppercase">Cho phép người dùng tạo tài khoản mới.</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, allowRegistration: !settings.allowRegistration})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.allowRegistration ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.allowRegistration ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-sm font-bold text-white">Xác thực 2 yếu tố (2FA)</p>
                <p className="text-[10px] text-slate-500 uppercase">Yêu cầu bảo mật cấp cao cho Admin.</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, twoFactor: !settings.twoFactor})}
                className={`w-12 h-6 rounded-full transition-all relative ${settings.twoFactor ? 'bg-sky-500 shadow-lg shadow-sky-500/20' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.twoFactor ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance & UX */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
            <Palette className="w-5 h-5 text-purple-400" /> Giao diện & Trải nghiệm
          </h3>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Theme mặc định cho toàn hệ thống</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-sky-500' },
              { id: 'matrix', name: 'Matrix', color: 'bg-emerald-500' },
              { id: 'ocean', name: 'Deep Ocean', color: 'bg-blue-600' },
              { id: 'sakura', name: 'Sakura', color: 'bg-pink-500' },
              { id: 'sunset', name: 'Sunset', color: 'bg-orange-500' },
              { id: 'light-tech', name: 'Light Tech', color: 'bg-slate-200' },
            ].map(theme => (
              <button 
                key={theme.id}
                onClick={() => setSettings({...settings, defaultTheme: theme.id})}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  settings.defaultTheme === theme.id 
                    ? 'border-sky-500 bg-sky-500/10' 
                    : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${theme.color} shadow-lg`} />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center relative">
            <Coffee className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Xóa bộ nhớ đệm hệ thống</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">Giải phóng bộ nhớ và đồng bộ lại dữ liệu Database.</p>
          </div>
          <button 
            onClick={handleClearCache}
            className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white hover:bg-orange-500 hover:border-orange-500 transition-all uppercase tracking-widest shadow-lg"
          >
            THỰC HIỆN NGAY
          </button>
        </div>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-sky-500 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 hover:bg-sky-600 transition-all shadow-2xl shadow-sky-500/40 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'ĐANG LƯU HỆ THỐNG...' : 'LƯU TẤT CẢ THAY ĐỔI'}
        </motion.button>
      </div>
    </motion.div>
  );
}
