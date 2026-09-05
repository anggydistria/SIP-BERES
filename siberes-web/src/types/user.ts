export type UserRole = 'ADMIN' | 'KETUA_BRS' | 'PENGELOLA';

export interface User {
  id: number;
  name: string;
  username: string;
  isActive: boolean;
  roles: UserRole[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  password: string;
  roles: UserRole[];
}

export interface UpdateUserPayload {
  name?: string;
  username?: string;
  password?: string;
  roles?: UserRole[];
}

export interface UpdateUserStatusResponse {
  message: string;

  user: {
    id: number;
    name: string;
    username: string;
    isActive: boolean;
    updatedAt: string;
  };
}
