import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set, get) => ({
  toasts: [],
  /** tone: info | success | warn | error */
  push: ({ title, description = '', tone = 'info', duration = 4200 }) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.filter((t) => t.title !== title), { id, title, description, tone }].slice(-3) }));
    if (duration) setTimeout(() => get().dismiss(id), duration);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (opts) => useToastStore.getState().push(opts);
