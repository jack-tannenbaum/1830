import React, { useEffect, useState } from 'react';
import { useColors } from '../styles/colors';

export type NotificationType = 'bid' | 'purchase' | 'info' | 'warning';

interface NotificationPopupProps {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  onClose: () => void;
  index: number; // Position in the stack
  duration?: number; // Auto-close duration in ms
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ 
  title, 
  message, 
  type,
  onClose,
  index,
  duration = 4000
}) => {
  const colors = useColors();
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mount the component first
    setIsMounted(true);
    
    // Then slide in and fade in
    const entranceTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    // Auto-remove after duration
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      // Wait for fade-out animation to complete
      setTimeout(() => {
        onClose();
      }, 500);
    }, duration);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(exitTimer);
    };
  }, [onClose, duration]);

           const getNotificationColors = () => {
           switch (type) {
             case 'bid': return colors.notification.bid;
             case 'purchase': return colors.notification.purchase;
             case 'warning': return colors.notification.warning;
             case 'info': return colors.notification.info;
             default: return colors.notification.info;
           }
         };

         const notificationColors = getNotificationColors();

  return (
    <div 
      className={`fixed transition-all duration-500 ease-out z-50 ${
        isMounted ? 'translate-y-0' : 'translate-y-full'
      } ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ 
        bottom: `${20 + (index * 80)}px`, // Stack from bottom right, 80px apart
        right: '20px',
        width: '400px',
        maxWidth: 'calc(100vw - 40px)', // Ensure it doesn't overflow the viewport
        position: 'fixed' // Explicitly set position
      }}
    >
                   <div className={`rounded-lg shadow-lg border-l-4 p-4 ${notificationColors.background} ${notificationColors.border}`}>
               <div className="flex items-center justify-between">
                 <div>
                   <div className={`font-semibold text-lg ${notificationColors.title}`}>
                     {title}
                   </div>
                   <div className={`text-sm ${notificationColors.text}`}>
                     {message}
                   </div>
                 </div>
          <button 
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};
