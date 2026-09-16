export const TOKEN_KEY = 'bms_token';

export interface AuthUser {
  _id: string;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'manager' | 'admin' | 'barber';
  status: string;
  subscriptionEnd?: string | null;
  periodDays?: number;
  createdAt?: string;
}

export interface SalonInfo {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  currency: string;
  managerSharePercent: number;
  barberSharePercent: number;
}

export interface WalletSummary {
  totalTransactionVolume: number;
  totalTransactions: number;
  totalManagerEarnings: number;
  totalBarberEarnings: number;
  activeBarbers: number;
  totalMoneyReceived: number;
  totalPaidToBarbers: number;
  totalOutstandingLoans: number;
  totalLoanRepayments: number;
  loanCount: number;
  currentBalance: number;
  unpaidBarberEarnings: number;
}

export interface DashboardSummary {
  wallet: WalletSummary;
  today: { volume: number; count: number };
  week: { volume: number; count: number };
  recentTransactions: Transaction[];
  topBarbers: {
    _id: string;
    name: string;
    transactionCount: number;
    volume: number;
    managerShare: number;
    barberShare: number;
  }[];
  notifications: NotificationItem[];
}

export interface Transaction {
  _id: string;
  salon: string;
  barber?: { _id: string; name: string } | string;
  barberName?: string;
  customerName: string;
  service: string;
  description: string;
  totalAmount: number;
  managerShare: number;
  barberShare: number;
  managerPercent: number;
  barberPercent: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface Barber {
  _id: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  role: string;
  status: 'active' | 'inactive';
  specializations: string[];
  joinedAt: string;
  createdAt: string;
  stats: {
    transactionCount: number;
    transactionVolume: number;
    managerShare: number;
    barberShare: number;
    paidOut: number;
    availableEarnings: number;
    outstandingLoans: number;
    activeLoans: number;
  };
}

export interface LoanRecord {
  _id: string;
  barber: { _id: string; name: string; phone: string } | string;
  amount: number;
  outstandingAmount: number;
  status: 'active' | 'settled';
  reason: string;
  totalRepaid: number;
  createdAt: string;
}

export interface ReportRecord {
  _id: string;
  reportType: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  totals: {
    transactionVolume: number;
    managerEarnings: number;
    barberEarnings: number;
    transactionCount: number;
    loanRepaymentsReceived: number;
    outstandingLoans: number;
  };
  perBarber: {
    barber: string;
    name: string;
    transactionCount: number;
    transactionVolume: number;
    managerShare: number;
    barberShare: number;
  }[];
  loansIssued: number;
  loansRepaid: number;
  generatedAt: string;
}

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminUser {
  _id: string;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  status: string;
  bucket: 'active' | 'expiring' | 'expired' | 'suspended';
  registrationDate: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  periodDays?: number;
  lastActiveAt?: string;
  salon: { _id: string; name: string; city?: string; status?: string } | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}