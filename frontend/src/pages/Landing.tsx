import { motion } from 'framer-motion';
import { Mail, Globe, MessageSquare, ArrowRight, Sparkles, Shield, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const navLinks = [
  { name: 'Tính năng', href: '#features' },
  { name: 'Giải pháp', href: '#about' },
  { name: 'Công nghệ', href: '#collection' },
  { name: 'Hỏi đáp', href: '#faq' },
  { name: 'Liên hệ', href: '#contact' }
];

const nftCollection = [
  {
    video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4",
    score: "8.7/10",
    label: "DỰ BÁO AI"
  },
  {
    video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4",
    score: "9.0/10",
    label: "NGÂN SÁCH THÔNG MINH"
  },
  {
    video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4",
    score: "8.2/10",
    label: "PHÂN TÍCH THỊ TRƯỜNG"
  }
];

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-[#010828] text-[#EFF4FF] font-sans selection:bg-[#6FFF00]/30 overflow-x-hidden">
      {/* Texture Overlay */}
      <div className="texture-overlay opacity-20" />

      {/* SECTION 1: HERO */}
      <section className="relative h-screen flex flex-col rounded-b-[32px] overflow-hidden">
        {/* Hero Video */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#010828]/50 via-transparent to-[#010828]" />
        </div>

        {/* Navbar */}
        <header className="relative z-20 max-w-[1831px] w-full mx-auto px-6 py-10 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-[#6FFF00] flex items-center justify-center text-[#010828] font-grotesk text-2xl shadow-[0_0_25px_rgba(111,255,0,0.4)] group-hover:scale-110 transition-all">N</div>
            <span className="font-grotesk text-3xl uppercase tracking-tighter">Nova.Finance</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-10 liquid-glass bg-white/[0.05] backdrop-blur-xl rounded-[28px] px-12 py-5 border border-white/10">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="font-bold text-[13px] uppercase hover:text-[#6FFF00] transition-colors tracking-widest">{link.name}</a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-3">
              <button className="w-12 h-12 liquid-glass bg-white/[0.05] rounded-2xl flex items-center justify-center hover:bg-[#6FFF00] hover:text-[#010828] transition-all border border-white/10"><MessageSquare size={18} /></button>
              <button className="w-12 h-12 liquid-glass bg-white/[0.05] rounded-2xl flex items-center justify-center hover:bg-[#6FFF00] hover:text-[#010828] transition-all border border-white/10"><Globe size={18} /></button>
            </div>
            <Link to="/login" className="px-10 py-5 liquid-glass bg-white/[0.08] backdrop-blur-xl rounded-2xl font-grotesk text-[14px] uppercase tracking-widest hover:bg-[#6FFF00] hover:text-[#010828] transition-all border border-white/10 shadow-xl">Vào Ứng Dụng</Link>
          </div>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-[1831px] w-full mx-auto px-6 pb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <div className="relative inline-block lg:ml-32">
              <h1 className="font-grotesk text-[45px] sm:text-[65px] md:text-[85px] lg:text-[115px] uppercase leading-[0.9] tracking-tighter text-white drop-shadow-2xl">
                VƯƠN XA HƠN<br/>
                VỚI ( HỆ ) <br/>
                TÀI CHÍNH AI
              </h1>
              <span className="absolute -right-8 lg:-right-32 top-0 lg:top-10 font-condiment text-[#6FFF00] text-4xl sm:text-7xl md:text-8xl -rotate-2 mix-blend-exclusion opacity-95 drop-shadow-[0_0_25px_rgba(111,255,0,0.6)]">Trợ lý ảo</span>
            </div>
          </motion.div>
        </div>

        {/* Social Icons Stack (Desktop Right) */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-5 z-20">
           {[Mail, MessageSquare, Globe].map((Icon, idx) => (
             <button key={idx} className="w-16 h-16 liquid-glass bg-white/[0.05] backdrop-blur-xl rounded-2xl flex items-center justify-center hover:bg-[#6FFF00] hover:text-[#010828] transition-all border border-white/10 shadow-lg"><Icon size={22} /></button>
           ))}
        </div>
      </section>

      {/* SECTION 2: ABOUT */}
      <section id="about" className="relative min-h-screen flex items-center py-24 overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60">
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#010828]/50" />
        </div>

        <div className="relative z-10 max-w-[1831px] w-full mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-24">
            <div className="relative">
               <h2 className="font-grotesk text-[45px] sm:text-[65px] md:text-[85px] lg:text-[110px] uppercase leading-none tracking-tighter text-white">
                 XIN CHÀO!<br/>
                 TÔI LÀ ORBIS
               </h2>
               <span className="absolute bottom-0 right-0 font-condiment text-[#6FFF00] text-5xl sm:text-8xl rotate-3 mix-blend-exclusion drop-shadow-[0_0_20px_rgba(111,255,0,0.5)]">Nova AI</span>
            </div>
            
            <div className="max-w-[420px] pt-4 lg:pt-24">
               <p className="text-lg sm:text-xl text-white font-bold uppercase leading-relaxed tracking-[0.1em] opacity-90">
                 Định hình lại cách bạn quản lý tài chính trong không gian số. Nova Finance là người bạn đồng hành AI tối thượng, giúp bạn kiểm soát dòng tiền chính xác đến từng xu.
               </p>
            </div>
          </div>

          <div className="mt-32 flex flex-col lg:flex-row justify-between items-end opacity-10 pointer-events-none hidden lg:flex">
             <div className="space-y-6 max-w-sm">
                <p className="uppercase text-sm tracking-widest font-black">Theo dõi tài sản đa chuỗi. Phân tích dữ liệu thời gian thực bởi mạng thần kinh nhân tạo. Vượt xa giới hạn tưởng tượng.</p>
                <p className="uppercase text-sm tracking-widest font-black">Theo dõi tài sản đa chuỗi. Phân tích dữ liệu thời gian thực bởi mạng thần kinh nhân tạo. Vượt xa giới hạn tưởng tượng.</p>
             </div>
             <div className="space-y-6 max-w-sm text-right">
                <p className="uppercase text-sm tracking-widest font-black">Bảo mật tuyệt đối. Mã hóa cấp quân đội cho tài sản của bạn. Hãy tin tưởng vào thuật toán và định nghĩa chương mới.</p>
                <p className="uppercase text-sm tracking-widest font-black">Bảo mật tuyệt đối. Mã hóa cấp quân đội cho tài sản của bạn. Hãy tin tưởng vào thuật toán và định nghĩa chương mới.</p>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: COLLECTION GRID */}
      <section id="collection" className="relative py-32 bg-[#010828]">
        <div className="max-w-[1831px] w-full mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-28 gap-10">
             <div className="relative">
                <h3 className="font-grotesk text-[45px] sm:text-[65px] lg:text-[90px] uppercase leading-[0.9] tracking-tighter text-white">
                   CÔNG NGHỆ CỦA<br/>
                   <span className="ml-12 lg:ml-24 flex items-center gap-6">
                     <span className="font-condiment text-[#6FFF00] normal-case tracking-normal text-6xl lg:text-8xl">Tương lai</span> AI
                   </span>
                </h3>
             </div>
             
             <button className="group relative flex items-end gap-5 hover:scale-105 transition-transform">
                <span className="font-grotesk text-[45px] lg:text-[70px] leading-none text-white">XEM</span>
                <div className="flex flex-col">
                   <span className="font-grotesk text-xl lg:text-3xl leading-none text-[#6FFF00]">TẤT CẢ</span>
                   <span className="font-grotesk text-xl lg:text-3xl leading-none text-white">TÍNH NĂNG</span>
                </div>
                <div className="absolute bottom-[-15px] left-0 w-full h-[8px] lg:h-[12px] bg-[#6FFF00] origin-left group-hover:scale-x-110 transition-transform shadow-[0_0_15px_rgba(111,255,0,0.5)]" />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             {nftCollection.map((nft, idx) => (
               <motion.div 
                 key={idx} whileHover={{ y: -20, backgroundColor: 'rgba(255,255,255,0.06)' }}
                 className="liquid-glass bg-white/[0.03] backdrop-blur-xl rounded-[50px] p-7 border border-white/10 transition-all group shadow-2xl"
               >
                 <div className="relative pb-[100%] rounded-[40px] overflow-hidden mb-10 shadow-inner">
                    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                       <source src={nft.video} type="video/mp4" />
                    </video>
                 </div>
                 <div className="liquid-glass bg-white/[0.05] backdrop-blur-xl rounded-[32px] px-8 py-6 flex justify-between items-center border border-white/10 shadow-lg">
                    <div>
                       <p className="text-[12px] font-black text-[#6FFF00] uppercase tracking-[0.3em] mb-2">{nft.label}</p>
                       <p className="font-grotesk text-2xl uppercase tracking-widest text-white">ĐỘ CHÍNH XÁC: {nft.score}</p>
                    </div>
                    <button className="w-16 h-16 rounded-full bg-gradient-to-br from-[#b724ff] to-[#7c3aed] flex items-center justify-center shadow-[0_0_35px_rgba(183,36,255,0.5)] hover:scale-115 transition-all">
                       <ArrowRight size={28} className="text-white" />
                    </button>
                 </div>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
         {/* CTA Video */}
         <div className="absolute inset-0 z-0">
           <video autoPlay loop muted playsInline className="w-full h-full object-cover">
             <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4" type="video/mp4" />
           </video>
           <div className="absolute inset-0 bg-gradient-to-r from-[#010828] via-transparent to-[#010828]/60" />
         </div>

         <div className="relative z-10 max-w-[1831px] w-full mx-auto px-6 flex justify-end">
            <div className="relative lg:pr-[10%] text-right max-w-4xl">
               <span className="absolute -top-24 -left-16 font-condiment text-[#6FFF00] text-5xl sm:text-8xl mix-blend-exclusion drop-shadow-[0_0_20px_rgba(111,255,0,0.5)]">Khởi động ngay</span>
               <h4 className="font-grotesk text-[35px] sm:text-[65px] lg:text-[85px] uppercase leading-[0.95] tracking-tighter text-white mb-20 drop-shadow-2xl">
                 GIA NHẬP.<br/>
                 KHÁM PHÁ BÍ MẬT.<br/>
                 ĐỊNH NGHĨA TƯƠNG LAI.<br/>
                 ĐÓN ĐẦU TÍN HIỆU.
               </h4>
               
               <Link 
                to="/register"
                className="group relative inline-flex items-center gap-6 bg-[#6FFF00] text-[#010828] px-16 py-8 rounded-full font-grotesk text-3xl uppercase tracking-widest hover:bg-white transition-all shadow-[0_20px_60px_rgba(111,255,0,0.4)] overflow-hidden"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shine" />
                 BẮT ĐẦU NGAY <ArrowRight size={40} className="group-hover:translate-x-3 transition-transform" />
               </Link>
            </div>
         </div>

         {/* Bottom Social Sidebar */}
         <div className="absolute left-[5%] bottom-[10%] liquid-glass bg-white/[0.08] backdrop-blur-2xl rounded-[1.5rem] p-4 flex flex-col gap-4 border border-white/10 shadow-2xl">
            {[Mail, MessageSquare, Globe].map((Icon, idx) => (
              <button key={idx} className="w-16 h-16 flex items-center justify-center hover:bg-[#6FFF00] hover:text-[#010828] rounded-2xl transition-all border-b border-white/10 last:border-0 pb-2 last:pb-0 group"><Icon size={26} className="group-hover:scale-110 transition-transform" /></button>
            ))}
         </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-white/10 bg-[#010828] relative z-10">
         <div className="max-w-[1831px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6FFF00] flex items-center justify-center text-[#010828] font-grotesk text-xl">N</div>
              <span className="font-grotesk text-2xl uppercase tracking-tighter text-white">Nova Finance</span>
            </div>
            <p className="text-[12px] font-black text-white/30 uppercase tracking-[0.5em] text-center">© 2026 Nova Finance AI. Bản quyền thuộc về hệ sinh thái tài chính số.</p>
            <div className="flex gap-10">
               <a href="#" className="text-[11px] font-black text-white/50 uppercase hover:text-[#6FFF00] transition-colors tracking-widest">Bảo mật</a>
               <a href="#" className="text-[11px] font-black text-white/50 uppercase hover:text-[#6FFF00] transition-colors tracking-widest">Điều khoản</a>
            </div>
         </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        html { scroll-behavior: smooth; }
        .liquid-glass { background-blend-mode: luminosity; }
        @keyframes shine { 0% { transform: translateX(-150%) skewX(-20deg); } 100% { transform: translateX(250%) skewX(-20deg); } }
        .animate-shine { animation: shine 3s infinite; }
        ::selection { background: #6FFF00; color: #010828; }
      `}} />
    </div>
  );
}
