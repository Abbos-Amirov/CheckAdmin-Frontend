export type ApiCheckStatus = 'pending' | 'approved' | 'rejected';

export type ApiCheckUser = {
  _id: string;
  fullName: string;
  employeeId: string;
  workType: 'inside' | 'outside';
  avatarUrl?: string | null;
};

export type ApiCheck = {
  _id: string;
  userId: string;
  user?: ApiCheckUser | null;
  imageUrl: string;
  amount: number;
  storeName: string | null;
  checkDate: string | null;
  cardInfo?: string | null;
  items: { name: string; price: number }[];
  month: string;
  status: ApiCheckStatus;
  adminNote?: string | null;
  createdAt?: string;
};

export type AdminChecksResponse = {
  checks: ApiCheck[];
  month?: string;
  status?: ApiCheckStatus;
};
