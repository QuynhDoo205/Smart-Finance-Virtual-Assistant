import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import { Search, Filter, MoreHorizontal, User, Mail, Shield, Calendar, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [filter, setFilter] = useState<{ role: 'all' | 'admin' | 'user', status: 'all' | 'active' | 'offline' }>({
    role: 'all',
    status: 'all'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [modal, setModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void; type: 'danger' | 'info' }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers();
      if (res.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleAdmin = (u: any) => {
    setModal({
      show: true,
      title: u.is_admin ? 'Hạ quyền Admin' : 'Cấp quyền Admin',
      message: `Bạn có chắc muốn ${u.is_admin ? 'HẠ QUYỀN' : 'CẤP QUYỀN'} Admin cho ${u.name}?`,
      type: 'info',
      onConfirm: async () => {
        try {
          const res = await adminApi.updateUserRole(u.id, !u.is_admin);
          if (res.success) {
            fetchUsers();
            setModal(prev => ({ ...prev, show: false }));
          } else {
            alert("Lỗi: " + (res as any).message);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDeleteUser = (u: any) => {
    setModal({
      show: true,
      title: 'Xác nhận XÓA',
      message: `CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng ${u.name}? Thao tác này không thể hoàn tác!`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await adminApi.deleteUser(u.id);
          if (res.success) {
            fetchUsers();
            setModal(prev => ({ ...prev, show: false }));
          } else {
            alert("Lỗi: " + (res as any).message);
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filter.role === 'all' || (filter.role === 'admin' ? u.is_admin : !u.is_admin);
    const matchesStatus = filter.status === 'all' || (filter.status === 'active' ? u.is_active : !u.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 relative"
    >
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {modal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setModal(p => ({ ...p, show: false }))}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#161B2B] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${modal.type === 'danger' ? 'bg-red-500' : 'bg-sky-500'}`} />
              <div className="space-y-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${modal.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-sky-500/10 text-sky-500'}`}>
                  {modal.type === 'danger' ? <Trash2 className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{modal.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{modal.message}</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setModal(p => ({ ...p, show: false }))}
                    className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-white hover:bg-white/10 transition-all"
                  >
                    HỦY BỎ
                  </button>
                  <button 
                    onClick={modal.onConfirm}
                    className={`flex-1 py-3.5 rounded-2xl text-xs font-black text-white shadow-lg transition-all ${
                      modal.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
                    }`}
                  >
                    XÁC NHẬN
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Quản lý Người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">Danh sách toàn bộ thành viên đang tham gia hệ thống.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm tên hoặc email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-sky-500/50 w-64 transition-all"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-xl border transition-all ${isFilterOpen ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-[#161B2B] border border-white/10 rounded-3xl shadow-2xl p-6 z-50 space-y-6"
                  >
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vai trò</label>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'admin', 'user'].map((r) => (
                          <button 
                            key={r}
                            onClick={() => setFilter(prev => ({ ...prev, role: r as any }))}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter.role === r ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-400'}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Trạng thái</label>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'active', 'offline'].map((s) => (
                          <button 
                            key={s}
                            onClick={() => setFilter(prev => ({ ...prev, status: s as any }))}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter.status === s ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-400'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-[#0F172A] rounded-[2rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Thành viên</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Trạng thái</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ngày gia nhập</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vai trò</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{u.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Mail className="w-3 h-3" />
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-bold border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Ngoại tuyến
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 opacity-40" />
                      {new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {u.is_admin ? (
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-[10px] font-black border border-sky-500/20 flex items-center gap-1.5 w-fit">
                        <Shield className="w-3 h-3" /> ADMIN
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-500 text-[10px] font-black border border-white/10 flex items-center gap-1.5 w-fit">
                        <User className="w-3 h-3" /> THÀNH VIÊN
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleToggleAdmin(u)}
                        title={u.is_admin ? "Hạ quyền Admin" : "Cấp quyền Admin"}
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-sky-400 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u)}
                        title="Xóa người dùng"
                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-500 font-medium">Không tìm thấy người dùng nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
