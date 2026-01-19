import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';
import { Button } from './ui/Button';
import localizationUtils from '../utils/localization';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';

export function NotificationCenter() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }

    const subscription = user
      ? notificationService.subscribeToNotifications((_payload) => {
          loadNotifications();
          loadUnreadCount();
        })
      : null;

    const interval = setInterval(() => {
      if (user) {
        loadUnreadCount();
      }
    }, 30000);

    return () => {
      if (subscription) {
        subscription.then((channel: any) => {
          if (channel) notificationService.unsubscribeFromNotifications(channel);
        });
      }
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      if (!user) {
        setNotifications([]);
        return;
      }
      const data = await notificationService.getNotifications(20);
      setNotifications(data);
    } catch (error) {
      const msg = String(error || '');
      if (!msg.includes('Not authenticated')) {
        console.error('Failed to load notifications:', error);
      }
    }
  };

  const loadUnreadCount = async () => {
    try {
      if (!user) {
        setUnreadCount(0);
        return;
      }
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      const msg = String(error || '');
      if (!msg.includes('Not authenticated')) {
        console.error('Failed to load unread count:', error);
      }
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await notificationService.markAllAsRead();
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    if (notification.link_url) {
      navigate(notification.link_url);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      messages: '💬',
      applications: '📄',
      events: '📅',
      marketplace: '🛒',
      visa_updates: '✈️',
      au_pair_matches: '👶',
      system: '🔔',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{t('notifications.title')}</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {t('notifications.markAllRead')}
                </Button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>{t('notifications.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {localizationUtils.formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('notifications.viewAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
