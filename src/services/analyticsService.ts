import { supabase } from '../lib/supabase';

let sessionId: string | null = null;
let sessionStartTime: number | null = null;

export const analyticsService = {
  initSession(): void {
    sessionId = crypto.randomUUID();
    sessionStartTime = Date.now();
  },

  getSessionId(): string {
    if (!sessionId) {
      this.initSession();
    }
    return sessionId!;
  },

  async trackEvent(
    eventType: string,
    eventName: string,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        event_type: eventType,
        event_name: eventName,
        properties: properties || {},
        session_id: this.getSessionId(),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  },

  async trackPageView(path: string, title?: string): Promise<void> {
    await this.trackEvent('page_view', path, {
      title: title || document.title,
      referrer: document.referrer,
      url: window.location.href,
    });
  },

  async trackClick(elementId: string, elementType: string, metadata?: any): Promise<void> {
    await this.trackEvent('click', `${elementType}_${elementId}`, {
      element_id: elementId,
      element_type: elementType,
      ...metadata,
    });
  },

  async trackSearch(query: string, filters: any, resultCount: number): Promise<void> {
    await this.trackEvent('search', 'global_search', {
      query,
      filters,
      result_count: resultCount,
    });
  },

  async trackFormSubmit(formName: string, success: boolean, metadata?: any): Promise<void> {
    await this.trackEvent('form_submit', formName, {
      success,
      ...metadata,
    });
  },

  async trackError(error: Error, context?: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('error_logs').insert({
        user_id: user?.id || null,
        error_type: error.name || 'Error',
        error_message: error.message,
        stack_trace: error.stack || '',
        url: window.location.href,
        user_agent: navigator.userAgent,
        metadata: context || {},
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  },

  async updateUserActivity(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const sessionDuration = sessionStartTime
        ? Math.floor((Date.now() - sessionStartTime) / 60000)
        : 0;

      await supabase.rpc('upsert_user_activity', {
        p_user_id: user.id,
        p_date: today,
        p_session_duration: sessionDuration,
      });
    } catch (error) {
      // Analytics failures should not block the app or spam console
      // console.debug('Failed to update user activity:', error);
    }
  },

  async getUserActivity(days = 30): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('analytics_user_activity')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user activity:', error);
      return [];
    }
  },

  async getErrorLogs(limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  },

  setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { type: 'unhandled_rejection' }
      );
    });
  },

  setupPerformanceTracking(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackEvent('performance', 'page_load', {
              dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              tcp: navEntry.connectEnd - navEntry.connectStart,
              request: navEntry.responseStart - navEntry.requestStart,
              response: navEntry.responseEnd - navEntry.responseStart,
              dom: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              load: navEntry.loadEventEnd - navEntry.loadEventStart,
              total: navEntry.loadEventEnd - navEntry.fetchStart,
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Performance tracking not supported');
      }
    }
  },

  endSession(): void {
    this.updateUserActivity();
    sessionId = null;
    sessionStartTime = null;
  },
};

if (typeof window !== 'undefined') {
  analyticsService.initSession();
  analyticsService.setupErrorTracking();
  analyticsService.setupPerformanceTracking();

  window.addEventListener('beforeunload', () => {
    analyticsService.endSession();
  });

  setInterval(() => {
    analyticsService.updateUserActivity();
  }, 5 * 60 * 1000);
}
