// Core game types based on the Flutter architecture

export enum RoundType {
  PRIVATE_AUCTION = 'private_auction',
  PRIVATE_RESOLUTION = 'private_resolution',
  AUCTION_SUMMARY = 'auction_summary',
  STOCK = 'stock',
  OPERATING = 'operating'
}

export enum GamePhase {
  ONE = 1,    // 2-train phase (private auction)
  TWO = 2,    // 2-train phase (after privates purchased)
  THREE = 3,  // 3-train phase
  FOUR = 4,   // 4-train phase
  FIVE = 5,   // 5-train phase
  SIX = 6,    // 6-train phase
  SEVEN = 7   // Diesel phase
}

export enum TrainType {
  TWO = 'two',
  THREE = 'three', 
  FOUR = 'four',
  FIVE = 'five',
  SIX = 'six',
  DIESEL = 'diesel'
}

export enum HexType {
  EMPTY = 'empty',
  CITY = 'city',
  OFF_BOARD = 'offBoard',
  MOUNTAIN = 'mountain',
  RIVER = 'river'
}

export enum TileColor {
  YELLOW = 'yellow',
  GREEN = 'green',
  BROWN = 'brown',
  GRAY = 'gray'
}

export interface Point {
  x: number;
  y: number;
}

export interface Certificate {
  corporationId: string;
  percentage: number; // 10 or 20
  isPresident: boolean;
}

export interface PrivateCompany {
  id: string;
  name: string;
  cost: number;
  revenue: number;
  effect?: string;
}

export interface OwnedPrivateCompany extends PrivateCompany {
  purchasePrice: number;
}

export interface Train {
  id: string;
  type: TrainType;
  cost: number;
  ownerId?: string; // corporation ID
}

export interface MapToken {
  id: string;
  corporationId: string;
  hexId: string;
  isStation: boolean;
}

export interface Tile {
  id: string;
  color: TileColor;
  cityCount: number;
  connections: string[];
  revenue: number[];
}

export interface MapHex {
  id: string;
  type: HexType;
  tile?: Tile;
  terrainCost: number;
  position: Point;
  tokens: MapToken[];
}

export interface Corporation {
  id: string;
  name: string;
  abbreviation: string;
  presidentId?: string;
  parValue?: number;
  sharePrice: number;
  treasury: number;
  trains: Train[];
  tokens: MapToken[];
  ipoShares: Certificate[]; // Shares available for purchase from IPO
  bankShares: Certificate[]; // Shares in bank pool (sold by players)
  playerShares: Map<string, Certificate[]>; // playerId -> certificates owned
  started: boolean; // Corporation is started when president's certificate is purchased
  floated: boolean; // Corporation is floated when 60% of shares are sold from IPO
  color: string;
}

export interface Player {
  id: string;
  name: string;
  cash: number;
  certificates: Certificate[];
  privateCompanies: OwnedPrivateCompany[];
  priority: number; // turn order
}

export interface StockMarket {
  tokenPositions: Map<string, Point>; // corporationId -> position
  grid: (number | null)[][]; // stock price grid
}

export interface Bank {
  cash: number;
  certificates: Certificate[];
  privateCompanies: PrivateCompany[];
}

export interface GameMap {
  hexes: Map<string, MapHex>;
  tiles: Map<string, Tile>;
}

export interface PhaseConfig {
  phase: GamePhase;
  name: string;
  description: string;
  trainTypes: TrainType[];
  maxTrainsPerCorp: number;
  allowedTileColors: TileColor[];
  canPurchasePrivates: boolean;
  operatingRoundsBetweenStock: number;
  offBoardValueRule: 'lesser' | 'greater';
  privateCompaniesClosed: boolean;
  twoTrainsObsolete: boolean;
  threeTrainsObsolete: boolean;
  fourTrainsObsolete: boolean;
}

export interface GameState {
  id: string;
  phase: GamePhase;
  roundType: RoundType;
  currentPlayerIndex: number;
  players: Player[];
  corporations: Corporation[];
  stockMarket: StockMarket;
  bank: Bank;
  gameMap: GameMap;
  trainSupply: Map<TrainType, Train[]>;
  auctionState?: AuctionState;
  auctionSummary?: AuctionSummary;
  resolvingCompanyId?: string;
  notifications: {
    id: string;
    title: string;
    message: string;
    type: 'bid' | 'purchase' | 'info' | 'warning' | 'success';
    duration?: number;
    timestamp: number; // For queuing and ordering
  }[];
  currentAction?: GameAction;
  history: GameAction[];
  
  // Turn-based multiplayer infrastructure (local for now)
  currentTurn?: TurnInfo;
  connectedPlayers: ConnectedPlayer[];
  actionHistory: GameAction[]; // For replay/sync
  turnTimeoutMs: number; // Default turn timeout
  
  stockRoundState?: {
    currentPlayerActions: StockAction[];
    stockRoundActions: StockAction[]; // Track all actions in the current stock round
    turnStartTime: number;
    pendingStockMovements?: { corporationId: string; sharesSold: number }[];
    consecutivePasses?: number;
  };
  operatingRoundState?: {
    operatingOrder: string[]; // corporation IDs in operating order
    currentOperatingIndex: number; // index of current corporation operating
    operatingCorporationId?: string; // ID of corporation currently operating
  };
  pendingBoeffect?: {
    playerId: string;
    corporationId: string;
  };
}

export interface PlayerBid {
  playerId: string;
  amount: number;
  privateCompanyId: string;
}

export interface PrivateCompanyState {
  id: string;
  currentPrice: number; // can be reduced from face value
  isOwned: boolean;
  ownerId?: string;
}

export interface BidOffState {
  privateCompanyId: string;
  participantIds: string[]; // player IDs in the bid-off
  currentPlayerIndex: number;
  currentBid: number;
  currentBidderId: string;
  consecutivePasses: number;
}

export interface AuctionState {
  privateCompanies: PrivateCompanyState[];
  playerTurnOrder: string[]; // player IDs  
  currentPlayerIndex: number;
  playerBids: PlayerBid[]; // one bid per player max
  lockedMoney: Map<string, number>; // playerId -> locked amount
  consecutivePasses: number;
  auctionComplete: boolean;
  bidOffState?: BidOffState; // active when there's a tie to resolve
}

export interface AuctionSummary {
  results: {
    companyId: string;
    companyName: string;
    outcome: 'sold' | 'unsold';
    buyerId?: string;
    buyerName?: string;
    price: number;
  }[];
}

export interface StockAction {
  id: string;
  playerId: string;
  type: 'buy_certificate' | 'sell_certificate' | 'start_corporation' | 'pass_stock';
  timestamp: number;
  data: {
    corporationId?: string;
    corporationAbbreviation?: string;
    parValue?: number;
    shares?: number;
    previousState?: {
      playerCash: number;
      playerCertificates: Certificate[];
      corporationShares: Certificate[];
      ipoShares: Certificate[];
      bankShares: Certificate[];
      purchasedCertificate?: Certificate;
      stockPrice?: number;
      stockPosition?: Point;
    };
  };
}

export enum ActionType {
  // Private auction actions
  BUY_CHEAPEST_PRIVATE = 'buy_cheapest_private',
  BID_ON_PRIVATE = 'bid_on_private',
  PASS_PRIVATE_AUCTION = 'pass_private_auction',
  
  // Bid-off actions
  BID_OFF_BID = 'bid_off_bid',
  BID_OFF_PASS = 'bid_off_pass',
  
  // Stock round actions  
  BUY_CERTIFICATE = 'buy_certificate',
  BUY_PRESIDENT_CERTIFICATE = 'buy_president_certificate',
  SELL_CERTIFICATE = 'sell_certificate',
  PASS_STOCK = 'pass_stock',
  
  // Operating round actions
  LAY_TRACK = 'lay_track',
  PLACE_TOKEN = 'place_token',
  RUN_TRAINS = 'run_trains',
  BUY_TRAIN = 'buy_train',
  DECLARE_DIVIDEND = 'declare_dividend'
}

// Turn-based multiplayer types
export interface TurnInfo {
  playerId: string;
  turnType: 'private_auction' | 'stock' | 'operating';
  startTime: number;
  timeoutMs: number;
  availableActions: ActionType[];
  isActive: boolean;
}

export interface ConnectedPlayer {
  playerId: string;
  isOnline: boolean;
  lastSeen: number;
  displayName: string;
}

export interface GameAction {
  id: string;
  type: ActionType;
  playerId: string;
  timestamp: number;
  data: Record<string, unknown>;
  clientId?: string; // For future WebSocket implementation
  sequenceNumber?: number; // For future conflict resolution
}
