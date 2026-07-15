import type { GameState } from "./model";

export type RuleErrorCode =
  | "VERSION_CONFLICT"
  | "DUPLICATE_COMMAND"
  | "NOT_CURRENT_PLAYER"
  | "ACTION_NOT_ALLOWED_IN_ROUND"
  | "INSUFFICIENT_AVAILABLE_CASH"
  | "BID_INCREMENT_TOO_SMALL"
  | "DUPLICATE_ADVANCE_BID"
  | "CERTIFICATE_LIMIT_EXCEEDED"
  | "CORPORATION_HOLDING_LIMIT_EXCEEDED"
  | "POOL_LIMIT_EXCEEDED"
  | "PRESIDENCY_CANNOT_TRANSFER"
  | "CANNOT_BUY_AFTER_SELLING"
  | "STOCK_TURN_ALREADY_COMPLETE"
  | "PRIVATE_TRADE_NOT_PERMITTED"
  | "INVALID_PAR_PRICE";

export interface DomainEvent {
  type: string;
  message: string;
  data: Record<string, string | number | boolean>;
}

export type CommandResult =
  | { ok: true; state: GameState; events: DomainEvent[] }
  | {
      ok: false;
      code: RuleErrorCode;
      message: string;
      details?: Record<string, string | number | boolean>;
    };
