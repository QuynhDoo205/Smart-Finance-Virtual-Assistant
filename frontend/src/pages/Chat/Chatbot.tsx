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

// ─── Voice Visualizer Animation ──────────────────────────────────────────────
function VoiceVisualizer() {
  return (
    <div className="flex items-center gap-1 h-6 px-1">
      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5].map((scale, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary-500 rounded-full"
          animate={{
            height: [10, 24, 10],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1
          }}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [appTheme, setAppTheme] = useTheme();
  const activeTheme = ['light-tech', 'sakura', 'ocean'].includes(appTheme) ? 'light' : 'dark';
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

      {/* Sidebar - CỐ ĐỊNH CHIỀU CAO (h-full) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0 }} animate={{ width: 320 }} exit={{ width: 0 }}
            className={`h-full flex flex-col shrink-0 border-r border-[var(--theme-subtle-border)] relative z-20 ${activeTheme === 'dark' ? 'bg-theme-bg-panel/80' : 'bg-white shadow-xl'}`}
          >
            <div className="flex flex-col h-full w-[320px]">
              <div className="p-4 shrink-0">
                <button onClick={startNewChat} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-400 font-bold hover:bg-primary-500/20 transition-all">
                  <Plus className="w-5 h-5" /> Chat mới
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                {sessions.map(s => (
                  <button key={s.id} onClick={() => loadSession(s.id)} className={`w-full text-left px-4 py-3 rounded-xl mb-1 text-sm transition-all ${currentSessionId === s.id ? 'bg-primary-500/20 text-primary-400 font-bold' : 'text-theme-text-muted hover:bg-[var(--theme-subtle-bg)]'}`}>
                    <div className="flex items-center gap-3"><MessageSquare className="w-4 h-4 opacity-40" /> <span className="truncate">{s.tieu_de}</span></div>
                  </button>
                ))}
              </div>

              {/* FOOTER SIDEBAR - Cảnh báo hoặc trợ giúp nếu cần */}
              <div className="p-4 shrink-0 border-t border-[var(--theme-subtle-border)]">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Lịch sử chat sẽ được lưu tự động
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Chat Area - CỐ ĐỊNH CHIỀU CAO (h-full) */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className="shrink-0 h-16 border-b border-[var(--theme-subtle-border)] flex items-center px-6 gap-4 bg-transparent backdrop-blur-md z-30">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[var(--theme-subtle-bg)] rounded-full"><Menu className="w-6 h-6" /></button>
          <span className="font-bold text-lg">Nova AI</span>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-3xl mx-auto space-y-8 py-4">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden ${m.role === 'assistant' ? 'bg-primary-500 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold border border-white/10'}`}>
                  {m.role === 'assistant' ? (
                    <Bot className="w-6 h-6" />
                  ) : user?.avatar_url ? (
                    <img 
                      src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_ROOT}${user.avatar_url}`} 
                      alt={user.full_name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-sm">{user?.full_name?.charAt(0) || 'U'}</span>
                  )}
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
            <div className={`flex items-end gap-2 p-2 rounded-[2rem] border transition-all shadow-2xl ${activeTheme === 'dark' ? 'bg-[var(--theme-subtle-bg)] border-[var(--theme-subtle-border)] focus-within:border-primary-500/40' : 'bg-[var(--theme-bg-surface)] border-[var(--theme-border)]'}`}>
              <button onClick={() => fileInputRef.current?.click()} className="p-3.5 hover:bg-[var(--theme-subtle-bg)] rounded-2xl transition-colors"><Camera className="w-6 h-6 text-theme-text-muted" /></button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <div className="flex-1 relative flex items-center min-h-[52px]">
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <motion.div 
                      key="listening"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-4 px-4 w-full"
                    >
                      <VoiceVisualizer />
                      <span className="text-sm font-bold text-primary-400 animate-pulse uppercase tracking-widest">Đang lắng nghe...</span>
                    </motion.div>
                  ) : (
                    <motion.textarea
                      key="input"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      ref={textareaRef} rows={1} value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
                      placeholder="Hỏi Nova về chi tiêu của bạn..."
                      className="w-full bg-transparent border-none outline-none py-3.5 px-2 text-[16px] font-medium text-theme-text-primary resize-none max-h-40"
                    />
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={startVoiceRecognition} 
                className={`p-3.5 rounded-2xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'hover:bg-[var(--theme-subtle-bg)] text-theme-text-muted'}`}
              >
                <Mic className="w-6 h-6" />
              </button>
              <button onClick={handleSendText} disabled={!input.trim()} className={`p-3.5 rounded-2xl transition-all ${input.trim() ? 'bg-primary-500 text-white shadow-lg' : 'opacity-20'}`}><Send className="w-6 h-6" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
