import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Player, GameAction, AuctionState, PrivateCompanyState, OwnedPrivateCompany, AuctionSummary, Corporation, Certificate, Point, StockAction } from '../types/game';
import { RoundType, ActionType } from '../types/game';
import { GAME_CONSTANTS, PRIVATE_COMPANIES, CORPORATIONS, STOCK_MARKET_GRID } from '../types/constants';

// Helper functions for stock market
const findParValuePosition = (parValue: number): Point | null => {
  // Map par values to their row in the red column (column 6)
  // Looking at STOCK_MARKET_GRID column 6: ["100", "90", "100", "82", "100", "67", "67", "67", null, null, null]
  const parValueToRow: Record<number, number> = {
    100: 0, // Row 0, Column 6
    90: 1,  // Row 1, Column 6  
    82: 2,
    76: 3,
    71: 4,  // Row 3, Column 6
    67: 5   // Row 5, Column 6
  };
  
  const row = parValueToRow[parValue];
  if (row !== undefined) {
    return { x: 6, y: row };
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

const checkCorporationFloated = (corporation: Corporation): boolean => {
  // Calculate total shares sold from IPO
  const totalSharesSold = Array.from(corporation.playerShares.values())
    .flat()
    .reduce((total, cert) => total + cert.percentage, 0);
  
  // Corporation is floated when 60% of shares are sold from IPO
  return totalSharesSold >= 60;
};

const createCorporationFromTemplate = (corpTemplate: typeof CORPORATIONS[0]): Corporation => {
  const corporationId = crypto.randomUUID();
  return {
    id: corporationId,
    name: corpTemplate.name,
    abbreviation: corpTemplate.abbreviation,
    presidentId: undefined,
    parValue: undefined,
    sharePrice: 0,
    treasury: 0,
    trains: [],
    tokens: [],
    ipoShares: generateInitialIPOShares(corporationId),
    bankShares: [],
    playerShares: new Map(),
    started: false, // Corporation is started when president's certificate is purchased
    floated: false, // Corporation is floated when 60% of shares are sold from IPO
    color: corpTemplate.color
  };
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
  buyCertificate: (playerId: string, corporationId: string, parValue?: number, fromBank?: boolean) => boolean;

  sellCertificate: (playerId: string, corporationId: string, shares: number) => boolean;
  undoLastStockAction: () => boolean;
  nextStockPlayer: () => void;
  
  // Process pending stock movements at end of turn
  processPendingStockMovements: () => void;
  
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
  corporations: CORPORATIONS.map(createCorporationFromTemplate),
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
    const corporations: Corporation[] = CORPORATIONS.map(createCorporationFromTemplate);

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
    set(() => ({
      roundType: RoundType.STOCK,
      auctionSummary: undefined,
      resolvingCompanyId: undefined,
      currentPlayerIndex: 0,
      stockRoundState: {
        currentPlayerActions: [],
        stockRoundActions: [], // Initialize empty stock round actions
        turnStartTime: Date.now()
      }
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
      set(() => ({
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
        set(() => ({
          auctionState: {
            ...state.auctionState!,
            playerBids: state.auctionState!.playerBids.filter(bid => bid.privateCompanyId !== cheapestCompany.id),
            lockedMoney: new Map([...state.auctionState!.lockedMoney].filter(([playerId]) => 
              state.auctionState!.playerBids.some(bid => bid.playerId === playerId && bid.privateCompanyId !== cheapestCompany.id)
            ))
          }
        }));
        
        // Mark the company as owned
        set(() => ({
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

  buyCertificate: (playerId, corporationId, parValue?: number) => {
    console.log('=== buyCertificate called ===');
    console.log('playerId:', playerId);
    console.log('corporationId:', corporationId);
    
    const state = get();
    console.log('state.players:', state.players);
    console.log('state.corporations:', state.corporations);
    
    const player = state.players.find(p => p.id === playerId);
    const corporation = state.corporations.find(c => c.id === corporationId);
    
    console.log('found player:', player);
    console.log('found corporation:', corporation);
    
    if (!player || !corporation) {
      console.log('Player or corporation not found, returning false');
      return false;
    }
    
    console.log('corporation.ipoShares.length:', corporation.ipoShares.length);
    console.log('corporation.sharePrice:', corporation.sharePrice);
    console.log('player.cash:', player.cash);
    console.log('player.certificates.length:', player.certificates.length);
    
    // Check if corporation has IPO shares available
    if (corporation.ipoShares.length === 0) {
      console.log('No IPO shares available, returning false');
      return false;
    }

    // Handle first purchase (starting corporation)
    if (!corporation.started) {
      if (!parValue) {
        console.log('Par value required for first purchase');
        return false;
      }
      
      // Find the president certificate
      const presidentCertificate = corporation.ipoShares.find(cert => cert.isPresident);
      if (!presidentCertificate) {
        console.log('No president certificate found');
        return false;
      }
      
      // Calculate president certificate cost (20% of par value)
      const presidentCost = parValue * 2; // President's Certificate represents 2 shares (20% ownership)
      if (player.cash < presidentCost) {
        get().addNotification({
          title: 'Insufficient Funds',
          message: `${player.name} doesn't have enough money to buy the President's Certificate for $${presidentCost}`,
          type: 'warning',
          duration: 3000
        });
        return false;
      }
      
      // Find the par value position on the stock market
      const parValuePosition = findParValuePosition(parValue);
      if (!parValuePosition) {
        console.log('Invalid par value');
        return false;
      }
      
      // Record previous state for undo
      const previousState = {
        playerCash: player.cash,
        playerCertificates: [...player.certificates],
        corporationShares: [],
        ipoShares: [...corporation.ipoShares],
        bankShares: [...corporation.bankShares],
        purchasedCertificate: presidentCertificate
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
        corporations: state.corporations.map(c => 
          c.id === corporationId 
            ? {
                ...c,
                presidentId: playerId,
                parValue: parValue,
                sharePrice: parValue,
                started: true, // Corporation is now started
                ipoShares: c.ipoShares.filter(cert => !cert.isPresident), // Remove president cert from IPO
                playerShares: new Map([[playerId, [presidentCertificate]]]) // Add president cert only
              }
            : c
        ),
        stockMarket: {
          ...state.stockMarket,
          tokenPositions: new Map([
            ...state.stockMarket.tokenPositions,
            [corporationId, { x: 6, y: parValuePosition.y }] // Place in column 6 at the same row as par value
          ])
        }
      }));
      
      // Record the action for undo
      const stockAction: StockAction = {
        id: crypto.randomUUID(),
        playerId,
        type: 'start_corporation',
        timestamp: Date.now(),
        data: {
          corporationAbbreviation: corporation.abbreviation,
          parValue,
          previousState
        }
      };
      
      set((state) => ({
        stockRoundState: {
          currentPlayerActions: [...(state.stockRoundState?.currentPlayerActions || []), stockAction],
          stockRoundActions: [...(state.stockRoundState?.stockRoundActions || []), stockAction],
          turnStartTime: state.stockRoundState?.turnStartTime || Date.now()
        }
      }));
      
      // Add notification
      get().addNotification({
        title: corporation.name,
        message: `${player.name} started ${corporation.name} at par value $${parValue} (bought 2 shares for $${presidentCost})`,
        type: 'purchase',
        duration: 3000
      });
      
      return true;
    }
    
    // Check if player can afford the share
    if (player.cash < corporation.sharePrice) {
      get().addNotification({
        title: 'Insufficient Funds',
        message: `${player.name} doesn't have enough money to buy a share for $${corporation.sharePrice}`,
        type: 'warning',
        duration: 3000
      });
      return false;
    }
    
    // Check certificate limit
    const certificateLimit = GAME_CONSTANTS.CERTIFICATE_LIMIT[state.players.length as keyof typeof GAME_CONSTANTS.CERTIFICATE_LIMIT] || 11;
    if (player.certificates.length >= certificateLimit) {
      get().addNotification({
        title: 'Certificate Limit Reached',
        message: `${player.name} has reached the maximum number of certificates (${certificateLimit})`,
        type: 'warning',
        duration: 3000
      });
      return false;
    }
    
    console.log('All checks passed, proceeding with purchase');
    console.log('corporation.ipoShares before pop:', corporation.ipoShares);
    
    // Transfer money and certificate
    const certificate = corporation.ipoShares.pop()!;
    console.log('popped certificate:', certificate);
    certificate.corporationId = corporation.id; // Ensure correct ID
    
    // Record previous state for undo (after certificate is created)
    const previousState = {
      playerCash: player.cash,
      playerCertificates: [...player.certificates], // Track player's certificates before purchase
      corporationShares: [...(corporation.playerShares.get(playerId) || [])],
      ipoShares: [...corporation.ipoShares],
      bankShares: [...corporation.bankShares],
      purchasedCertificate: certificate // Track the specific certificate purchased
    };
    
    set((state) => {
      // Check if this purchase would make the buyer the new president
      const buyerCurrentShares = state.corporations.find(c => c.id === corporationId)?.playerShares.get(playerId) || [];
      const currentPresident = state.corporations.find(c => c.id === corporationId)?.presidentId;
      
      let newPresidentId = currentPresident;
      let presidentTransfer = false;
      
      if (currentPresident && currentPresident !== playerId) {
        // Compare TOTAL ownership percentages (including President's Certificate)
        const currentPresidentShares = corporation.playerShares.get(currentPresident) || [];
        const currentPresidentTotalPercentage = currentPresidentShares.reduce((sum, cert) => sum + cert.percentage, 0);
        
        // Calculate buyer's percentage after this purchase
        const buyerSharesAfterPurchase = [...buyerCurrentShares, certificate];
        const buyerTotalPercentage = buyerSharesAfterPurchase.reduce((sum, cert) => sum + cert.percentage, 0);
        
        console.log(`=== PRESIDENCY TRANSFER CHECK (BUY) ===`);
        console.log(`Current president: ${currentPresident} (${currentPresidentShares.length} shares, ${currentPresidentTotalPercentage}%)`);
        console.log(`Buyer: ${playerId} (${buyerCurrentShares.length} shares → ${buyerSharesAfterPurchase.length} shares, ${buyerTotalPercentage}%)`);
        console.log(`Certificate being bought: ${certificate.isPresident ? 'President' : 'Regular'} (${certificate.percentage}%)`);
        
        // If buyer would have MORE percentage than current president, transfer presidency
        if (buyerTotalPercentage > currentPresidentTotalPercentage) {
          newPresidentId = playerId;
          presidentTransfer = true;
          
          console.log(`✅ PRESIDENCY TRANSFER TRIGGERED: Buyer ${buyerTotalPercentage}% > President ${currentPresidentTotalPercentage}%`);
          
          // Add notification for presidency transfer
          const oldPresident = state.players.find(p => p.id === currentPresident);
          if (oldPresident) {
            get().addNotification({
              title: corporation.name,
              message: `${player.name} stole the presidency from ${oldPresident.name} by buying more shares!`,
              type: 'warning',
              duration: 4000
            });
          }
        } else {
          console.log(`❌ NO PRESIDENCY TRANSFER: Buyer ${buyerTotalPercentage}% <= President ${currentPresidentTotalPercentage}%`);
        }
        console.log(`=== END PRESIDENCY TRANSFER CHECK (BUY) ===`);
      }
      
      // Handle President's Certificate transfer if presidency is changing
      const updatedPlayerShares = new Map(corporation.playerShares);
      
      if (presidentTransfer && currentPresident && currentPresident !== playerId) {
        // Find the President's Certificate from the old president
        const oldPresidentShares = updatedPlayerShares.get(currentPresident) || [];
        const presidentCert = oldPresidentShares.find(cert => cert.isPresident);
        
        if (presidentCert) {
          console.log(`=== PRESIDENCY EXCHANGE LOGIC (BUY) ===`);
          
          // Remove President's Certificate from old president
          const oldPresidentRemainingShares = oldPresidentShares.filter(cert => !cert.isPresident);
          console.log(`Old president shares before exchange: ${oldPresidentShares.length} total (${oldPresidentRemainingShares.length} regular + 1 President's Certificate)`);
          
          // OLD PRESIDENT gives President's Certificate to NEW PRESIDENT in exchange for 2 regular shares
          const buyerShares = updatedPlayerShares.get(playerId) || [];
          console.log(`Buyer shares before exchange: ${buyerShares.length} total`);
          
          // Take 2 shares from the new president's EXISTING shares (before the new purchase)
          const sharesToGiveToOldPresident = buyerShares.slice(0, 2); // Take first 2 existing shares
          const newPresidentRemainingShares = buyerShares.slice(2); // Keep remaining existing shares
          
          console.log(`Shares to give to old president: ${sharesToGiveToOldPresident.length} (${sharesToGiveToOldPresident.map(c => c.percentage + '%').join(', ')})`);
          console.log(`New president remaining shares: ${newPresidentRemainingShares.length} (${newPresidentRemainingShares.map(c => c.percentage + '%').join(', ')})`);
          
          // New president gets: remaining existing shares + new purchase + President's Certificate
          const newPresidentFinalShares = [...newPresidentRemainingShares, certificate, presidentCert];
          
          // Old president gets their remaining shares plus 2 shares from new president
          const oldPresidentFinalShares = [...oldPresidentRemainingShares, ...sharesToGiveToOldPresident];
          
          console.log(`New president final shares: ${newPresidentFinalShares.length} total (${newPresidentFinalShares.map(c => `${c.isPresident ? 'P' : c.percentage + '%'}`).join(', ')})`);
          console.log(`Old president final shares: ${oldPresidentFinalShares.length} total (${oldPresidentFinalShares.map(c => `${c.isPresident ? 'P' : c.percentage + '%'}`).join(', ')})`);
          
          // Update the player shares
          updatedPlayerShares.set(playerId, newPresidentFinalShares);
          updatedPlayerShares.set(currentPresident, oldPresidentFinalShares);
          
          console.log(`✅ EXCHANGE COMPLETE: 1 President's Certificate ↔ 2 regular shares`);
          console.log(`=== END PRESIDENCY EXCHANGE LOGIC (BUY) ===`);
        } else {
          // No President's Certificate found, just add the new certificate
          const buyerShares = updatedPlayerShares.get(playerId) || [];
          updatedPlayerShares.set(playerId, [...buyerShares, certificate]);
        }
      } else {
        // No presidency transfer, just add the new certificate
        const buyerShares = updatedPlayerShares.get(playerId) || [];
        updatedPlayerShares.set(playerId, [...buyerShares, certificate]);
      }
      
      const updatedCorporation = {
        ...corporation,
        presidentId: newPresidentId,
        ipoShares: [...corporation.ipoShares],
        playerShares: updatedPlayerShares
      };

      // Check if corporation should be floated (60% of shares sold)
      const shouldBeFloated = checkCorporationFloated(updatedCorporation);
      if (shouldBeFloated && !updatedCorporation.floated) {
        updatedCorporation.floated = true;
        get().addNotification({
          title: corporation.name,
          message: `${corporation.name} is now floated! (60% of shares sold)`,
          type: 'info',
          duration: 4000
        });
      }

      return {
        players: state.players.map(p => 
          p.id === playerId 
            ? { ...p, cash: p.cash - corporation.sharePrice, certificates: [...p.certificates, certificate] }
            : p
        ),
        corporations: state.corporations.map(c => 
          c.id === corporationId 
            ? updatedCorporation
            : c
        )
      };
    });
    
    // Record the action for undo
    const stockAction: StockAction = {
      id: crypto.randomUUID(),
      playerId,
      type: 'buy_certificate',
      timestamp: Date.now(),
      data: {
        corporationId,
        previousState
      }
    };
    
    set((state) => ({
      stockRoundState: {
        currentPlayerActions: [...(state.stockRoundState?.currentPlayerActions || []), stockAction],
        stockRoundActions: [...(state.stockRoundState?.stockRoundActions || []), stockAction],
        turnStartTime: state.stockRoundState?.turnStartTime || Date.now()
      }
    }));
    
    // Add notification
    get().addNotification({
      title: corporation.name,
      message: `${player.name} bought ${certificate.percentage === 20 ? '2 shares' : '1 share'} for $${corporation.sharePrice}`,
      type: 'purchase',
      duration: 3000
    });
    
    // Process pending stock movements when taking another action
    get().processPendingStockMovements();
    
    return true;
  },

  sellCertificate: (playerId, corporationId, shares) => {
    console.log('=== sellCertificate called ===');
    console.log('playerId:', playerId);
    console.log('corporationId:', corporationId);
    console.log('shares:', shares);
    console.log('=== DEBUG: Starting sellCertificate logic (v2) ===');
    
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    const corporation = state.corporations.find(c => c.id === corporationId);
    
    if (!player || !corporation) {
      console.log('Player or corporation not found');
      return false;
    }
    
    console.log('Player:', player.name);
    console.log('Corporation:', corporation.name);
    
    // Check if player has enough certificates (check corporation's playerShares map)
    const playerCerts = corporation.playerShares.get(playerId) || [];
    console.log('Player certificates for this corporation (from playerShares):', playerCerts.length);
    console.log('Player certificates (from player.certificates):', player.certificates.length);
    console.log('Shares requested to sell:', shares);
    if (playerCerts.length < shares) {
      console.log('Player does not have enough certificates');
      return false;
    }
    
    // Check if we're trying to sell a President's Certificate
    const regularCerts = playerCerts.filter(cert => !cert.isPresident);
    const presidentCerts = playerCerts.filter(cert => cert.isPresident);
    
    console.log('=== DEBUG: Certificate Analysis ===');
    console.log('regularCerts.length:', regularCerts.length);
    console.log('presidentCerts.length:', presidentCerts.length);
    console.log('shares requested:', shares);
    console.log('shares > regularCerts.length:', shares > regularCerts.length);
    console.log('regularCerts:', regularCerts.map(c => `${c.percentage}%${c.isPresident ? ' (P)' : ''}`));
    console.log('presidentCerts:', presidentCerts.map(c => `${c.percentage}%${c.isPresident ? ' (P)' : ''}`));
    
    // If we're trying to sell more shares than we have regular certificates, 
    // we must be trying to sell a President's Certificate
    if (shares > regularCerts.length) {
      console.log('Player is trying to sell a President\'s Certificate, checking if transfer is possible');
      
      // Check if any other player has at least 20% ownership to become president
      let hasOtherPlayerWithEnoughOwnership = false;
      for (const [otherPlayerId, otherPlayerCerts] of corporation.playerShares.entries()) {
        const otherPlayerOwnership = otherPlayerCerts.reduce((sum, cert) => sum + cert.percentage, 0);
        console.log(`Player ${otherPlayerId} has ${otherPlayerCerts.length} certificates (${otherPlayerOwnership}% ownership)`);
        if (otherPlayerId !== playerId && otherPlayerOwnership >= 20) {
          hasOtherPlayerWithEnoughOwnership = true;
          console.log(`Player ${otherPlayerId} has enough ownership to become president`);
          break;
        }
      }
      
      // Block the sale if no other player has enough ownership to become president
      if (!hasOtherPlayerWithEnoughOwnership) {
        console.log('No other player has enough ownership, showing notification');
        get().addNotification({
          title: 'Cannot Sell President\'s Certificate',
          message: 'You cannot sell shares because no other player has enough ownership to become president. The President\'s Certificate can only be transferred, never sold directly.',
          type: 'warning',
          duration: 5000
        });
        return false;
      } else {
        console.log('Another player has enough ownership, allowing President\'s Certificate sale');
      }
    } else {
      console.log('✅ Player is selling regular certificates only, no presidency transfer needed');
      console.log('=== DEBUG: Proceeding with regular certificate sale ===');
    }
    
    // Calculate total value using original price (price doesn't drop until after all shares are sold)
    const originalPrice = corporation.sharePrice;
    const totalValue = originalPrice * shares;
    console.log(`=== DEBUG: Selling ${shares} shares at original price $${originalPrice} = $${totalValue} total ===`);
    
    // Record previous state for undo
    const previousState = {
      playerCash: player.cash,
      playerCertificates: [...player.certificates],
      corporationShares: [...(corporation.playerShares.get(playerId) || [])],
      ipoShares: [...corporation.ipoShares],
      bankShares: [...corporation.bankShares],
      stockPrice: corporation.sharePrice,
      stockPosition: state.stockMarket.tokenPositions.get(corporationId)
    };
    
    // CRITICAL: Check if president is selling and needs to transfer presidency BEFORE validating regular certificates
    const sellerIsPresident = corporation.presidentId === playerId;
    let actualPlayerCerts = playerCerts; // Track the actual certificates after potential presidency transfer
    let actualRemainingCerts = player.certificates; // Track remaining certificates after potential presidency transfer
    
    console.log('=== DEBUG: SECOND PRESIDENCY TRANSFER CHECK ===');
    console.log(`Seller is president: ${sellerIsPresident}`);
    console.log(`President certificates: ${presidentCerts.length}`);
    console.log(`Regular certificates: ${regularCerts.length}`);
    console.log(`Shares being sold: ${shares}`);
    console.log(`Player ID: ${playerId}`);
    console.log(`Condition check: sellerIsPresident (${sellerIsPresident}) && presidentCerts.length > 0 (${presidentCerts.length > 0}) && shares > regularCerts.length (${shares > regularCerts.length})`);
    console.log(`Overall condition: ${sellerIsPresident && presidentCerts.length > 0 && shares > regularCerts.length}`);
    
    // Only do presidency transfer if we're actually trying to sell a president's certificate
    if (sellerIsPresident && presidentCerts.length > 0 && shares > regularCerts.length) {
      console.log(`🔍 ANALYZING PRESIDENCY TRANSFER ELIGIBILITY`);
      console.log('=== DEBUG: Presidency transfer check triggered ===');
      
      // Find player with most shares (excluding current president)
      let maxShares = 0;
      let newPresidentId = null;
      
      console.log(`📊 Checking all players' ownership:`);
      for (const [otherPlayerId, otherPlayerCerts] of corporation.playerShares.entries()) {
        if (otherPlayerId !== playerId) {
          const otherPlayerTotalPercentage = Math.round(otherPlayerCerts.reduce((sum, cert) => sum + cert.percentage, 0));
          console.log(`   Player ${otherPlayerId}: ${otherPlayerCerts.length} certificates, ${otherPlayerTotalPercentage}% ownership`);
          
          if (otherPlayerTotalPercentage >= maxShares) {
            console.log(`     🏆 New leader: ${otherPlayerId} with ${otherPlayerTotalPercentage}% (was ${maxShares}%)`);
            maxShares = otherPlayerTotalPercentage;
            newPresidentId = otherPlayerId;
          } else {
            console.log(`     ⬇️ Not better than current max: ${otherPlayerTotalPercentage}% < ${maxShares}%`);
          }
        }
      }
      
      const currentPresidentTotalPercentage = Math.round(playerCerts.reduce((sum, cert) => sum + cert.percentage, 0));
      console.log(`Current president: ${playerCerts.length} certificates, ${currentPresidentTotalPercentage}% ownership`);
      console.log(`Player with most ownership: ${newPresidentId} with ${maxShares}%`);
      
      // Transfer presidency if another player has equal or more ownership percentage
      console.log(`\n🎯 PRESIDENCY TRANSFER DECISION:`);
      console.log(`   Current president ownership: ${currentPresidentTotalPercentage}%`);
      console.log(`   Best other player ownership: ${maxShares}%`);
      console.log(`   Best other player ID: ${newPresidentId}`);
      console.log(`   Transfer condition: ${maxShares} >= ${currentPresidentTotalPercentage} = ${maxShares >= currentPresidentTotalPercentage}`);
      console.log(`   With rounding: ${Math.round(maxShares)} >= ${Math.round(currentPresidentTotalPercentage)} = ${Math.round(maxShares) >= Math.round(currentPresidentTotalPercentage)}`);
      
      const roundedMaxShares = Math.round(maxShares);
      const roundedCurrentPresidentShares = Math.round(currentPresidentTotalPercentage);
      const hasNewPresident = !!newPresidentId;
      const hasEnoughShares = roundedMaxShares >= roundedCurrentPresidentShares;
      
      console.log(`🔍 FINAL CONDITION CHECK:`);
      console.log(`   newPresidentId exists: ${hasNewPresident} (${newPresidentId})`);
      console.log(`   ${roundedMaxShares} >= ${roundedCurrentPresidentShares}: ${hasEnoughShares}`);
      console.log(`   Overall condition: ${hasNewPresident && hasEnoughShares}`);
      
      if (hasNewPresident && hasEnoughShares) {
        console.log(`✅ PRESIDENCY TRANSFER TRIGGERED: Transferring to ${newPresidentId}`);
        console.log(`Current president ownership: ${currentPresidentTotalPercentage}%`);
        console.log(`New president ownership: ${maxShares}%`);
        
        // Get the new president's current shares
        if (!newPresidentId) {
          console.log('❌ No new president found');
          return false;
        }
        const newPresidentCerts = corporation.playerShares.get(newPresidentId) || [];
        const newPresidentTotalPercentage = newPresidentCerts.reduce((sum, cert) => sum + cert.percentage, 0);
        console.log(`New president certificates: ${newPresidentCerts.length}, total ${newPresidentTotalPercentage}%`);
        
        if (newPresidentTotalPercentage < 20) {
          console.log(`❌ New president doesn't have enough ownership for exchange: ${newPresidentTotalPercentage}%`);
          return false;
        }
        
        // EXCHANGE: President's Certificate (20%) ↔ 2 regular shares (20%)
        console.log(`=== EXECUTING PRESIDENCY EXCHANGE ===`);
        const presidentCert = presidentCerts[0];
        console.log(`President's Certificate: ${presidentCert.percentage}%`);
        
        // Take 2 shares from new president
        const sharesToGive = newPresidentCerts.slice(-2); // Take last 2 shares
        const newPresidentRemainingShares = newPresidentCerts.slice(0, -2);
        
        console.log(`Shares from new president: ${sharesToGive.map(s => s.percentage + '%').join(', ')}`);
        console.log(`New president remaining: ${newPresidentRemainingShares.map(s => s.percentage + '%').join(', ')}`);
        
        // Update the corporation's playerShares map
        set((state) => {
          const updatedCorporations = state.corporations.map(corp => {
            if (corp.id === corporationId) {
              const updatedPlayerShares = new Map(corp.playerShares);
              
              // Former president gets regular shares only (no President's Certificate)
              const formerPresidentShares = [...regularCerts, ...sharesToGive];
              updatedPlayerShares.set(playerId, formerPresidentShares);
              
              // New president gets President's Certificate + remaining shares
              const newPresidentFinalShares = [...newPresidentRemainingShares, presidentCert];
              updatedPlayerShares.set(newPresidentId!, newPresidentFinalShares);
              
              console.log(`Former president final shares: ${formerPresidentShares.map(s => s.percentage + '%').join(', ')}`);
              console.log(`New president final shares: ${newPresidentFinalShares.map(s => s.isPresident ? 'P' : s.percentage + '%').join(', ')}`);
              
              return {
                ...corp,
                presidentId: newPresidentId || undefined,
                playerShares: updatedPlayerShares
              };
            }
            return corp;
          });
          
          return { ...state, corporations: updatedCorporations };
        });
        
        // Update local variables for the sale logic
        actualPlayerCerts = [...regularCerts, ...sharesToGive]; // Former president now has these shares
        actualRemainingCerts = player.certificates.filter(cert => {
          // Remove all shares of this corporation and add back the new shares
          if (cert.corporationId === corporationId) {
            return false;
          }
          return true;
        }).concat(actualPlayerCerts); // Add all the new shares after presidency transfer
        
        console.log(`After presidency transfer:`);
        console.log(`  actualPlayerCerts: ${actualPlayerCerts.length} certificates`);
        console.log(`  actualRemainingCerts: ${actualRemainingCerts.length} certificates`);
        
        // Add notification for presidency transfer
        if (newPresidentId) {
          const newPresident = state.players.find(p => p.id === newPresidentId);
          if (newPresident) {
            get().addNotification({
              title: corporation.name,
              message: `${player.name} dumps ${corporation.name} presidency. ${newPresident.name} is now president.`,
              type: 'warning',
              duration: 4000
            });
          }
        }
        
        console.log(`✅ PRESIDENCY TRANSFER COMPLETE`);
        console.log(`=== END PRESIDENCY EXCHANGE ===`);
      } else {
        console.log(`❌ NO PRESIDENCY TRANSFER: Max ownership ${maxShares}% < Current president ${currentPresidentTotalPercentage}%`);
      }
    } else {
      console.log('=== DEBUG: Second presidency transfer check NOT triggered ===');
      console.log('✅ No presidency transfer needed, proceeding with sale');
    }
    
    // Proceed with normal sale (using potentially updated certificates after presidency transfer)
    console.log('=== PROCEEDING WITH SALE ===');
    console.log(`Using actualPlayerCerts: ${actualPlayerCerts.length} certificates`);
    console.log(`Selling ${shares} shares for $${totalValue}`);
    
    // Validate we have enough shares to sell (after potential presidency transfer)
    const actualRegularCerts = actualPlayerCerts.filter(cert => !cert.isPresident);
    console.log(`actualRegularCerts: ${actualRegularCerts.length} certificates`);
    console.log(`Shares requested: ${shares}`);
    
    if (shares > actualRegularCerts.length) {
      console.log(`❌ Not enough regular shares to sell: ${actualRegularCerts.length} available, ${shares} requested`);
      return false;
    }
    
    console.log(`✅ Enough shares available, proceeding with sale`);
    
    const actualCertsToRemove = actualRegularCerts.slice(0, shares);
    const actualFinalRemainingCerts = actualRemainingCerts.filter(cert => 
      !actualCertsToRemove.some(removeCert => 
        removeCert.corporationId === cert.corporationId && 
        removeCert.percentage === cert.percentage &&
        removeCert.isPresident === cert.isPresident
      )
    );
    
    set((state) => {
      const updatedPlayerShares = new Map(state.corporations.find(c => c.id === corporationId)?.playerShares || []);
      // Use the correct remaining shares for this corporation after sale
      const remainingSharesForCorp = actualPlayerCerts.filter(cert => !actualCertsToRemove.includes(cert));
      updatedPlayerShares.set(playerId, remainingSharesForCorp);
      
      return {
        players: state.players.map(p => 
          p.id === playerId 
            ? { ...p, cash: p.cash + totalValue, certificates: actualFinalRemainingCerts }
            : p
        ),
        corporations: state.corporations.map(c => 
          c.id === corporationId 
            ? { 
                ...c, 
                bankShares: [...c.bankShares, ...actualCertsToRemove],
                playerShares: updatedPlayerShares
              }
            : c
        )
      };
    });
    
    // Record the action for undo
    const stockAction: StockAction = {
      id: crypto.randomUUID(),
      playerId,
      type: 'sell_certificate',
      timestamp: Date.now(),
      data: {
        corporationId,
        shares,
        previousState
      }
    };
    
    set((state) => ({
      stockRoundState: {
        currentPlayerActions: [...(state.stockRoundState?.currentPlayerActions || []), stockAction],
        stockRoundActions: [...(state.stockRoundState?.stockRoundActions || []), stockAction],
        turnStartTime: state.stockRoundState?.turnStartTime || Date.now()
      }
    }));
    
    // Add notification
    get().addNotification({
      title: corporation.name,
      message: `${player.name} sold ${shares} share${shares > 1 ? 's' : ''} for $${totalValue}`,
      type: 'info',
      duration: 3000
    });
    
    // Record pending stock movements (price will move when turn ends)
    console.log('=== DEBUG: Recording pending stock movements for end-of-turn processing ===');
    set((state) => ({
      stockRoundState: {
        ...state.stockRoundState!,
        pendingStockMovements: [
          ...(state.stockRoundState?.pendingStockMovements || []),
          { corporationId, sharesSold: shares }
        ]
      }
    }));
    
    // Check if presidency should transfer after the sale
    console.log('=== DEBUG: Checking for presidency transfer after sale ===');
    const updatedState = get();
    const updatedCorporation = updatedState.corporations.find(c => c.id === corporationId);
    const currentPresidentId = updatedCorporation?.presidentId;
    
    if (currentPresidentId === playerId) {
      console.log('=== DEBUG: Seller is still president, checking if transfer needed ===');
      
      // Find the largest shareholder after the sale
      let maxOwnership = 0;
      let largestShareholderId = null;
      
      for (const [otherPlayerId, otherPlayerCerts] of updatedCorporation!.playerShares.entries()) {
        const ownership = otherPlayerCerts.reduce((sum, cert) => sum + cert.percentage, 0);
        console.log(`Player ${otherPlayerId} has ${ownership}% ownership`);
        
        if (ownership > maxOwnership) {
          maxOwnership = ownership;
          largestShareholderId = otherPlayerId;
        }
      }
      
      // Check current president's ownership
      const presidentCerts = updatedCorporation!.playerShares.get(currentPresidentId) || [];
      const presidentOwnership = presidentCerts.reduce((sum, cert) => sum + cert.percentage, 0);
      console.log(`Current president (${currentPresidentId}) has ${presidentOwnership}% ownership`);
      console.log(`Largest shareholder (${largestShareholderId}) has ${maxOwnership}% ownership`);
      
      // Transfer presidency if someone else is now the largest shareholder
      if (largestShareholderId && largestShareholderId !== currentPresidentId && maxOwnership > presidentOwnership) {
        console.log('=== DEBUG: Presidency transfer needed! ===');
        console.log(`Transferring presidency from ${currentPresidentId} to ${largestShareholderId}`);
        
        // Get the new president's certificates
        const newPresidentCerts = updatedCorporation!.playerShares.get(largestShareholderId) || [];
        const newPresidentOwnership = newPresidentCerts.reduce((sum, cert) => sum + cert.percentage, 0);
        
        if (newPresidentOwnership >= 20) {
          console.log('=== DEBUG: New president has enough ownership for exchange ===');
          
          // Find president's certificate
          const presidentCert = presidentCerts.find(cert => cert.isPresident);
          if (presidentCert) {
            console.log('=== DEBUG: Executing presidency exchange ===');
            
            // Take 2 shares from new president
            const sharesToGive = newPresidentCerts.slice(-2);
            const newPresidentRemainingShares = newPresidentCerts.slice(0, -2);
            
            // Update the corporation's playerShares map
            set((state) => {
              const updatedCorporations = state.corporations.map(corp => {
                if (corp.id === corporationId) {
                  const updatedPlayerShares = new Map(corp.playerShares);
                  
                  // Former president gets regular shares only (no President's Certificate)
                  const formerPresidentShares = presidentCerts.filter(cert => !cert.isPresident).concat(sharesToGive);
                  updatedPlayerShares.set(currentPresidentId, formerPresidentShares);
                  
                  // New president gets President's Certificate + remaining shares
                  const newPresidentFinalShares = newPresidentRemainingShares.concat([presidentCert]);
                  updatedPlayerShares.set(largestShareholderId!, newPresidentFinalShares);
                  
                  return {
                    ...corp,
                    presidentId: largestShareholderId,
                    playerShares: updatedPlayerShares
                  };
                }
                return corp;
              });
              
              return { ...state, corporations: updatedCorporations };
            });
            
            // Add notification for presidency transfer
            const newPresident = updatedState.players.find(p => p.id === largestShareholderId);
            if (newPresident) {
              get().addNotification({
                title: updatedCorporation!.name,
                message: `${player.name} dumps ${updatedCorporation!.name} presidency. ${newPresident.name} is now president.`,
                type: 'warning',
                duration: 4000
              });
            }
            
            console.log('=== DEBUG: Presidency transfer completed ===');
          }
        } else {
          console.log('=== DEBUG: New president does not have enough ownership for exchange ===');
        }
      } else {
        console.log('=== DEBUG: No presidency transfer needed ===');
      }
    }
    
    console.log('=== DEBUG: sellCertificate completed successfully ===');
    return true;
  },



  undoLastStockAction: () => {
    const state = get();
    if (!state.stockRoundState || state.stockRoundState.currentPlayerActions.length === 0) {
      return false;
    }

    const lastAction = state.stockRoundState.currentPlayerActions[state.stockRoundState.currentPlayerActions.length - 1];
    const player = state.players.find(p => p.id === lastAction.playerId);
    if (!player) return false;

    set((state) => {
      const newState = { ...state };
      
      // Restore player cash and certificates
      newState.players = state.players.map(p => 
        p.id === lastAction.playerId 
          ? { ...p, cash: lastAction.data.previousState.playerCash, certificates: lastAction.data.previousState.playerCertificates }
          : p
      );

      // Restore corporation state
      if (lastAction.type === 'start_corporation') {
        // Handle start_corporation undo - revert corporation to unstarted state
        newState.corporations = state.corporations.map(corp => {
          if (corp.abbreviation === lastAction.data.corporationAbbreviation) {
            return {
              ...corp,
              presidentId: undefined,
              parValue: undefined,
              sharePrice: 0,
              started: false, // Revert to unstarted state
              floated: false, // Corporation is floated when 60% of shares are sold from IPO
              ipoShares: generateInitialIPOShares(corp.id), // Restore all IPO shares
              playerShares: new Map() // Clear player shares
            };
          }
          return corp;
        });
      } else if (lastAction.data.corporationId) {
        // Handle regular certificate actions
        newState.corporations = state.corporations.map(corp => {
          if (corp.id === lastAction.data.corporationId) {
            // Get current player shares map
            const currentPlayerShares = new Map(corp.playerShares);
            
            // Get the current player's shares
            const currentShares = currentPlayerShares.get(lastAction.playerId) || [];
            
            // Remove only the specific certificate that was purchased this turn
            const purchasedCert = lastAction.data.previousState.purchasedCertificate;
            if (purchasedCert) {
              // Find the certificate to remove by matching all properties exactly
              const certToRemove = currentShares.find(cert => 
                cert.corporationId === purchasedCert.corporationId && 
                cert.percentage === purchasedCert.percentage && 
                cert.isPresident === purchasedCert.isPresident
              );
              
              if (certToRemove) {
                // Remove only this specific certificate
                const remainingShares = currentShares.filter(cert => cert !== certToRemove);
                
                // Update the player's shares
                if (remainingShares.length > 0) {
                  currentPlayerShares.set(lastAction.playerId, remainingShares);
                } else {
                  currentPlayerShares.delete(lastAction.playerId);
                }
              }
            }
            
            // Add the purchased certificate back to the IPO pool
            const certToReturn = lastAction.data.previousState.purchasedCertificate;
            const updatedIPOShares = certToReturn 
              ? [...lastAction.data.previousState.ipoShares, certToReturn]
              : lastAction.data.previousState.ipoShares;
            
            return {
              ...corp,
              ipoShares: updatedIPOShares,
              bankShares: lastAction.data.previousState.bankShares,
              playerShares: currentPlayerShares,
              // Restore stock price if it was recorded
              ...(lastAction.data.previousState.stockPrice !== undefined && {
                sharePrice: lastAction.data.previousState.stockPrice
              })
            };
          }
          return corp;
        });
      }

      // Restore stock market token position if it was recorded
      if (lastAction.data.previousState.stockPosition && lastAction.data.corporationId) {
        newState.stockMarket = {
          ...state.stockMarket,
          tokenPositions: new Map([
            ...state.stockMarket.tokenPositions,
            [lastAction.data.corporationId, lastAction.data.previousState.stockPosition]
          ])
        };
      }

      // Remove the last action
      newState.stockRoundState = {
        ...state.stockRoundState!,
        currentPlayerActions: state.stockRoundState!.currentPlayerActions.slice(0, -1)
      };

      return newState;
    });

    // Add notification
    get().addNotification({
      title: 'Action Undone',
      message: `Undid ${lastAction.type} for ${player.name}`,
      type: 'info',
      duration: 2000
    });

    return true;
  },

  nextStockPlayer: () => {
    const state = get();
    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    
    // Process pending stock movements before moving to next player
    get().processPendingStockMovements();
    
    set(() => ({
      currentPlayerIndex: nextPlayerIndex,
      stockRoundState: {
        currentPlayerActions: [],
        stockRoundActions: state.stockRoundState?.stockRoundActions || [], // Preserve stock round actions
        turnStartTime: Date.now()
      }
    }));

    // Add notification
    const nextPlayer = state.players[nextPlayerIndex];
    get().addNotification({
      title: 'Stock Round',
      message: `${nextPlayer.name}'s turn`,
      type: 'info',
      duration: 2000
    });
  },

  processPendingStockMovements: () => {
    const state = get();
    if (!state.stockRoundState?.pendingStockMovements || state.stockRoundState.pendingStockMovements.length === 0) {
      return;
    }
    
    console.log('=== DEBUG: Processing pending stock movements ===');
    
    // Process each pending movement
    for (const movement of state.stockRoundState.pendingStockMovements) {
      console.log(`=== DEBUG: Processing movement for ${movement.corporationId}: ${movement.sharesSold} shares sold ===`);
      
      // Move stock price down for each share sold
      for (let i = 0; i < movement.sharesSold; i++) {
        console.log(`=== DEBUG: Moving stock price down for share ${i + 1} of ${movement.sharesSold} ===`);
        const priceMoveResult = get().moveStockPrice(movement.corporationId, 'down');
        console.log(`=== DEBUG: Stock price move result for share ${i + 1}:`, priceMoveResult);
        
        // If we can't move the price down anymore (at bottom), stop
        if (!priceMoveResult) {
          console.log(`=== DEBUG: Cannot move stock price down further, stopped at share ${i + 1} ===`);
          break;
        }
      }
    }
    
    // Clear pending movements
    set((state) => ({
      stockRoundState: {
        ...state.stockRoundState!,
        pendingStockMovements: []
      }
    }));
    
    console.log('=== DEBUG: Pending stock movements processed and cleared ===');
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
    console.log('=== DEBUG: moveStockPrice called ===');
    console.log('corporationId:', corporationId);
    console.log('direction:', direction);
    
    const state = get();
    const corporation = state.corporations.find(c => c.id === corporationId);
    if (!corporation) {
      console.log('=== DEBUG: Corporation not found ===');
      return false;
    }
    
    const currentPosition = state.stockMarket.tokenPositions.get(corporationId);
    if (!currentPosition) {
      console.log('=== DEBUG: No current position found for corporation ===');
      return false;
    }
    console.log('=== DEBUG: Current position:', currentPosition);
    
    let newPosition: Point;
    if (direction === 'up') {
      // Move directly up 1 grid box (for end-of-round movement when all shares owned by players)
      newPosition = { x: currentPosition.x, y: currentPosition.y - 1 };
    } else {
      // Move directly down 1 grid box (for share sales)
      newPosition = { x: currentPosition.x, y: currentPosition.y + 1 };
    }
    
    console.log('=== DEBUG: New position:', newPosition);
    
    // Check bounds - if at bottom of column (down) or top of column (up), don't move
    if (newPosition.y < 0 || newPosition.y >= STOCK_MARKET_GRID.length || 
        newPosition.x < 0 || newPosition.x >= STOCK_MARKET_GRID[newPosition.y].length ||
        STOCK_MARKET_GRID[newPosition.y][newPosition.x] === null) {
      console.log('=== DEBUG: Position out of bounds or invalid, cannot move ===');
      return false;
    }
    
    // Update position and share price
    const newPrice = parseInt(STOCK_MARKET_GRID[newPosition.y][newPosition.x] as string);
    console.log('=== DEBUG: New price:', newPrice);
    
    console.log('=== DEBUG: About to update state with new price and position ===');
    set((state) => {
      console.log('=== DEBUG: Inside set function, updating state ===');
      const updatedState = {
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
      };
      console.log('=== DEBUG: State update completed ===');
      return updatedState;
    });
    
    // Verify the state was updated
    const updatedState = get();
    const updatedCorporation = updatedState.corporations.find(c => c.id === corporationId);
    const updatedPosition = updatedState.stockMarket.tokenPositions.get(corporationId);
    console.log('=== DEBUG: After state update - Corporation share price:', updatedCorporation?.sharePrice);
    console.log('=== DEBUG: After state update - Token position:', updatedPosition);
    
    console.log('=== DEBUG: Stock price move completed successfully ===');
    return true;
  },

  // Note: Dividend-related price movements (rules 4 & 5) happen in the operating round
  // and are not yet implemented. These functions are placeholders for future implementation.
  payDividend: (corporationId: string) => {
    // TODO: Implement dividend price movement (move right 1 grid box, or up if at right edge)
    console.warn('Dividend price movement not yet implemented');
    return false;
  },

  withholdDividend: (corporationId: string) => {
    // TODO: Implement withholding price movement (move left 1 grid box, or down if at left edge)
    console.warn('Withholding price movement not yet implemented');
    return false;
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
