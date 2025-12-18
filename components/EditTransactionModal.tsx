import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { X, Check } from 'lucide-react';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onClose, onSave }) => {
  const [formData, setFormData] = useState<Transaction | null>(null);

  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction });
    }
  }, [transaction]);

  if (!transaction || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Extract Date and Time strings for inputs
  const dateObj = new Date(formData.date);
  // Handle case where date might be invalid or just YYYY-MM-DD
  const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '';
  // Simple time extraction
  const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toTimeString().slice(0, 5) : '00:00';

  const handleDateTimeChange = (d: string, t: string) => {
    const newDate = new Date(`${d}T${t}`);
    setFormData({ ...formData, date: newDate.toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Sửa giao dịch</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Số tiền</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full mt-1 border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 text-xl font-bold text-slate-800 bg-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-xs font-semibold text-slate-500 uppercase">Loại</label>
               <select
                 value={formData.type}
                 onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                 className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
               >
                 <option value="expense">Chi tiêu</option>
                 <option value="income">Thu nhập</option>
               </select>
            </div>
            <div>
               <label className="text-xs font-semibold text-slate-500 uppercase">Ví</label>
               <select
                 value={formData.wallet}
                 onChange={(e) => setFormData({ ...formData, wallet: e.target.value as any })}
                 className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
               >
                 <option value="cash">Tiền mặt</option>
                 <option value="account">Tài khoản</option>
               </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Danh mục</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Mô tả</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Ngày</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => handleDateTimeChange(e.target.value, timeStr)}
                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Giờ</label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => handleDateTimeChange(dateStr, e.target.value)}
                className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2"
          >
            <Check size={20} /> Lưu thay đổi
          </button>
        </form>
      </div>
    </div>
  );
};
