/**
 * Utility functions for student session error handling and WebSocket management
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
}

export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBase: 2,
};

/**
 * Executes an async function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, baseDelay, maxDelay, exponentialBase } = {
    ...defaultRetryConfig,
    ...config,
  };

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        break;
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt - 1),
        maxDelay
      );
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Creates a debounced version of a function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

/**
 * Safely handles cleanup operations with error logging
 */
export async function safeCleanup(
  operations: Array<() => Promise<void> | void>,
  operationNames?: string[]
): Promise<void> {
  const results = await Promise.allSettled(
    operations.map(async (op, index) => {
      try {
        await op();
        console.log(`Cleanup operation ${operationNames?.[index] || index} completed`);
      } catch (error) {
        console.warn(`Cleanup operation ${operationNames?.[index] || index} failed:`, error);
        throw error;
      }
    })
  );
  
  const failures = results.filter(result => result.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`${failures.length} cleanup operations failed`);
  }
}

/**
 * Validates WebSocket connection and attempts reconnection if needed
 */
export async function ensureWebSocketConnection(
  socketService: any,
  accessCode?: string
): Promise<boolean> {
  try {
    const status = socketService.getConnectionStatus();
    
    if (!status.connected) {
      console.log('WebSocket not connected, attempting to reconnect...');
      await socketService.connect();
      
      // If we have an access code, rejoin the session
      if (accessCode) {
        const joinResult = await socketService.joinSessionCode(accessCode);
        if (!joinResult.success) {
          console.warn('Failed to rejoin session after reconnection');
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to ensure WebSocket connection:', error);
    return false;
  }
}

/**
 * Enhanced error logging with context
 */
export function logError(
  context: string,
  error: any,
  additionalInfo?: Record<string, any>
): void {
  const errorInfo = {
    context,
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };
  
  console.error(`[${context}] Error:`, errorInfo);
}

/**
 * Type guard for checking if an error is a connection error
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';
  
  return (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('disconnect') ||
    name.includes('network') ||
    name.includes('timeout')
  );
}

/**
 * Creates a promise that resolves after a specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an async function to ensure it doesn't run after component unmounts
 */
export function createMountGuard() {
  let mounted = true;
  
  const guardedAsync = <T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      if (!mounted) {
        console.warn('Attempted to run async operation after component unmounted');
        return undefined;
      }
      return await fn(...args);
    };
  };
  
  const cleanup = () => {
    mounted = false;
  };
  
  const isMounted = () => mounted;
  
  return { guardedAsync, cleanup, isMounted };
}
