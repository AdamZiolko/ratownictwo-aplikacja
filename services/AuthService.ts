import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/Config';

interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
  accessToken: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {    async register(data: RegisterData): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Create error with structured data for better handling
        const error = new Error(JSON.stringify(responseData));
        throw error;
      }
      
      return responseData;
    } catch (error) {
      // If it's already our structured error, re-throw it
      if (error instanceof Error && error.message.startsWith('{')) {
        throw error;
      }
      // Otherwise, wrap in generic error
      throw new Error('Registration failed');
    }
  }    async login(data: LoginData): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Create error with structured data for better handling
        const error = new Error(JSON.stringify(responseData));
        throw error;
      }

      const userData = responseData;
      
      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      if (userData.refreshToken) {
        await AsyncStorage.setItem('refreshToken', userData.refreshToken);
      }
      
      return userData;
    } catch (error) {
      // If it's already our structured error, re-throw it
      if (error instanceof Error && error.message.startsWith('{')) {
        throw error;
      }
      // Otherwise, wrap in generic error
      throw new Error('Login failed');
    }
  }

  
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('refreshToken');
  }

  
  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }

  
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  
  async refreshToken(): Promise<TokenRefreshResponse | null> {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        return null;
      }      const response = await fetch(`${API_URL}/api/auth/refreshtoken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await this.logout();
        throw new Error('Session expired');
      }

      const data: TokenRefreshResponse = await response.json();
      
      
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.accessToken = data.accessToken;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      
      return data;
    } catch (error) {
      await this.logout();
      throw error;
    }
  }
}

export default new AuthService();