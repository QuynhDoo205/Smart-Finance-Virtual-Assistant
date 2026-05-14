import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, MessageSquare, Cpu, Sliders, Save, Sparkles, BarChart3, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';

export default function AdminAIConfig() {
  const [config, setConfig] = useState({
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
    model: 'Gemini 2.5 Flash'
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
    const loadConfig = async () => {
      try {
        const res = await adminApi.getAIConfig();
        if (res.success) setConfig(res.data);
      } catch (err) {
        console.error("Failed to load AI config:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminApi.updateAIConfig(config);
      if (res.success) {
        setModal({
          show: true,
          title: 'Thành công!',
          message: 'Cấu hình AI đã được cập nhật và áp dụng cho toàn bộ hệ thống.',
          type: 'success'
        });
      } else {
        throw new Error((res as any).message);
      }
    } catch (err: any) {
      setModal({
        show: true,
        title: 'Lỗi hệ thống',
        message: 'Không thể lưu cấu hình. Vui lòng kiểm tra kết nối Database. ' + (err.message || ''),
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative">
      {/* Custom Modal */}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(p => ({ ...p, show: false }))} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-[#161B2B] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden text-center">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${modal.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <div className="flex flex-col items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${modal.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {modal.type === 'error' ? <AlertCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{modal.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{modal.message}</p>
                </div>
                <button 
                  onClick={() => setModal(p => ({ ...p, show: false }))}
                  className="w-full py-3.5 mt-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  ĐÓNG
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-400" />
            Cấu hình Nova AI
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý mô hình ngôn ngữ và trí tuệ nhân tạo trợ lý.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> 
          {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Model hiện tại', value: config.model, icon: Brain, color: 'text-amber-400' },
          { label: 'Tổng Tokens (Tháng)', value: '840K', icon: MessageSquare, color: 'text-sky-400' },
          { label: 'Chi phí ước tính', value: '$0.85', icon: BarChart3, color: 'text-emerald-400' },
        ].map((item, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-3xl border-white/5 bg-[#0F172A]">
            <div className="flex items-center justify-between mb-4">
              <item.icon className={`w-6 h-6 ${item.color}`} />
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                OPTIMIZED
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
            <h3 className="text-2xl font-black text-white mt-1">{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] space-y-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            Thông số mô hình
          </h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-300">Temperature (Sự sáng tạo)</label>
                <span className="text-xs font-bold text-amber-400">{config.temperature}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={config.temperature} 
                onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-300">Top P</label>
                <span className="text-xs font-bold text-amber-400">{config.top_p}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={config.top_p} 
                onChange={(e) => setConfig({...config, top_p: parseFloat(e.target.value)})}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-300">Max Output Tokens</label>
                <span className="text-xs font-bold text-amber-400">{config.max_tokens}</span>
              </div>
              <input 
                type="range" min="256" max="4096" step="256" 
                value={config.max_tokens} 
                onChange={(e) => setConfig({...config, max_tokens: parseInt(e.target.value)})}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500" 
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 bg-[#0F172A] space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-sky-400 w-5 h-5" />
            Trạng thái API Key
          </h3>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Provider</span>
              <span className="text-sm font-bold text-white">Google Generative AI</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Key Status</span>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Last Sync</span>
              <span className="text-sm text-slate-400">Just now</span>
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-sky-500/10 border border-white/5">
            <h4 className="font-bold text-white flex items-center gap-2 mb-2 text-sm">
              <Cpu className="w-4 h-4 text-sky-400" /> Tối ưu hóa chi phí
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mô hình hiện đang sử dụng cache để giảm thiểu chi phí API. 
              Các câu hỏi trùng lặp sẽ không tiêu tốn thêm Tokens.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
