import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Sparkles, Scan, X, 
  Camera, Receipt, CheckCircle2, Mic, Paperclip, MoreVertical,
  RefreshCw, Trash2, Calendar, LayoutGrid, Zap, Plus, MessageSquare, 
  Menu, ChevronLeft, User, Settings, HelpCircle, History, ExternalLink,
  ChevronDown, Search, Share2, Image as ImageIcon, AlertTriangle
} from 'lucide-react';
import { aiApi, API_ROOT } from '../../utils/api';
import authStore from '../../store/authStore';
import { useTheme } from '../../store/themeStore';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string | React.ReactNode;
  type?: 'text' | 'image' | 'card';
  data?: any;
  timestamp: Date;
}

interface ChatSession {
  id: number;
  tieu_de: string;
  ngay_cap_nhat: string;
}

function VoiceVisualizer() {
  return (
    <div className="flex items-center gap-1 h-6 px-1">
      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5].map((scale, i) => (
        <motion.div
          key={i}
          className="w-1 bg-[#00D1FF] rounded-full"
          animate={{ height: [10, 24, 10], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('chatbot_sidebar_open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('chatbot_sidebar_open', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const user = authStore.getUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lastSentRef = useRef<{ text: string, time: number }>({ text: '', time: 0 });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const fetchSessions = async () => {
    try {
      const res = await aiApi.getSessions();
      if (res.success) setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const loadSession = async (sessionId: number) => {
    setIsLoadingHistory(true);
    setCurrentSessionId(sessionId);
    try {
      const res = await aiApi.getHistory(sessionId);
      if (res.success) {
        const formattedMessages: Message[] = res.data.map((msg: any, idx: number) => {
          const parsedData = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          return {
            id: `hist-${idx}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            data: parsedData,
            type: parsedData ? 'card' : 'text'
          };
        });
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
      setTimeout(() => scrollToBottom("auto"), 100);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setMessages([
      { id: 'welcome', role: 'assistant', content: `Dạ chào ${user?.full_name?.split(' ').pop() || 'bạn'}! Tôi là Nova. Hôm nay tôi có thể giúp gì cho tài chính của bạn ạ?`, timestamp: new Date() }
    ]);
  };

  useEffect(() => {
    if (messages.length === 0 && !currentSessionId) startNewChat();
  }, [currentSessionId]);

  useEffect(() => {
    if (!isLoadingHistory) scrollToBottom();
  }, [messages, isTyping, isScanning, isLoadingHistory, scrollToBottom]);

  const handleSendText = async () => {
    if (!input.trim() || isAiProcessing) return;
    
    // Chống trùng lặp (Debounce): Nếu nội dung giống hệt và cách nhau dưới 3s thì bỏ qua
    const now = Date.now();
    if (input.trim() === lastSentRef.current.text && (now - lastSentRef.current.time) < 3000) {
      console.warn("Trùng lặp tin nhắn, đã chặn để tránh tạo giao dịch kép.");
      return;
    }
    
    lastSentRef.current = { text: input.trim(), time: now };
    const userMsg = input;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);
    setIsAiProcessing(true);
    const currentDate = new Date();
    const localISO = currentDate.getFullYear() + '-' + 
                     String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(currentDate.getDate()).padStart(2, '0') + 'T' + 
                     String(currentDate.getHours()).padStart(2, '0') + ':' + 
                     String(currentDate.getMinutes()).padStart(2, '0') + ':' + 
                     String(currentDate.getSeconds()).padStart(2, '0') + '+07:00';
    try {
      // Ép AI dùng định dạng đầy đủ ngày giờ để tránh mất dữ liệu và lệch ngày
      const contextMsg = `[Hệ thống: Hiện tại là ${localISO}. Hãy luôn trả về trường date theo định dạng ISO 8601 kèm múi giờ, ví dụ: ${localISO}] ${userMsg}`;
      const res = await aiApi.chat(contextMsg, currentSessionId || undefined);
      setIsTyping(false);
      if (res.success) {
        if (!currentSessionId) { setCurrentSessionId(res.sessionId); fetchSessions(); }
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: res.reply, timestamp: new Date(), data: res.data, type: res.data ? 'card' : 'text' }]);
      }
    } catch (err: any) {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `⚠️ Lỗi: ${err.message}`, timestamp: new Date() }]);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isScanning) return;
    const imageUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: <img src={imageUrl} className="max-w-[280px] rounded-2xl border border-white/10 shadow-2xl" />, timestamp: new Date() }]);
    setIsScanning(true);
    try {
      const res = await aiApi.scan(file);
      setIsScanning(false);
      if (res.success) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', type: 'card', data: res.data, content: 'Dạ, tôi đã quét được hóa đơn của bạn:', timestamp: new Date() }]);
      }
    } catch {
      setIsScanning(false);
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => setInput(prev => prev + ' ' + e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--theme-bg-deep)] font-sans selection:bg-primary-500/30">

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="h-full flex flex-col shrink-0 border-r border-[var(--theme-subtle-border)] relative z-20 bg-[var(--theme-glass-bg)] backdrop-blur-3xl"
          >
            <div className="flex flex-col h-full w-[280px]">
              <div className="p-5 shrink-0">
                <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 text-black font-black uppercase text-xs tracking-widest hover:bg-white transition-all shadow-lg group">
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Chat mới
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
                <p className="px-4 mb-4 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Hội thoại của bạn</p>
                {sessions.map(s => (
                  <button key={s.id} onClick={() => loadSession(s.id)} className={`w-full text-left px-4 py-3 rounded-xl mb-1.5 text-xs transition-all font-bold group ${currentSessionId === s.id ? 'bg-[var(--theme-subtle-bg)] text-primary-400 font-black' : 'text-theme-text-muted hover:bg-[var(--theme-subtle-bg)] hover:text-theme-text-primary'}`}>
                    <div className="flex items-center gap-3">
                      <MessageSquare className={`w-3.5 h-3.5 ${currentSessionId === s.id ? 'text-primary-400' : 'text-theme-text-muted'}`} /> 
                      <span className="truncate tracking-tight">{s.tieu_de}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-[var(--theme-bg-deep)] via-[var(--theme-bg-surface)] to-[var(--theme-bg-deep)]">
        
        {/* Header */}
        <header className="shrink-0 h-16 border-b border-[var(--theme-subtle-border)] flex items-center px-6 gap-4 bg-[var(--theme-glass-bg)] backdrop-blur-2xl z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[var(--theme-subtle-bg)] rounded-lg transition-all text-theme-text-muted hover:text-theme-text-primary"><Menu className="w-5 h-5" /></button>
          <div className="flex flex-col">
             <span className="font-black text-sm uppercase tracking-[0.2em] text-theme-text-primary">Nova AI Smart</span>
             <span className="text-[8px] text-primary-400 font-black uppercase tracking-[0.5em]">Quantum Finance Assistant</span>
          </div>
        </header>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <div className="max-w-3xl mx-auto space-y-10">
            {messages.map(m => (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} key={m.id} className={`flex gap-5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden shadow-2xl ${m.role === 'assistant' ? 'bg-primary-500 text-black' : 'bg-white/10 border border-white/10 text-theme-text-primary font-black'}`}>
                  {m.role === 'assistant' ? <Bot className="w-6 h-6" /> : <span className="text-sm">{user?.full_name?.charAt(0) || 'U'}</span>}
                </div>
                <div className={`max-w-[85%] lg:max-w-[70%] ${m.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-5 py-3.5 rounded-2xl text-[15px] font-bold leading-relaxed shadow-2xl ${
                    m.role === 'user' 
                      ? 'bg-primary-500 text-black rounded-tr-none' 
                      : 'bg-[var(--theme-bg-surface)] text-theme-text-primary border border-[var(--theme-subtle-border)] rounded-tl-none shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]'
                  }`}>
                    {m.content}
                  </div>
                  <p className="text-[8px] text-white/20 mt-2 font-black uppercase tracking-widest">{new Date(m.timestamp).toLocaleTimeString()}</p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex gap-4 items-center">
                 <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center animate-pulse"><Bot className="w-5 h-5 text-primary-400" /></div>
                 <div className="flex gap-1"><div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" /><div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce delay-75" /><div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce delay-150" /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="shrink-0 p-6 bg-gradient-to-t from-[var(--theme-bg-deep)] to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 p-2 rounded-2xl bg-[var(--theme-glass-bg)] backdrop-blur-3xl border border-[var(--theme-subtle-border)] focus-within:border-primary-500/40 shadow-2xl transition-all">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-[var(--theme-subtle-bg)] rounded-xl transition-all group"><Camera className="w-5 h-5 text-theme-text-muted group-hover:text-primary-400" /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              
              <div className="flex-1 relative flex items-center min-h-[44px]">
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <div className="flex items-center gap-4 px-4 w-full">
                      <VoiceVisualizer />
                      <span className="text-[10px] font-black text-primary-400 animate-pulse uppercase tracking-[0.3em]">Đang lắng nghe...</span>
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef} rows={1} value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
                      placeholder="Hỏi Nova về chi tiêu của bạn..."
                      className="w-full bg-transparent border-none outline-none py-2.5 px-2 text-[15px] font-bold text-theme-text-primary placeholder:text-theme-text-muted resize-none max-h-32"
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-1.5 pr-1">
                <button 
                  onClick={startVoiceRecognition} 
                  className={`p-3 rounded-xl transition-all ${isListening ? 'bg-rose-500 text-white' : 'hover:bg-white/5 text-white/30'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSendText} 
                  disabled={!input.trim()} 
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    input.trim() 
                      ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20 opacity-100 scale-100' 
                      : 'text-primary-400 opacity-30 scale-90'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="mt-4 text-center text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">Nova AI Smart • Secure Quantum Finance</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(56,189,248,0.3); }
        ::placeholder { color: var(--theme-text-muted) !important; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; font-size: 10px; }
      `}} />
    </div>
  );
}
