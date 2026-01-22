import api from './api';

export interface LoginResponse {
  token: string;
  expiresInMillis: number;
  id: number;
  username: string;
  role: 'ADMIN' | 'SECRETARIO';
}

const authService = {
  login(username: string, password: string) {
    return api.post<LoginResponse>('/auth/login', { username, password });
  },
};

export default authService;
