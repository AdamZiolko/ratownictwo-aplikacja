// services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/Config';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  accessToken: string;
  refreshToken?: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

const BASE_API = API_URL;            
const AUTH_ROUTE = `${BASE_API}/auth`;         
const SESSION_ROUTE = `${BASE_API}/sessions`;    

export const getSession = async (code: string): Promise<any> => {
  const resp = await fetch(`${SESSION_ROUTE}/code/${code}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!resp.ok) throw new Error(`Session fetch failed: ${resp.status}`);
  return resp.json();
};

export const signup = async (data: RegisterData): Promise<any> => {
  const resp = await fetch(`${AUTH_ROUTE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.message || 'Signup failed');
  }
  return resp.json();
};

export const signin = async (data: LoginData): Promise<User> => {
  const resp = await fetch(`${AUTH_ROUTE}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.message || 'Signin failed');
  }
  const userData: User = await resp.json();

  await AsyncStorage.setItem('user', JSON.stringify(userData));
  if (userData.refreshToken) {
    await AsyncStorage.setItem('refreshToken', userData.refreshToken);
  }
  return userData;
};

export const register = async (data: RegisterData): Promise<any> => {

  return signup(data);
};

export const login = async (data: LoginData): Promise<User> => {
  return signin(data);
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('refreshToken');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const userStr = await AsyncStorage.getItem('user');
  return userStr ? JSON.parse(userStr) as User : null;
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};

export const refreshToken = async (): Promise<TokenRefreshResponse | null> => {
  const rt = await AsyncStorage.getItem('refreshToken');
  if (!rt) return null;

  const resp = await fetch(`${AUTH_ROUTE}/refreshtoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: rt }),
  });
  if (!resp.ok) {
    await logout();
    throw new Error('Session expired');
  }
  const data: TokenRefreshResponse = await resp.json();

  const userStr = await AsyncStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr) as User;
    user.accessToken = data.accessToken;
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }
  await AsyncStorage.setItem('refreshToken', data.refreshToken);
  return data;
};

const AuthService = {
  getSession,
  signup,
  signin,
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  refreshToken,
};
export default AuthService;