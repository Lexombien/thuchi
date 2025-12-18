import React, { useState } from 'react';
import { User } from '../types';
import { X, Save, User as UserIcon, Lock } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: User, newPassword?: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, isOpen, onClose, onUpdateUser }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSaveInfo = () => {
    onUpdateUser({ ...user, name, avatar });
    setMessage('Đã cập nhật thông tin!');
    setTimeout(() => setMessage(''), 2000);
  };

  const handleChangePassword = () => {
    if (!newPassword || !currentPassword) {
      setMessage('Vui lòng nhập mật khẩu.');
      return;
    }
    // Simple validation logic handled in App.tsx typically, but here we just pass it up
    onUpdateUser(user, newPassword); 
    setMessage('Yêu cầu đổi mật khẩu đã gửi.');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setMessage(''), 2000);
  };

  // Preset avatars
  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Callie'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Tài khoản</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-indigo-100 border-4 border-white shadow-lg overflow-hidden mb-4">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-indigo-400"><UserIcon size={40} /></div>
            )}
          </div>
          <div className="flex gap-2">
            {avatars.map((url, i) => (
              <button key={i} onClick={() => setAvatar(url)} className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 hover:ring-2 ring-indigo-500">
                <img src={url} alt="Preset" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Info Form */}
          <div className="space-y-3">
             <label className="text-sm font-semibold text-slate-700">Thông tin cá nhân</label>
             <input
               type="text"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Họ tên"
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
             />
             <input
               type="text"
               value={avatar}
               onChange={(e) => setAvatar(e.target.value)}
               placeholder="URL Avatar (Tùy chọn)"
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-indigo-500"
             />
             <button onClick={handleSaveInfo} className="w-full py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-sm hover:bg-indigo-200 transition-colors">
                Lưu thông tin
             </button>
          </div>

          <div className="h-px bg-slate-100 my-4"></div>

          {/* Password Form */}
          <div className="space-y-3">
             <label className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Lock size={14}/> Đổi mật khẩu</label>
             <input
               type="password"
               value={currentPassword}
               onChange={(e) => setCurrentPassword(e.target.value)}
               placeholder="Mật khẩu hiện tại"
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
             />
             <input
               type="password"
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
               placeholder="Mật khẩu mới"
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500"
             />
             <button onClick={handleChangePassword} className="w-full py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors">
                Cập nhật mật khẩu
             </button>
          </div>
        </div>
        
        {message && <p className="text-center text-green-600 text-sm mt-4 font-medium animate-pulse">{message}</p>}

      </div>
    </div>
  );
};
