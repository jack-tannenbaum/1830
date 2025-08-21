import React, { useEffect, useState } from 'react';
import { useColors } from '../styles/colors';

interface BidPopupProps {
  companyName: string;
  playerName: string;
  amount: number;
  onClose: () => void;
  index: number; // Position in the stack
}

export const BidPopup: React.FC<BidPopupProps> = ({ 
  companyName, 
  playerName, 
  amount, 
  onClose,
  index
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const colors = useColors();

  useEffect(() => {
    // Slide in
    setIsVisible(true);
    
    // Auto-remove after 3 seconds (shorter than purchase popups)
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for slide-out animation to complete
      setTimeout(() => {
        onClose();
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed transition-all duration-300 ease-out z-50 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ 
        bottom: `${20 + (index * 80)}px`, // Stack from bottom right, 80px apart
        right: '20px',
        width: '400px',
        maxWidth: 'calc(100vw - 40px)', // Ensure it doesn't overflow the viewport
        position: 'fixed' // Explicitly set position
      }}
    >
      <div className={`rounded-lg shadow-lg border-l-4 p-4 ${colors.card.background} ${colors.notification.bid.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`font-semibold text-lg ${colors.notification.bid.title}`}>
              {companyName}
            </div>
            <div className={`text-sm ${colors.notification.bid.text}`}>
              {playerName} bid ${amount}
            </div>
          </div>
          <button 
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className={`transition-colors ${colors.text.tertiary} hover:${colors.text.secondary}`}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

