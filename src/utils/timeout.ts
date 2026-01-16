export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const startTime = Date.now();
  console.log(`[Timeout] ${operation} started`);

  return Promise.race([
    promise.then((result) => {
      const elapsed = Date.now() - startTime;
      console.log(`[Timeout] ${operation} success in ${elapsed}ms`);
      return result;
    }),
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        console.error(`[Timeout] ${operation} timeout after ${timeoutMs}ms`);
        reject(new TimeoutError(`Operation '${operation}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

export function createTimeoutLogger(pageName: string) {
  return {
    start: (operation: string) => {
      console.log(`[${pageName}] ${operation} start`);
      return Date.now();
    },
    success: (operation: string, startTime: number, count?: number) => {
      const elapsed = Date.now() - startTime;
      const countStr = count !== undefined ? ` (count=${count})` : '';
      console.log(`[${pageName}] ${operation} success in ${elapsed}ms${countStr}`);
    },
    error: (operation: string, startTime: number, error: any) => {
      const elapsed = Date.now() - startTime;
      console.error(`[${pageName}] ${operation} error in ${elapsed}ms`, error);
    },
    timeout: (operation: string, timeoutMs: number) => {
      console.error(`[${pageName}] ${operation} timeout in ${timeoutMs}ms`);
    }
  };
}
