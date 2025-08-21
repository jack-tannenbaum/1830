import { TurnInfo, ActionType, RoundType, GameState, GameAction } from '../types/game';

// Default turn timeout (30 seconds)
export const DEFAULT_TURN_TIMEOUT = 30000;

// Turn timeout for different round types
export const TURN_TIMEOUTS = {
  [RoundType.PRIVATE_AUCTION]: 45000, // 45 seconds for auction decisions
  [RoundType.STOCK]: 30000, // 30 seconds for stock actions
  [RoundType.OPERATING]: 60000, // 60 seconds for operating decisions
};

/**
 * Creates a new turn for the specified player
 */
export const createTurn = (
  playerId: string,
  roundType: RoundType,
  availableActions: ActionType[],
  timeoutMs: number = DEFAULT_TURN_TIMEOUT
): TurnInfo => {
  return {
    playerId,
    turnType: roundType as 'private_auction' | 'stock' | 'operating',
    startTime: Date.now(),
    timeoutMs,
    availableActions,
    isActive: true,
  };
};

/**
 * Checks if it's the specified player's turn
 */
export const isPlayerTurn = (currentTurn: TurnInfo | undefined, playerId: string): boolean => {
  return currentTurn?.playerId === playerId && currentTurn?.isActive === true;
};

/**
 * Checks if the turn has timed out
 */
export const isTurnTimedOut = (currentTurn: TurnInfo | undefined): boolean => {
  if (!currentTurn || !currentTurn.isActive) return false;
  return Date.now() - currentTurn.startTime > currentTurn.timeoutMs;
};

/**
 * Validates if an action is allowed for the current turn
 */
export const validateAction = (
  action: GameAction,
  currentTurn: TurnInfo | undefined,
  roundType: RoundType
): { isValid: boolean; error?: string } => {
  // Check if it's the player's turn
  if (!isPlayerTurn(currentTurn, action.playerId)) {
    return { isValid: false, error: 'Not your turn' };
  }

  // Check if turn has timed out
  if (isTurnTimedOut(currentTurn)) {
    return { isValid: false, error: 'Turn has timed out' };
  }

  // Check if action is allowed for current turn type
  if (!currentTurn?.availableActions.includes(action.type)) {
    return { isValid: false, error: `Action ${action.type} not allowed in current turn` };
  }

  return { isValid: true };
};

/**
 * Gets available actions for a round type
 */
export const getAvailableActions = (roundType: RoundType): ActionType[] => {
  switch (roundType) {
    case RoundType.PRIVATE_AUCTION:
      return [
        ActionType.BUY_CHEAPEST_PRIVATE,
        ActionType.BID_ON_PRIVATE,
        ActionType.PASS_PRIVATE_AUCTION,
      ];
    
    case RoundType.STOCK:
      return [
        ActionType.BUY_CERTIFICATE,
        ActionType.BUY_PRESIDENT_CERTIFICATE,
        ActionType.SELL_CERTIFICATE,
        ActionType.PASS_STOCK,
      ];
    
    case RoundType.OPERATING:
      return [
        ActionType.LAY_TRACK,
        ActionType.PLACE_TOKEN,
        ActionType.RUN_TRAINS,
        ActionType.BUY_TRAIN,
        ActionType.DECLARE_DIVIDEND,
      ];
    
    default:
      return [];
  }
};

/**
 * Creates a game action with proper metadata
 */
export const createGameAction = (
  type: ActionType,
  playerId: string,
  data: Record<string, unknown> = {}
): GameAction => {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    playerId,
    timestamp: Date.now(),
    data,
    clientId: 'local', // For future WebSocket implementation
    sequenceNumber: Date.now(), // For future conflict resolution
  };
};

/**
 * Records an action in the game history
 */
export const recordAction = (gameState: GameState, action: GameAction): GameState => {
  return {
    ...gameState,
    actionHistory: [...gameState.actionHistory, action],
    currentAction: action,
  };
};

/**
 * Ends the current turn
 */
export const endTurn = (gameState: GameState): GameState => {
  return {
    ...gameState,
    currentTurn: gameState.currentTurn ? {
      ...gameState.currentTurn,
      isActive: false,
    } : undefined,
  };
};
