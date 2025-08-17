import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Player, GameAction, AuctionState, PlayerBid, PrivateCompanyState } from '../types/game';
import { RoundType, ActionType } from '../types/game';
import { GAME_CONSTANTS, PRIVATE_COMPANIES } from '../types/constants';

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
  
  // Stock actions
  buyCertificate: (playerId: string, corporationId: string) => boolean;
  buyPresidentCertificate: (playerId: string, corporationId: string, parValue: number) => boolean;
  sellCertificate: (playerId: string, corporationId: string, shares: number) => boolean;
}

const createInitialState = (): Partial<GameState> => ({
  id: crypto.randomUUID(),
  phase: 1,
  roundType: RoundType.PRIVATE_AUCTION,
  currentPlayerIndex: 0,
  players: [],
  corporations: [],
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

    return {
      ...initialState,
      players,
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
    set((state) => ({
      players: state.players.map(p => 
        p.id === playerId 
          ? { 
              ...p, 
              cash: p.cash - cheapest.currentPrice,
              privateCompanies: [...p.privateCompanies, privateCompany]
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
      }
    }));

    get().addAction({
      type: ActionType.BUY_CHEAPEST_PRIVATE,
      playerId,
      data: { privateCompanyId: cheapest.id, amount: cheapest.currentPrice }
    });

    get().checkAuctionComplete();
    return true;
  },

  bidOnPrivate: (playerId, privateCompanyId, amount) => {
    const state = get();
    if (!state.auctionState || state.roundType !== RoundType.PRIVATE_AUCTION) return false;
    
    const player = state.players.find(p => p.id === playerId);
    const privateCompany = state.auctionState.privateCompanies.find(pc => pc.id === privateCompanyId);
    
    if (!player || !privateCompany || privateCompany.isOwned || player.cash < amount) return false;

    // Can't bid on cheapest (must buy at face value)
    const cheapest = state.auctionState.privateCompanies
      .filter(pc => !pc.isOwned)
      .sort((a, b) => a.currentPrice - b.currentPrice)[0];
    
    if (privateCompany.id === cheapest?.id) return false;

    // Check if player already has a bid (can only have one)
    const existingBid = state.auctionState.playerBids.find(bid => bid.playerId === playerId);
    
    // Minimum bid is $5 over current price or existing highest bid
    const existingBids = state.auctionState.playerBids.filter(bid => bid.privateCompanyId === privateCompanyId);
    const highestBid = Math.max(...existingBids.map(bid => bid.amount), privateCompany.currentPrice);
    const minBid = highestBid + 5;
    
    if (amount < minBid) return false;

    // Remove existing bid if any and add new bid
    const newBids = state.auctionState.playerBids.filter(bid => bid.playerId !== playerId);
    newBids.push({ playerId, amount, privateCompanyId });

    // Update locked money
    const newLockedMoney = new Map(state.auctionState.lockedMoney);
    if (existingBid) {
      newLockedMoney.set(playerId, amount);
    } else {
      newLockedMoney.set(playerId, amount);
    }

    set((state) => ({
      auctionState: {
        ...state.auctionState!,
        playerBids: newBids,
        lockedMoney: newLockedMoney,
        currentPlayerIndex: (state.auctionState!.currentPlayerIndex + 1) % state.auctionState!.playerTurnOrder.length,
        consecutivePasses: 0
      }
    }));

    get().addAction({
      type: ActionType.BID_ON_PRIVATE,
      playerId,
      data: { privateCompanyId, amount }
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

  checkAuctionComplete: () => {
    const state = get();
    if (!state.auctionState) return;

    const remainingCompanies = state.auctionState.privateCompanies.filter(pc => !pc.isOwned);
    
    if (remainingCompanies.length === 0) {
      // All companies sold, move to stock round
      set((state) => ({
        roundType: RoundType.STOCK,
        auctionState: undefined,
        currentPlayerIndex: 0
      }));
    }
  },

  buyCertificate: (playerId, corporationId) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    const corporation = state.corporations.find(c => c.id === corporationId);
    
    if (!player || !corporation) return false;
    
    // Implementation will be added later
    console.log(`Player ${player.name} wants to buy certificate from ${corporation.name}`);
    return true;
  },

  sellCertificate: (playerId, corporationId, shares) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    
    if (!player) return false;
    
    // Implementation will be added later
    console.log(`Player ${player.name} wants to sell ${shares} shares of ${corporationId}`);
    return true;
  },

  buyPresidentCertificate: (playerId, corporationId, parValue) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);
    // Corporation logic will be implemented when we add corporations
    
    if (!player) return false;
    
    // Implementation will be added later when we implement stock rounds
    console.log(`Player ${player.name} buying president certificate of ${corporationId} at par ${parValue}`);
    return true;
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
