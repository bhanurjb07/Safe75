import { create } from 'zustand';
import { ENABLE_PAST_SEMESTERS } from '../config/env.js';
import { fetchAttendance, fetchSemesters } from '../api/attendance.js';
import { toApiError } from '../api/errors.js';
import { KEYS, session as store } from '../utils/storage.js';
import { useAuthStore } from './authStore.js';
import { toast } from './toastStore.js';

const OFFLINE_CODES = new Set(['network', 'timeout', 'server']);

const sameData = (a, b) =>
  a && b && a.overall.total === b.overall.total && a.overall.present === b.overall.present &&
  a.subjects.map((s) => s.id).join() === b.subjects.map((s) => s.id).join();

const empty = () => ({
  data: null,
  semesters: [],
  status: 'idle', // idle | loading | ready | error
  refreshing: false,
  error: null,
  lastUpdated: null,
  offline: false,
  viewing: null, // userId of a past semester being viewed
  pastData: {},
  pastLoading: null,
  pastSupported: ENABLE_PAST_SEMESTERS ? store.get(KEYS.pastSemesters, 'unknown') : false,
});

export const useAttendanceStore = create((set, get) => ({
  ...empty(),

  /** Loads current-semester data. Shows cached data instantly while refreshing. */
  load: async ({ force = false } = {}) => {
    const sess = useAuthStore.getState().session;
    if (!sess) return;
    const { data, status, refreshing } = get();
    if (status === 'loading' || refreshing) return;
    if (data && !force) return;

    if (!data) {
      const cached = store.get(KEYS.cache, null);
      if (cached?.data) {
        set({ data: cached.data, semesters: cached.semesters ?? [], lastUpdated: cached.savedAt, status: 'ready' });
      }
    }
    set(get().data ? { refreshing: true } : { status: 'loading', error: null });

    try {
      const [att, sems] = await Promise.all([fetchAttendance(sess), fetchSemesters(sess).catch(() => null)]);
      const savedAt = Date.now();
      const semesters = sems ?? get().semesters;
      set({ data: att, semesters, status: 'ready', error: null, offline: false, lastUpdated: savedAt, refreshing: false });
      store.set(KEYS.cache, { data: att, semesters, savedAt });
      if (force) toast({ title: 'Attendance updated', tone: 'success', duration: 2200 });
    } catch (err) {
      const e = toApiError(err);
      set({ refreshing: false });
      if (e.code === 'unauthorized') {
        useAuthStore.getState().logout('expired');
        return;
      }
      if (get().data) {
        set({ status: 'ready', error: e, offline: OFFLINE_CODES.has(e.code) });
        toast({ title: OFFLINE_CODES.has(e.code) ? 'Showing saved data' : "Couldn't refresh", description: e.message, tone: 'warn' });
      } else {
        set({ status: 'error', error: e });
      }
    }
  },

  /** Switches the view to another semester. Experimental: hides itself if the ERP doesn't support it. */
  selectSemester: async (userId) => {
    const sess = useAuthStore.getState().session;
    const { data, pastData, semesters } = get();
    const currentId = semesters[0]?.userId ?? sess?.userId;
    if (!sess || !userId || userId === currentId || userId === sess.userId) {
      set({ viewing: null });
      return;
    }
    if (pastData[userId]) {
      set({ viewing: userId });
      return;
    }
    set({ pastLoading: userId });
    try {
      const att = await fetchAttendance(sess, userId);
      if (sameData(att, data)) throw Object.assign(new Error('same'), { code: 'same' });
      store.set(KEYS.pastSemesters, true);
      set((s) => ({ pastData: { ...s.pastData, [userId]: att }, viewing: userId, pastLoading: null, pastSupported: true }));
    } catch (err) {
      const e = toApiError(err);
      set({ pastLoading: null });
      if (e.code === 'unauthorized') {
        useAuthStore.getState().logout('expired');
        return;
      }
      if (OFFLINE_CODES.has(e.code)) {
        toast({ title: "Couldn't load that semester", description: e.message, tone: 'warn' });
        return;
      }
      store.set(KEYS.pastSemesters, false);
      set({ pastSupported: false, viewing: null });
      toast({ title: 'Past semesters unavailable', description: "Your ERP doesn't share old semesters' attendance.", tone: 'info' });
    }
  },

  reset: () => set(empty()),
}));

// Clear everything when the user logs out or the session expires. sessionStorage is already
// cleared by then; the short delay only lets the screen animate out with its data still in place.
useAuthStore.subscribe((s, prev) => {
  if (prev.session && !s.session) {
    setTimeout(() => {
      if (!useAuthStore.getState().session) useAttendanceStore.getState().reset();
    }, 450);
  }
});

/** The data currently on screen (current semester, or a past one being viewed). */
export const useActiveData = () =>
  useAttendanceStore((s) => (s.viewing && s.pastData[s.viewing] ? s.pastData[s.viewing] : s.data));

/** Current semester label for the header chip. */
export const useSemesterLabel = () =>
  useAttendanceStore((s) => {
    const sem = s.viewing ? s.semesters.find((x) => x.userId === s.viewing) : s.semesters[0];
    return sem?.batchName ?? '';
  });
