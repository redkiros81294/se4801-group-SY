// Canonical event types — must match ROLE_EVENT_TYPES in LogMovement.tsx
// and whatever the backend's /transactions endpoint accepts.
export type EventType = 'MANUFACTURED' | 'SHIPPED' | 'IN_TRANSIT' | 'RECEIVED';

interface EventTypeMeta {
  label: string;
  colorVar: string;
  icon: string;
}

export const EVENT_TYPE_META: Record<string, EventTypeMeta> = {
  MANUFACTURED: { label: 'Manufactured', colorVar: 'cyan', icon: 'ti-building-factory-2' },
  SHIPPED: { label: 'Shipped', colorVar: 'blue', icon: 'ti-package-export' },
  IN_TRANSIT: { label: 'In Transit', colorVar: 'amber', icon: 'ti-truck' },
  RECEIVED: { label: 'Received', colorVar: 'green', icon: 'ti-building-store' },
};

export const getEventTypeMeta = (eventType: string): EventTypeMeta =>
  EVENT_TYPE_META[eventType] ?? { label: eventType, colorVar: 't2', icon: 'ti-circle-check' };
