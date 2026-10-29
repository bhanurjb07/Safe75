import { useMemo } from 'react';
import { create } from 'zustand';
import { useActiveData } from '../store/attendanceStore.js';
import { buildAlerts } from '../utils/analytics.js';

// Only a date is remembered ("latest class already seen"), so new absences can be flagged.
const KEY = 'safe75.lastSeen';
const read = () => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const useSeen = create((set) => ({
  lastSeen: read(),
  mark: (date) => {
    try {
      window.localStorage.setItem(KEY, date);
    } catch {
      /* ignore */
    }
    set({ lastSeen: date });
  },
}));

/** Alerts for the data on screen, how many are unread, and a way to mark them read. */
export function useAlerts() {
  const data = useActiveData();
  const { lastSeen, mark } = useSeen();
  const alerts = useMemo(() => (data ? buildAlerts(data, lastSeen) : []), [data, lastSeen]);
  const latest = data?.records.length ? data.records[data.records.length - 1].date : null;
  const unread = lastSeen
    ? alerts.filter((a) => a.isNew).length
    : alerts.filter((a) => a.tone === 'danger' || a.tone === 'warn').length;
  return { alerts, unread, lastSeen, markRead: () => latest && latest !== lastSeen && mark(latest) };
}
