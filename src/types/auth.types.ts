export type AdminUser = {
  id: string;
  employeeId: string;
  fullName: string;
  phone?: string;
  email?: string;
  role?: string;
};

export type AdminLoginRequest = {
  employeeId: string;
  password: string;
};

export type AdminSignupRequest = {
  fullName: string;
  employeeId: string;
  phone: string;
  password: string;
  adminSecret: string;
};

/** Backend javobi — token nomi va o‘rash farq qilishi mumkin. */
export type AdminAuthResponse = {
  success?: boolean;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  admin?: AdminUser;
  user?: AdminUser;
  message?: string;
  data?: {
    accessToken?: string;
    token?: string;
    admin?: AdminUser;
    user?: AdminUser;
  };
};

export type AuthSession = {
  token: string;
  user: AdminUser;
};

export const AUTH_PASSWORD_MIN_LENGTH = 6;
