import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, Sparkles, User, Bot, ChevronDown, Settings, Maximize2, Plus, History, Trash2, Zap, RefreshCw, Clock, Calendar, ChevronRight } from 'lucide-react';
import { aiApi } from '../../utils/api';
import authStore from '../../store/authStore';

interface ZodiacAnimal {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glow: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ZODIAC_ANIMALS: ZodiacAnimal[] = [
  { id: 'rat', name: 'Tý', emoji: '🐭', color: 'from-slate-400 to-slate-600', glow: 'rgba(148,163,184,0.8)' },
  { id: 'ox', name: 'Sửu', emoji: '🐂', color: 'from-amber-600 to-amber-800', glow: 'rgba(180,83,9,0.8)' },
  { id: 'tiger', name: 'Dần', emoji: '🐅', color: 'from-orange-500 to-red-600', glow: 'rgba(249,115,22,0.8)' },
  { id: 'cat', name: 'Mão', emoji: '🐈', color: 'from-emerald-400 to-teal-600', glow: 'rgba(52,211,153,0.8)' },
  { id: 'dragon', name: 'Thìn', emoji: '🐲', color: 'from-yellow-400 to-amber-600', glow: 'rgba(234,179,8,0.9)' },
  { id: 'snake', name: 'Tỵ', emoji: '🐍', color: 'from-green-500 to-emerald-700', glow: 'rgba(16,185,129,0.8)' },
  { id: 'horse', name: 'Ngọ', emoji: '🐎', color: 'from-red-400 to-orange-600', glow: 'rgba(248,113,113,0.8)' },
  { id: 'goat', name: 'Mùi', emoji: '🐐', color: 'from-stone-300 to-stone-500', glow: 'rgba(168,162,158,0.8)' },
  { id: 'monkey', name: 'Thân', emoji: '🐒', color: 'from-yellow-600 to-orange-700', glow: 'rgba(202,138,4,0.8)' },
  { id: 'rooster', name: 'Dậu', emoji: '🐓', color: 'from-red-500 to-rose-700', glow: 'rgba(239,68,68,0.8)' },
  { id: 'dog', name: 'Tuất', emoji: '🐕', color: 'from-orange-400 to-amber-700', glow: 'rgba(251,146,60,0.8)' },
  { id: 'pig', name: 'Hợi', emoji: '🐖', color: 'from-pink-400 to-rose-500', glow: 'rgba(244,114,182,0.8)' },
];

const SUGGESTIONS = [
  "Phân tích chi tiêu tháng này",
  "Tình hình 6 hũ của tôi",
  "Tôi có thể tiết kiệm thêm không?",
  "Giao dịch gần đây nhất"
];

export default function FloatingAI() {
  const [user, setUser] = useState<any>(authStore.getUser());
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<{ title: string; date: string; messages: Message[] }[]>([]);

  const defaultGreeting = (): Message[] => ([
    { 
      role: 'assistant', 
      content: authStore.getUser() 
        ? `Chào ${authStore.getUser()?.full_name.split(' ').pop()}! Tôi là Nova. Hôm nay tôi có thể giúp gì cho tài chính của bạn ạ?` 
        : 'Chào bạn! Tôi là Nova. Hãy ĐĂNG NHẬP để tôi hỗ trợ bạn tốt nhất nhé!' 
    }
  ]);

  useEffect(() => {
    setMessages(defaultGreeting());
    const savedHistory = localStorage.getItem('chat_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    const unsubscribe = authStore.subscribe((newUser) => { setUser(newUser); });
    return () => unsubscribe();
  }, []);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showZodiacMenu, setShowZodiacMenu] = useState(false);
  const [selectedZodiac, setSelectedZodiac] = useState(ZODIAC_ANIMALS[4]); 
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    const saved = localStorage.getItem('user_zodiac');
    if (saved) {
      const found = ZODIAC_ANIMALS.find(z => z.id === saved);
      if (found) setSelectedZodiac(found);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        const trigger = document.getElementById('ai-trigger-btn');
        if (trigger && trigger.contains(event.target as Node)) return;
        setIsOpen(false);
        setShowZodiacMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const rawInput = text || input.trim();
    if (!rawInput || loading) return;
    
    const userMsg: Message = { role: 'user', content: rawInput };
    setMessages(prev => [...prev, userMsg]);
    if (!text) setInput('');
    setLoading(true);

    try {
      const res = await aiApi.chat(rawInput);
      if (res.success && res.reply) {
        const newAssistantMsg: Message = { role: 'assistant', content: res.reply };
        setMessages(prev => [...prev, newAssistantMsg]);
        
        // Save history even on first response
        const newHistoryItem = { 
          title: rawInput.substring(0, 30) + '...', 
          date: new Date().toISOString(), 
          messages: [...messages, userMsg, newAssistantMsg] 
        };
        const updatedHistory = [newHistoryItem, ...history.filter(h => h.title !== newHistoryItem.title).slice(0, 9)];
        setHistory(updatedHistory);
        localStorage.setItem('chat_history', JSON.stringify(updatedHistory));
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Dạ, hệ thống đang bận. Thử lại sau nhé!' } as Message]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages(defaultGreeting());
    setShowHistory(false);
  };

  const changeZodiac = (z: typeof ZODIAC_ANIMALS[0]) => {
    setSelectedZodiac(z);
    localStorage.setItem('user_zodiac', z.id);
    setShowZodiacMenu(false);
  };

  return (
    <div className="fixed bottom-2 right-4 z-[100] flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 15, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            className="w-[320px] h-[460px] bg-[#010828]/95 backdrop-blur-[40px] border border-white/20 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col pointer-events-auto mb-2"
          >
            {/* Header - Compact */}
            <div className={`p-4 bg-gradient-to-br ${selectedZodiac.color} relative overflow-hidden shrink-0 border-b border-white/10`}>
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-x-[-20deg] translate-x-[-150%] animate-[shine:3s_infinite]" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center border border-white/40 shadow-2xl cursor-pointer group relative overflow-hidden" onClick={() => setShowZodiacMenu(!showZodiacMenu)}>
                    <span className="text-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform duration-500">{selectedZodiac.emoji}</span>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Nova AI</h3>
                    <p className="text-[8px] text-white/70 font-black uppercase tracking-widest">Hộ mệnh {selectedZodiac.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={startNewChat} className="p-1.5 rounded-full bg-white/10 hover:bg-[#00D1FF] hover:text-[#010828] transition-all text-white shadow-lg"><Plus className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setShowHistory(!showHistory)} className={`p-1.5 rounded-full transition-all text-white shadow-lg ${showHistory ? 'bg-[#00D1FF] text-[#010828]' : 'bg-white/10 hover:bg-white/20'}`}><History className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full bg-black/40 hover:bg-rose-500 transition-all text-white shadow-lg"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>

            {/* Zodiac Menu - 3D Spheres */}
            <AnimatePresence>
              {showZodiacMenu && (
                <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="absolute inset-x-0 top-[72px] z-[60] bg-[#010828]/98 backdrop-blur-3xl border-b border-white/10 p-4 grid grid-cols-4 gap-3 shadow-2xl">
                  {ZODIAC_ANIMALS.map(z => (
                    <button key={z.id} onClick={() => changeZodiac(z)} className={`group relative flex flex-col items-center gap-1.5 p-0.5 transition-all ${selectedZodiac.id === z.id ? 'scale-110' : 'hover:scale-105'}`}>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${z.color} p-[1px] shadow-lg shadow-black/50 group-hover:shadow-[#00D1FF]/40 transition-all`}>
                        <div className="w-full h-full rounded-full bg-[#010828] flex items-center justify-center relative overflow-hidden">
                           <span className="text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-10">{z.emoji}</span>
                           <div className={`absolute inset-0 bg-gradient-to-br ${z.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                        </div>
                      </div>
                      <span className="text-[7px] font-black text-white/60 group-hover:text-white uppercase tracking-tighter">{z.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium History Overlay */}
            <AnimatePresence>
              {showHistory && (
                <motion.div 
                  initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                  className="absolute inset-0 z-[80] bg-[#010828]/95 backdrop-blur-3xl flex flex-col overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#00D1FF]/10 to-transparent pointer-events-none" />
                  <div className="p-6 pt-16 flex-1 flex flex-col relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-[#00D1FF] rounded-full shadow-[0_0_10px_#00D1FF]" />
                        <h4 className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Hệ thống lịch sử</h4>
                      </div>
                      <button onClick={() => setShowHistory(false)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-[#00D1FF]/40 transition-all"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
                          <Clock className="w-16 h-16 stroke-[1px]" />
                          <p className="text-[10px] uppercase font-black tracking-[0.5em] text-center">Data Empty</p>
                        </div>
                      ) : (
                        history.map((item, i) => (
                          <motion.button 
                            key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            onClick={() => { setMessages(item.messages); setShowHistory(false); }} 
                            className="w-full group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00D1FF]/0 to-[#00D1FF]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:border-[#00D1FF]/30 transition-all flex items-center justify-between">
                              <div className="flex flex-col gap-1 text-left min-w-0">
                                <span className="text-[11px] font-bold text-white/90 truncate group-hover:text-[#00D1FF] transition-colors uppercase tracking-tight">{item.title}</span>
                                <div className="flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                                   <Calendar className="w-2.5 h-2.5" />
                                   <span className="text-[8px] font-black uppercase tracking-tighter">{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-[#00D1FF] transition-all group-hover:translate-x-1" />
                            </div>
                          </motion.button>
                        ))
                      )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                       <button onClick={() => { setHistory([]); localStorage.removeItem('chat_history'); }} className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all">Xóa tất cả</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-3xl text-[12px] font-bold leading-relaxed shadow-xl ${
                    msg.role === 'user' ? 'bg-[#00D1FF] text-[#010828] rounded-tr-none' : 'bg-[#0F172A] text-white border border-white/10 rounded-tl-none shadow-black/40'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 p-2.5 rounded-2xl flex gap-1 animate-pulse border border-white/5"><div className="w-1.5 h-1.5 bg-[#00D1FF] rounded-full" /><div className="w-1.5 h-1.5 bg-[#00D1FF] rounded-full" /><div className="w-1.5 h-1.5 bg-[#00D1FF] rounded-full" /></div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="px-4 py-1.5 overflow-x-auto no-scrollbar flex gap-2 shrink-0 border-t border-white/5 bg-white/[0.02]">
               {SUGGESTIONS.map((text, idx) => (
                 <button key={idx} onClick={() => handleSend(text)} className="whitespace-nowrap px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[8px] font-black text-white/40 hover:text-[#00D1FF] hover:border-[#00D1FF]/40 transition-all uppercase tracking-wider">
                   {text}
                 </button>
               ))}
            </div>

            {/* Footer Area - Rực sáng */}
            <div className="p-4 bg-white/[0.03] border-t border-white/10 space-y-3 shrink-0">
              <div className="relative flex items-center gap-2">
                <input 
                  type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Hỏi Nova AI..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[12px] text-white font-bold placeholder:text-white/10 focus:border-[#00D1FF]/40 outline-none transition-all shadow-inner"
                />
                <button 
                  onClick={() => handleSend()} 
                  disabled={loading || !input.trim()} 
                  className={`w-10 h-10 rounded-xl bg-[#00D1FF] text-[#010828] flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(0,209,255,0.4)] ${
                    input.trim() 
                      ? 'opacity-100 scale-100 shadow-[0_0_20px_#00D1FF]' 
                      : 'text-[#010828] opacity-80 scale-95'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button - COMPACT & ROUND */}
      <motion.button
        id="ai-trigger-btn"
        onClick={() => setIsOpen(!isOpen)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="pointer-events-auto relative w-14 h-14 group z-10"
      >
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} 
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
          className={`absolute inset-[-8px] rounded-full bg-gradient-to-br ${selectedZodiac.color} blur-xl opacity-40`} 
        />
        
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${selectedZodiac.color} p-[1.5px] shadow-2xl`}>
          <div className="w-full h-full rounded-full bg-[#010828] flex items-center justify-center relative overflow-hidden">
            <span className="text-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] group-hover:scale-110 transition-transform duration-500 z-10">{selectedZodiac.emoji}</span>
            <div className={`absolute inset-0 bg-gradient-to-br ${selectedZodiac.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 skew-x-[-30deg] translate-x-[-150%] group-hover:animate-[shine_1.5s_infinite]" />
          </div>
        </div>

        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#00D1FF] rounded-full border-[3px] border-[#010828] shadow-[0_0_12px_#00D1FF]" />
      </motion.button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shine { 0% { transform: translateX(-150%) skewX(-30deg); } 100% { transform: translateX(250%) skewX(-30deg); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,209,255,0.2); border-radius: 10px; }
      `}} />
    </div>
  );
}
