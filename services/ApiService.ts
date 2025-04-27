import AuthService from './AuthService';

const API_URL = 'http://localhost:8080/api/';

class ApiService {
  
  private async getAuthHeader(): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    
    try {
      
      let token = null;
      const user = await AuthService.getCurrentUser();
      if (user && user.accessToken) {
        token = user.accessToken;
        
        
        if (this.isTokenExpired(token)) {
          console.log('Token is expired, refreshing...');
          const refreshResult = await AuthService.refreshToken();
          if (refreshResult && refreshResult.accessToken) {
            token = refreshResult.accessToken;
          }
        }
      }
      
      
      if (token) {
        headers.append('authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    return headers;
  }

  private isTokenExpired(token: string): boolean {
    try {
      
      const payload = token.split('.')[1];
      
      const decodedPayload = JSON.parse(atob(payload));
      
      if (decodedPayload.exp) {
        
        return decodedPayload.exp * 1000 < Date.now();
      }
      return false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      
      return true;
    }
  }
  
  
  private extractTokenFromHeader(authHeader?: string | null): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
    
    return null;
  }
  
  
  private async handleResponse(response: Response, initialRequest?: Request): Promise<any> {
    if (response.ok) {
      return await response.json();
    }
    
    
    if (response.status === 401) {
      try {
        const refreshResult = await AuthService.refreshToken();
        
        if (refreshResult && initialRequest) {
          
          const headers = await this.getAuthHeader();
          
          
          if (initialRequest.headers) {
            const authHeader = initialRequest.headers.get('authorization');
            const bearerToken = this.extractTokenFromHeader(authHeader);
            if (!bearerToken && refreshResult.accessToken) {
              headers.set('authorization', `Bearer ${refreshResult.accessToken}`);
            }
          }
          
          const retryResponse = await fetch(response.url, {
            method: initialRequest.method || 'GET',
            headers,
            body: initialRequest.method !== 'GET' && initialRequest.method !== 'HEAD' ? 
                  initialRequest.body : undefined,
          });
          
          return await this.handleResponse(retryResponse);
        }
      } catch (error) {
        
        await AuthService.logout();
        throw new Error('Session expired. Please login again.');
      }
    }
    
    
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Request failed');
    } catch (e) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }
  
  
  async get(endpoint: string, customHeaders?: Headers): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      
      
      if (customHeaders) {
        customHeaders.forEach((value: string, key: string) => {
          headers.append(key, value);
        });
        
        
        const authHeader = customHeaders.get('authorization');
        if (authHeader) {
          const bearerToken = this.extractTokenFromHeader(authHeader);
          if (bearerToken) {
            headers.set('authorization', `Bearer ${bearerToken}`);
          }
        }
      }
      
      const request = new Request(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers,
      });
      
      const response = await fetch(request);
      return await this.handleResponse(response, request);
    } catch (error) {
      console.error(`GET request to ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  
  async post(endpoint: string, data: any, customHeaders?: Headers): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      
      
      if (customHeaders) {
        customHeaders.forEach((value: string, key: string) => {
          headers.append(key, value);
        });
        
        
        const authHeader = customHeaders.get('authorization');
        if (authHeader) {
          const bearerToken = this.extractTokenFromHeader(authHeader);
          if (bearerToken) {
            headers.set('authorization', `Bearer ${bearerToken}`);
          }
        }
      }
      
      const request = new Request(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      
      const response = await fetch(request);
      return await this.handleResponse(response, request);
    } catch (error) {
      console.error(`POST request to ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  
  async put(endpoint: string, data: any, customHeaders?: Headers): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      
      
      if (customHeaders) {
        customHeaders.forEach((value: string, key: string) => {
          headers.append(key, value);
        });
        
        
        const authHeader = customHeaders.get('authorization');
        if (authHeader) {
          const bearerToken = this.extractTokenFromHeader(authHeader);
          if (bearerToken) {
            headers.set('authorization', `Bearer ${bearerToken}`);
          }
        }
      }
      
      const request = new Request(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
      
      const response = await fetch(request);
      return await this.handleResponse(response, request);
    } catch (error) {
      console.error(`PUT request to ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  
  async delete(endpoint: string, customHeaders?: Headers): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      
      
      if (customHeaders) {
        customHeaders.forEach((value: string, key: string) => {
          headers.append(key, value);
        });
        
        
        const authHeader = customHeaders.get('authorization');
        if (authHeader) {
          const bearerToken = this.extractTokenFromHeader(authHeader);
          if (bearerToken) {
            headers.set('authorization', `Bearer ${bearerToken}`);
          }
        }
      }
      
      const request = new Request(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
      
      const response = await fetch(request);
      return await this.handleResponse(response, request);
    } catch (error) {
      console.error(`DELETE request to ${endpoint} failed:`, error);
      throw error;
    }
  }
}

const apiService = new ApiService();
export default apiService;