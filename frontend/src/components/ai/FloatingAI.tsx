import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, Sparkles, User, Bot, ChevronDown, Settings, Maximize2, Plus, History, Trash2, Zap, RefreshCw, Clock, Calendar, ChevronRight, TrendingUp, PieChart, ShieldCheck, LineChart, Target, Compass, Briefcase, Activity } from 'lucide-react';
import { aiApi } from '../../utils/api';
import authStore from '../../store/authStore';

interface AIPersona {
  id: string;
  name: string;
  role: string;
  icon: any;
  color: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AI_PERSONAS: AIPersona[] = [
  { id: 'orbis', name: 'Orbis', role: 'Trợ lý Tổng hợp', icon: Bot, color: 'from-[#00D1FF] to-[#0077FF]' },
  { id: 'nova', name: 'Nova', role: 'Chuyên gia Tăng trưởng', icon: TrendingUp, color: 'from-emerald-400 to-teal-600' },
  { id: 'aura', name: 'Aura', role: 'Cố vấn Cắt giảm', icon: PieChart, color: 'from-rose-400 to-red-600' },
  { id: 'nexus', name: 'Nexus', role: 'Chuyên gia Rủi ro', icon: ShieldCheck, color: 'from-amber-400 to-orange-600' },
  { id: 'zenith', name: 'Zenith', role: 'Phân tích Đầu tư', icon: LineChart, color: 'from-purple-500 to-indigo-600' },
  { id: 'lyra', name: 'Lyra', role: 'Định hướng Tương lai', icon: Compass, color: 'from-pink-400 to-rose-500' },
  { id: 'atlas', name: 'Atlas', role: 'Cố vấn Danh mục', icon: Briefcase, color: 'from-stone-400 to-slate-600' },
  { id: 'pulse', name: 'Pulse', role: 'Theo dõi Dòng tiền', icon: Activity, color: 'from-cyan-400 to-blue-600' },
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
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(AI_PERSONAS[0]); 
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef<{ text: string, time: number }>({ text: '', time: 0 });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    const saved = localStorage.getItem('user_persona');
    if (saved) {
      const found = AI_PERSONAS.find(p => p.id === saved);
      if (found) setSelectedPersona(found);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isOpen && chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node)) {
        const trigger = document.getElementById('ai-trigger-btn');
        if (trigger && trigger.contains(event.target as Node)) return;
        setIsOpen(false);
        setShowPersonaMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const rawInput = text || input.trim();
    if (!rawInput || loading) return;

    // Chống trùng lặp (Debounce) cho Chatbot thu nhỏ
    const now = Date.now();
    if (rawInput === lastSentRef.current.text && (now - lastSentRef.current.time) < 3000) {
      console.warn("Chặn tin nhắn trùng lặp ở Floating AI.");
      return;
    }
    lastSentRef.current = { text: rawInput, time: now };
    
    const userMsg: Message = { role: 'user', content: rawInput };
    setMessages(prev => [...prev, userMsg]);
    if (!text) setInput('');
    setLoading(true);

    // Xử lý khi chưa đăng nhập (Mock AI Data thông minh)
    if (!user) {
      setTimeout(() => {
        const textLower = rawInput.toLowerCase();
        let reply = "";

        if (textLower.includes("chào") || textLower.includes("hi ") || textLower.includes("hello")) {
          reply = "Chào bạn! 👋 Tôi là Orbis - Trợ lý tài chính AI. Rất vui được gặp bạn! Để tôi có thể giúp bạn tối ưu hóa dòng tiền, vui lòng **Đăng nhập** nhé! ✨";
        } 
        else if (textLower.includes("6 hũ") || textLower.includes("6 hu") || textLower.includes("sáu hũ") || textLower.includes("sau hu")) {
          reply = "Theo phương pháp JARS, thu nhập nên chia thành: 55% Thiết yếu, 10% Tiết kiệm, 10% Giáo dục... Để xem số dư thực tế từng hũ của bạn đang ở mức nào, vui lòng **Tạo tài khoản / Đăng nhập** để tôi tính toán giúp nha! 💰";
        } 
        else if (textLower.includes("chi tiêu") || textLower.includes("tieu") || textLower.includes("xài")) {
          reply = "Phân tích chi tiêu cần dựa trên lịch sử giao dịch thực tế. Để tôi có thể vẽ biểu đồ dòng tiền và tìm ra khoản chi 'lãng phí' nhất của bạn, hãy **Đăng nhập** ngay nhé! 📊";
        } 
        else if (textLower.includes("tiết kiệm") || textLower.includes("tiet kiem") || textLower.includes("dư")) {
          reply = "Tôi có thể mô phỏng các chiến lược cắt giảm chi phí để giúp bạn tiết kiệm thêm 15-20% mỗi tháng! Nhưng tính năng AI tính toán chuyên sâu này yêu cầu dữ liệu cá nhân. Vui lòng **Đăng ký / Đăng nhập** để trải nghiệm sức mạnh thực sự! 🚀";
        } 
        else if (textLower.includes("giao dịch") || textLower.includes("giao dich") || textLower.includes("gd")) {
          reply = "Tôi có khả năng truy xuất và phân tích hàng ngàn giao dịch của bạn chỉ trong vài giây. Tuy nhiên, hiện tại tôi chưa biết bạn là ai 😅. Vui lòng **Đăng nhập** để tôi cấp quyền truy cập dữ liệu nhé! 🔒";
        } 
        else {
          const defaultReplies = [
            `Câu hỏi "${rawInput}" của bạn rất hay! Tính năng phân tích AI nâng cao này yêu cầu truy cập dữ liệu cá nhân. Hãy **Đăng nhập/Đăng ký** để tôi trở thành trợ lý đắc lực của riêng bạn nhé! 💎`,
            "Dạ, đây là bản xem trước của hệ thống. Để tôi trả lời chính xác câu hỏi này dựa trên tình hình tài chính của bạn, vui lòng **Đăng nhập** nhé! ✨",
            "Tôi rất muốn phân tích chuyên sâu cho bạn, nhưng hệ thống cần bạn **Tạo tài khoản** để cá nhân hóa dữ liệu nha! 🚀"
          ];
          reply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
        }

        setMessages(prev => [...prev, { role: 'assistant', content: reply } as Message]);
        setLoading(false);
      }, 1000 + Math.random() * 800); // Giả lập thời gian AI "suy nghĩ" ngẫu nhiên từ 1s - 1.8s
      return;
    }

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

  const changePersona = (p: typeof AI_PERSONAS[0]) => {
    setSelectedPersona(p);
    localStorage.setItem('user_persona', p.id);
    setShowPersonaMenu(false);
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
            <div className={`p-4 bg-gradient-to-br ${selectedPersona.color} relative overflow-hidden shrink-0 border-b border-white/10`}>
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-x-[-20deg] translate-x-[-150%] animate-[shine:3s_infinite]" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#010828]/50 backdrop-blur-2xl flex items-center justify-center border border-white/20 shadow-2xl cursor-pointer group relative overflow-hidden" onClick={() => setShowPersonaMenu(!showPersonaMenu)}>
                    <selectedPersona.icon className="w-5 h-5 text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-black text-white uppercase tracking-widest">{selectedPersona.name} AI</h3>
                    <p className="text-[9px] text-white/80 font-bold uppercase tracking-widest">{selectedPersona.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={startNewChat} className="p-1.5 rounded-full bg-white/10 hover:bg-white hover:text-[#010828] transition-all text-white shadow-lg"><Plus className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setShowHistory(!showHistory)} className={`p-1.5 rounded-full transition-all shadow-lg ${showHistory ? 'bg-white text-[#010828]' : 'bg-white/10 text-white hover:bg-white/20'}`}><History className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full bg-black/40 hover:bg-rose-500 transition-all text-white shadow-lg"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>

            {/* Persona Menu - 3D Spheres */}
            <AnimatePresence>
              {showPersonaMenu && (
                <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="absolute inset-x-0 top-[72px] z-[60] bg-[#010828]/98 backdrop-blur-3xl border-b border-white/10 p-4 grid grid-cols-4 gap-3 shadow-2xl">
                  {AI_PERSONAS.map(p => (
                    <button key={p.id} onClick={() => changePersona(p)} className={`group relative flex flex-col items-center gap-1.5 p-1 transition-all ${selectedPersona.id === p.id ? 'scale-110' : 'hover:scale-105'}`}>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.color} p-[1px] shadow-lg shadow-black/50 group-hover:shadow-white/20 transition-all`}>
                        <div className="w-full h-full rounded-full bg-[#010828] flex items-center justify-center relative overflow-hidden">
                           <p.icon className="w-4 h-4 text-white z-10" />
                           <div className={`absolute inset-0 bg-gradient-to-br ${p.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                        </div>
                      </div>
                      <span className="text-[7px] font-black text-white/60 group-hover:text-white uppercase tracking-tighter text-center">{p.name}</span>
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
                  {msg.role === 'assistant' && (
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${selectedPersona.color} flex items-center justify-center shrink-0 shadow-lg`}>
                      <selectedPersona.icon className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3.5 rounded-2xl text-[12px] leading-relaxed shadow-xl whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-[#00D1FF] text-[#010828] font-bold rounded-br-sm' : 'bg-white/5 backdrop-blur-md text-[#EFF4FF] border border-white/10 rounded-bl-sm shadow-black/40'
                  }`}>
                    {msg.role === 'assistant' ? (
                      // Parse markdown bold text
                      <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#00D1FF] font-black">$1</strong>') }} />
                    ) : (
                      msg.content
                    )}
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
          className={`absolute inset-[-8px] rounded-full bg-gradient-to-br ${selectedPersona.color} blur-xl opacity-40`} 
        />
        
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${selectedPersona.color} p-[1.5px] shadow-2xl`}>
          <div className="w-full h-full rounded-full bg-[#010828] flex items-center justify-center relative overflow-hidden">
            <selectedPersona.icon className="w-6 h-6 text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500 z-10" />
            <div className={`absolute inset-0 bg-gradient-to-br ${selectedPersona.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
            <div className="absolute top-0 left-0 w-full h-full bg-white/20 skew-x-[-30deg] translate-x-[-150%] group-hover:animate-[shine_1.5s_infinite]" />
          </div>
        </div>

        <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[3px] border-[#010828] shadow-[0_0_12px_#34d399]" />
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
