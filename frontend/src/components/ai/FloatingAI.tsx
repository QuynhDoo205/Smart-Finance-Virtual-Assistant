import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, Sparkles, User, Bot, ChevronDown, Settings, Maximize2 } from 'lucide-react';
import { aiApi } from '../../utils/api';
import authStore from '../../store/authStore';

interface ZodiacAnimal {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glow: string;
  img?: string;
}

const ZODIAC_ANIMALS: ZodiacAnimal[] = [
  { id: 'rat', name: 'Tý', emoji: '🐭', color: 'from-slate-400 to-slate-600', glow: 'rgba(148,163,184,0.5)' },
  { id: 'ox', name: 'Sửu', emoji: '🐮', color: 'from-amber-600 to-amber-800', glow: 'rgba(180,83,9,0.5)' },
  { id: 'tiger', name: 'Dần', emoji: '🐯', color: 'from-orange-500 to-red-600', glow: 'rgba(249,115,22,0.5)' },
  { id: 'cat', name: 'Mão', emoji: '🐱', color: 'from-emerald-400 to-teal-600', glow: 'rgba(52,211,153,0.5)' },
  { id: 'dragon', name: 'Thìn', emoji: '🐲', color: 'from-yellow-400 to-amber-600', glow: 'rgba(234,179,8,0.6)', img: '/assets/ai/zodiac_dragon_3d.png' },
  { id: 'snake', name: 'Tỵ', emoji: '🐍', color: 'from-green-500 to-emerald-700', glow: 'rgba(16,185,129,0.5)' },
  { id: 'horse', name: 'Ngọ', emoji: '🐴', color: 'from-red-400 to-orange-600', glow: 'rgba(248,113,113,0.5)' },
  { id: 'goat', name: 'Mùi', emoji: '🐐', color: 'from-stone-300 to-stone-500', glow: 'rgba(168,162,158,0.5)' },
  { id: 'monkey', name: 'Thân', emoji: '🐵', color: 'from-yellow-600 to-orange-700', glow: 'rgba(202,138,4,0.5)' },
  { id: 'rooster', name: 'Dậu', emoji: '🐔', color: 'from-red-500 to-rose-700', glow: 'rgba(239,68,68,0.5)' },
  { id: 'dog', name: 'Tuất', emoji: '🐶', color: 'from-orange-400 to-amber-700', glow: 'rgba(251,146,60,0.5)' },
  { id: 'pig', name: 'Hợi', emoji: '🐷', color: 'from-pink-400 to-rose-500', glow: 'rgba(244,114,182,0.5)' },
];

const SUGGESTIONS = [
  "Phân tích tài chính tháng này",
  "Tôi đã tiêu bao nhiêu tiền?",
  "Kiểm tra quỹ dự phòng",
  "Mẹo tiết kiệm hôm nay"
];

const MOCK_ANSWERS: Record<string, string> = {
  "phân tích tài chính tháng này": "Để tôi xem... Ồ, bạn cần đăng nhập để tôi có thể đọc dữ liệu thu nhập và chi tiêu thực tế của bạn. Đăng nhập ngay để nhận báo cáo chuyên sâu nhé! 🚀",
  "tôi đã tiêu bao nhiêu tiền?": "Hiện tại tôi thấy bạn đang dùng chế độ khách. Hãy đăng nhập để tôi đồng bộ các jar tài chính và cho bạn con số chính xác nhất!",
  "kiểm tra quỹ dự phòng": "Quỹ dự phòng là cực kỳ quan trọng. Khi bạn đăng nhập, tôi sẽ giúp bạn tính toán xem quỹ của bạn đã đạt mục tiêu 6 tháng chi tiêu chưa.",
  "mẹo tiết kiệm hôm nay": "Mẹo nhỏ: Hãy tuân thủ quy tắc 6 chiếc hũ. Đăng nhập để tôi tự động chia tiền vào các hũ giúp bạn!"
};

export default function FloatingAI() {
  const [user, setUser] = useState<any>(authStore.getUser());
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { 
      role: 'assistant', 
      content: authStore.getUser() 
        ? `Chào ${authStore.getUser()?.full_name.split(' ').pop()}! Tôi là Nova AI. Bạn muốn phân tích con số nào hôm nay? (Hãy viết tắt thoải mái, tôi hiểu hết!)` 
        : 'Chào bạn! Tôi là Nova AI. Hãy đăng nhập để tôi có thể trở thành trợ lý tài chính cá nhân thực thụ của bạn nhé!' 
    }
  ]);

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = authStore.subscribe((newUser) => {
      setUser(newUser);
    });

    return () => unsubscribe();
  }, []);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showZodiacMenu, setShowZodiacMenu] = useState(false);
  const [selectedZodiac, setSelectedZodiac] = useState(ZODIAC_ANIMALS[4]); 
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    
    const saved = localStorage.getItem('user_zodiac');
    if (saved) {
      const found = ZODIAC_ANIMALS.find(z => z.id === saved);
      if (found) setSelectedZodiac(found);
    }
  }, [messages, isOpen]);

  const handleSend = async (text?: string) => {
    const rawInput = text || input.trim();
    if (!rawInput || loading) return;
    
    const normalizedInput = rawInput.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', content: rawInput }]);
    if (!text) setInput('');
    setLoading(true);

    // 1. Caching & Mock Logic (Token Saving)
    const cachedAnswers = JSON.parse(sessionStorage.getItem('ai_cache') || '{}');
    if (cachedAnswers[normalizedInput]) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: cachedAnswers[normalizedInput] }]);
        setLoading(false);
      }, 500);
      return;
    }

    // 2. Teaser Mode for Guests
    if (!user) {
      setTimeout(() => {
        const reply = MOCK_ANSWERS[normalizedInput] || "Câu hỏi rất hay! Nhưng để trả lời chính xác dựa trên túi tiền của bạn, tôi cần bạn đăng nhập trước nhé. Đăng nhập cực nhanh thôi! ✨";
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        setLoading(false);
      }, 800);
      return;
    }

    // 3. Real AI Chat (Optimized Prompt in Backend)
    try {
      const res = await aiApi.chat(rawInput);
      if (res.success && res.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
        // Save to cache
        cachedAnswers[normalizedInput] = res.reply;
        sessionStorage.setItem('ai_cache', JSON.stringify(cachedAnswers));
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Tôi đang bận phân tích số liệu chút. Thử lại sau nhé!' }]);
    } finally {
      setLoading(false);
    }
  };

  const changeZodiac = (z: typeof ZODIAC_ANIMALS[0]) => {
    setSelectedZodiac(z);
    localStorage.setItem('user_zodiac', z.id);
    setShowZodiacMenu(false);
  };

  return (
    <div className="fixed bottom-3 right-4 z-[100] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="w-[340px] h-[460px] bg-[#0F172A]/98 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_10px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className={`p-4 bg-gradient-to-br ${selectedZodiac.color} relative overflow-hidden shrink-0`}>
              <div className="absolute top-0 left-0 w-full h-full bg-white/5 skew-x-[-20deg] translate-x-[-150%] animate-[shine_4s_infinite]" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg overflow-hidden">
                    {selectedZodiac.img ? (
                      <img src={selectedZodiac.img} alt={selectedZodiac.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl drop-shadow-md">{selectedZodiac.emoji}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Nova AI Smart</h3>
                    <p className="text-[8px] text-white/80 font-black uppercase">Trợ lý {selectedZodiac.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowZodiacMenu(!showZodiacMenu)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white"><Settings className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-all text-white"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>

            {/* Zodiac Overlay */}
            <AnimatePresence>
              {showZodiacMenu && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-x-0 top-[72px] z-50 bg-[#1E293B]/95 backdrop-blur-xl border-b border-white/10 p-4 grid grid-cols-4 gap-2">
                  {ZODIAC_ANIMALS.map(z => (
                    <button key={z.id} onClick={() => changeZodiac(z)} className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${selectedZodiac.id === z.id ? 'bg-sky-500/20 border-sky-500/40' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                      {z.img ? <img src={z.img} alt={z.name} className="w-6 h-6 object-cover" /> : <span className="text-base">{z.emoji}</span>}
                      <span className="text-[7px] font-black text-white uppercase">{z.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed shadow-sm ${
                    msg.role === 'user' ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-white/5 text-slate-300 border border-white/5 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-2 rounded-xl flex gap-1 animate-pulse">
                    <div className="w-1 h-1 bg-sky-500 rounded-full" />
                    <div className="w-1 h-1 bg-sky-500 rounded-full" />
                    <div className="w-1 h-1 bg-sky-500 rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Area */}
            <div className="p-3 bg-white/[0.02] border-t border-white/5 space-y-3 shrink-0">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {SUGGESTIONS.map((text, idx) => (
                  <button key={idx} onClick={() => handleSend(text)} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400 hover:text-sky-400 hover:border-sky-500/30 transition-all whitespace-nowrap">
                    {text}
                  </button>
                ))}
              </div>
              <div className="relative flex items-center gap-2">
                <input 
                  type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={user ? "Hỏi bất cứ gì (VD: cp ăn uống, tn tháng này...)" : "Đăng nhập để hỏi Nova AI..."}
                  disabled={!user && messages.length > 3}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-white focus:border-sky-500/50 outline-none transition-all"
                />
                <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        className="pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center group z-10"
      >
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 4 }} className={`absolute inset-0 rounded-full bg-gradient-to-br ${selectedZodiac.color} blur-xl`} />
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${selectedZodiac.color} border-2 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl`}>
          {selectedZodiac.img ? <img src={selectedZodiac.img} alt="AI" className="w-full h-full object-cover scale-110" /> : <span className="text-xl">{selectedZodiac.emoji}</span>}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0F172A] shadow-lg" />
        </div>
      </motion.button>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shine {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
