import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useColors } from '../styles/colors';

export const AuctionSummary: React.FC = () => {
  const { auctionSummary, continueToStockRound, players } = useGameStore();
  const colors = useColors();

  if (!auctionSummary) {
    return <div>No auction summary available</div>;
  }

  const soldCompanies = auctionSummary.results.filter(r => r.outcome === 'sold');

  // Group companies by player
  const companiesByPlayer = soldCompanies.reduce((acc, company) => {
    const buyerId = company.buyerId!;
    if (!acc[buyerId]) {
      acc[buyerId] = {
        buyerName: company.buyerName!,
        companies: []
      };
    }
    acc[buyerId].companies.push(company);
    return acc;
  }, {} as Record<string, { buyerName: string; companies: typeof soldCompanies }>);

  // Create entries for all players, even those with no companies
  const allPlayerEntries = players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    companies: companiesByPlayer[player.id]?.companies || []
  }));

  return (
    <div className={`${colors.card.background} rounded-lg shadow-lg p-6`}>
      <h2 className={`text-2xl font-bold text-center mb-6 ${colors.text.primary}`}>Private Company Auction Results</h2>
      
              <div className="mb-6">
          <h3 className={`text-lg font-semibold ${colors.auctionSummary.title} mb-3`}>Companies by Player</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allPlayerEntries.map((playerData) => (
              <div key={playerData.playerId} className={`${colors.auctionSummary.playerCard.background} ${colors.auctionSummary.playerCard.border} rounded p-4`}>
                <div className={`font-semibold ${colors.auctionSummary.playerCard.title} text-lg mb-3`}>
                  {playerData.playerName}
                </div>
                              {playerData.companies.length > 0 ? (
                  <div className="space-y-2">
                    {playerData.companies.map((company) => (
                      <div key={company.companyId} className={`${colors.auctionSummary.companyCard.background} ${colors.auctionSummary.companyCard.border} rounded p-2`}>
                        <div className={`font-medium ${colors.auctionSummary.companyCard.name}`}>{company.companyName}</div>
                        <div className={`text-sm ${colors.auctionSummary.companyCard.price}`}>
                          Purchased for ${company.price}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`${colors.auctionSummary.empty} italic text-sm`}>
                    No companies purchased
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={continueToStockRound}
          className={`${colors.button.primary} font-semibold py-3 px-6 rounded-md`}
        >
          Continue to Stock Round
        </button>
      </div>
    </div>
  );
};
