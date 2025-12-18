import React, { useState, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  LayoutGrid, List as ListIcon, MessageSquare, PieChart, 
  Bell, Plus, Wallet, CreditCard, ArrowRightLeft, User as UserIcon, LogOut, Settings, Mic
} from 'lucide-react';
import { processUserInput } from './services/geminiService';
import { Transaction, Period, ChartDataPoint, CategoryDataPoint, User, Message, TransactionType, WalletType } from './types';
import { InputModal } from './components/InputModal';
import { TransactionList } from './components/TransactionList';
import { Charts } from './components/Charts';
import { AuthScreen } from './components/AuthScreen';
import { ChatInput } from './components/ChatInput'; 
import { EditTransactionModal } from './components/EditTransactionModal';
import { ProfileModal } from './components/ProfileModal';
import { LiveVoiceSession } from './components/LiveVoiceSession';

// Mock data
const INITIAL_DATA: Transaction[] = [];

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'chat'>('dashboard');
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [period, setPeriod] = useState<Period>(Period.MONTH);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      const savedTx = localStorage.getItem(`transactions_${user.username}`);
      const savedChat = localStorage.getItem(`chat_${user.username}`);
      setTransactions(savedTx ? JSON.parse(savedTx) : INITIAL_DATA);
      setChatHistory(savedChat ? JSON.parse(savedChat) : [{
        id: 'welcome',
        text: `Chào ${user.name}! Tôi có thể giúp gì cho bạn hôm nay?`,
        sender: 'ai',
        timestamp: Date.now()
      }]);
    } else {
      localStorage.removeItem('currentUser');
      setTransactions([]);
      setChatHistory([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`transactions_${user.username}`, JSON.stringify(transactions));
      localStorage.setItem(`chat_${user.username}`, JSON.stringify(chatHistory));
    }
  }, [transactions, chatHistory, user]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab]);

  // --- ACTIONS ---

  const handleUpdateUser = (updatedUser: User, newPassword?: string) => {
    setUser(updatedUser);
    const usersStr = localStorage.getItem('users');
    if (usersStr && user) {
      const users = JSON.parse(usersStr);
      if (users[user.username]) {
        users[user.username] = { 
          ...users[user.username], 
          name: updatedUser.name, 
          avatar: updatedUser.avatar 
        };
        if (newPassword) {
          users[user.username].password = newPassword;
        }
        localStorage.setItem('users', JSON.stringify(users));
      }
    }
  };

  const logTransaction = (data: { amount: number; type: TransactionType; wallet: WalletType; category: string; description: string }) => {
    const currentTimeString = new Date().toTimeString().split(' ')[0];
    const today = new Date().toISOString().split('T')[0];
    const fullDate = `${today}T${currentTimeString}`;

    const newTransaction: Transaction = {
      id: uuidv4(),
      amount: data.amount,
      type: data.type,
      wallet: data.wallet,
      category: data.category || "Khác",
      description: data.description || "Giao dịch từ giọng nói",
      date: fullDate
    };
    setTransactions(prev => [newTransaction, ...prev]);
    showNotification("Đã ghi nhận giao dịch!");
    return "ok";
  };

  const transferMoney = (data: { amount: number; from: WalletType; to: WalletType; description: string }) => {
    const currentTimeString = new Date().toTimeString().split(' ')[0];
    const today = new Date().toISOString().split('T')[0];
    const fullDate = `${today}T${currentTimeString}`;

    const withdrawal: Transaction = {
      id: uuidv4(),
      amount: data.amount,
      type: 'expense',
      wallet: data.from,
      category: "Chuyển tiền",
      description: data.description || `Chuyển đến ${data.to === 'cash' ? 'Tiền mặt' : 'Tài khoản'}`,
      date: fullDate
    };

    const deposit: Transaction = {
      id: uuidv4(),
      amount: data.amount,
      type: 'income',
      wallet: data.to,
      category: "Nhận tiền",
      description: data.description || `Nhận từ ${data.from === 'cash' ? 'Tiền mặt' : 'Tài khoản'}`,
      date: fullDate
    };

    setTransactions(prev => [withdrawal, deposit, ...prev]);
    showNotification("Đã luân chuyển tiền!");
    return "ok";
  };

  const handleUserInput = async (text: string) => {
    setIsProcessing(true);
    setIsInputModalOpen(false); 

    const userMsg: Message = {
      id: uuidv4(),
      text,
      sender: 'user',
      timestamp: Date.now()
    };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const result = await processUserInput(text);
      if (result.action === 'transaction' && result.transactionData) {
        logTransaction({
          amount: Number(result.transactionData.amount),
          type: result.transactionData.type as TransactionType,
          wallet: result.transactionData.wallet as WalletType,
          category: result.transactionData.category,
          description: result.transactionData.description
        });
        addAiMessage(result.chatResponse || "Đã lưu giao dịch.", true);
      } else if (result.action === 'transfer' && result.transferData) {
        transferMoney({
          amount: Number(result.transferData.amount),
          from: result.transferData.from as WalletType,
          to: result.transferData.to as WalletType,
          description: result.transferData.description
        });
        addAiMessage(result.chatResponse || "Đã thực hiện luân chuyển.", true);
      } else {
        addAiMessage(result.chatResponse || "Tôi không hiểu ý bạn.");
      }
    } catch (err) {
      console.error(err);
      addAiMessage("Xin lỗi, có lỗi xảy ra.");
    } finally {
      setIsProcessing(false);
    }
  };

  const addAiMessage = (text: string, isResult = false) => {
    const aiMsg: Message = {
      id: uuidv4(),
      text,
      sender: 'ai',
      timestamp: Date.now(),
      isTransactionResult: isResult
    };
    setChatHistory(prev => [...prev, aiMsg]);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    showNotification("Đã cập nhật giao dịch!");
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    showNotification("Đã xóa giao dịch");
  };

  // --- CALCULATIONS ---
  const balances = useMemo(() => {
    let cash = 0;
    let account = 0;
    transactions.forEach(t => {
      const val = t.type === 'income' ? t.amount : -t.amount;
      if (t.wallet === 'cash') cash += val;
      else account += val;
    });
    return { cash, account, total: cash + account };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (period === Period.MONTH) return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      return true; 
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, period]);

  const summary = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  }, [filteredTransactions]);

  const barData: ChartDataPoint[] = useMemo(() => {
      const dataMap = new Map<string, { income: number, expense: number }>();
      filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        let key = `${date.getDate()}/${date.getMonth() + 1}`;
        if (!dataMap.has(key)) dataMap.set(key, { income: 0, expense: 0 });
        const entry = dataMap.get(key)!;
        if (t.type === 'income') entry.income += t.amount; else entry.expense += t.amount;
      });
      return Array.from(dataMap.entries()).map(([name, val]) => ({ name, ...val })).reverse();
    }, [filteredTransactions]);

  const pieData: CategoryDataPoint[] = useMemo(() => {
      const categoryMap = new Map<string, number>();
      filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
      });
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
      return Array.from(categoryMap.entries()).map(([name, value], idx) => ({
        name, value, color: colors[idx % colors.length]
      })).sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 relative overflow-hidden">
      
      {/* --- TOP HEADER --- */}
      <div className="bg-white px-6 pt-12 pb-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3" onClick={() => setIsProfileModalOpen(true)}>
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-primary border-2 border-white shadow-sm overflow-hidden cursor-pointer">
             {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" /> : <UserIcon size={20} />}
          </div>
          <div className="cursor-pointer">
            <p className="text-xs text-slate-400 font-medium">Xin chào,</p>
            <h2 className="text-sm font-bold text-slate-800">{user.name}</h2>
          </div>
        </div>
        <div className="flex gap-4">
            <button className="relative p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                <Bell size={20} className="text-slate-600" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button onClick={() => setUser(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                <LogOut size={20} className="text-slate-600" />
            </button>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto pb-24 px-6 space-y-6 scroll-smooth no-scrollbar">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center py-2">
              <p className="text-slate-400 text-sm font-medium mb-1">Tổng số dư</p>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {formatCurrency(balances.total)} <span className="text-2xl text-slate-400 font-normal">đ</span>
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-100/50 rounded-full group-hover:scale-110 transition-transform"></div>
                <div className="flex items-center gap-2 text-emerald-600 mb-2 z-10">
                   <div className="p-1.5 bg-white rounded-full shadow-sm"><ArrowRightLeft size={14} className="rotate-45" /></div>
                   <span className="text-xs font-bold uppercase tracking-wider">Thu nhập</span>
                </div>
                <span className="text-lg font-bold text-emerald-700 z-10">+{formatCurrency(summary.income)}</span>
              </div>
              <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100 flex flex-col justify-between h-32 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-100/50 rounded-full group-hover:scale-110 transition-transform"></div>
                <div className="flex items-center gap-2 text-rose-600 mb-2 z-10">
                   <div className="p-1.5 bg-white rounded-full shadow-sm"><ArrowRightLeft size={14} className="-rotate-45" /></div>
                   <span className="text-xs font-bold uppercase tracking-wider">Chi tiêu</span>
                </div>
                <span className="text-lg font-bold text-rose-700 z-10">-{formatCurrency(summary.expense)}</span>
              </div>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 text-sm">Ví của tôi</h3>
                   <span className="text-[10px] text-slate-400">Tự động tính từ giao dịch</span>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm"><Wallet size={20} /></div>
                            <span className="text-sm font-medium text-slate-700">Tiền mặt</span>
                        </div>
                        <span className="font-bold text-slate-900">{formatCurrency(balances.cash)} đ</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><CreditCard size={20} /></div>
                            <span className="text-sm font-medium text-slate-700">Tài khoản</span>
                        </div>
                        <span className="font-bold text-slate-900">{formatCurrency(balances.account)} đ</span>
                    </div>
                </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-bold text-slate-800 text-lg">Giao dịch gần đây</h3>
                <button onClick={() => setActiveTab('stats')} className="text-primary text-xs font-semibold hover:underline">Xem thống kê</button>
              </div>
              <TransactionList 
                transactions={filteredTransactions.slice(0, 5)} 
                onDelete={handleDeleteTransaction}
                onEdit={setEditingTransaction}
              />
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-2xl font-bold text-slate-900">Thống kê tháng này</h2>
               <Charts barData={barData} pieData={pieData} />
               <div className="pb-4">
                  <h3 className="font-bold text-slate-800 mb-4">Lịch sử chi tiết</h3>
                  <TransactionList 
                    transactions={filteredTransactions} 
                    onDelete={handleDeleteTransaction}
                    onEdit={setEditingTransaction}
                  />
               </div>
           </div>
        )}

        {activeTab === 'chat' && (
           <div className="flex flex-col h-full">
               <div className="flex-1 space-y-4 pb-4">
                  {chatHistory.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-2 mt-1 shadow-md"><MessageSquare size={14} /></div>}
                      <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-slate-800 text-white rounded-br-none shadow-md' 
                          : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
               </div>
               <div className="sticky bottom-0 bg-slate-50 pt-2">
                 <ChatInput onSend={handleUserInput} isProcessing={isProcessing} />
               </div>
           </div>
        )}
      </main>

      {/* LIVE VOICE FAB (As requested in image) */}
      <button 
        onClick={() => setIsLiveSessionOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-secondary text-white rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30 group"
      >
        <Mic size={28} />
        <span className="absolute -top-12 right-0 bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
           Trò chuyện trực tiếp
        </span>
      </button>

      {/* --- BOTTOM NAVIGATION --- */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 px-6 py-2 pb-6 flex justify-between items-center z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-primary scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
            <LayoutGrid size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Tổng quan</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-primary scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
            <PieChart size={24} strokeWidth={activeTab === 'stats' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Thống kê</span>
        </button>
        <div className="relative -top-6">
            <button onClick={() => setIsInputModalOpen(true)} className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl shadow-slate-900/30 hover:scale-110 active:scale-95 transition-all">
                <Plus size={28} strokeWidth={2.5} />
            </button>
        </div>
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-primary scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
            <MessageSquare size={24} strokeWidth={activeTab === 'chat' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Trò chuyện</span>
        </button>
        <button onClick={() => setIsProfileModalOpen(true)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600">
            <Settings size={24} />
            <span className="text-[10px] font-medium">Tài khoản</span>
        </button>
      </div>

      {/* --- MODALS --- */}
      {isLiveSessionOpen && (
        <LiveVoiceSession 
          onClose={() => setIsLiveSessionOpen(false)}
          onLogTransaction={logTransaction}
          onTransfer={transferMoney}
        />
      )}
      <InputModal isOpen={isInputModalOpen} onClose={() => setIsInputModalOpen(false)} onSend={handleUserInput} isProcessing={isProcessing} />
      <EditTransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} onSave={handleEditTransaction} />
      {user && <ProfileModal user={user} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onUpdateUser={handleUpdateUser} />}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 z-50 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            {notification}
        </div>
      )}
    </div>
  );
}
