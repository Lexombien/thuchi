import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, WalletType } from '../types';
import { ArrowUp, ArrowDown, Trash2, Wallet, CreditCard, Pencil, Filter } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit }) => {
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterWallet, setFilterWallet] = useState<'all' | WalletType>('all');
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterWallet !== 'all' && t.wallet !== filterWallet) return false;
      if (searchText && !t.description.toLowerCase().includes(searchText.toLowerCase()) && !t.category.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterType, filterWallet, searchText]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <div className="relative flex-1 min-w-[120px]">
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
        >
          <option value="all">Tất cả loại</option>
          <option value="income">Thu nhập</option>
          <option value="expense">Chi tiêu</option>
        </select>
        <select 
          value={filterWallet} 
          onChange={(e) => setFilterWallet(e.target.value as any)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
        >
          <option value="all">Tất cả ví</option>
          <option value="cash">Tiền mặt</option>
          <option value="account">Tài khoản</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Filter className="text-slate-300" size={32} />
          </div>
          <p className="text-slate-400 text-sm">Không tìm thấy giao dịch nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div 
              key={t.id} 
              className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                {/* Icon Box */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {t.type === 'income' ? <ArrowUp size={20} strokeWidth={2.5} /> : <ArrowDown size={20} strokeWidth={2.5} />}
                </div>
                
                {/* Info */}
                <div className="flex flex-col">
                  <h3 className="font-bold text-gray-900 text-sm">{t.category}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 uppercase">
                      {t.wallet === 'cash' ? <Wallet size={10} /> : <CreditCard size={10} />}
                      {t.wallet === 'cash' ? 'Tiền mặt' : 'Tài khoản'}
                    </span>
                    {/* Display Date and Time */}
                    <span>• {new Date(t.date).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} {new Date(t.date).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{t.description}</p>
                </div>
              </div>

              {/* Amount & Action */}
              <div className="flex flex-col items-end gap-1">
                <span className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('vi-VN').format(t.amount)} đ
                </span>
                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(t)}
                    className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
