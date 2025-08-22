import { useColors } from './colors';

export const useButtonStyles = () => {
  const colors = useColors();

  return {
    // Base button styles
    base: 'px-3 py-2 rounded-lg transition-colors duration-300',
    
    // Common button variants
    primary: `${colors.button.primary}`,
    secondary: `${colors.button.secondary}`,
    success: `${colors.button.success}`,
    danger: `${colors.button.danger}`,
    warning: `${colors.button.warning}`,
    disabled: `${colors.button.disabled}`,
    
    // Specific button patterns used throughout the app
    headerButton: `px-3 py-2 rounded-lg transition-colors duration-300`,
    modalButton: 'flex-1 px-3 py-2 rounded-lg transition-colors duration-300',
    actionButton: 'px-4 py-2 rounded-md font-medium transition-colors',
    
    // Game-specific button styles
    stockMarketToggle: colors.gameBoard.toggleButton.stockMarket,
    railwayMapToggle: colors.gameBoard.toggleButton.railwayMap,
    
    // Utility functions for dynamic styling
    withColor: (colorClass: string) => `${colorClass} px-3 py-2 rounded-lg transition-colors duration-300`,
    
    // Responsive button styles
    responsive: 'px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors duration-300 text-sm sm:text-base'
  };
};
