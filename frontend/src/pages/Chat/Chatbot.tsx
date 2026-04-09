import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User as UserIcon, Sparkles, FileText, Scan, X, Camera, Receipt, CheckCircle2 } from 'lucide-react';

export default function Chatbot() {
  
  // Message structure: text or custom React node for rich cards
  const [messages, setMessages] = useState<{id: string, role: 'assistant' | 'user', content: string | React.ReactNode, type?: 'text' | 'image'}[]>([
    { id: '1', role: 'assistant', content: 'Xin chào! Tôi là Nova AI. Trợ lý tài chính cá nhân của bạn. Bạn muốn tôi giúp ghi chép khoản chi nào hôm nay? (Ví dụ: Nhập "Nay đổ xăng 50k" hoặc upload ảnh hóa đơn)' }
  ]);
  const [input, setInput] = useState('');
  
  // States for UX
  const [isScanning, setIsScanning] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Entry States
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCategory, setManualCategory] = useState('Ăn uống');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isScanning]);

  // 1. Trợ lý ảo Chatbot: Nhắn tin tự nhiên
  const handleSendText = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { id: Math.random().toString(), role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        id: Math.random().toString(),
        role: 'assistant', 
        content: `Tôi đã phân tích lệnh: "${userMsg}". Quỹ tiền tương ứng đã được tự động trừ! 💸` 
      }]);
    }, 1500);
  };

  // 2. Quét hóa đơn bằng AI
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    
    setMessages(prev => [...prev, {
      id: Math.random().toString(),
      role: 'user',
      content: (
        <div className="flex flex-col gap-2">
          <img src={imageUrl} alt="Hóa đơn" className="max-w-[240px] max-h-[320px] object-cover rounded-2xl border-2 border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)]" />
        </div>
      ),
      type: 'image'
    }]);

    setIsScanning(true);

    // Mock API processing time
    setTimeout(() => {
      setIsScanning(false);
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          id: Math.random().toString(),
          role: 'assistant', 
          content: (
            <div className="space-y-4 relative z-10 w-full min-w-[260px] md:min-w-[320px]">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                 <p className="flex items-center gap-2 text-emerald-400 font-bold"><CheckCircle2 className="w-5 h-5"/> Trích xuất AI thành công</p>
                 <Sparkles className="w-4 h-4 text-emerald-500/50" />
              </div>
              
              <div className="bg-gradient-to-br from-[#111827]/80 to-[#1F2937]/80 rounded-2xl p-5 border border-emerald-500/20 shadow-[0_4px_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex justify-between border-b border-white/5 pb-3 mb-3 text-sm relative z-10">
                  <span className="text-gray-400">Đơn vị thanh toán</span>
                  <strong className="text-white text-right">Lotte Mart Vietnam</strong>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3 mb-3 text-sm relative z-10">
                  <span className="text-gray-400">Danh mục AI Map</span>
                  <strong className="text-sky-400 text-right bg-sky-500/10 px-2 py-0.5 rounded">🛒 Siêu thị / Đồ dùng</strong>
                </div>
                <div className="flex justify-between items-center text-sm relative z-10 pt-1">
                  <span className="text-gray-400 font-medium">Tổng thanh toán</span>
                  <strong className="text-emerald-400 text-2xl font-black drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">345.000đ</strong>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed italic">Khoản chi này đã được tự động lưu vào hệ thống và trừ vào quỹ.</p>
            </div>
          ) 
        }]);
      }, 1000);
    }, 2500);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 3. Ghi chép thủ công
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAmount || !manualDesc) return;
    
    setShowManualForm(false);
    
    const formattedAmount = new Intl.NumberFormat('vi-VN').format(Number(manualAmount.replace(/\D/g, '')));
    
    setMessages(prev => [...prev, { 
      id: Math.random().toString(),
      role: 'user', 
      content: (
        <div className="flex items-center gap-3">
           <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-white" />
           </div>
           <div>
              <p className="text-white font-bold">{formattedAmount}đ <span className="text-gray-300 font-normal">cho</span> {manualDesc}</p>
              <p className="text-xs text-gray-400 bg-black/20 inline-block px-2 py-0.5 mt-1 rounded">{manualCategory}</p>
           </div>
        </div>
      )
    }]);
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        id: Math.random().toString(),
        role: 'assistant', 
        content: `Đã tự động cộng/trừ khoản chi ${formattedAmount}đ! Dữ liệu của bạn đã được cập nhật. 📝` 
      }]);
      
      setManualAmount('');
      setManualDesc('');
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto pb-4 relative">
      
      {/* Background Decorators */}
      <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 px-4 z-10">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 flex items-center gap-3 drop-shadow-lg">
            Nova AI
            <span className="flex h-3 w-3 relative mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,1)]"></span>
            </span>
          </h1>
          <p className="text-sm text-primary-200/60 mt-1 font-medium tracking-wide pb-1">Tự động nhận diện biên lai & truy vấn chi tiêu</p>
        </div>
      </motion.div>

      {/* Chat Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="flex-1 glass-panel rounded-[2rem] overflow-hidden flex flex-col relative border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10 bg-[#0B0F19]/40 backdrop-blur-2xl"
      >
        
        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar relative z-10">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl relative ${
                  msg.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-primary-500 to-emerald-500'
                }`}>
                  {msg.role === 'assistant' && <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl" />}
                  {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-white relative z-10" /> : <Bot className="w-6 h-6 text-white relative z-10" />}
                </div>
                
                <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-[2rem] relative shadow-2xl ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-indigo-500/90 to-purple-600/90 text-white rounded-tr-sm border border-white/10 backdrop-blur-md' 
                    : 'bg-[#1F2937]/60 backdrop-blur-xl border border-white/10 text-gray-100 rounded-tl-sm'
                }`}>
                  {typeof msg.content === 'string' ? <p className="leading-relaxed whitespace-pre-wrap text-[15px]">{msg.content}</p> : msg.content}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary-500 to-emerald-500 shadow-2xl relative">
                   <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl" />
                  <Bot className="w-6 h-6 text-white relative z-10" />
                </div>
                <div className="bg-[#1F2937]/60 backdrop-blur-xl p-5 rounded-[2rem] rounded-tl-sm border border-white/10 flex items-center gap-2 h-[60px]">
                  <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(56,189,248,0.8)]" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(56,189,248,0.8)]" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(56,189,248,0.8)]" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-[#0B0F19]/80 backdrop-blur-2xl border-t border-white/5 relative z-20">
          
          {/* Scanning Indicator Overlay */}
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="absolute bottom-full left-4 bg-gradient-to-r from-[#111827] to-[#1F2937] border border-primary-500/40 rounded-3xl p-5 mb-6 shadow-[0_10px_40px_rgba(56,189,248,0.25)] flex items-center gap-5 z-20 backdrop-blur-xl"
              >
                <div className="relative w-16 h-16 bg-black/50 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner">
                  <Receipt className="w-8 h-8 text-primary-500/30" />
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-[2px] bg-primary-400 shadow-[0_0_15px_#38bdf8] z-10"
                  />
                  <div className="absolute inset-0 bg-primary-500/10 animate-pulse" />
                </div>
                <div className="pr-8">
                  <p className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-sky-300 flex items-center gap-2">
                    <Scan className="w-4 h-4 animate-[spin_3s_linear_infinite] text-primary-400" /> AI Đang xử lý biên lai...
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Việc bóc tách dữ liệu đang diễn ra.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-center gap-2 md:gap-3">
            {/* Hidden File Input */}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 flex items-center justify-center rounded-[1.25rem] bg-[#1F2937] hover:bg-gradient-to-br hover:from-primary-500/20 hover:to-indigo-500/20 border border-white/5 hover:border-primary-500/30 text-gray-400 hover:text-primary-300 transition-all relative group shadow-lg"
            >
              <Camera className="w-6 h-6" />
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#111827] text-xs px-3 py-1.5 flex items-center gap-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-xl font-medium"><Sparkles className="w-3 h-3 text-primary-400"/> Quét Hóa đơn AI</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowManualForm(true)}
              className="w-14 h-14 flex items-center justify-center rounded-[1.25rem] bg-[#1F2937] hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-teal-500/20 border border-white/5 hover:border-emerald-500/30 text-gray-400 hover:text-emerald-400 transition-all group relative shadow-lg"
            >
              <FileText className="w-6 h-6" />
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#111827] text-xs px-3 py-1.5 flex items-center gap-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-xl font-medium">Nhập thủ công</span>
            </motion.button>
            
            <div className="flex-1 relative group">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendText()}
                  placeholder="Gõ lệnh: 'Nay đi dạo hết 100k'..."
                  className="w-full bg-[#1F2937]/50 backdrop-blur-md border border-white/10 group-hover:border-white/20 rounded-[1.25rem] pl-6 pr-16 py-4 md:py-4 h-14 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500 transition-all text-sm md:text-base font-medium shadow-inner"
                />
                
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleSendText}
                  disabled={!input.trim()}
                  className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white disabled:opacity-0 disabled:scale-50 transition-all font-bold shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Manual Entry Modal - Fully redesigned, ultra premium */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-[#1F2937]/90 to-[#111827]/90 p-8 rounded-[2.5rem] w-full max-w-md relative border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Decorative blobs */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-[50px] pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-teal-500/20 rounded-full blur-[50px] pointer-events-none" />

              <button 
                onClick={() => setShowManualForm(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <FileText className="w-7 h-7 text-emerald-400" />
                  </div>
                  
                  <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                    Ghi Chép Giao Dịch
                  </h2>
                  <p className="text-gray-400 text-sm mb-8">Điền thông tin khoản chi để Nova AI phân tích lưu trữ.</p>
                  
                  <form onSubmit={handleManualSubmit} className="space-y-5">
                    <div className="group">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 group-focus-within:text-emerald-400 transition-colors">Số tiền (VNĐ)</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        className="w-full bg-black/20 border-b-2 border-white/10 focus:border-emerald-500 outline-none text-3xl font-black text-white py-2 transition-colors placeholder-gray-700"
                        placeholder="0"
                        value={manualAmount}
                        onChange={(e) => {
                          const numericStr = e.target.value.replace(/\D/g, '');
                          setManualAmount(numericStr ? new Intl.NumberFormat('vi-VN').format(Number(numericStr)) : '');
                        }}
                      />
                    </div>

                    <div className="group">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 group-focus-within:text-emerald-400 transition-colors">Chi tiết</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-black/20 border border-white/10 focus:border-emerald-500/50 rounded-xl outline-none text-white px-4 py-3 transition-colors placeholder-gray-600 focus:bg-emerald-500/5"
                        placeholder="VD: Cà phê Highland..."
                        value={manualDesc}
                        onChange={e => setManualDesc(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Phân loại</label>
                      <select 
                        className="w-full bg-black/20 border border-white/10 focus:border-emerald-500/50 rounded-xl outline-none text-white px-4 py-3 transition-colors appearance-none cursor-pointer focus:bg-emerald-500/5"
                        value={manualCategory}
                        onChange={e => setManualCategory(e.target.value)}
                      >
                        <option value="Ăn uống" className="bg-gray-900 text-white">🍔 Ăn uống</option>
                        <option value="Mua sắm" className="bg-gray-900 text-white">🛍️ Mua sắm</option>
                        <option value="Di chuyển" className="bg-gray-900 text-white">🚗 Di chuyển</option>
                        <option value="Sinh hoạt" className="bg-gray-900 text-white">🏠 Sinh hoạt</option>
                        <option value="Khác" className="bg-gray-900 text-white">📌 Giới tuyến Khác</option>
                      </select>
                    </div>

                    <div className="pt-6">
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={!manualAmount || !manualDesc}
                        className="w-full btn-primary !bg-gradient-to-r !from-emerald-500 !to-teal-500 !border-0 flex items-center justify-center gap-2 py-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:grayscale text-lg"
                      >
                        Xác nhận Ghi Sổ
                      </motion.button>
                    </div>
                  </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
