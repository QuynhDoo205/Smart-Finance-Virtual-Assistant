import { motion } from 'framer-motion';
import { Lock, Star, Trophy, Zap, Map, Code, Shield, Award, Crown } from 'lucide-react';

const badges = [
  { id: 1, name: 'Người Khởi Đầu', description: 'Hoàn thành Onboarding & thiết lập ngân sách đầu tiên.', icon: <Map className="w-8 h-8" />, unlocked: true, rarity: 'common', color: 'from-blue-400 to-blue-600' },
  { id: 2, name: 'Chi Tiêu Thông Thái', description: 'Giữ chi tiêu dưới mức ngân sách trong 7 ngày liên tiếp.', icon: <Shield className="w-8 h-8" />, unlocked: true, rarity: 'uncommon', color: 'from-emerald-400 to-emerald-600' },
  { id: 3, name: 'Kỷ Luật Thép', description: 'Không chi tiêu vượt quá mức cho phép trong 1 tháng.', icon: <Award className="w-8 h-8" />, unlocked: false, rarity: 'rare', color: 'from-purple-400 to-purple-600' },
  { id: 4, name: 'Bậc Thầy AI', description: 'Sử dụng Nova AI để trích xuất 50 hóa đơn tự động.', icon: <Zap className="w-8 h-8" />, unlocked: true, rarity: 'epic', color: 'from-fuchsia-400 to-pink-600' },
  { id: 5, name: 'Tự Do Tài Chính', description: 'Đạt mục tiêu tiết kiệm khổng lồ (Trên 100M VND).', icon: <Crown className="w-8 h-8" />, unlocked: false, rarity: 'legendary', color: 'from-amber-300 to-orange-500' },
  { id: 6, name: 'Người Bắt Bugs', description: 'Tham gia sửa lỗi hệ thống (Beta Tester).', icon: <Code className="w-8 h-8" />, unlocked: true, rarity: 'mythic', color: 'from-gray-300 to-gray-500' },
];

export default function Badges() {
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVars = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header Level Info */}
      <motion.div variants={itemVars} className="glass-panel p-8 md:p-12 rounded-[2.5rem] border-amber-500/20 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none mix-blend-screen" />
        
        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-amber-400 to-orange-600 shadow-2xl">
            <div className="w-full h-full bg-[#0F172A] rounded-full flex items-center justify-center border-4 border-[#0F172A]">
              <Trophy className="w-16 h-16 text-amber-500" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-rose-500 to-pink-600 w-12 h-12 rounded-full border-4 border-[#0F172A] flex items-center justify-center shadow-lg">
            <span className="font-extrabold text-theme-text-primary text-sm">Lv.5</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-4xl font-extrabold text-theme-text-primary mb-2 flex flex-col md:flex-row items-center gap-3">
            Hành Trình Gamification
            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
              <Star className="w-3 h-3" /> Hạng Vàng
            </span>
          </h1>
          <p className="text-lg text-theme-text-muted mb-6 max-w-2xl">
            Biến việc quản lý tài chính thành một chuyến phiêu lưu! Sưu tầm huy hiệu, nâng cấp độ và mở khóa những phần thưởng đặc biệt.
          </p>

          <div className="space-y-2 max-w-xl">
            <div className="flex justify-between items-end text-sm">
              <span className="font-semibold text-theme-text-muted">Tiến trình Level 6</span>
              <span className="font-bold text-amber-500">2400 / 5000 XP</span>
            </div>
            <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '48%' }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full relative"
              >
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_1s_linear_infinite]" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-theme-text-primary">Tủ Huy Hiệu Tâm Huyết</h2>
          <span className="text-theme-text-muted font-medium">Đã mở khóa: 4/6</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <motion.div 
              key={badge.id}
              variants={itemVars}
              className={`relative overflow-hidden rounded-[2rem] p-1 transition-all duration-300 group ${
                badge.unlocked 
                  ? 'bg-gradient-to-br border-transparent' 
                  : 'bg-gray-800 border border-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              {badge.unlocked && (
                <div className={`absolute inset-0 bg-gradient-to-br ${badge.color} opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500`} />
              )}
              
              <div className={`relative h-full flex flex-col items-center text-center p-8 rounded-[1.9rem] ${
                badge.unlocked ? 'bg-[#0F172A]/90 backdrop-blur-xl border border-white/10' : 'bg-[#111827]'
              }`}>
                
                {/* Icon Container */}
                <div className={`w-24 h-24 mb-6 rounded-[2rem] flex items-center justify-center relative ${
                  badge.unlocked 
                    ? `bg-gradient-to-br ${badge.color} shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-300` 
                    : 'bg-gray-800 border border-white/5 grayscale'
                }`}>
                  <div className="text-theme-text-primary">
                    {badge.unlocked ? badge.icon : <Lock className="w-8 h-8 text-theme-text-muted" />}
                  </div>
                  
                  {/* Subtle shine effect on unlocked icons */}
                  {badge.unlocked && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                  )}
                </div>

                <div className="space-y-2 relative z-10 w-full">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                    badge.unlocked ? 'bg-white/10 text-theme-text-primary' : 'bg-gray-800 text-theme-text-muted'
                  }`}>
                    {badge.rarity}
                  </span>
                  <h3 className={`text-xl font-bold mt-3 ${badge.unlocked ? 'text-theme-text-primary' : 'text-theme-text-muted'}`}>
                    {badge.name}
                  </h3>
                  <p className={`text-sm leading-relaxed ${badge.unlocked ? 'text-theme-text-muted' : 'text-gray-600'}`}>
                    {badge.description}
                  </p>
                </div>

                {/* Status indicator */}
                {!badge.unlocked && (
                  <div className="mt-6 pt-4 border-t border-white/5 w-full">
                    <p className="text-xs text-amber-500/80 font-medium flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3" /> Yêu cầu chưa đạt
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
