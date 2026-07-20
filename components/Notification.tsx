'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  id: string;
  message: string;
  type: NotificationType;
  onDismiss: (id: string) => void;
  autoDismiss?: boolean;
  dismissTime?: number;
}

export default function Notification({
  id,
  message,
  type = 'info',
  onDismiss,
  autoDismiss = true,
  dismissTime = 5000,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoDismiss) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(id), 300);
    }, dismissTime);

    return () => clearTimeout(timer);
  }, [autoDismiss, dismissTime, id, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };

  const iconMap = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />,
    error: <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />,
  };

  const bgColorMap = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    warning: 'bg-yellow-50',
    info: 'bg-blue-50',
  };

  const textColorMap = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  };

  if (!isVisible) return null;

  return (
    <div className={`rounded-md p-4 ${bgColorMap[type]} mb-2`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {iconMap[type]}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${textColorMap[type]}`}>
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex rounded-md ${bgColorMap[type]} p-1.5 ${textColorMap[type]} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type}-50 focus:ring-${type}-600`}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
