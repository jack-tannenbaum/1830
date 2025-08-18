import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Player, GameAction, AuctionState, PlayerBid, PrivateCompanyState, OwnedPrivateCompany, AuctionSummary, Corporation, Certificate, Point, StockAction } from '../types/game';
import { RoundType, ActionType } from '../types/game';
import { GAME_CONSTANTS, PRIVATE_COMPANIES, CORPORATIONS, STOCK_MARKET_GRID } from '../types/constants';

// Helper functions for stock market
const findParValuePosition = (parValue: number): Point | null => {
  for (let row = 0; row < STOCK_MARKET_GRID.length; row++) {
    for (let col = 0; col < STOCK_MARKET_GRID[row].length; col++) {
      if (STOCK_MARKET_GRID[row][col] === parValue.toString()) {
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
    floated: false,
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
  buyCertificate: (playerId: string, corporationId: string) => boolean;
  buyPresidentCertificate: (playerId: string, corporationAbbreviation: string, parValue: number) => boolean;
  sellCertificate: (playerId: string, corporationId: string, shares: number) => boolean;
  undoLastStockAction: () => boolean;
  nextStockPlayer: () => void;
  
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
    set((state) => ({
      roundType: RoundType.STOCK,
      auctionSummary: undefined,
      resolvingCompanyId: undefined,
      currentPlayerIndex: 0,
      stockRoundState: {
        currentPlayerActions: [],
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
      const buyerTotalShares = buyerCurrentShares.length + 1; // +1 for the new certificate
      
      const currentPresident = state.corporations.find(c => c.id === corporationId)?.presidentId;
      const presidentShares = currentPresident ? 
        (state.corporations.find(c => c.id === corporationId)?.playerShares.get(currentPresident) || []).length : 0;
      
      let newPresidentId = currentPresident;
      let presidentTransfer = false;
      
            // Check if this purchase would make the buyer the new president
      // Compare TOTAL ownership percentages (including President's Certificate)
      const currentPresidentShares = currentPresident ? corporation.playerShares.get(currentPresident) || [] : [];
      const currentPresidentTotalPercentage = currentPresidentShares.reduce((sum, cert) => sum + cert.percentage, 0);
      
      const buyerSharesAfterPurchase = buyerCurrentShares.length + 1; // +1 for the new certificate
      const buyerTotalPercentage = buyerSharesAfterPurchase * 10; // Each share is 10%
      
      console.log(`Presidency check: Buyer will have ${buyerTotalPercentage}% (${buyerSharesAfterPurchase} shares), current president has ${currentPresidentTotalPercentage}% (${currentPresidentShares.length} shares)`);
      
      // If buyer would have MORE percentage than current president, transfer presidency
      if (buyerTotalPercentage > currentPresidentTotalPercentage && currentPresident !== playerId) {
        newPresidentId = playerId;
        presidentTransfer = true;
        
        console.log(`Presidency transfer triggered: Buyer will have ${buyerTotalPercentage}% (${buyerSharesAfterPurchase} shares), current president has ${currentPresidentTotalPercentage}% (${currentPresidentShares.length} shares)`);
        
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
        console.log(`No presidency transfer: Buyer will have ${buyerTotalPercentage}% (${buyerSharesAfterPurchase} shares), current president has ${currentPresidentTotalPercentage}% (${currentPresidentShares.length} shares)`);
      }
      
      // Handle President's Certificate transfer if presidency is changing
      let updatedPlayerShares = new Map(corporation.playerShares);
      
      if (presidentTransfer && currentPresident && currentPresident !== playerId) {
        // Find the President's Certificate from the old president
        const oldPresidentShares = updatedPlayerShares.get(currentPresident) || [];
        const presidentCert = oldPresidentShares.find(cert => cert.isPresident);
        
        if (presidentCert) {
          // Remove President's Certificate from old president
          const oldPresidentRemainingShares = oldPresidentShares.filter(cert => !cert.isPresident);
          
          // NEW PRESIDENT gives 2 of their EXISTING shares to OLD PRESIDENT in exchange for President's Certificate
          const buyerShares = updatedPlayerShares.get(playerId) || [];
          
          // Take 2 shares from the new president's EXISTING shares (before the new purchase)
          const sharesToGiveToOldPresident = buyerShares.slice(0, 2); // Take first 2 existing shares
          const newPresidentRemainingShares = buyerShares.slice(2); // Keep remaining existing shares
          
          // New president gets: remaining existing shares + new purchase + President's Certificate
          const newPresidentFinalShares = [...newPresidentRemainingShares, certificate, presidentCert];
          
          // Old president gets their remaining shares plus 2 shares from new president
          const oldPresidentFinalShares = [...oldPresidentRemainingShares, ...sharesToGiveToOldPresident];
          
          // Update the player shares
          updatedPlayerShares.set(playerId, newPresidentFinalShares);
          updatedPlayerShares.set(currentPresident, oldPresidentFinalShares);
          
          console.log(`President's Certificate exchange: New president gives 2 shares to old president, gets President's Certificate`);
          console.log(`New president: ${newPresidentFinalShares.length} shares + President's Certificate (${newPresidentFinalShares.length * 10 + 20}% total)`);
          console.log(`Old president: ${oldPresidentFinalShares.length} shares (${oldPresidentFinalShares.length * 10}% total)`);
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
      
      return {
        players: state.players.map(p => 
          p.id === playerId 
            ? { ...p, cash: p.cash - corporation.sharePrice, certificates: [...p.certificates, certificate] }
            : p
        ),
        corporations: state.corporations.map(c => 
          c.id === corporationId 
            ? { 
                ...c, 
                presidentId: newPresidentId,
                ipoShares: [...c.ipoShares],
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
    
    return true;
  },

  sellCertificate: (playerId, corporationId, shares) => {
    console.log('=== sellCertificate called ===');
    console.log('playerId:', playerId);
    console.log('corporationId:', corporationId);
    console.log('shares:', shares);
    
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
    
    // Check President's Certificate rules
    const playerIsPresident = corporation.presidentId === playerId;
    const presidentCert = playerCerts.find(cert => cert.isPresident);
    
    // President's Certificate can never be sold directly - it can only be transferred
    if (presidentCert) {
      console.log('Player has President\'s Certificate, checking if they can sell');
      // Check if any other player has at least 2 shares to become president
      let hasOtherPlayerWithTwoShares = false;
      for (const [otherPlayerId, otherPlayerCerts] of corporation.playerShares.entries()) {
        console.log(`Player ${otherPlayerId} has ${otherPlayerCerts.length} shares`);
        if (otherPlayerId !== playerId && otherPlayerCerts.length >= 2) {
          hasOtherPlayerWithTwoShares = true;
          console.log(`Player ${otherPlayerId} has enough shares to become president`);
          break;
        }
      }
      
      // If no other player has at least 2 shares, cannot sell
      if (!hasOtherPlayerWithTwoShares) {
        console.log('No other player has enough shares, showing notification');
        // Add notification explaining why they can't sell
        get().addNotification({
          title: 'Cannot Sell President\'s Certificate',
          message: 'You cannot sell shares because no other player has enough shares to become president. The President\'s Certificate can only be transferred, never sold directly.',
          type: 'warning',
          duration: 5000
        });
        return false; // Cannot sell President's Certificate if no one else can become president
      } else {
        console.log('Another player has enough shares, allowing sale');
      }
    }
    
    // Calculate total value
    const totalValue = corporation.sharePrice * shares;
    
    // Record previous state for undo
    const previousState = {
      playerCash: player.cash,
      playerCertificates: [...player.certificates],
      corporationShares: [...(corporation.playerShares.get(playerId) || [])],
      ipoShares: [...corporation.ipoShares],
      bankShares: [...corporation.bankShares]
    };
    
    // Remove certificates from player and add to bank pool
    // President's Certificate cannot be sold directly - only regular certificates
    const regularCerts = playerCerts.filter(cert => !cert.isPresident);
    const presidentCerts = playerCerts.filter(cert => cert.isPresident);
    
    // Can only sell regular certificates
    if (shares > regularCerts.length) {
      return false; // Cannot sell more shares than regular certificates available
    }
    
    const certsToRemove = regularCerts.slice(0, shares);
    
    const remainingCerts = player.certificates.filter(cert => 
      !certsToRemove.some(removeCert => 
        removeCert.corporationId === cert.corporationId && 
        removeCert.percentage === cert.percentage &&
        removeCert.isPresident === cert.isPresident
      )
    );
    
    // Check if this sale would cause president transfer BEFORE the sale
    // Calculate what the seller will have after the sale
    // Remove shares from regular certificates first, keep President's Certificate if possible
    const remainingRegularCerts = regularCerts.slice(0, regularCerts.length - shares);
    const sellerRemainingShares = [...remainingRegularCerts, ...presidentCerts];
    
    console.log('PlayerCerts before sale:', playerCerts.length);
    console.log('Shares being sold:', shares);
    console.log('SellerRemainingShares after sale:', sellerRemainingShares.length);
    console.log('SellerRemainingShares breakdown:', sellerRemainingShares.map(cert => `${cert.isPresident ? 'President' : 'Regular'} (${cert.percentage}%)`));
    const sellerIsPresident = corporation.presidentId === playerId;
    
    console.log('Presidency transfer check:', { sellerIsPresident, presidentCertsLength: presidentCerts.length, sellerId: playerId, presidentId: corporation.presidentId });
    
    if (sellerIsPresident && presidentCerts.length > 0) {
      // Find the player with the most shares after this sale
      let maxShares = 0;
      let newPresidentId = corporation.presidentId;
      
      // Check all players' shares in this corporation - compare TOTAL ownership percentages
      for (const [otherPlayerId, otherPlayerCerts] of state.corporations.find(c => c.id === corporationId)?.playerShares.entries() || []) {
        if (otherPlayerId === playerId) {
          // This is the seller - use their remaining shares after sale
          const sellerTotalPercentage = sellerRemainingShares.reduce((sum, cert) => sum + cert.percentage, 0);
          if (sellerTotalPercentage > maxShares) {
            maxShares = sellerTotalPercentage;
            newPresidentId = otherPlayerId;
          }
        } else {
          // Other players - use their current shares
          const otherPlayerTotalPercentage = otherPlayerCerts.reduce((sum, cert) => sum + cert.percentage, 0);
          if (otherPlayerTotalPercentage > maxShares) {
            maxShares = otherPlayerTotalPercentage;
            newPresidentId = otherPlayerId;
          }
        }
      }
      
      // If the seller will still have the most shares after the sale, no transfer needed
      if (newPresidentId === playerId) {
        console.log(`No presidency transfer needed: Seller will still have the most shares (${maxShares})`);
        return false;
      }
      
      // If seller would no longer have the most shares, transfer presidency BEFORE the sale
      // Only transfer if the new president has MORE shares (not equal)
      if (newPresidentId && newPresidentId !== playerId) {
        const sellerSharesAfterSale = sellerRemainingShares.reduce((sum, cert) => sum + cert.percentage, 0);
        const newPresidentShares = state.corporations.find(c => c.id === corporationId)?.playerShares.get(newPresidentId)?.reduce((sum, cert) => sum + cert.percentage, 0) || 0;
        
        console.log(`Presidency transfer check: Seller will have ${sellerSharesAfterSale}%, New president has ${newPresidentShares}%`);
        
        if (newPresidentShares > sellerSharesAfterSale) {
          console.log(`Presidency will transfer: ${newPresidentShares} > ${sellerSharesAfterSale}`);
        } else {
          console.log(`No presidency transfer: ${newPresidentShares} <= ${sellerSharesAfterSale} (tie or seller still has more)`);
          return false; // Don't transfer presidency if it's a tie or seller still has more
        }
        
        const presidentCert = presidentCerts[0]; // There should only be one President's Certificate
        
        // Update player shares map - transfer President's Certificate before sale
        const updatedPlayerShares = new Map(state.corporations.find(c => c.id === corporationId)?.playerShares || []);
        
        // NEW PRESIDENT gives 2 of their shares to SELLER in exchange for President's Certificate
        const existingNewPresidentShares = updatedPlayerShares.get(newPresidentId) || [];
        
        // Take 2 shares from the new president to give to seller
        const newPresidentSharesAfterExchange = existingNewPresidentShares.slice(0, existingNewPresidentShares.length - 2);
        const sharesToGiveToSeller = existingNewPresidentShares.slice(existingNewPresidentShares.length - 2);
        
        // Seller gets their remaining regular shares plus 2 shares from new president
        const sellerRegularShares = sellerRemainingShares.filter(cert => !cert.isPresident);
        const sellerFinalShares = [...sellerRegularShares, ...sharesToGiveToSeller];
        
        // New president gets President's Certificate plus remaining shares
        updatedPlayerShares.set(playerId, sellerFinalShares);
        updatedPlayerShares.set(newPresidentId, [...newPresidentSharesAfterExchange, presidentCert]);
        
        console.log(`After exchange: Seller will have ${sellerFinalShares.length} shares (${sellerRegularShares.length} regular + 2 from new president)`);
        console.log(`After exchange: New president will have ${newPresidentSharesAfterExchange.length + 1} shares (${newPresidentSharesAfterExchange.length} remaining + 1 President's Certificate)`);
        
        // Update the remaining certificates to reflect the transfer
        const finalRemainingCerts = remainingCerts.filter(cert => !cert.isPresident);
        
        // Add notification for president transfer
        const newPresident = state.players.find(p => p.id === newPresidentId);
        if (newPresident) {
          get().addNotification({
            title: corporation.name,
            message: `${player.name} dumps ${corporation.name}. ${newPresident.name} is now president.`,
            type: 'warning',
            duration: 3000
          });
        }
        
        set((state) => ({
          players: state.players.map(p => 
            p.id === playerId 
              ? { ...p, cash: p.cash + totalValue, certificates: finalRemainingCerts }
              : p
          ),
          corporations: state.corporations.map(c => 
            c.id === corporationId 
              ? { 
                  ...c, 
                  presidentId: newPresidentId,
                  bankShares: [...c.bankShares, ...certsToRemove],
                  playerShares: updatedPlayerShares
                }
              : c
          ),
          stockRoundState: {
            currentPlayerActions: [...(state.stockRoundState?.currentPlayerActions || []), {
              id: crypto.randomUUID(),
              playerId,
              type: 'sell_certificate',
              timestamp: Date.now(),
              data: {
                corporationId,
                shares,
                previousState
              }
            }],
            turnStartTime: state.stockRoundState?.turnStartTime || Date.now()
          }
        }));
        
        return true;
      }
    }
    
    // No president transfer occurred - proceed with normal sale
    set((state) => {
      const updatedPlayerShares = new Map(state.corporations.find(c => c.id === corporationId)?.playerShares || []);
      // Use the correct remaining shares for this corporation
      const remainingSharesForCorp = playerCerts.slice(0, playerCerts.length - shares);
      updatedPlayerShares.set(playerId, remainingSharesForCorp);
      
      return {
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
    
    return true;
  },

  buyPresidentCertificate: (playerId, corporationAbbreviation, parValue) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return false;
    
    // Find the existing corporation (it should already exist but not be floated)
    const existingCorporation = state.corporations.find(c => c.abbreviation === corporationAbbreviation);
    if (!existingCorporation) return false;
    
    // Check if corporation is already floated
    if (existingCorporation.floated) return false;
    
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
    if (!parValuePosition) return false;
    
    // Find the president certificate from the existing IPO pool
    const presidentCertificate = existingCorporation.ipoShares.find(cert => cert.isPresident);
    if (!presidentCertificate) return false;
    
    set((state) => ({
      players: state.players.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              cash: p.cash - presidentCost
            }
          : p
      ),
      corporations: state.corporations.map(c => 
        c.id === existingCorporation.id 
          ? {
              ...c,
              presidentId: playerId,
              parValue: parValue,
              sharePrice: parValue,
              floated: true,
              ipoShares: c.ipoShares.filter(cert => !cert.isPresident), // Remove president cert from IPO
              playerShares: new Map([[playerId, [presidentCertificate]]]) // Add president cert only
            }
          : c
      ),
      stockMarket: {
        ...state.stockMarket,
        tokenPositions: new Map([
          ...state.stockMarket.tokenPositions,
          [existingCorporation.id, parValuePosition]
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
        corporationAbbreviation,
        parValue,
        previousState: {
          playerCash: player.cash + presidentCost, // Cash before purchase
          playerCertificates: [...player.certificates],
          corporationShares: [],
          ipoShares: [],
          bankShares: []
        }
      }
    };
    
    set((state) => ({
      stockRoundState: {
        currentPlayerActions: [...(state.stockRoundState?.currentPlayerActions || []), stockAction],
        turnStartTime: state.stockRoundState?.turnStartTime || Date.now()
      }
    }));
    
    // Add notification
    get().addNotification({
      title: existingCorporation.name,
      message: `${player.name} started ${existingCorporation.name} at par value $${parValue} (bought 2 shares for $${presidentCost})`,
      type: 'purchase',
      duration: 3000
    });
    
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
        // Handle start_corporation undo - revert corporation to unfloated state
        newState.corporations = state.corporations.map(corp => {
          if (corp.abbreviation === lastAction.data.corporationAbbreviation) {
            return {
              ...corp,
              presidentId: undefined,
              parValue: undefined,
              sharePrice: 0,
              floated: false,
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
              playerShares: currentPlayerShares
            };
          }
          return corp;
        });
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
    
    set((state) => ({
      currentPlayerIndex: nextPlayerIndex,
      stockRoundState: {
        currentPlayerActions: [],
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
    

    
    let newPosition: Point;
    if (direction === 'up') {
      // Move up and right (diagonal)
      newPosition = { x: currentPosition.x + 1, y: currentPosition.y - 1 };
    } else {
      // Move down and left (diagonal)
      newPosition = { x: currentPosition.x - 1, y: currentPosition.y + 1 };
    }
    
    // Check bounds
    if (newPosition.y < 0 || newPosition.y >= STOCK_MARKET_GRID.length || 
        newPosition.x < 0 || newPosition.x >= STOCK_MARKET_GRID[newPosition.y].length ||
        STOCK_MARKET_GRID[newPosition.y][newPosition.x] === null) {
      return false;
    }
    
    // Update position and share price
    const newPrice = parseInt(STOCK_MARKET_GRID[newPosition.y][newPosition.x] as string);
    
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
