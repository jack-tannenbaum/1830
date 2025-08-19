import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';
import { STOCK_MARKET_GRID, STOCK_MARKET_COLOR_GRID } from '../types/constants';
import type { Corporation } from '../types/game';

interface StockMarketDisplayProps {
  onCorporationClick?: (corporation: Corporation) => void;
  selectedCorporationId?: string;
  className?: string;
}

export const StockMarketDisplay: React.FC<StockMarketDisplayProps> = ({ 
  onCorporationClick, 
  selectedCorporationId,
  className = ""
}) => {
  const { corporations, stockMarket } = useGameStore();
  const colors = useColors();

  const getCellStyle = (value: string | null, rowIndex: number, colIndex: number) => {
    if (!value) return {};
    
    // Get color from the color grid
    const color = STOCK_MARKET_COLOR_GRID[rowIndex]?.[colIndex];
    if (!color) return {};
    
    // Map color names to CSS variables
    switch (color) {
      case 'orange': return { backgroundColor: 'var(--stock-orange)' };
      case 'yellow': return { backgroundColor: 'var(--stock-yellow)' };
      case 'red': return { backgroundColor: 'var(--stock-red)' };
      case 'brown': return { backgroundColor: 'var(--stock-brown)' };
      case 'white': return { backgroundColor: 'var(--stock-gray)' };
      default: return {};
    }
  };

  const getCorporationsAtPosition = (rowIndex: number, colIndex: number) => {
    const corporationsAtPosition: Corporation[] = [];
    for (const [corporationId, position] of stockMarket.tokenPositions.entries()) {
      if (position.x === colIndex && position.y === rowIndex) {
        const corporation = corporations.find(corp => corp.id === corporationId);
        if (corporation) {
          corporationsAtPosition.push(corporation);
        }
      }
    }
    return corporationsAtPosition;
  };

  return (
    <div className={`${colors.gameBoard.stockMarket.background} p-4 rounded-lg ${className}`}>
      <div className="grid grid-cols-19 gap-1 text-xs">
        {STOCK_MARKET_GRID.flatMap((row, rowIndex) => 
          row.map((value, colIndex) => {
            const corporationsAtPosition = getCorporationsAtPosition(rowIndex, colIndex);
            const isSelected = corporationsAtPosition.some(corp => corp.id === selectedCorporationId);
            
            // Create hover tooltip content
            const tooltipContent = value 
              ? corporationsAtPosition.length > 0
                ? `$${value} - ${corporationsAtPosition.map(corp => `${corp.name} (${corp.abbreviation})`).join(', ')}`
                : `$${value}`
              : '';
            
            return (
              <div 
                key={`${rowIndex}-${colIndex}`} 
                className={`stock-cell relative ${corporationsAtPosition.length > 0 ? 'group' : ''} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                style={getCellStyle(value, rowIndex, colIndex)}
                title={corporationsAtPosition.length > 0 ? tooltipContent : (value ? `$${value}` : '')}
                onClick={() => {
                  if (corporationsAtPosition.length > 0 && onCorporationClick) {
                    onCorporationClick(corporationsAtPosition[0]); // Click first corporation if multiple
                  }
                }}
              >
                {value || ''}
                {corporationsAtPosition.length > 0 && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center gap-1 p-1">
                      {corporationsAtPosition.map((corporation) => (
                        <div 
                          key={corporation.id}
                          className="flex-shrink-0"
                          style={{ 
                            backgroundColor: corporation.color,
                            borderRadius: '4px',
                            padding: '2px 4px',
                            fontSize: '8px',
                            fontWeight: 'bold',
                            color: 'white',
                            textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                            minWidth: '16px',
                            textAlign: 'center'
                          }}
                        >
                          {corporation.abbreviation}
                        </div>
                      ))}
                    </div>
                    
                    {/* Hover Popup - only when corporations are present */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <div className={`${colors.card.background} ${colors.card.border} rounded-lg shadow-lg p-3 border-2 min-w-max`}>
                        <div className={`text-sm font-semibold ${colors.text.primary} mb-2`}>
                          ${value} - {corporationsAtPosition.length} corporation{corporationsAtPosition.length > 1 ? 's' : ''}
                        </div>
                        <div className="space-y-1">
                          {corporationsAtPosition.map((corporation) => (
                            <div key={corporation.id} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: corporation.color }}
                              />
                              <span className={`text-sm ${colors.text.secondary}`}>
                                {corporation.name} ({corporation.abbreviation})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Arrow pointing down */}
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800 mx-auto"></div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
