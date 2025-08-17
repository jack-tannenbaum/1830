import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';

export const PrivateAuction: React.FC = () => {
  const { 
    auctionState, 
    players, 
    bank,
    buyCheapestPrivate,
    bidOnPrivate, 
    passPrivateAuction,
    bidOffBid,
    bidOffPass
  } = useGameStore();
  
  const colors = useColors();
  const [bidAmounts, setBidAmounts] = useState<{ [key: string]: number }>({});

  if (!auctionState) {
    return <div>No auction in progress</div>;
  }

  // If there's a bid-off in progress, show bid-off UI
  if (auctionState.bidOffState) {
    return <BidOffAuction 
      bidOffState={auctionState.bidOffState}
      players={players}
      bank={bank}
      bidOffBid={bidOffBid}
      bidOffPass={bidOffPass}
    />;
  }

  const currentPlayer = players[auctionState.currentPlayerIndex];
  const availablePrivateCompanies = bank.privateCompanies;

  // Get cheapest unowned private company
  const cheapestPrivate = auctionState.privateCompanies
    .filter(pc => !pc.isOwned)
    .sort((a, b) => a.currentPrice - b.currentPrice)[0];

  const getPrivateCompanyData = (id: string) => {
    return availablePrivateCompanies.find(pc => pc.id === id);
  };

  const getHighestBid = (privateCompanyId: string): number => {
    const bids = auctionState.playerBids.filter(bid => bid.privateCompanyId === privateCompanyId);
    if (bids.length === 0) {
      // No bids, return face value
      const privateCo = auctionState.privateCompanies.find(pc => pc.id === privateCompanyId);
      return privateCo?.currentPrice || 0;
    }
    // Return highest bid amount
    return Math.max(...bids.map(bid => bid.amount));
  };

  const getHighestBidder = (privateCompanyId: string): string => {
    const bids = auctionState.playerBids.filter(bid => bid.privateCompanyId === privateCompanyId);
    if (bids.length === 0) return 'None';
    const highestBid = Math.max(...bids.map(bid => bid.amount));
    const bidder = bids.find(bid => bid.amount === highestBid);
    const player = players.find(p => p.id === bidder?.playerId);
    return player?.name || 'Unknown';
  };

  const getCurrentPlayerBids = (): { companyId: string; amount: number }[] => {
    if (!currentPlayer) return [];
    return auctionState.playerBids
      .filter(bid => bid.playerId === currentPlayer.id)
      .map(bid => ({ companyId: bid.privateCompanyId, amount: bid.amount }));
  };

  const getAvailableCash = (playerId: string): number => {
    const player = players.find(p => p.id === playerId);
    const lockedAmount = auctionState.lockedMoney.get(playerId) || 0;
    return (player?.cash || 0) - lockedAmount;
  };

  const getMinBidForCompany = (privateCompanyId: string): number => {
    return getHighestBid(privateCompanyId) + 5;
  };

  const handleBuyCheapest = () => {
    if (currentPlayer && cheapestPrivate) {
      buyCheapestPrivate(currentPlayer.id);
    }
  };

  const handleBidOnCompany = (companyId: string) => {
    const minBid = getMinBidForCompany(companyId);
    const amount = Math.max(bidAmounts[companyId] || minBid, minBid);
    if (currentPlayer && amount) {
      if (bidOnPrivate(currentPlayer.id, companyId, amount)) {
        // Reset the bid amount to the new minimum after successful bid
        const newMinBid = getMinBidForCompany(companyId);
        setBidAmounts({ ...bidAmounts, [companyId]: newMinBid });
      }
    }
  };

  const handlePass = () => {
    if (currentPlayer) {
      passPrivateAuction(currentPlayer.id);
    }
  };

  const adjustBid = (companyId: string, change: number) => {
    const currentBid = bidAmounts[companyId] || getMinBidForCompany(companyId);
    const newBid = Math.max(getMinBidForCompany(companyId), currentBid + change);
    setBidAmounts({ ...bidAmounts, [companyId]: newBid });
  };

  const initializeBidAmount = (companyId: string) => {
    if (!bidAmounts[companyId]) {
      setBidAmounts({ ...bidAmounts, [companyId]: getMinBidForCompany(companyId) });
    }
  };

  const canBuyCheapest = () => {
    return currentPlayer && cheapestPrivate && 
           getAvailableCash(currentPlayer.id) >= cheapestPrivate.currentPrice;
  };

  const canBidOnCompany = (companyId: string) => {
    if (!currentPlayer) return false;
    const minBid = getMinBidForCompany(companyId);
    const amount = Math.max(bidAmounts[companyId] || minBid, minBid);
    const availableCash = getAvailableCash(currentPlayer.id);
    
    return availableCash >= amount && amount >= minBid;
  };

  const currentPlayerBids = getCurrentPlayerBids();

  // Sort companies by price for consistent display
  const sortedCompanies = auctionState.privateCompanies
    .filter(pc => !pc.isOwned)
    .sort((a, b) => a.currentPrice - b.currentPrice);

  return (
    <div className={`${colors.card.background} rounded-lg shadow-lg p-6`}>
      <h2 className={`text-2xl font-bold text-center mb-6 ${colors.text.primary}`}>Private Company Auction</h2>
      
      {/* Current Player Turn */}
      {currentPlayer && (
        <div className={`${colors.auction.currentPlayer.background} ${colors.auction.currentPlayer.border} rounded-lg p-4 mb-6`}>
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${colors.auction.currentPlayer.title}`}>
              {currentPlayer.name}'s Turn
            </h3>
            <div className={`text-sm ${colors.auction.currentPlayer.text} mt-1`}>
              <span>Available Cash: ${getAvailableCash(currentPlayer.id)}</span>
                              {currentPlayerBids.length > 0 && (
                  <div className={`ml-4 ${colors.text.warning}`}>
                    <div className="font-medium">Current Bids:</div>
                    {currentPlayerBids.map((bid) => (
                      <div key={bid.companyId} className="text-sm">
                        ${bid.amount} on {getPrivateCompanyData(bid.companyId)?.name}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Private Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sortedCompanies.map((privateCompany, index) => {
          const companyData = getPrivateCompanyData(privateCompany.id);
          const highestBid = getHighestBid(privateCompany.id);
          const highestBidder = getHighestBidder(privateCompany.id);
          const minBid = getMinBidForCompany(privateCompany.id);
          const isCheapest = privateCompany.id === cheapestPrivate?.id;
          // Ensure bid amount is at least the minimum bid (updates when other players bid)
          const currentBidAmount = Math.max(bidAmounts[privateCompany.id] || minBid, minBid);
          
          return (
                          <div
                key={privateCompany.id}
                className={`border-2 rounded-lg p-4 ${
                  isCheapest 
                    ? `${colors.auction.companyCard.cheapest.border} ${colors.auction.companyCard.cheapest.background}` 
                    : `${colors.auction.companyCard.border} ${colors.auction.companyCard.background}`
                }`}
              >
                {/* Company Header */}
                <div className="text-center mb-3">
                  <h4 className={`font-bold ${colors.auction.companyCard.title}`}>{companyData?.name}</h4>
                  {isCheapest && (
                    <div className={`text-xs ${colors.auction.companyCard.cheapest.label} font-semibold`}>CHEAPEST</div>
                  )}
                </div>

                              {/* Company Details */}
                <div className="text-center mb-3">
                  <div className={`text-sm ${colors.auction.companyCard.text}`}>
                    <div>Face Value: ${companyData?.cost}</div>
                    <div>Revenue: ${companyData?.revenue}</div>
                    {!isCheapest && (
                      <>
                        <div>High Bid: ${highestBid} ({highestBidder})</div>
                        <div>Min Bid: ${minBid}</div>
                      </>
                    )}
                    {isCheapest && privateCompany.currentPrice < (companyData?.cost || 0) && (
                      <div className={`${colors.private.reduced} font-semibold`}>
                        Reduced from ${companyData?.cost}!
                      </div>
                    )}
                  </div>
                </div>

                              {/* Current Bids */}
                {!isCheapest && (() => {
                  const currentBids = auctionState.playerBids.filter(bid => bid.privateCompanyId === privateCompany.id);
                  return currentBids.length > 0 && (
                    <div className={`text-xs ${colors.private.name} italic mb-2`}>
                      Bids: {currentBids.map(bid => {
                        const bidder = players.find(p => p.id === bid.playerId);
                        return `${bidder?.name}: $${bid.amount}`;
                      }).join('\n')}
                    </div>
                  );
                })()}

                              {/* Special Effect */}
                {companyData?.effect && (
                  <div className={`text-xs ${colors.private.effect} italic border-t pt-2 mb-3`}>
                    {companyData.effect}
                  </div>
                )}

                              {/* Action Section */}
                <div className="border-t pt-3">
                  {isCheapest ? (
                    /* Buy Button for Cheapest */
                    <button
                      onClick={handleBuyCheapest}
                      disabled={!canBuyCheapest()}
                      className={`w-full py-2 ${colors.button.success} font-semibold rounded-md disabled:${colors.button.disabled}`}
                    >
                      Buy ${privateCompany.currentPrice}
                    </button>
                  ) : (
                    /* Bid Interface for More Expensive */
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <button
                          onClick={() => adjustBid(privateCompany.id, -5)}
                          disabled={currentBidAmount <= minBid}
                          className={`w-8 h-8 ${colors.button.primary} rounded disabled:${colors.button.disabled}`}
                        >
                          -
                        </button>
                        <div 
                          className={`flex-1 text-center py-1 ${colors.auction.bidInput.background} ${colors.auction.bidInput.border} rounded font-semibold ${colors.auction.bidInput.text}`}
                          onClick={() => {
                            // Update to current minimum bid when clicked
                            setBidAmounts({ ...bidAmounts, [privateCompany.id]: currentBidAmount });
                          }}
                        >
                          ${currentBidAmount}
                        </div>
                        <button
                          onClick={() => adjustBid(privateCompany.id, 5)}
                          disabled={getAvailableCash(currentPlayer?.id || '') < currentBidAmount + 5}
                          className={`w-8 h-8 ${colors.button.primary} rounded disabled:${colors.button.disabled}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => handleBidOnCompany(privateCompany.id)}
                        disabled={!canBidOnCompany(privateCompany.id)}
                        className={`w-full py-2 font-semibold rounded-md ${colors.button.warning} ${colors.button.disabled}`}
                      >
                        Bid ${currentBidAmount}
                      </button>
                    </div>
                  )}
                </div>
            </div>
          );
        })}
      </div>

      {/* Pass Button */}
      <div className="mb-6">
        <button
          onClick={handlePass}
          className={`w-full py-3 ${colors.button.danger} font-semibold rounded-md`}
        >
          Pass Turn
        </button>
      </div>

      {/* Player Status */}
      <div className="mt-6">
        <h4 className={`font-semibold mb-2 ${colors.text.primary}`}>Player Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {players.map((player, index) => {
            const lockedAmount = auctionState.lockedMoney.get(player.id) || 0;
            const availableCash = player.cash - lockedAmount;
            const playerBids = auctionState.playerBids.filter(bid => bid.playerId === player.id);
            
            return (
                              <div 
                  key={player.id}
                  className={`flex justify-between items-center p-2 rounded ${
                    index === auctionState.currentPlayerIndex
                      ? colors.player.current
                      : colors.player.inactive
                  }`}
                >
                  <div>
                    <span className={`font-medium ${colors.player.name}`}>
                      {player.name}
                      {index === auctionState.currentPlayerIndex && ' (Current)'}
                    </span>
                    
                    {/* Show owned private companies */}
                    {player.privateCompanies.length > 0 && (
                      <div className={`text-xs ${colors.text.success}`}>
                        {player.privateCompanies.map((pc) => (
                          <div key={pc.id}>
                            Bought {pc.name} for ${(pc as any).purchasePrice || pc.cost}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Show active bids */}
                    {playerBids.length > 0 && (
                      <div className={`text-xs ${colors.text.warning}`}>
                        {playerBids.map((bid) => (
                          <div key={bid.privateCompanyId}>
                            ${bid.amount} on {getPrivateCompanyData(bid.privateCompanyId)?.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-right">
                    <div className={colors.text.secondary}>Available: ${availableCash}</div>
                    {lockedAmount > 0 && (
                      <div className={`${colors.player.locked} text-xs`}>Locked: ${lockedAmount}</div>
                    )}
                  </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* Auction Summary */}
      <div className={`mt-4 p-3 ${colors.auction.progress.background} rounded`}>
        <h5 className={`font-semibold text-sm mb-1 ${colors.auction.progress.title}`}>Auction Progress</h5>
        <p className={`text-xs ${colors.auction.progress.text}`}>
          {auctionState.privateCompanies.filter(pc => pc.isOwned).length} of 6 companies sold • 
          Consecutive passes: {auctionState.consecutivePasses}
        </p>
      </div>
    </div>
  );
};

// Bid-off component for tied bids
interface BidOffAuctionProps {
  bidOffState: any; // BidOffState type
  players: any[];
  bank: any;
  bidOffBid: (playerId: string, amount: number) => boolean;
  bidOffPass: (playerId: string) => boolean;
}

const BidOffAuction: React.FC<BidOffAuctionProps> = ({ 
  bidOffState, 
  players, 
  bank, 
  bidOffBid, 
  bidOffPass 
}) => {
  const colors = useColors();
  const [bidAmount, setBidAmount] = useState(bidOffState.currentBid + 5);
  
  const currentPlayer = players.find(p => p.id === bidOffState.participantIds[bidOffState.currentPlayerIndex]);
  const currentBidder = players.find(p => p.id === bidOffState.currentBidderId);
  const privateCompany = bank.privateCompanies.find((pc: any) => pc.id === bidOffState.privateCompanyId);
  
  const handleBid = () => {
    if (currentPlayer && bidAmount > bidOffState.currentBid) {
      if (bidOffBid(currentPlayer.id, bidAmount)) {
        setBidAmount(bidAmount + 5);
      }
    }
  };
  
  const handlePass = () => {
    if (currentPlayer) {
      bidOffPass(currentPlayer.id);
    }
  };

  return (
    <div className={`${colors.card.background} rounded-lg ${colors.card.shadow} p-6`}>
      <h2 className={`text-2xl font-bold text-center mb-6 ${colors.text.danger}`}>Bid-Off in Progress!</h2>
      
      <div className={`${colors.notification.warning.background} ${colors.notification.warning.border} rounded-lg p-4 mb-6`}>
        <div className="text-center">
          <h3 className={`text-xl font-semibold mb-2 ${colors.notification.warning.title}`}>
            {privateCompany?.name}
          </h3>
          <div className={`text-lg ${colors.notification.warning.text}`}>
            Current High Bid: <span className="font-bold">${bidOffState.currentBid}</span> by {currentBidder?.name}
          </div>
          <div className={`text-sm mt-2 ${colors.notification.warning.text}`}>
            Participants: {bidOffState.participantIds.map((id: string) => 
              players.find(p => p.id === id)?.name
            ).join(' vs ')}
          </div>
        </div>
      </div>

      {currentPlayer && (
        <div className={`${colors.auction.currentPlayer.background} ${colors.auction.currentPlayer.border} rounded-lg p-4 mb-6`}>
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${colors.auction.currentPlayer.title}`}>
              {currentPlayer.name}'s Turn
            </h3>
            <div className={`text-sm mt-1 ${colors.auction.currentPlayer.text}`}>
              Available Cash: ${currentPlayer.cash}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBidAmount(Math.max(bidOffState.currentBid + 5, bidAmount - 5))}
            className={`w-12 h-12 ${colors.button.primary} rounded`}
          >
            -
          </button>
          <div className={`flex-1 text-center py-2 ${colors.auction.bidInput.background} ${colors.auction.bidInput.border} rounded font-semibold ${colors.auction.bidInput.text}`}>
            ${bidAmount}
          </div>
          <button
            onClick={() => setBidAmount(bidAmount + 5)}
            className={`w-12 h-12 ${colors.button.primary} rounded`}
          >
            +
          </button>
        </div>
        
        <button
          onClick={handleBid}
          disabled={bidAmount <= bidOffState.currentBid || (currentPlayer?.cash || 0) < bidAmount}
                          className={`w-full py-3 font-semibold rounded-md ${colors.button.success} ${colors.button.disabled}`}
        >
          Bid ${bidAmount}
        </button>
        
        <button
          onClick={handlePass}
          className={`w-full py-3 font-semibold rounded-md ${colors.button.danger}`}
        >
          Pass
        </button>
      </div>

      <div className={`mt-6 text-center text-sm ${colors.text.tertiary}`}>
        <p>Minimum bid: ${bidOffState.currentBid + 5}</p>
        <p>All tied players must bid or pass. Last bidder wins!</p>
      </div>
    </div>
  );
};