import AuthService from './AuthService';

const API_URL = 'http://localhost:8080/api/';

class ApiService {
  // Helper method to get authentication headers
  private async getAuthHeader(): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    
    try {
      // First try to get token from AuthService
      let token = null;
      const user = await AuthService.getCurrentUser();
      if (user && user.accessToken) {
        token = user.accessToken;
        
        // Check if token is expired and refresh if needed
        if (this.isTokenExpired(token)) {
          console.log('Token is expired, refreshing...');
          const refreshResult = await AuthService.refreshToken();
          if (refreshResult && refreshResult.accessToken) {
            token = refreshResult.accessToken;
          }
        }
      }
      
      // If token exists, add it to headers
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
      // JWT tokens are in three parts: header.payload.signature
      const payload = token.split('.')[1];
      // Decode the base64 payload
      const decodedPayload = JSON.parse(atob(payload));
      // Check if the token has an expiration time
      if (decodedPayload.exp) {
        // exp is in seconds, Date.now() is in milliseconds
        return decodedPayload.exp * 1000 < Date.now();
      }
      return false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      // If we can't decode the token, assume it's expired to be safe
      return true;
    }
  }
  
  // Extract token from authorization header
  private extractTokenFromHeader(authHeader?: string | null): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }
    
    return null;
  }
  
  // Handle API response with token refresh if needed
  private async handleResponse(response: Response, initialRequest?: Request): Promise<any> {
    if (response.ok) {
      return await response.json();
    }
    
    // If unauthorized, try to refresh token
    if (response.status === 401) {
      try {
        const refreshResult = await AuthService.refreshToken();
        
        if (refreshResult && initialRequest) {
          // Retry the original request with new token
          const headers = await this.getAuthHeader();
          
          // Extract authorization header from the response if available
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
        // Token refresh failed, logout user
        await AuthService.logout();
        throw new Error('Session expired. Please login again.');
      }
    }
    
    // Handle other errors
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Request failed');
    } catch (e) {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }
  
  // GET request with authentication
  async get(endpoint: string, customHeaders?: Headers): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      
      // Add any custom headers provided
      if (customHeaders) {
        customHeaders.forEach((value: string, key: string) => {
          headers.append(key, value);
        });
        
        // Check if there's an authorization header in custom headers
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
  
  // POST request with authentication
  async post(endpoint: string, data: any, customHeaders?: Headers): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      
      // Add any custom headers provided
      if (customHeaders) {
        customHeaders.forEach((value: string, key: string) => {
          headers.append(key, value);
        });
        
        // Check if there's an authorization header in custom headers
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
  
  // PUT request with authentication
  async put(endpoint: string, data: any, customHeaders?: Headers): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      
      // Add any custom headers provided
      if (customHeaders) {
        customHeaders.forEach((value: string, key: string) => {
          headers.append(key, value);
        });
        
        // Check if there's an authorization header in custom headers
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
  
  // DELETE request with authentication
  async delete(endpoint: string, customHeaders?: Headers): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      
      // Add any custom headers provided
      if (customHeaders) {
        customHeaders.forEach((value: string, key: string) => {
          headers.append(key, value);
        });
        
        // Check if there's an authorization header in custom headers
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