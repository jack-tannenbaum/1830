import { GamePhase, TrainType, TileColor, PhaseConfig } from './game';

export const PHASE_CONFIGS: Record<GamePhase, PhaseConfig> = {
  [GamePhase.ONE]: {
    phase: GamePhase.ONE,
    name: 'Phase 1 - Private Auction',
    description: 'Private company auction phase. No corporations can operate yet.',
    trainTypes: [TrainType.TWO],
    maxTrainsPerCorp: 0, // No corporations operating yet
    allowedTileColors: [],
    canPurchasePrivates: false,
    operatingRoundsBetweenStock: 0,
    offBoardValueRule: 'lesser',
    privateCompaniesClosed: false,
    twoTrainsObsolete: false,
    threeTrainsObsolete: false,
    fourTrainsObsolete: false
  },
  
  [GamePhase.TWO]: {
    phase: GamePhase.TWO,
    name: 'Phase 2 - 2-Train Operations',
    description: 'Corporations can operate with 2-trains. Yellow tiles only. Up to 4 trains per corporation.',
    trainTypes: [TrainType.TWO],
    maxTrainsPerCorp: 4,
    allowedTileColors: [TileColor.YELLOW],
    canPurchasePrivates: false,
    operatingRoundsBetweenStock: 1,
    offBoardValueRule: 'lesser',
    privateCompaniesClosed: false,
    twoTrainsObsolete: false,
    threeTrainsObsolete: false,
    fourTrainsObsolete: false
  },
  
  [GamePhase.THREE]: {
    phase: GamePhase.THREE,
    name: 'Phase 3 - 3-Train Operations',
    description: '3-trains available. Yellow and green tiles. Up to 4 trains per corporation. Can purchase private companies.',
    trainTypes: [TrainType.TWO, TrainType.THREE],
    maxTrainsPerCorp: 4,
    allowedTileColors: [TileColor.YELLOW, TileColor.GREEN],
    canPurchasePrivates: true,
    operatingRoundsBetweenStock: 2,
    offBoardValueRule: 'lesser',
    privateCompaniesClosed: false,
    twoTrainsObsolete: false,
    threeTrainsObsolete: false,
    fourTrainsObsolete: false
  },
  
  [GamePhase.FOUR]: {
    phase: GamePhase.FOUR,
    name: 'Phase 4 - 4-Train Operations',
    description: '4-trains available. Yellow and green tiles. Up to 3 trains per corporation. 2-trains become obsolete.',
    trainTypes: [TrainType.THREE, TrainType.FOUR],
    maxTrainsPerCorp: 3,
    allowedTileColors: [TileColor.YELLOW, TileColor.GREEN],
    canPurchasePrivates: true,
    operatingRoundsBetweenStock: 2,
    offBoardValueRule: 'lesser',
    privateCompaniesClosed: false,
    twoTrainsObsolete: true,
    threeTrainsObsolete: false,
    fourTrainsObsolete: false
  },
  
  [GamePhase.FIVE]: {
    phase: GamePhase.FIVE,
    name: 'Phase 5 - 5-Train Operations',
    description: '5-trains available. Yellow, green, and brown tiles. Up to 2 trains per corporation. Private companies closed.',
    trainTypes: [TrainType.THREE, TrainType.FOUR, TrainType.FIVE],
    maxTrainsPerCorp: 2,
    allowedTileColors: [TileColor.YELLOW, TileColor.GREEN, TileColor.BROWN],
    canPurchasePrivates: false,
    operatingRoundsBetweenStock: 3,
    offBoardValueRule: 'greater',
    privateCompaniesClosed: true,
    twoTrainsObsolete: true,
    threeTrainsObsolete: false,
    fourTrainsObsolete: false
  },
  
  [GamePhase.SIX]: {
    phase: GamePhase.SIX,
    name: 'Phase 6 - 6-Train Operations',
    description: '6-trains available. All tile colors. Up to 2 trains per corporation. 3-trains become obsolete.',
    trainTypes: [TrainType.FOUR, TrainType.FIVE, TrainType.SIX],
    maxTrainsPerCorp: 2,
    allowedTileColors: [TileColor.YELLOW, TileColor.GREEN, TileColor.BROWN, TileColor.GRAY],
    canPurchasePrivates: false,
    operatingRoundsBetweenStock: 3,
    offBoardValueRule: 'greater',
    privateCompaniesClosed: true,
    twoTrainsObsolete: true,
    threeTrainsObsolete: true,
    fourTrainsObsolete: false
  },
  
  [GamePhase.SEVEN]: {
    phase: GamePhase.SEVEN,
    name: 'Phase 7 - Diesel Operations',
    description: 'Diesel trains available. All tile colors. Up to 2 trains per corporation. 4-trains become obsolete.',
    trainTypes: [TrainType.FIVE, TrainType.SIX, TrainType.DIESEL],
    maxTrainsPerCorp: 2,
    allowedTileColors: [TileColor.YELLOW, TileColor.GREEN, TileColor.BROWN, TileColor.GRAY],
    canPurchasePrivates: false,
    operatingRoundsBetweenStock: 3,
    offBoardValueRule: 'greater',
    privateCompaniesClosed: true,
    twoTrainsObsolete: true,
    threeTrainsObsolete: true,
    fourTrainsObsolete: true
  }
};

export const getPhaseConfig = (phase: GamePhase): PhaseConfig => {
  return PHASE_CONFIGS[phase];
};

export const getCurrentPhaseConfig = (phase: GamePhase): PhaseConfig => {
  return PHASE_CONFIGS[phase];
};

// Helper functions for phase-specific rules
export const canPlayTileColor = (currentPhase: GamePhase, tileColor: TileColor): boolean => {
  const config = getPhaseConfig(currentPhase);
  return config.allowedTileColors.includes(tileColor);
};

export const getMaxTrainsPerCorp = (currentPhase: GamePhase): number => {
  const config = getPhaseConfig(currentPhase);
  return config.maxTrainsPerCorp;
};

export const canPurchasePrivateCompanies = (currentPhase: GamePhase): boolean => {
  const config = getPhaseConfig(currentPhase);
  return config.canPurchasePrivates;
};

export const getOperatingRoundsBetweenStock = (currentPhase: GamePhase): number => {
  const config = getPhaseConfig(currentPhase);
  return config.operatingRoundsBetweenStock;
};

export const getOffBoardValueRule = (currentPhase: GamePhase): 'lesser' | 'greater' => {
  const config = getPhaseConfig(currentPhase);
  return config.offBoardValueRule;
};

export const arePrivateCompaniesClosed = (currentPhase: GamePhase): boolean => {
  const config = getPhaseConfig(currentPhase);
  return config.privateCompaniesClosed;
};

export const areTwoTrainsObsolete = (currentPhase: GamePhase): boolean => {
  const config = getPhaseConfig(currentPhase);
  return config.twoTrainsObsolete;
};

export const areThreeTrainsObsolete = (currentPhase: GamePhase): boolean => {
  const config = getPhaseConfig(currentPhase);
  return config.threeTrainsObsolete;
};

export const areFourTrainsObsolete = (currentPhase: GamePhase): boolean => {
  const config = getPhaseConfig(currentPhase);
  return config.fourTrainsObsolete;
};
