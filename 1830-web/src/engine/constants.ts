export const TOTAL_GAME_CASH = 12_000;
export const DISTRIBUTED_PLAYER_CASH = 2_400;
export const STARTING_CASH = { 3: 800, 4: 600, 5: 480, 6: 400 } as const;
export const CERTIFICATE_LIMIT = { 3: 20, 4: 16, 5: 13, 6: 11 } as const;
export const PAR_VALUES = [67, 71, 76, 82, 90, 100] as const;
export const SAVE_SCHEMA_VERSION = 2;
export const ENGINE_VERSION = "financial-core-v1";
export const SAVE_KEY = "1830-game-v2";

export const STOCK_MARKET_GRID = [
  ["60", "67", "71", "76", "82", "90", "100", "112", "125", "142", "160", "180", "200", "225", "250", "275", "300", "325", "350"],
  ["53", "60", "66", "70", "76", "82", "90", "100", "112", "125", "142", "160", "180", "200", "220", "240", "260", "280", "300"],
  ["46", "55", "60", "65", "70", "76", "82", "90", "100", "111", "125", "140", "155", "170", "185", "200", null, null, null],
  ["39", "48", "54", "60", "66", "71", "76", "82", "90", "100", "110", "120", "130", null, null, null, null, null, null],
  ["32", "41", "48", "55", "62", "67", "71", "76", "82", "90", "100", null, null, null, null, null, null, null, null],
  ["25", "34", "42", "50", "58", "65", "67", "71", "75", "80", null, null, null, null, null, null, null, null, null],
  ["18", "27", "36", "45", "54", "63", "67", "69", "70", null, null, null, null, null, null, null, null, null, null],
  ["10", "20", "30", "40", "50", "60", "67", "68", null, null, null, null, null, null, null, null, null, null, null],
  [null, "10", "20", "30", "40", "50", "60", null, null, null, null, null, null, null, null, null, null, null],
  [null, null, "10", "20", "30", "40", "50", null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, "10", "20", "30", "40", null, null, null, null, null, null, null, null, null, null, null, null],
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
  [null, "brown", "brown", "brown", "orange", "yellow", "yellow", null, null, null, null, null, null, null, null, null, null, null],
  [null, null, "brown", "brown", "brown", "orange", "yellow", null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, "brown", "brown", "brown", "orange", null, null, null, null, null, null, null, null, null, null, null, null],
] as const;
