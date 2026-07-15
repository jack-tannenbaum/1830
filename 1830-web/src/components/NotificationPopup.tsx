import { useEffect } from 'react';

import type { UiNotification } from '../engine/adapter-contracts';
import { useGameStore } from '../store/gameStore';

const MAX_VISIBLE_NOTIFICATIONS = 4;

function NotificationToast({
  notification,
  dismiss,
}: {
  notification: UiNotification;
  dismiss: (notificationId: string) => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(
      () => dismiss(notification.id),
      notification.type === 'error' ? 10_000 : 6_000,
    );
    return () => window.clearTimeout(timeout);
  }, [dismiss, notification.id, notification.type]);

  return (
    <div
      role={notification.type === 'error' ? 'alert' : 'status'}
      className="notification-toast flex items-start justify-between rounded-lg border-l-4 p-4 shadow-lg"
      data-level={notification.type}
    >
      <div className="flex-1 break-words pr-2 text-sm">{notification.message}</div>
      <button
        type="button"
        onClick={() => dismiss(notification.id)}
        aria-label="Dismiss notification"
        className="ml-2 text-lg leading-none opacity-70 hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

export function NotificationPopup() {
  const notifications = useGameStore((state) => state.notifications);
  const dismissNotification = useGameStore((state) => state.dismissNotification);

  if (notifications.length === 0) {
    return null;
  }

  const visibleNotifications = notifications.slice(-MAX_VISIBLE_NOTIFICATIONS);
  const hiddenCount = notifications.length - visibleNotifications.length;
  const clearAll = () => {
    notifications.forEach((notification) => dismissNotification(notification.id));
  };

  return (
    <div
      className="fixed z-50 flex flex-col gap-2"
      style={{
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxWidth: 'calc(100vw - 40px)',
      }}
    >
      <div className="flex items-center justify-between px-1 text-xs">
        <span style={{ color: 'var(--text-secondary)' }}>
          {hiddenCount > 0 ? `${hiddenCount} earlier hidden` : 'Notifications'}
        </span>
        <button
          type="button"
          onClick={clearAll}
          className="rounded px-2 py-1 font-medium"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
        >
          Clear all
        </button>
      </div>
      {visibleNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          dismiss={dismissNotification}
        />
      ))}
    </div>
  );
}
