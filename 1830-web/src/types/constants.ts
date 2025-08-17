import type { Corporation, PrivateCompany } from './game';
import { TrainType } from './game';

// Game constants for 1830
export const GAME_CONSTANTS = {
  STARTING_CASH: 600,
  BANK_CASH: 12000,
  MAX_SHARES_PER_CORPORATION: 10,
  PRESIDENT_SHARE_PERCENTAGE: 20,
  NORMAL_SHARE_PERCENTAGE: 10,
  CERTIFICATE_LIMIT: {
    3: 20, // 3 players
    4: 16, // 4 players  
    5: 13, // 5 players
    6: 11  // 6 players
  }
} as const;

export const TRAIN_DATA: Record<TrainType, { cost: number; maxCities: number; quantity: number }> = {
  [TrainType.TWO]: { cost: 80, maxCities: 2, quantity: 8 },
  [TrainType.THREE]: { cost: 180, maxCities: 3, quantity: 7 },
  [TrainType.FOUR]: { cost: 300, maxCities: 4, quantity: 6 },
  [TrainType.FIVE]: { cost: 450, maxCities: 5, quantity: 5 },
  [TrainType.SIX]: { cost: 630, maxCities: 6, quantity: 4 },
  [TrainType.DIESEL]: { cost: 1100, maxCities: 999, quantity: 4 }
};

export const CORPORATIONS: Omit<Corporation, 'id' | 'presidentId' | 'sharePrice' | 'treasury' | 'trains' | 'tokens' | 'ipoShares' | 'bankShares' | 'playerShares' | 'floated'>[] = [
  { name: 'Pennsylvania Railroad', abbreviation: 'PRR', parValue: undefined, color: '#008000' },
  { name: 'New York Central', abbreviation: 'NYC', parValue: undefined, color: '#000000' },
  { name: 'Canadian Pacific', abbreviation: 'CPR', parValue: undefined, color: '#FFA500' },
  { name: 'Baltimore & Ohio', abbreviation: 'B&O', parValue: undefined, color: '#FF0000' },
  { name: 'Chesapeake & Ohio', abbreviation: 'C&O', parValue: undefined, color: '#0000FF' },
  { name: 'Erie Railroad', abbreviation: 'ERIE', parValue: undefined, color: '#FFFF00' },
  { name: 'New York, New Haven & Hartford', abbreviation: 'NNH', parValue: undefined, color: '#800080' },
  { name: 'Boston & Maine', abbreviation: 'B&M', parValue: undefined, color: '#8B4513' }
];

export const PRIVATE_COMPANIES: Omit<PrivateCompany, 'id'>[] = [
  { name: 'Schuylkill Valley', cost: 20, revenue: 5, effect: 'No special effect' },
  { name: 'Champlain & St. Lawrence', cost: 40, revenue: 10, effect: 'Blocks hex B20 while owned by a player' },
  { name: 'Delaware & Hudson', cost: 70, revenue: 15, effect: 'Blocks hexes F16 and G19 while owned by a player' },
  { name: 'Mohawk & Hudson', cost: 110, revenue: 20, effect: 'A corporation owning the M&H may lay a tile and station token in Albany (D14) for only the $40 tile cost' },
  { name: 'Camden & Amboy', cost: 160, revenue: 25, effect: 'Blocks hex H18 while owned by a player. The corporation owning this company may place a "free" tile in hex H18' },
  { name: 'Baltimore & Ohio', cost: 220, revenue: 30, effect: 'The player owning this private company immediately receives the President\'s certificate of the Baltimore & Ohio' }
];

export const STOCK_MARKET_GRID: (number | null)[][] = [
  [null, null, null, null, 70, 80, 90, 100, 112, 126, 142],
  [null, null, null, 60, 67, 76, 86, 97, 109, 122, 136],
  [null, null, 50, 55, 62, 70, 78, 87, 96, 106, 117],
  [null, 40, 45, 50, 55, 62, 68, 75, 82, 90, 99],
  [null, 35, 40, 45, 50, 55, 60, 65, 70, 76, 82],
  [null, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75],
  [null, null, 30, 35, 40, 45, 50, 55, 60, 65, 70],
  [null, null, null, 30, 35, 40, 45, 50, 55, 60, 65],
  [null, null, null, null, 30, 35, 40, 45, 50, 55, 60],
  [null, null, null, null, null, 30, 35, 40, 45, 50, 55]
];

export const getTrainMaxCities = (trainType: TrainType): number => {
  return TRAIN_DATA[trainType].maxCities;
};

export const getTrainCost = (trainType: TrainType): number => {
  return TRAIN_DATA[trainType].cost;
};
