import { useGameStore } from '../store/gameStore';

const LEVEL_STYLES = {
  info: 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
  success: 'bg-green-100 border-green-500 text-green-900 dark:bg-green-900 dark:text-green-100',
  warning: 'bg-yellow-100 border-yellow-500 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100',
  error: 'bg-red-100 border-red-500 text-red-900 dark:bg-red-900 dark:text-red-100',
} as const;

export function NotificationPopup() {
  const notifications = useGameStore((state) => state.notifications);
  const dismissNotification = useGameStore((state) => state.dismissNotification);

  if (notifications.length === 0) {
    return null;
  }

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
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role="status"
          className={`flex items-start justify-between rounded-lg border-l-4 shadow-lg p-4 ${LEVEL_STYLES[notification.type]}`}
        >
          <div className="text-sm flex-1 pr-2 break-words">{notification.message}</div>
          <button
            type="button"
            onClick={() => dismissNotification(notification.id)}
            aria-label="Dismiss notification"
            className="ml-2 text-lg leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
