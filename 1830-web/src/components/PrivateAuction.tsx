import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const PrivateAuction: React.FC = () => {
  const { 
    auctionState, 
    players, 
    bank,
    buyCheapestPrivate,
    bidOnPrivate, 
    passPrivateAuction 
  } = useGameStore();
  
  const [bidAmounts, setBidAmounts] = useState<{ [key: string]: number }>({});

  if (!auctionState) {
    return <div>No auction in progress</div>;
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
    const privateCo = auctionState.privateCompanies.find(pc => pc.id === privateCompanyId);
    return Math.max(...bids.map(bid => bid.amount), privateCo?.currentPrice || 0);
  };

  const getHighestBidder = (privateCompanyId: string): string => {
    const bids = auctionState.playerBids.filter(bid => bid.privateCompanyId === privateCompanyId);
    if (bids.length === 0) return 'None';
    const highestBid = Math.max(...bids.map(bid => bid.amount));
    const bidder = bids.find(bid => bid.amount === highestBid);
    const player = players.find(p => p.id === bidder?.playerId);
    return player?.name || 'Unknown';
  };

  const getCurrentPlayerBid = (): { companyId: string; amount: number } | null => {
    if (!currentPlayer) return null;
    const bid = auctionState.playerBids.find(bid => bid.playerId === currentPlayer.id);
    return bid ? { companyId: bid.privateCompanyId, amount: bid.amount } : null;
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
    const amount = bidAmounts[companyId];
    if (currentPlayer && amount) {
      if (bidOnPrivate(currentPlayer.id, companyId, amount)) {
        setBidAmounts({ ...bidAmounts, [companyId]: getMinBidForCompany(companyId) });
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
    const amount = bidAmounts[companyId] || getMinBidForCompany(companyId);
    return getAvailableCash(currentPlayer.id) >= amount && amount >= getMinBidForCompany(companyId);
  };

  const currentPlayerBid = getCurrentPlayerBid();

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
              {currentPlayerBid && (
                <span className="ml-4 text-yellow-700">
                  Current Bid: ${currentPlayerBid.amount} on {getPrivateCompanyData(currentPlayerBid.companyId)?.name}
                </span>
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
          const currentBidAmount = bidAmounts[privateCompany.id] || minBid;
          
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
                    }).join(', ')}
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
                        onClick={() => initializeBidAmount(privateCompany.id)}
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
            const playerBid = auctionState.playerBids.find(bid => bid.playerId === player.id);
            
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
                  {playerBid && (
                    <div className="text-xs text-yellow-700">
                      Bid: ${playerBid.amount} on {getPrivateCompanyData(playerBid.privateCompanyId)?.name}
                    </div>
                  )}
                </div>
                <div className="text-sm text-right">
                  <div className="text-gray-600">Available: ${availableCash}</div>
                  {lockedAmount > 0 && (
                    <div className="text-yellow-600 text-xs">Locked: ${lockedAmount}</div>
                  )}
                  {player.privateCompanies.length > 0 && (
                    <div className="text-xs bg-green-200 px-1 rounded mt-1">
                      Owns: {player.privateCompanies.map(pc => pc.name.split(' ')[0]).join(', ')}
                    </div>
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