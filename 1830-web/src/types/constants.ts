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
  [TrainType.TWO]: { cost: 80, maxCities: 2, quantity: 6 },
  [TrainType.THREE]: { cost: 180, maxCities: 3, quantity: 5 },
  [TrainType.FOUR]: { cost: 300, maxCities: 4, quantity: 4 },
  [TrainType.FIVE]: { cost: 450, maxCities: 5, quantity: 3 },
  [TrainType.SIX]: { cost: 630, maxCities: 6, quantity: 2 },
  [TrainType.DIESEL]: { cost: 1100, maxCities: 999, quantity: 6 }
};

export const CORPORATIONS: Omit<Corporation, 'id' | 'presidentId' | 'sharePrice' | 'treasury' | 'trains' | 'tokens' | 'ipoShares' | 'bankShares' | 'playerShares' | 'floated'>[] = [
  { name: 'Pennsylvania Railroad', abbreviation: 'PRR', parValue: undefined, color: '#008000', started: false },
  { name: 'New York Central', abbreviation: 'NYC', parValue: undefined, color: '#000000', started: false },
  { name: 'Canadian Pacific', abbreviation: 'CPR', parValue: undefined, color: '#FF0000', started: false },
  { name: 'Baltimore & Ohio', abbreviation: 'B&O', parValue: undefined, color: '#800080', started: false },
  { name: 'Chesapeake & Ohio', abbreviation: 'C&O', parValue: undefined, color: '#0000FF', started: false },
  { name: 'Erie Railroad', abbreviation: 'ERIE', parValue: undefined, color: '#FFFF00', started: false },
  { name: 'New York, New Haven & Hartford', abbreviation: 'NNH', parValue: undefined, color: '#FFA500', started: false },
  { name: 'Boston & Maine', abbreviation: 'B&M', parValue: undefined, color: '#8B4513', started: false }
];

export const PRIVATE_COMPANIES: Omit<PrivateCompany, 'id'>[] = [
  { name: 'Schuylkill Valley', cost: 20, revenue: 5, effect: 'No special effect' },
  { name: 'Champlain & St. Lawrence', cost: 40, revenue: 10, effect: 'Blocks hex B20 while owned by a player' },
  { name: 'Delaware & Hudson', cost: 70, revenue: 15, effect: 'Blocks hexes F16 and G19 while owned by a player' },
  { name: 'Mohawk & Hudson', cost: 110, revenue: 20, effect: 'A corporation owning the M&H may lay a tile and station token in Albany (D14) for only the $40 tile cost' },
  { name: 'Camden & Amboy', cost: 160, revenue: 25, effect: 'Blocks hex H18 while owned by a player. The corporation owning this company may place a "free" tile in hex H18' },
  { name: 'Baltimore & Ohio', cost: 220, revenue: 30, effect: 'The player owning this private company immediately receives the President\'s certificate of the Baltimore & Ohio' }
];

export const STOCK_MARKET_GRID = [
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
] as const;

export const STOCK_MARKET_COLOR_GRID = [
  ["yellow", "white", "white", "white", "white", "white", "red", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white"],
  ["yellow", "yellow", "white", "white", "white", "white", "red", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white", "white"],
  ["yellow", "yellow", "yellow", "white", "white", "white", "red", "white", "white", "white", "white", "white", "white", "white", "white", "white", null, null, null],
  ["orange", "yellow", "yellow", "yellow", "white", "white", "red", "white", "white", "white", "white", "white", "white", null, null, null, null, null, null],
  ["orange", "orange", "yellow", "yellow", "white", "white", "red", "white", "white", "white", "white", null, null, null, null, null, null, null, null],
  ["brown", "orange", "orange", "yellow", "yellow", "white", "red", "white", "white", "white", null, null, null, null, null, null, null, null, null],
  ["brown", "brown", "orange", "orange", "yellow", "white", "white", "white", "white", null, null, null, null, null, null, null, null, null, null],
  ["brown", "brown", "brown", "orange", "yellow", "yellow", "white", "white", null, null, null, null, null, null, null, null, null, null, null],
  [null, "brown", "brown", "brown", "orange", "yellow", "yellow", null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, "brown", "brown", "brown", "orange", "yellow", null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, "brown", "brown", "brown", "orange", null, null, null, null, null, null, null, null, null, null, null, null]
] as const;


export const getTrainMaxCities = (trainType: TrainType): number => {
  return TRAIN_DATA[trainType].maxCities;
};

export const getTrainCost = (trainType: TrainType): number => {
  return TRAIN_DATA[trainType].cost;
};
