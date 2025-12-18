export type TransactionType = 'income' | 'expense';
export type WalletType = 'cash' | 'account';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  wallet: WalletType;
  category: string;
  description: string;
  date: string; // ISO String YYYY-MM-DDTHH:mm:ss
}

export enum Period {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
}

export interface CategoryDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface User {
  username: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  isTransactionResult?: boolean;
}

// Extends Window for Web Speech API
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}
