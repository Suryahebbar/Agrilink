'use client';

import { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Notification, { NotificationType } from '@/components/Notification';

interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  notify: (message: string, type?: NotificationType, options?: { autoDismiss?: boolean; dismissTime?: number }) => void;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const notify = useCallback((
    message: string, 
    type: NotificationType = 'info', 
    { autoDismiss = true, dismissTime = 5000 } = {}
  ) => {
    const id = uuidv4();
    
    setNotifications(prev => [
      ...prev, 
      { 
        id, 
        message, 
        type,
        autoDismiss,
        dismissTime
      } as any
    ]);

    if (autoDismiss) {
      setTimeout(() => {
        dismissNotification(id);
      }, dismissTime);
    }
  }, [dismissNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismissNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 w-80 space-y-2">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
            onDismiss={dismissNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
