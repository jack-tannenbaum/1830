import type {
  NotificationLevel,
  UiNotification,
} from "./adapter-contracts";
import type { CommandResult, DomainEvent } from "./results";

/**
 * Map a domain event's type string to a UI notification severity.
 *
 * The mapping is deterministic and based purely on the event type's prefix or
 * suffix so that new event types opt in to a severity by naming convention.
 */
function levelForEventType(eventType: string): NotificationLevel {
  if (eventType.endsWith(".warning") || eventType.startsWith("warning.")) {
    return "warning";
  }
  if (eventType.endsWith(".error") || eventType.startsWith("error.")) {
    return "error";
  }
  if (eventType.endsWith(".success") || eventType.startsWith("success.")) {
    return "success";
  }
  return "info";
}

/**
 * Project a rejected `CommandResult` to a single stable `UiNotification`.
 *
 * The notification id encodes the originating command id and the rule error
 * code so React lists can key on it and callers can dismiss it without any
 * timestamp or randomness.
 */
export function rejectionNotification(
  commandId: string,
  result: Extract<CommandResult, { ok: false }>,
): UiNotification {
  return {
    id: `${commandId}:reject:${result.code}`,
    type: "error",
    message: result.message,
  };
}

/**
 * Project a sequence of accepted domain events to `UiNotification`s.
 *
 * One notification is produced per event, in the same order, with a
 * deterministic id encoding the command id and the event's position. The input
 * array is never mutated.
 */
export function eventNotifications(
  commandId: string,
  events: DomainEvent[],
): UiNotification[] {
  const notifications: UiNotification[] = [];
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    notifications.push({
      id: `${commandId}:event:${i}`,
      type: levelForEventType(event.type),
      message: event.message,
    });
  }
  return notifications;
}
