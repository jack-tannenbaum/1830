import React from 'react';
import { useGameStore } from '../store/gameStore';

export const PrivateResolution: React.FC = () => {
  const { 
    resolvingCompanyId, 
    auctionState, 
    players, 
    bank,
    resolveNextCompany 
  } = useGameStore();

  if (!resolvingCompanyId || !auctionState) {
    return <div>No company to resolve</div>;
  }

  const company = auctionState.privateCompanies.find(pc => pc.id === resolvingCompanyId);
  const companyData = bank.privateCompanies.find(pc => pc.id === resolvingCompanyId);
  const bids = auctionState.playerBids.filter(bid => bid.privateCompanyId === resolvingCompanyId);

  if (!company || !companyData) {
    return <div>Company not found</div>;
  }

  const getBidderName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Resolving Private Company</h2>
      
      {/* Company Card */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-blue-800 mb-2">{companyData.name}</h3>
          <div className="text-sm text-blue-600 mb-4">
            <div>Face Value: ${companyData.cost}</div>
            <div>Revenue: ${companyData.revenue}</div>
            {companyData.effect && (
              <div className="mt-2 text-xs italic border-t pt-2">
                {companyData.effect}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Status */}
      <div className="text-center mb-6">
        {bids.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">No Bids</h4>
            <p className="text-yellow-600">This company will remain unsold</p>
          </div>
        ) : bids.length === 1 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-800 mb-2">Single Bid</h4>
            <p className="text-green-600">
              {getBidderName(bids[0].playerId)} will buy {companyData.name} for ${bids[0].amount}
            </p>
          </div>
        ) : (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-orange-800 mb-2">Multiple Bids</h4>
            <p className="text-orange-600 mb-2">Bid-off required between:</p>
            <div className="space-y-1">
              {bids.map((bid) => (
                <div key={bid.playerId} className="text-sm">
                  {getBidderName(bid.playerId)}: ${bid.amount}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={resolveNextCompany}
          className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700"
        >
          {bids.length === 0 ? 'Continue' : bids.length === 1 ? 'Award Company' : 'Start Bid-Off'}
        </button>
      </div>
    </div>
  );
};
