import React from 'react';
import { useGameStore } from '../store/gameStore';

export const AuctionSummary: React.FC = () => {
  const { auctionSummary, continueToStockRound } = useGameStore();

  if (!auctionSummary) {
    return <div>No auction summary available</div>;
  }

  const soldCompanies = auctionSummary.results.filter(r => r.outcome === 'sold');
  const unsoldCompanies = auctionSummary.results.filter(r => r.outcome === 'unsold');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Private Company Auction Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Sold Companies */}
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-3">Companies Sold</h3>
          {soldCompanies.length > 0 ? (
            <div className="space-y-2">
              {soldCompanies.map((result) => (
                <div key={result.companyId} className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="font-semibold text-green-800">{result.companyName}</div>
                  <div className="text-sm text-green-600">
                    Sold to {result.buyerName} for ${result.price}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No companies were sold</div>
          )}
        </div>

        {/* Unsold Companies */}
        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-3">Companies Unsold</h3>
          {unsoldCompanies.length > 0 ? (
            <div className="space-y-2">
              {unsoldCompanies.map((result) => (
                <div key={result.companyId} className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="font-semibold text-red-800">{result.companyName}</div>
                  <div className="text-sm text-red-600">
                    Face value: ${result.price} (not sold)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">All companies were sold</div>
          )}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={continueToStockRound}
          className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700"
        >
          Continue to Stock Round
        </button>
      </div>
    </div>
  );
};
