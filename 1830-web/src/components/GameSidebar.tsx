import type { GameState, PlayerId } from '../engine/model';
import {
  getCorporationOwnership,
  getCorporationPresident,
  getPlayerCertificateCount,
} from '../engine/selectors';
import { useColors } from '../styles/colors';

interface GameSidebarProps {
  game: GameState;
}

function currentPlayerId(game: GameState): PlayerId | null {
  if (game.round === 'privateAuction') {
    return game.auction?.bidOff?.currentActorId ?? game.auction?.currentActorId ?? null;
  }
  if (game.round === 'stock') return game.stock?.currentActorId ?? null;
  if (game.round === 'operatingShell') {
    const corporationId = game.operatingShell?.currentCorporationId;
    return corporationId ? getCorporationPresident(game, corporationId) : null;
  }
  return null;
}

function shortPrivateName(name: string): string {
  return name
    .replace('Schuylkill Valley', 'SV')
    .replace('Champlain & St. Lawrence', 'C&SL')
    .replace('Delaware & Hudson', 'D&H')
    .replace('Mohawk & Hudson', 'M&H')
    .replace('Camden & Amboy', 'C&A')
    .replace('Baltimore & Ohio', 'B&O');
}

function CorporationToken({
  abbreviation,
  color,
}: {
  abbreviation: string;
  color: string;
}) {
  const textColor = color.toUpperCase() === '#FFFF00' || color.toUpperCase() === '#FFA500'
    ? '#111827'
    : '#ffffff';
  return (
    <div
      className="corporation-token shrink-0"
      style={{ backgroundColor: color, color: textColor }}
    >
      {abbreviation}
    </div>
  );
}

export function GameSidebar({ game }: GameSidebarProps) {
  const colors = useColors();
  const activePlayerId = currentPlayerId(game);
  const isStockRound = game.round === 'stock';
  const players = Object.values(game.players).sort((left, right) => left.seat - right.seat);
  const operatingOrder = game.operatingShell?.operatingOrder ?? [];

  return (
    <aside className="space-y-6">
      <section className={`${colors.card.backgroundAlt} rounded-lg ${colors.card.shadow} p-4 ${colors.card.borderAlt}`}>
        <h2 className={`mb-3 text-lg font-semibold ${colors.text.primary}`}>Players</h2>

        {isStockRound ? (
          <div className="space-y-3">
            {players.map((player) => {
              const holdings = game.corporationOrder
                .map((corporationId) => {
                  const corporation = game.corporations[corporationId];
                  if (!corporation) return null;
                  const ownership = getCorporationOwnership(game, corporationId);
                  const holder = ownership.holders.find(({ player: owner }) => owner.id === player.id);
                  if (!holder) return null;
                  return {
                    corporation,
                    percent: holder.percent,
                    isPresident: ownership.presidentId === player.id,
                  };
                })
                .filter((holding): holding is NonNullable<typeof holding> => holding !== null)
                .sort((left, right) => right.percent - left.percent);
              const privates = Object.values(game.privates)
                .filter((privateCompany) => privateCompany.location.type === 'player'
                  && privateCompany.location.playerId === player.id)
                .sort((left, right) => left.faceValue - right.faceValue);

              return (
                <article
                  key={player.id}
                  className={`rounded-md border p-3 ${
                    player.id === activePlayerId ? colors.player.current : colors.card.border
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`font-medium ${colors.text.primary}`}>{player.name}</span>
                    <span className={`${colors.player.cash} font-semibold`}>${player.cash}</span>
                  </div>
                  <div className={`mb-3 text-xs ${colors.text.tertiary}`}>
                    {getPlayerCertificateCount(game, player.id)} certificates
                  </div>

                  {holdings.length > 0 && (
                    <div className="mb-3">
                      <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${colors.text.secondary}`}>
                        Stock Holdings
                      </div>
                      <div className="space-y-1.5">
                        {holdings.map(({ corporation, percent, isPresident }) => (
                          <div key={corporation.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2.5 w-2.5 rounded" style={{ backgroundColor: corporation.color }} />
                              <span className={`font-medium ${colors.corporation.name}`}>
                                {corporation.abbreviation}
                              </span>
                              {isPresident && (
                                <span className="font-bold" style={{ color: '#FFD700' }}>P</span>
                              )}
                            </div>
                            <span className={`font-semibold ${colors.text.primary}`}>{percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {privates.length > 0 && (
                    <div className="mb-3">
                      <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${colors.text.secondary}`}>
                        Private Companies
                      </div>
                      <div className="space-y-1.5">
                        {privates.map((privateCompany) => (
                          <div key={privateCompany.id} className="text-xs">
                            <div className={`font-medium ${colors.text.primary}`}>{privateCompany.name}</div>
                            <div className={colors.text.tertiary}>
                              {privateCompany.purchasePrice === undefined
                                ? 'Purchase price unavailable'
                                : `Bought for $${privateCompany.purchasePrice}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>
            {players.map((player) => {
              const holdings = game.corporationOrder
                .map((corporationId) => {
                  const corporation = game.corporations[corporationId];
                  if (!corporation) return null;
                  const holder = getCorporationOwnership(game, corporationId).holders
                    .find(({ player: owner }) => owner.id === player.id);
                  return holder ? `${corporation.abbreviation} ${holder.percent}%` : null;
                })
                .filter((holding): holding is string => holding !== null);
              const privates = Object.values(game.privates)
                .filter((privateCompany) => privateCompany.location.type === 'player'
                  && privateCompany.location.playerId === player.id);
              const controlledCorporations = game.corporationOrder
                .map((corporationId) => game.corporations[corporationId])
                .filter((corporation) => corporation
                  && getCorporationPresident(game, corporation.id) === player.id
                  && (corporation.lifecycle === 'floatEligible' || corporation.lifecycle === 'operating'));

              return (
                <article
                  key={player.id}
                  className={`relative h-full rounded-md border p-3 ${
                    player.id === activePlayerId ? colors.player.current : colors.card.border
                  }`}
                >
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className={`text-sm font-medium ${colors.text.primary}`}>{player.name}</span>
                      <span className={`${colors.player.cash} font-semibold`}>${player.cash}</span>
                    </div>
                    {holdings.length > 0 && (
                      <div className={`text-xs ${colors.text.secondary}`}>{holdings.join(', ')}</div>
                    )}
                    {privates.length > 0 && (
                      <div className={`mt-1 text-xs ${colors.text.secondary}`}>
                        Privates: {privates.map((privateCompany) => `${shortPrivateName(privateCompany.name)} ($${privateCompany.revenue})`).join(', ')}
                      </div>
                    )}
                  </div>

                  {controlledCorporations.length > 0 && (
                    <div className="space-y-2">
                      <div className={`text-xs font-semibold uppercase tracking-wide ${colors.text.secondary}`}>
                        Operating
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {controlledCorporations
                          .sort((left, right) => operatingOrder.indexOf(left.id) - operatingOrder.indexOf(right.id))
                          .map((corporation) => {
                            const orderIndex = operatingOrder.indexOf(corporation.id);
                            const isCurrent = game.operatingShell?.currentCorporationId === corporation.id;
                            return (
                              <div key={corporation.id} className="relative">
                                <div className={isCurrent ? 'ring-2 ring-yellow-400 rounded-full' : ''}>
                                  <CorporationToken abbreviation={corporation.abbreviation} color={corporation.color} />
                                </div>
                                {orderIndex >= 0 && (
                                  <span className={`absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${colors.button.danger}`}>
                                    {orderIndex + 1}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

    </aside>
  );
}
