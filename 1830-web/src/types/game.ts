// Core game types based on the Flutter architecture

export enum RoundType {
  PRIVATE_AUCTION = 'private_auction',
  PRIVATE_RESOLUTION = 'private_resolution',
  AUCTION_SUMMARY = 'auction_summary',
  STOCK = 'stock',
  OPERATING = 'operating'
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
  floated: boolean;
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

export interface GameState {
  id: string;
  phase: number;
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
    type: 'bid' | 'purchase' | 'info' | 'warning';
    duration?: number;
    timestamp: number; // For queuing and ordering
  }[];
  currentAction?: GameAction;
  history: GameAction[];
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

export interface GameAction {
  id: string;
  type: string;
  playerId: string;
  timestamp: number;
  data: any;
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
