export type EventType =
  | "COLLISION_WARNING"
  | "SAFETY_ZONE_ENTER"
  | "EMERGENCY_HALT"
  | "POSITION_UPDATE";

export interface StateEvent {
  type: EventType;
  payload: any;
}

class StateBus {
  private listeners: Map<EventType, Array<(payload: any) => void>> = new Map();

  public emit(type: EventType, payload: any) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }

    // Also emit to window for external HTML/Dashboard UI
    window.dispatchEvent(
      new CustomEvent(`engine:${type}`, { detail: payload }),
    );
  }

  public subscribe(type: EventType, handler: (payload: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(handler);
  }
}

export const stateBus = new StateBus();
