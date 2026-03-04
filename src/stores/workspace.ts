import { create } from "zustand";

export interface FolderItem {
  id: string;
  name: string;
  icon?: string | null;
  sortOrder: number;
  _count: { notes: number };
}

interface NoteItem {
  id: string;
  title: string;
  icon?: string | null;
  parentId: string | null;
  folderId?: string | null;
  isFavorite: boolean;
  sortOrder: number;
  updatedAt: string;
  _count: { children: number };
}

interface Workspace {
  id: string;
  name: string;
  icon?: string | null;
  members: { role: string }[];
}

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  notes: NoteItem[];
  folders: FolderItem[];
  expandedIds: Set<string>;
  loading: boolean;

  setWorkspaces: (workspaces: Workspace[]) => void;
  setActiveWorkspace: (id: string) => void;
  setNotes: (notes: NoteItem[]) => void;
  addNote: (note: NoteItem) => void;
  updateNote: (id: string, data: Partial<NoteItem>) => void;
  removeNote: (id: string) => void;
  toggleExpanded: (id: string) => void;
  setLoading: (loading: boolean) => void;

  fetchWorkspaces: () => Promise<void>;
  fetchNotes: (workspaceId: string) => Promise<void>;
  createNote: (parentId?: string | null, folderId?: string | null) => Promise<NoteItem | null>;

  fetchFolders: (workspaceId: string) => Promise<void>;
  createFolder: (name?: string) => Promise<FolderItem | null>;
  updateFolder: (id: string, data: Partial<FolderItem>) => void;
  removeFolder: (id: string) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,
  notes: [],
  folders: [],
  expandedIds: new Set<string>(),
  loading: false,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((s) => ({ notes: [...s.notes, note] })),
  updateNote: (id, data) =>
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    })),
  removeNote: (id) =>
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  toggleExpanded: (id) =>
    set((s) => {
      const next = new Set(s.expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedIds: next };
    }),
  setLoading: (loading) => set({ loading }),

  fetchWorkspaces: async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) return;
      const data = await res.json();
      set({ workspaces: data });
      if (data.length > 0 && !get().activeWorkspaceId) {
        set({ activeWorkspaceId: data[0].id });
        get().fetchNotes(data[0].id);
        get().fetchFolders(data[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch workspaces:", e);
    }
  },

  fetchNotes: async (workspaceId) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/notes?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const data = await res.json();
      set({ notes: data });
    } catch (e) {
      console.error("Failed to fetch notes:", e);
    } finally {
      set({ loading: false });
    }
  },

  createNote: async (parentId = null, folderId = null) => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) return null;

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          parentId,
          folderId,
        }),
      });
      if (!res.ok) return null;
      const note = await res.json();
      get().addNote({
        ...note,
        _count: { children: 0 },
      });
      return note;
    } catch (e) {
      console.error("Failed to create note:", e);
      return null;
    }
  },

  fetchFolders: async (workspaceId) => {
    try {
      const res = await fetch(`/api/folders?workspaceId=${workspaceId}`);
      if (!res.ok) return;
      const data = await res.json();
      set({ folders: data });
    } catch (e) {
      console.error("Failed to fetch folders:", e);
    }
  },

  createFolder: async (name?: string) => {
    const { activeWorkspaceId } = get();
    if (!activeWorkspaceId) return null;

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          name,
        }),
      });
      if (!res.ok) return null;
      const folder = await res.json();
      set((s) => ({ folders: [...s.folders, folder] }));
      return folder;
    } catch (e) {
      console.error("Failed to create folder:", e);
      return null;
    }
  },

  updateFolder: (id, data) =>
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, ...data } : f)),
    })),

  removeFolder: (id) =>
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      notes: s.notes.map((n) => (n.folderId === id ? { ...n, folderId: null } : n)),
    })),

  moveNoteToFolder: async (noteId, folderId) => {
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      get().updateNote(noteId, { folderId });
    } catch (e) {
      console.error("Failed to move note:", e);
    }
  },
}));
