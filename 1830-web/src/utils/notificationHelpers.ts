import { useGameStore } from '../store/gameStore';

export interface NotificationOptions {
  title: string;
  message: string;
  duration?: number;
}

export const createNotificationHelpers = () => {
  const { addNotification } = useGameStore.getState();

  return {
    success: (options: NotificationOptions) => {
      addNotification({
        ...options,
        type: 'success',
        duration: options.duration ?? 3000
      });
    },

    warning: (options: NotificationOptions) => {
      addNotification({
        ...options,
        type: 'warning',
        duration: options.duration ?? 5000
      });
    },

    error: (options: NotificationOptions) => {
      addNotification({
        ...options,
        type: 'warning',
        duration: options.duration ?? 5000
      });
    },

    info: (options: NotificationOptions) => {
      addNotification({
        ...options,
        type: 'info',
        duration: options.duration ?? 3000
      });
    },

    // Common notification patterns
    alreadyBoughtThisTurn: () => {
      addNotification({
        title: 'Already Bought This Turn',
        message: 'You have already bought shares this turn',
        type: 'warning',
        duration: 3000
      });
    },

    cannotBuyAfterSelling: (corporationAbbreviation: string) => {
      addNotification({
        title: 'Cannot Buy After Selling',
        message: `You cannot buy ${corporationAbbreviation} shares after selling ${corporationAbbreviation} shares in the same round`,
        type: 'warning',
        duration: 3000
      });
    },

    insufficientCash: (required: number, available: number) => {
      addNotification({
        title: 'Insufficient Cash',
        message: `You need $${required} but only have $${available}`,
        type: 'warning',
        duration: 3000
      });
    },

    corporationStarted: (corporationName: string, parValue: number) => {
      addNotification({
        title: 'Corporation Started',
        message: `${corporationName} has been started with a par value of $${parValue}`,
        type: 'success',
        duration: 3000
      });
    },

    sharePurchased: (corporationName: string, percentage: number, price: number) => {
      addNotification({
        title: 'Share Purchased',
        message: `Purchased ${percentage}% of ${corporationName} for $${price}`,
        type: 'success',
        duration: 3000
      });
    },

    shareSold: (corporationName: string, percentage: number, price: number) => {
      addNotification({
        title: 'Share Sold',
        message: `Sold ${percentage}% of ${corporationName} for $${price}`,
        type: 'info',
        duration: 3000
      });
    }
  };
};
