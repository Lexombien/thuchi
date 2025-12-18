import React, { useState } from 'react';
import { User } from '../types';
import { Wallet, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || (!isLogin && !name)) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const usersStr = localStorage.getItem('users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (isLogin) {
      if (users[username] && users[username].password === password) {
        onLogin({ username, name: users[username].name });
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } else {
      if (users[username]) {
        setError('Tên đăng nhập đã tồn tại');
      } else {
        const newUser = { name, password };
        users[username] = newUser;
        localStorage.setItem('users', JSON.stringify(users));
        onLogin({ username, name });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center bg-indigo-50">
          <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
            <Wallet size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">MoneyTalk</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài chính cá nhân thông minh</p>
        </div>
        
        <div className="p-8">
          <div className="flex gap-4 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Đăng nhập
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Đăng ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Họ tên</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Nhập tên của bạn"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Ví dụ: user123"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLogin ? 'Vào ứng dụng' : 'Tạo tài khoản'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
