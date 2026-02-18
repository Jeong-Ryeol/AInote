import { create } from "zustand";

interface SidebarStore {
  isOpen: boolean;
  width: number;
  isResizing: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setWidth: (width: number) => void;
  setIsResizing: (resizing: boolean) => void;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 240;

export { MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH };

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: true,
  width: DEFAULT_WIDTH,
  isResizing: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setWidth: (width) =>
    set({ width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width)) }),
  setIsResizing: (isResizing) => set({ isResizing }),
}));
