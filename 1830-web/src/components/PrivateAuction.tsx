import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Private Company Auction</h2>
      
      {/* Current Player Turn */}
      {currentPlayer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-700">
              {currentPlayer.name}'s Turn
            </h3>
            <div className="text-sm text-blue-600 mt-1">
              <span>Available Cash: ${getAvailableCash(currentPlayer.id)}</span>
              {currentPlayerBids.length > 0 && (
                <div className="ml-4 text-yellow-700">
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
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 bg-white'
              }`}
            >
              {/* Company Header */}
              <div className="text-center mb-3">
                <h4 className="font-bold text-gray-800">{companyData?.name}</h4>
                {isCheapest && (
                  <div className="text-xs text-green-600 font-semibold">CHEAPEST</div>
                )}
              </div>

              {/* Company Details */}
              <div className="text-center mb-3">
                <div className="text-sm text-gray-600">
                  <div>Face Value: ${companyData?.cost}</div>
                  <div>Revenue: ${companyData?.revenue}</div>
                  {!isCheapest && (
                    <>
                      <div>High Bid: ${highestBid} ({highestBidder})</div>
                      <div>Min Bid: ${minBid}</div>
                    </>
                  )}
                  {isCheapest && privateCompany.currentPrice < (companyData?.cost || 0) && (
                    <div className="text-red-600 font-semibold">
                      Reduced from ${companyData?.cost}!
                    </div>
                  )}
                </div>
              </div>

              {/* Current Bids */}
              {!isCheapest && (() => {
                const currentBids = auctionState.playerBids.filter(bid => bid.privateCompanyId === privateCompany.id);
                return currentBids.length > 0 && (
                  <div className="text-xs text-blue-600 italic mb-2">
                    Bids: {currentBids.map(bid => {
                      const bidder = players.find(p => p.id === bid.playerId);
                      return `${bidder?.name}: $${bid.amount}`;
                    }).join('\n')}
                  </div>
                );
              })()}

              {/* Special Effect */}
              {companyData?.effect && (
                <div className="text-xs text-gray-600 italic border-t pt-2 mb-3">
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
                    className="w-full py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                        className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                      >
                        -
                      </button>
                      <div 
                        className="flex-1 text-center py-1 bg-blue-50 border border-blue-300 rounded font-semibold text-blue-800"
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
                        className="w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleBidOnCompany(privateCompany.id)}
                      disabled={!canBidOnCompany(privateCompany.id)}
                      className="w-full py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed"
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
          className="w-full py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
        >
          Pass Turn
        </button>
      </div>

      {/* Player Status */}
      <div className="mt-6">
        <h4 className="font-semibold mb-2">Player Status</h4>
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
                    ? 'bg-blue-100 border border-blue-300' 
                    : 'bg-gray-50'
                }`}
              >
                <div>
                  <span className="font-medium">
                    {player.name}
                    {index === auctionState.currentPlayerIndex && ' (Current)'}
                  </span>
                  
                  {/* Show owned private companies */}
                  {player.privateCompanies.length > 0 && (
                    <div className="text-xs text-green-700">
                      {player.privateCompanies.map((pc) => (
                        <div key={pc.id}>
                          Bought {pc.name} for ${(pc as any).purchasePrice || pc.cost}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show active bids */}
                  {playerBids.length > 0 && (
                    <div className="text-xs text-yellow-700">
                      {playerBids.map((bid) => (
                        <div key={bid.privateCompanyId}>
                          ${bid.amount} on {getPrivateCompanyData(bid.privateCompanyId)?.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-right">
                  <div className="text-gray-600">Available: ${availableCash}</div>
                  {lockedAmount > 0 && (
                    <div className="text-yellow-600 text-xs">Locked: ${lockedAmount}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auction Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <h5 className="font-semibold text-sm mb-1">Auction Progress</h5>
        <p className="text-xs text-gray-600">
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-red-600">Bid-Off in Progress!</h2>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-red-700 mb-2">
            {privateCompany?.name}
          </h3>
          <div className="text-lg text-red-600">
            Current High Bid: <span className="font-bold">${bidOffState.currentBid}</span> by {currentBidder?.name}
          </div>
          <div className="text-sm text-red-500 mt-2">
            Participants: {bidOffState.participantIds.map((id: string) => 
              players.find(p => p.id === id)?.name
            ).join(' vs ')}
          </div>
        </div>
      </div>

      {currentPlayer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-700">
              {currentPlayer.name}'s Turn
            </h3>
            <div className="text-sm text-blue-600 mt-1">
              Available Cash: ${currentPlayer.cash}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBidAmount(Math.max(bidOffState.currentBid + 5, bidAmount - 5))}
            className="w-12 h-12 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            -
          </button>
          <div className="flex-1 text-center py-2 bg-blue-50 border border-blue-300 rounded font-semibold text-blue-800">
            ${bidAmount}
          </div>
          <button
            onClick={() => setBidAmount(bidAmount + 5)}
            className="w-12 h-12 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            +
          </button>
        </div>
        
        <button
          onClick={handleBid}
          disabled={bidAmount <= bidOffState.currentBid || (currentPlayer?.cash || 0) < bidAmount}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Bid ${bidAmount}
        </button>
        
        <button
          onClick={handlePass}
          className="w-full py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
        >
          Pass
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Minimum bid: ${bidOffState.currentBid + 5}</p>
        <p>All tied players must bid or pass. Last bidder wins!</p>
      </div>
    </div>
  );
};