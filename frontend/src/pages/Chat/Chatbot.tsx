import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Sparkles, Scan, X, 
  Camera, Receipt, CheckCircle2, Mic, Paperclip, MoreVertical,
  RefreshCw, Trash2, Calendar, LayoutGrid, Zap, Plus, MessageSquare, 
  Menu, ChevronLeft, User, Settings, HelpCircle, History, ExternalLink,
  ChevronDown, Search, Share2, Image as ImageIcon, AlertTriangle
} from 'lucide-react';
import { aiApi } from '../../utils/api';
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

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appTheme, setAppTheme] = useTheme();
  const activeTheme = appTheme === 'light-tech' ? 'light' : 'dark';
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('nova_primary_color') || '#38bdf8');
  
  const user = authStore.getUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
        const formattedMessages: Message[] = res.data.map((msg, idx) => {
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
      { id: 'welcome', role: 'assistant', content: `Chào ${user?.full_name?.split(' ').pop() || 'bạn'}! Tôi là Nova. Hôm nay tôi có thể giúp gì cho tài chính của bạn?`, timestamp: new Date() }
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
    const userMsg = input;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);
    setIsAiProcessing(true);
    try {
      const res = await aiApi.chat(userMsg, currentSessionId || undefined);
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
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: <img src={imageUrl} className="max-w-[300px] rounded-xl" />, timestamp: new Date() }]);
    setIsScanning(true);
    try {
      const res = await aiApi.scan(file);
      setIsScanning(false);
      if (res.success) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', type: 'card', data: res.data, content: 'Tôi đã quét được hóa đơn của bạn:', timestamp: new Date() }]);
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
    <div className={`flex h-full w-full overflow-hidden bg-transparent`}>
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className={`relative w-full max-w-md p-8 rounded-[2rem] shadow-2xl ${activeTheme === 'dark' ? 'bg-[#1e1f20] border border-white/10' : 'bg-white border border-slate-200'}`}>
               <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-primary-400" /> Cài đặt Nova</h3>
               <button onClick={() => setAppTheme(activeTheme === 'dark' ? 'light-tech' : 'cyberpunk')} className="w-full py-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 font-bold mb-4">
                 Chuyển sang Chế độ {activeTheme === 'dark' ? 'Sáng' : 'Tối'}
               </button>
               <button onClick={() => setShowSettings(false)} className="w-full py-4 rounded-xl bg-primary-500 text-white font-bold">Lưu & Đóng</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar - CỐ ĐỊNH CHIỀU CAO (h-full) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0 }} animate={{ width: 320 }} exit={{ width: 0 }}
            className={`h-full flex flex-col shrink-0 border-r border-white/5 relative z-20 ${activeTheme === 'dark' ? 'bg-theme-bg-panel/80' : 'bg-white shadow-xl'}`}
          >
            <div className="flex flex-col h-full w-[320px]">
              <div className="p-4 shrink-0">
                <button onClick={startNewChat} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 font-bold hover:bg-primary-500/20 transition-all">
                  <Plus className="w-5 h-5" /> Chat mới
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                {sessions.map(s => (
                  <button key={s.id} onClick={() => loadSession(s.id)} className={`w-full text-left px-4 py-3 rounded-xl mb-1 text-sm transition-all ${currentSessionId === s.id ? 'bg-primary-500/20 text-primary-400 font-bold' : 'text-theme-text-muted hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3"><MessageSquare className="w-4 h-4 opacity-40" /> <span className="truncate">{s.tieu_de}</span></div>
                  </button>
                ))}
              </div>

              {/* FOOTER SIDEBAR LUÔN Ở ĐÁY */}
              <div className="p-4 shrink-0 border-t border-white/5">
                <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform"><Settings className="w-5 h-5" /></div>
                  <span className="font-bold text-sm text-theme-text-primary">Cài đặt Nova</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Chat Area - CỐ ĐỊNH CHIỀU CAO (h-full) */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="shrink-0 h-16 border-b border-white/5 flex items-center px-6 gap-4 bg-transparent backdrop-blur-md z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-full"><Menu className="w-6 h-6" /></button>
          <span className="font-bold text-lg">Nova AI</span>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-3xl mx-auto space-y-8 py-4">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${m.role === 'assistant' ? 'bg-primary-500 text-white' : 'bg-white/10'}`}>
                  {m.role === 'assistant' ? <Bot className="w-6 h-6" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`max-w-[80%] ${m.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-5 py-3 rounded-2xl text-[15px] font-medium leading-relaxed ${m.role === 'user' ? 'bg-primary-500 text-white shadow-lg' : 'text-theme-text-primary'}`}>{m.content}</div>
                </div>
              </div>
            ))}
            {isTyping && <div className="animate-pulse flex gap-2"><div className="w-2 h-2 bg-primary-400 rounded-full" /></div>}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT AREA LUÔN Ở ĐÁY CỦA VIEWPORT */}
        <div className="shrink-0 p-6 bg-gradient-to-t from-theme-bg-deep to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className={`flex items-end gap-2 p-2 rounded-[2rem] border transition-all shadow-2xl ${activeTheme === 'dark' ? 'bg-[#1e1f20] border-white/10 focus-within:border-primary-500/40' : 'bg-white border-slate-200'}`}>
              <button onClick={() => fileInputRef.current?.click()} className="p-3.5 hover:bg-white/5 rounded-2xl transition-colors"><Camera className="w-6 h-6 text-theme-text-muted" /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <textarea
                ref={textareaRef} rows={1} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
                placeholder="Hỏi Nova về chi tiêu của bạn..."
                className="flex-1 bg-transparent border-none outline-none py-3.5 px-2 text-[16px] font-medium text-theme-text-primary resize-none max-h-40"
              />
              <button onClick={handleSendText} disabled={!input.trim()} className={`p-3.5 rounded-2xl transition-all ${input.trim() ? 'bg-primary-500 text-white shadow-lg' : 'opacity-20'}`}><Send className="w-6 h-6" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
