import { Platform } from 'react-native';
import { API_URL } from '@/constants/Config';

interface NetworkDiagnostics {
  isConnected: boolean;
  latency: number | null;
  serverReachable: boolean;
  timestamp: Date;
  error?: string;
}

class NetworkDiagnosticsService {
  private lastCheck: NetworkDiagnostics | null = null;

  async performDiagnostics(): Promise<NetworkDiagnostics> {
    const diagnostics: NetworkDiagnostics = {
      isConnected: false,
      latency: null,
      serverReachable: false,
      timestamp: new Date(),
    };

    try {
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);
      const endTime = Date.now();
      diagnostics.latency = endTime - startTime;

      if (response.ok) {
        diagnostics.isConnected = true;
        diagnostics.serverReachable = true;
      } else {
        diagnostics.error = `Server returned status: ${response.status}`;
        console.warn(`⚠️ Server issue: ${diagnostics.error}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          diagnostics.error =
            'Request timeout - Network may be slow or unreliable';
        } else if (error.message.includes('fetch')) {
          diagnostics.error = 'Network fetch failed - No internet connection';
        } else {
          diagnostics.error = error.message;
        }
      } else {
        diagnostics.error = 'Unknown network error';
      }
      console.error(`❌ Network diagnostics failed: ${diagnostics.error}`);
    }

    this.lastCheck = diagnostics;
    return diagnostics;
  }

  async quickConnectivityCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_URL}/api/health`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  getLastDiagnostics(): NetworkDiagnostics | null {
    return this.lastCheck;
  }

  logNetworkInfo(): void {
    if (this.lastCheck) {
      if (this.lastCheck.error) {
      }
    }
  }

  async testAudioStreaming(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return true;
      } else {
        console.warn(`⚠️ Audio streaming failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Audio streaming test failed:', error);
      return false;
    }
  }
}

export const networkDiagnostics = new NetworkDiagnosticsService();
export default networkDiagnostics;
