export type UserRole = 'ADMIN' | 'KETUA_BRS' | 'PENGELOLA';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  roles: UserRole[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
}
