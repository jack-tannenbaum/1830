import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Player, GameAction, AuctionState, PlayerBid, PrivateCompanyState, OwnedPrivateCompany, AuctionSummary, Corporation, Certificate, Point } from '../types/game';
import { RoundType, ActionType } from '../types/game';
import { GAME_CONSTANTS, PRIVATE_COMPANIES, CORPORATIONS } from '../types/constants';

// Helper functions for stock market
const findParValuePosition = (parValue: number): Point | null => {
  const stockMarketGrid = [
    ["60", "67", "71", "76", "82", "90", "100", "112", "125", "142", "160", "180", "200", "225", "250", "275", "300", "325", "350"],
    ["53", "60", "66", "70", "76", "82", "90", "100", "112", "125", "142", "160", "180", "200", "220", "240", "260", "280", "300"],
    ["46", "55", "60", "65", "70", "76", "82", "90", "100", "111", "125", "140", "155", "170", "185", "200", null, null, null],
    ["39", "48", "54", "60", "66", "71", "76", "82", "90", "100", "110", "120", "130", null, null, null, null, null, null],
    ["32", "41", "48", "55", "62", "67", "71", "76", "82", "90", "100", null, null, null, null, null, null, null, null],
    ["25", "34", "42", "50", "58", "65", "67", "71", "75", "80", null, null, null, null, null, null, null, null, null],
    ["18", "27", "36", "45", "54", "63", "67", "69", "70", null, null, null, null, null, null, null, null, null, null],
    ["10", "20", "30", "40", "50", "60", "67", "68", null, null, null, null, null, null, null, null, null, null, null],
    [null, "10", "20", "30", "40", "50", "60", null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, "10", "20", "30", "40", "50", null, null, null, null, null, null, null, null, null, null, null, null],
    [null, null, null, "10", "20", "30", "40", null, null, null, null, null, null, null, null, null, null, null, null]
  ];
  
  for (let row = 0; row < stockMarketGrid.length; row++) {
    for (let col = 0; col < stockMarketGrid[row].length; col++) {
      if (stockMarketGrid[row][col] === parValue.toString()) {
        return { x: col, y: row };
      }
    }
  }
  return null;
};

const generateInitialIPOShares = (corporationId: string): Certificate[] => {
  const shares: Certificate[] = [];
  
  // Generate 1 President's certificate (20%)
  shares.push({
    corporationId: corporationId,
    percentage: 20,
    isPresident: true
  });
  
  // Generate 8 regular 10% certificates (80% total)
  for (let i = 0; i < 8; i++) {
    shares.push({
      corporationId: corporationId,
      percentage: 10,
      isPresident: false
    });
  }
  
  return shares;
};

interface GameStore extends GameState {
  // Actions
  setGameState: (state: Partial<GameState>) => void;
  addPlayer: (name: string) => void;
  removePlayer: (playerId: string) => void;
  nextPlayer: () => void;
  nextRound: () => void;
  addAction: (action: Omit<GameAction, 'id' | 'timestamp'>) => void;
  
  // Game setup
  initializeGame: (playerNames: string[]) => void;
  newGame: () => void;
  hasActiveGame: () => boolean;
  
  // Private auction actions
  buyCheapestPrivate: (playerId: string) => boolean;
  bidOnPrivate: (playerId: string, privateCompanyId: string, amount: number) => boolean;
  passPrivateAuction: (playerId: string) => boolean;
  handleAllPlayersPass: () => void;
  checkAuctionComplete: () => void;
  
  // Bid-off actions
  startBidOff: (privateCompanyId: string, tiedPlayerIds: string[], highestBid: number) => void;
  bidOffBid: (playerId: string, amount: number) => boolean;
  bidOffPass: (playerId: string) => boolean;
  
  // Notifications
  closeNotification: (notificationId: string) => void;
  addNotification: (notification: Omit<GameState['notifications'][0], 'id' | 'timestamp'>) => void;
  

  continueToStockRound: () => void;
  
  // Auction summary
  createAuctionSummary: () => AuctionSummary;
  
  // Stock actions
  buyCertificate: (playerId: string, corporationId: string) => boolean;
  buyPresidentCertificate: (playerId: string, corporationId: string, parValue: number) => boolean;
  sellCertificate: (playerId: string, corporationId: string, shares: number) => boolean;
  
  // Stock price movement
  moveStockPrice: (corporationId: string, direction: 'up' | 'down') => boolean;
  payDividend: (corporationId: string) => boolean;
  withholdDividend: (corporationId: string) => boolean;
}

const createInitialState = (): Partial<GameState> => ({
  id: crypto.randomUUID(),
  phase: 1,
  roundType: RoundType.PRIVATE_AUCTION,
  currentPlayerIndex: 0,
  players: [],
  corporations: CORPORATIONS.map(corpTemplate => ({
    id: crypto.randomUUID(),
    name: corpTemplate.name,
    abbreviation: corpTemplate.abbreviation,
    presidentId: undefined,
    parValue: undefined,
    sharePrice: 0,
    treasury: 0,
    trains: [],
    tokens: [],
    ipoShares: generateInitialIPOShares(corpTemplate.abbreviation),
    bankShares: [],
    playerShares: new Map(),
    floated: false,
    color: corpTemplate.color
  })),
  stockMarket: {
    tokenPositions: new Map(),
    grid: []
  },
  bank: {
    cash: GAME_CONSTANTS.BANK_CASH,
    certificates: [],
    privateCompanies: PRIVATE_COMPANIES.map((pc, index) => ({ ...pc, id: `private-${index}` }))
  },
  gameMap: {
    hexes: new Map(),
    tiles: new Map()
  },
  trainSupply: new Map(),
  notifications: [],
  history: []
});

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState() as GameState,

      setGameState: (newState) => set((state) => ({ ...state, ...newState })),

      newGame: () => {
        set(createInitialState() as GameState);
      },

      hasActiveGame: () => {
        const state = get();
        return state.players.length > 0;
      },

  addPlayer: (name) => set((state) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      cash: GAME_CONSTANTS.STARTING_CASH,
      certificates: [],
      privateCompanies: [],
      priority: state.players.length
    };
    return { players: [...state.players, newPlayer] };
  }),

  removePlayer: (playerId) => set((state) => ({
    players: state.players.filter(p => p.id !== playerId)
  })),

  nextPlayer: () => set((state) => ({
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length
  })),

  nextRound: () => set((state) => {
    const newRoundType = state.roundType === RoundType.STOCK 
      ? RoundType.OPERATING 
      : RoundType.STOCK;
    
    return {
      roundType: newRoundType,
      currentPlayerIndex: 0,
      phase: newRoundType === RoundType.STOCK ? state.phase + 1 : state.phase
    };
  }),

  addAction: (action) => set((state) => {
    const newAction: GameAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    return { history: [...state.history, newAction] };
  }),

  initializeGame: (playerNames) => set(() => {
    const initialState = createInitialState();
    const players = playerNames.map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      cash: GAME_CONSTANTS.STARTING_CASH,
      certificates: [],
      privateCompanies: [],
      priority: index
    }));

    // Initialize private company states (sorted by cost)
    const privateCompanies: PrivateCompanyState[] = (initialState.bank?.privateCompanies || [])
      .sort((a, b) => a.cost - b.cost)
      .map(pc => ({
        id: pc.id,
        currentPrice: pc.cost,
        isOwned: false,
        ownerId: undefined
      }));

    const auctionState: AuctionState = {
      privateCompanies,
      playerTurnOrder: players.map(p => p.id),
      currentPlayerIndex: 0,
      playerBids: [],
      lockedMoney: new Map(),
      consecutivePasses: 0,
      auctionComplete: false
    };

    // Initialize corporations with IPO shares
    const corporations: Corporation[] = CORPORATIONS.map(corpTemplate => ({
      id: crypto.randomUUID(),
      name: corpTemplate.name,
      abbreviation: corpTemplate.abbreviation,
      presidentId: undefined,
      parValue: undefined,
      sharePrice: 0,
      treasury: 0,
      trains: [],
      tokens: [],
      ipoShares: generateInitialIPOShares(corpTemplate.abbreviation),
      bankShares: [],
      playerShares: new Map(),
      floated: false,
      color: corpTemplate.color
    }));

    return {
      ...initialState,
      players,
      corporations, // This should override the empty array from initialState
      auctionState,
      id: crypto.randomUUID()
    };
  }),

  buyCheapestPrivate: (playerId) => {
    const state = get();
    if (!state.auctionState || state.roundType !== RoundType.PRIVATE_AUCTION) return false;
    
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;

    // Find cheapest unowned private
    const cheapest = state.auctionState.privateCompanies
      .filter(pc => !pc.isOwned)
      .sort((a, b) => a.currentPrice - b.currentPrice)[0];
    
    if (!cheapest || player.cash < cheapest.currentPrice) return false;

    const privateCompany = state.bank.privateCompanies.find(pc => pc.id === cheapest.id);
    if (!privateCompany) return false;

    // Buy the company
    set((state) => {
      console.log('Buying cheapest private:', {
        playerId,
        companyId: cheapest.id,
        price: cheapest.currentPrice,
        currentPrivateCompanies: state.auctionState!.privateCompanies.map(pc => ({
          id: pc.id,
          isOwned: pc.isOwned,
          ownerId: pc.ownerId
        }))
      });
      
      return {
        players: state.players.map(p => 
          p.id === playerId 
            ? { 
                ...p, 
                cash: p.cash - cheapest.currentPrice,
                privateCompanies: [...p.privateCompanies, { ...privateCompany, purchasePrice: cheapest.currentPrice }]
              }
            : p
        ),
        bank: {
          ...state.bank,
          cash: state.bank.cash + cheapest.currentPrice,
          privateCompanies: state.bank.privateCompanies.filter(pc => pc.id !== cheapest.id)
        },
        auctionState: {
          ...state.auctionState!,
          privateCompanies: state.auctionState!.privateCompanies.map(pc =>
            pc.id === cheapest.id ? { ...pc, isOwned: true, ownerId: playerId } : pc
          ),
          currentPlayerIndex: (state.auctionState!.currentPlayerIndex + 1) % state.auctionState!.playerTurnOrder.length,
          consecutivePasses: 0
        },
        // Notification will be added via queue
      };
    });

    get().addAction({
      type: ActionType.BUY_CHEAPEST_PRIVATE,
      playerId,
      data: { privateCompanyId: cheapest.id, amount: cheapest.currentPrice }
    });

    // Add notification via queue
    get().addNotification({
      title: privateCompany.name,
      message: `Purchased by ${player.name} for $${cheapest.currentPrice}`,
      type: 'purchase',
      duration: 4000
    });

    // Don't check auction complete here - let the notification queue handle timing
    return true;
  },

  bidOnPrivate: (playerId, privateCompanyId, amount) => {
    const state = get();
    if (!state.auctionState || state.roundType !== RoundType.PRIVATE_AUCTION) return false;
    
    const player = state.players.find(p => p.id === playerId);
    const privateCompany = state.auctionState.privateCompanies.find(pc => pc.id === privateCompanyId);
    const privateCompanyData = state.bank.privateCompanies.find(pc => pc.id === privateCompanyId);
    
    if (!player || !privateCompany || !privateCompanyData || privateCompany.isOwned) return false;
    
    // Check available cash using the same logic as UI (use lockedMoney map)
    const currentLockedAmount = state.auctionState.lockedMoney.get(playerId) || 0;
    // If player has an existing bid on this company, subtract it from locked amount since we'll replace it
    const existingBidOnThisCompany = state.auctionState.playerBids.find(bid => bid.playerId === playerId && bid.privateCompanyId === privateCompanyId);
    const adjustedLockedAmount = existingBidOnThisCompany ? currentLockedAmount - existingBidOnThisCompany.amount : currentLockedAmount;
    const availableCash = player.cash - adjustedLockedAmount;
    
    if (availableCash < amount) return false;

    // Can't bid on cheapest (must buy at face value)
    const cheapest = state.auctionState.privateCompanies
      .filter(pc => !pc.isOwned)
      .sort((a, b) => a.currentPrice - b.currentPrice)[0];
    
    if (privateCompany.id === cheapest?.id) return false;

    // Can't bid on cheapest if it's about to be resolved (has bids)
    if (cheapest) {
      const cheapestCompanyBids = state.auctionState.playerBids.filter(bid => bid.privateCompanyId === cheapest.id);
      if (cheapestCompanyBids.length > 0) return false;
    }

    // existingBidOnThisCompany already declared above for cash validation
    
    // Minimum bid is $5 over current price or existing highest bid
    const existingBids = state.auctionState.playerBids.filter(bid => bid.privateCompanyId === privateCompanyId);
    const highestBid = Math.max(...existingBids.map(bid => bid.amount), privateCompany.currentPrice);
    const minBid = highestBid + 5;
    
    if (amount < minBid) return false;

    // Remove existing bid on this company if any and add new bid
    const newBids = state.auctionState.playerBids.filter(bid => !(bid.playerId === playerId && bid.privateCompanyId === privateCompanyId));
    newBids.push({ playerId, amount, privateCompanyId });

    // Update locked money - sum all bids for this player
    const newLockedMoney = new Map(state.auctionState.lockedMoney);
    const allPlayerBids = newBids.filter(bid => bid.playerId === playerId);
    const totalLockedAmount = allPlayerBids.reduce((sum, bid) => sum + bid.amount, 0);
    newLockedMoney.set(playerId, totalLockedAmount);

    set((state) => ({
      auctionState: {
        ...state.auctionState!,
        playerBids: newBids,
        lockedMoney: newLockedMoney,
        currentPlayerIndex: (state.auctionState!.currentPlayerIndex + 1) % state.auctionState!.playerTurnOrder.length,
        consecutivePasses: 0
      },
      // Notification will be added via queue
    }));

    get().addAction({
      type: ActionType.BID_ON_PRIVATE,
      playerId,
      data: { privateCompanyId, amount }
    });

    // Add notification via queue
    get().addNotification({
      title: privateCompanyData.name,
      message: `${player.name} bid $${amount}`,
      type: 'bid',
      duration: 3000
    });

    return true;
  },

  passPrivateAuction: (playerId) => {
    const state = get();
    if (!state.auctionState || state.roundType !== RoundType.PRIVATE_AUCTION) return false;

    const consecutivePasses = state.auctionState.consecutivePasses + 1;
    
    set((state) => ({
      auctionState: {
        ...state.auctionState!,
        currentPlayerIndex: (state.auctionState!.currentPlayerIndex + 1) % state.auctionState!.playerTurnOrder.length,
        consecutivePasses
      }
    }));

    get().addAction({
      type: ActionType.PASS_PRIVATE_AUCTION,
      playerId,
      data: {}
    });

    // If all players passed, reduce cheapest price or force sale
    if (consecutivePasses >= state.auctionState.playerTurnOrder.length) {
      get().handleAllPlayersPass();
    }

    get().checkAuctionComplete();
    return true;
  },

  handleAllPlayersPass: () => {
    const state = get();
    if (!state.auctionState) return;

    const cheapest = state.auctionState.privateCompanies
      .filter(pc => !pc.isOwned)
      .sort((a, b) => a.currentPrice - b.currentPrice)[0];
    
    if (!cheapest) {
      get().checkAuctionComplete();
      return;
    }

    if (cheapest.currentPrice <= 5) {
      // Force next player to take it for free/current price
      const nextPlayer = state.auctionState.playerTurnOrder[state.auctionState.currentPlayerIndex];
      get().buyCheapestPrivate(nextPlayer);
    } else {
      // Reduce price by $5
      set((state) => ({
        auctionState: {
          ...state.auctionState!,
          privateCompanies: state.auctionState!.privateCompanies.map(pc =>
            pc.id === cheapest.id ? { ...pc, currentPrice: Math.max(0, pc.currentPrice - 5) } : pc
          ),
          consecutivePasses: 0
        }
      }));
    }
  },

  createAuctionSummary: (): AuctionSummary => {
    const state = get();
    
    // Get all companies that were in the original auction
    const allCompanyIds = ['private-0', 'private-1', 'private-2', 'private-3', 'private-4', 'private-5'];
    const results = allCompanyIds.map(companyId => {
      // Check if any player owns this company
      const player = state.players.find(p => p.privateCompanies.some(owned => owned.id === companyId));
      if (player) {
        const ownedCompany = player.privateCompanies.find(owned => owned.id === companyId);
        return {
          companyId: companyId,
          companyName: ownedCompany?.name || `Company ${companyId}`,
          outcome: 'sold' as const,
          buyerId: player.id,
          buyerName: player.name,
          price: ownedCompany?.purchasePrice || 0
        };
      } else {
        // Check if it's still in the bank
        const bankCompany = state.bank.privateCompanies.find(pc => pc.id === companyId);
        if (bankCompany) {
          return {
            companyId: companyId,
            companyName: bankCompany.name,
            outcome: 'unsold' as const,
            price: bankCompany.cost
          };
        } else {
          // Company was removed from bank but not owned by any player (shouldn't happen)
          return {
            companyId: companyId,
            companyName: `Company ${companyId}`,
            outcome: 'unsold' as const,
            price: 0
          };
        }
      }
    });
    
    return { results };
  },

  closeNotification: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.filter(notification => notification.id !== notificationId)
    }));
  },

  addNotification: (notification: Omit<GameState['notifications'][0], 'id' | 'timestamp'>) => {
    // Add to queue with a delay based on current queue length
    const state = get();
    const queueDelay = state.notifications.length * 100; // 100ms between each notification for snappy feel
    
    console.log('Adding notification to queue:', {
      type: notification.type,
      queueDelay,
      currentNotifications: state.notifications.length
    });
    
    setTimeout(() => {
      set((state) => ({
        notifications: [...state.notifications, {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        }]
      }));
      
      console.log('Notification added to state:', notification.type);
      
      // After adding the notification, check if we should continue the auction
      // Only do this for purchase notifications, not bid notifications
      if (notification.type === 'purchase') {
        setTimeout(() => {
          get().checkAuctionComplete();
        }, 100); // Quick delay to let the notification appear
      }
    }, queueDelay);
  },



  continueToStockRound: () => {
    set((state) => ({
      roundType: RoundType.STOCK,
      auctionSummary: undefined,
      resolvingCompanyId: undefined,
      currentPlayerIndex: 0
    }));
  },

  checkAuctionComplete: () => {
    const state = get();
    if (!state.auctionState) return;

    // Check if all companies are sold
    const remainingCompanies = state.auctionState.privateCompanies.filter(pc => !pc.isOwned);
    
    if (remainingCompanies.length === 0) {
      // All companies sold, create summary and move to summary round
      const summary = get().createAuctionSummary();
      set((state) => ({
        roundType: RoundType.AUCTION_SUMMARY,
        auctionState: undefined,
        auctionSummary: summary,
        resolvingCompanyId: undefined
      }));
      return;
    }

    // Check the cheapest unowned company for resolution
    const cheapestCompany = remainingCompanies.sort((a, b) => a.currentPrice - b.currentPrice)[0];
    const cheapestCompanyBids = state.auctionState.playerBids.filter(bid => bid.privateCompanyId === cheapestCompany.id);
    
    // If cheapest company has no bids, players can continue bidding
    if (cheapestCompanyBids.length === 0) {
      return;
    }
    
    // If cheapest company has exactly 1 bid, that player buys it
    if (cheapestCompanyBids.length === 1) {
      const winningBid = cheapestCompanyBids[0];
      const player = state.players.find(p => p.id === winningBid.playerId);
      const privateCompany = state.bank.privateCompanies.find(pc => pc.id === cheapestCompany.id);
      
      if (player && privateCompany) {
        // Award the company to the player
        const ownedCompany: OwnedPrivateCompany = {
          ...privateCompany,
          purchasePrice: winningBid.amount
        };
        player.privateCompanies.push(ownedCompany);
        player.cash -= winningBid.amount;
        
        // Show purchase notification via queue
        get().addNotification({
          title: privateCompany.name,
          message: `Purchased by ${player.name} for $${winningBid.amount}`,
          type: 'purchase',
          duration: 4000
        });
        
        // Remove the bid and locked money
        set((state) => ({
          auctionState: {
            ...state.auctionState!,
            playerBids: state.auctionState!.playerBids.filter(bid => bid.privateCompanyId !== cheapestCompany.id),
            lockedMoney: new Map([...state.auctionState!.lockedMoney].filter(([playerId]) => 
              state.auctionState!.playerBids.some(bid => bid.playerId === playerId && bid.privateCompanyId !== cheapestCompany.id)
            ))
          }
        }));
        
        // Mark the company as owned
        set((state) => ({
          auctionState: {
            ...state.auctionState!,
            privateCompanies: state.auctionState!.privateCompanies.map(pc => 
              pc.id === cheapestCompany.id ? { ...pc, isOwned: true, ownerId: winningBid.playerId } : pc
            )
          }
        }));
        
        // Don't check auction complete here - let the notification queue handle timing
        return;
      }
    }
    
    // If cheapest company has multiple bids, start bid-off
    if (cheapestCompanyBids.length > 1) {
      const highestBidAmount = Math.max(...cheapestCompanyBids.map(bid => bid.amount));
      const allBidderIds = cheapestCompanyBids.map(bid => bid.playerId);
      get().startBidOff(cheapestCompany.id, allBidderIds, highestBidAmount);
      return;
    }
  },

  buyCertificate: (playerId, corporationId) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    const corporation = state.corporations.find(c => c.id === corporationId);
    
    if (!player || !corporation) return false;
    
    // Check if corporation has IPO shares available
    if (corporation.ipoShares.length === 0) return false;
    
    // Check if player can afford the share
    if (player.cash < corporation.sharePrice) return false;
    
    // Check certificate limit
    const certificateLimit = GAME_CONSTANTS.CERTIFICATE_LIMIT[state.players.length as keyof typeof GAME_CONSTANTS.CERTIFICATE_LIMIT] || 11;
    if (player.certificates.length >= certificateLimit) return false;
    
    // Transfer money and certificate
    const certificate = corporation.ipoShares.pop()!;
    certificate.corporationId = corporation.id; // Ensure correct ID
    
    set((state) => ({
      players: state.players.map(p => 
        p.id === playerId 
          ? { ...p, cash: p.cash - corporation.sharePrice, certificates: [...p.certificates, certificate] }
          : p
      ),
      corporations: state.corporations.map(c => 
        c.id === corporationId 
          ? { 
              ...c, 
              ipoShares: [...c.ipoShares],
              playerShares: new Map([
                ...c.playerShares,
                [playerId, [...(c.playerShares.get(playerId) || []), certificate]]
              ])
            }
          : c
      )
    }));
    
    return true;
  },

  sellCertificate: (playerId, corporationId, shares) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    const corporation = state.corporations.find(c => c.id === corporationId);
    
    if (!player || !corporation) return false;
    
    // Check if player has enough certificates
    const playerCerts = player.certificates.filter(cert => cert.corporationId === corporationId);
    if (playerCerts.length < shares) return false;
    
    // Calculate total value
    const totalValue = corporation.sharePrice * shares;
    
    // Remove certificates from player and add to bank pool
    const certsToRemove = playerCerts.slice(0, shares);
    const remainingCerts = player.certificates.filter(cert => 
      !certsToRemove.some(removeCert => 
        removeCert.corporationId === cert.corporationId && 
        removeCert.percentage === cert.percentage &&
        removeCert.isPresident === cert.isPresident
      )
    );
    
    set((state) => ({
      players: state.players.map(p => 
        p.id === playerId 
          ? { ...p, cash: p.cash + totalValue, certificates: remainingCerts }
          : p
      ),
      corporations: state.corporations.map(c => 
        c.id === corporationId 
          ? { 
              ...c, 
              bankShares: [...c.bankShares, ...certsToRemove],
              playerShares: new Map([
                ...c.playerShares,
                [playerId, remainingCerts.filter(cert => cert.corporationId === corporationId)]
              ])
            }
          : c
      )
    }));
    
    return true;
  },

  buyPresidentCertificate: (playerId, corporationId, parValue) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return false;
    
    // Find the corporation template
    const corpTemplate = CORPORATIONS.find(c => c.abbreviation === corporationId);
    if (!corpTemplate) return false;
    
    // Check if corporation is already floated
    if (state.corporations.some(c => c.abbreviation === corporationId)) return false;
    
    // Calculate president certificate cost (20% of par value)
    const presidentCost = parValue * (GAME_CONSTANTS.PRESIDENT_SHARE_PERCENTAGE / 100);
    if (player.cash < presidentCost) return false;
    
    // Find the par value position on the stock market
    const parValuePosition = findParValuePosition(parValue);
    if (!parValuePosition) return false;
    
    // Create the corporation
    const newCorporation: Corporation = {
      id: crypto.randomUUID(),
      name: corpTemplate.name,
      abbreviation: corpTemplate.abbreviation,
      presidentId: playerId,
      parValue: parValue,
      sharePrice: parValue,
      treasury: 0,
      trains: [],
      tokens: [],
      ipoShares: generateInitialIPOShares(corpTemplate.abbreviation),
      bankShares: [],
      playerShares: new Map(),
      floated: true,
      color: corpTemplate.color
    };
    
    // Create president certificate
    const presidentCertificate: Certificate = {
      corporationId: newCorporation.id,
      percentage: GAME_CONSTANTS.PRESIDENT_SHARE_PERCENTAGE,
      isPresident: true
    };
    
    set((state) => ({
      players: state.players.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              cash: p.cash - presidentCost, 
              certificates: [...p.certificates, presidentCertificate] 
            }
          : p
      ),
      corporations: [...state.corporations, newCorporation],
      stockMarket: {
        ...state.stockMarket,
        tokenPositions: new Map([
          ...state.stockMarket.tokenPositions,
          [newCorporation.id, parValuePosition]
        ])
      }
    }));
    
    return true;
  },

  // Bid-off methods
  startBidOff: (privateCompanyId, tiedPlayerIds, highestBid) => {
    set((state) => {
      // Find the next player in regular turn order who is participating in the bid-off
      const currentTurnIndex = state.auctionState!.currentPlayerIndex;
      const regularTurnOrder = state.auctionState!.playerTurnOrder;
      
      // Find the first participating player after the current turn
      let startingPlayerIndex = 0;
      for (let i = 0; i < regularTurnOrder.length; i++) {
        const checkIndex = (currentTurnIndex + i) % regularTurnOrder.length;
        const playerId = regularTurnOrder[checkIndex];
        if (tiedPlayerIds.includes(playerId)) {
          startingPlayerIndex = tiedPlayerIds.indexOf(playerId);
          break;
        }
      }
      
      return {
        auctionState: {
          ...state.auctionState!,
          bidOffState: {
            privateCompanyId,
            participantIds: tiedPlayerIds,
            currentPlayerIndex: startingPlayerIndex,
            currentBid: highestBid,
            currentBidderId: tiedPlayerIds[startingPlayerIndex],
            consecutivePasses: 0
          }
        }
      };
    });
  },

  bidOffBid: (playerId, amount) => {
    const state = get();
    if (!state.auctionState?.bidOffState) return false;

    const bidOff = state.auctionState.bidOffState;
    const player = state.players.find(p => p.id === playerId);
    
    if (!player || amount <= bidOff.currentBid) return false;

    // Check if player can afford the bid
    const lockedAmount = state.auctionState.lockedMoney.get(playerId) || 0;
    if (player.cash - lockedAmount < amount) return false;

    // Update bid-off state
    const nextPlayerIndex = (bidOff.currentPlayerIndex + 1) % bidOff.participantIds.length;
    
    set((state) => ({
      auctionState: {
        ...state.auctionState!,
        bidOffState: {
          ...bidOff,
          currentBid: amount,
          currentBidderId: playerId,
          currentPlayerIndex: nextPlayerIndex,
          consecutivePasses: 0
        }
      }
    }));

    get().addAction({
      type: ActionType.BID_OFF_BID,
      playerId,
      data: { amount, privateCompanyId: bidOff.privateCompanyId }
    });

    return true;
  },

  bidOffPass: (playerId) => {
    const state = get();
    if (!state.auctionState?.bidOffState) return false;

    const bidOff = state.auctionState.bidOffState;
    const consecutivePasses = bidOff.consecutivePasses + 1;
    
    // If all other players passed, winner gets the company
    if (consecutivePasses >= bidOff.participantIds.length - 1) {
      const winner = state.players.find(p => p.id === bidOff.currentBidderId);
      const privateCompany = state.bank.privateCompanies.find(pc => pc.id === bidOff.privateCompanyId);
      
      if (winner && privateCompany) {
        // Award company to winner
        set((state) => {
          console.log('Bid-off completion - updating state:', {
            winner: bidOff.currentBidderId,
            company: bidOff.privateCompanyId,
            amount: bidOff.currentBid,
            currentPrivateCompanies: state.auctionState!.privateCompanies.map(pc => ({
              id: pc.id,
              isOwned: pc.isOwned,
              ownerId: pc.ownerId
            }))
          });
          
          return {
            players: state.players.map(p => 
              p.id === bidOff.currentBidderId 
                ? { 
                    ...p, 
                    cash: p.cash - bidOff.currentBid,
                    privateCompanies: [...p.privateCompanies, { ...privateCompany, purchasePrice: bidOff.currentBid }]
                  }
                : p
            ),
            bank: {
              ...state.bank,
              cash: state.bank.cash + bidOff.currentBid,
              privateCompanies: state.bank.privateCompanies.filter(pc => pc.id !== bidOff.privateCompanyId)
            },
            auctionState: {
              ...state.auctionState!,
              privateCompanies: state.auctionState!.privateCompanies.map(pc =>
                pc.id === bidOff.privateCompanyId ? { ...pc, isOwned: true, ownerId: bidOff.currentBidderId } : pc
              ),
              playerBids: state.auctionState!.playerBids.filter(bid => bid.privateCompanyId !== bidOff.privateCompanyId),
              bidOffState: undefined
            },
            // Notification will be added via queue
          };
        });

        // Add notification via queue
        get().addNotification({
          title: privateCompany.name,
          message: `Purchased by ${winner.name} for $${bidOff.currentBid}`,
          type: 'purchase',
          duration: 4000
        });

        // Don't check auction complete here - let the notification queue handle timing
      }
    } else {
      // Continue bid-off with next player
      const nextPlayerIndex = (bidOff.currentPlayerIndex + 1) % bidOff.participantIds.length;
      
      set((state) => ({
        auctionState: {
          ...state.auctionState!,
          bidOffState: {
            ...bidOff,
            currentPlayerIndex: nextPlayerIndex,
            consecutivePasses
          }
        }
      }));
    }

    get().addAction({
      type: ActionType.BID_OFF_PASS,
      playerId,
      data: { privateCompanyId: bidOff.privateCompanyId }
    });

    return true;
  },

  moveStockPrice: (corporationId: string, direction: 'up' | 'down') => {
    const state = get();
    const corporation = state.corporations.find(c => c.id === corporationId);
    if (!corporation) return false;
    
    const currentPosition = state.stockMarket.tokenPositions.get(corporationId);
    if (!currentPosition) return false;
    
    const stockMarketGrid = [
      ["60", "67", "71", "76", "82", "90", "100", "112", "125", "142", "160", "180", "200", "225", "250", "275", "300", "325", "350"],
      ["53", "60", "66", "70", "76", "82", "90", "100", "112", "125", "142", "160", "180", "200", "220", "240", "260", "280", "300"],
      ["46", "55", "60", "65", "70", "76", "82", "90", "100", "111", "125", "140", "155", "170", "185", "200", null, null, null],
      ["39", "48", "54", "60", "66", "71", "76", "82", "90", "100", "110", "120", "130", null, null, null, null, null, null],
      ["32", "41", "48", "55", "62", "67", "71", "76", "82", "90", "100", null, null, null, null, null, null, null, null],
      ["25", "34", "42", "50", "58", "65", "67", "71", "75", "80", null, null, null, null, null, null, null, null, null],
      ["18", "27", "36", "45", "54", "63", "67", "69", "70", null, null, null, null, null, null, null, null, null, null],
      ["10", "20", "30", "40", "50", "60", "67", "68", null, null, null, null, null, null, null, null, null, null, null],
      [null, "10", "20", "30", "40", "50", "60", null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, "10", "20", "30", "40", "50", null, null, null, null, null, null, null, null, null, null, null, null],
      [null, null, null, "10", "20", "30", "40", null, null, null, null, null, null, null, null, null, null, null, null]
    ];
    
    let newPosition: Point;
    if (direction === 'up') {
      // Move up and right (diagonal)
      newPosition = { x: currentPosition.x + 1, y: currentPosition.y - 1 };
    } else {
      // Move down and left (diagonal)
      newPosition = { x: currentPosition.x - 1, y: currentPosition.y + 1 };
    }
    
    // Check bounds
    if (newPosition.y < 0 || newPosition.y >= stockMarketGrid.length || 
        newPosition.x < 0 || newPosition.x >= stockMarketGrid[newPosition.y].length ||
        stockMarketGrid[newPosition.y][newPosition.x] === null) {
      return false;
    }
    
    // Update position and share price
    const newPrice = parseInt(stockMarketGrid[newPosition.y][newPosition.x] as string);
    
    set((state) => ({
      corporations: state.corporations.map(c => 
        c.id === corporationId 
          ? { ...c, sharePrice: newPrice }
          : c
      ),
      stockMarket: {
        ...state.stockMarket,
        tokenPositions: new Map([
          ...state.stockMarket.tokenPositions,
          [corporationId, newPosition]
        ])
      }
    }));
    
    return true;
  },

  payDividend: (corporationId: string) => {
    return get().moveStockPrice(corporationId, 'up');
  },

  withholdDividend: (corporationId: string) => {
    return get().moveStockPrice(corporationId, 'down');
  }
    }),
    {
      name: '1830-game-storage',

      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str, (key, value) => {
            if (value && typeof value === 'object' && value.__type === 'Map') {
              return new Map(value.value);
            }
            if (value && typeof value === 'object' && value.__type === 'Set') {
              return new Set(value.value);
            }
            return value;
          });
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value, (key, val) => {
            if (val instanceof Map) {
              return { __type: 'Map', value: Array.from(val.entries()) };
            }
            if (val instanceof Set) {
              return { __type: 'Set', value: Array.from(val) };
            }
            return val;
          }));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
