import React, { useEffect, useState } from 'react';

interface PurchasePopupProps {
  companyName: string;
  playerName: string;
  price: number;
  onClose: () => void;
  index: number; // Position in the stack
}

export const PurchasePopup: React.FC<PurchasePopupProps> = ({ 
  companyName, 
  playerName, 
  price, 
  onClose,
  index
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in
    setIsVisible(true);
    
    // Auto-remove after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for slide-out animation to complete
      setTimeout(() => {
        onClose();
      }, 300);
    }, 4000);

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
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-800 text-lg">
              {companyName}
            </div>
            <div className="text-gray-600 text-sm">
              Purchased by {playerName} for ${price}
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
