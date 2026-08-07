// Canonical event types -- must match ROLE_EVENT_TYPES in LogMovement.tsx
// and whatever the backend's /transactions endpoint accepts.
export type EventType = 'MANUFACTURED' | 'SHIPPED' | 'IN_TRANSIT' | 'RECEIVED';

interface EventTypeMeta {
  label: string;
  // Static Tailwind classes (must be literal strings so Tailwind can see them)
  colorClasses: string;
  icon: string;
}

export const EVENT_TYPE_META: Record<string, EventTypeMeta> = {
  MANUFACTURED: { label: 'Manufactured', colorClasses: 'bg-[var(--cyan)]/20 text-[var(--cyan)]', icon: 'ti-building-factory-2' },
  SHIPPED: { label: 'Shipped', colorClasses: 'bg-[var(--blue)]/20 text-[var(--blue)]', icon: 'ti-package-export' },
  IN_TRANSIT: { label: 'In Transit', colorClasses: 'bg-[var(--amber)]/20 text-[var(--amber)]', icon: 'ti-truck' },
  RECEIVED: { label: 'Received', colorClasses: 'bg-[var(--green)]/20 text-[var(--green)]', icon: 'ti-building-store' },
};

export const getEventTypeMeta = (eventType: string): EventTypeMeta =>
  EVENT_TYPE_META[eventType] ?? { label: eventType, colorClasses: 'bg-[var(--t2)]/20 text-[var(--t2)]', icon: 'ti-circle-check' };
