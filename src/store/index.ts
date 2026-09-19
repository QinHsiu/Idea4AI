import { createMemoryStore, memoryStore } from "./memory";
import { createSupabaseStore, isSupabaseConfigured } from "./supabase";
import type { IdeaStore } from "./types";

const globalForStore = globalThis as typeof globalThis & {
  __idea4aiIdeaStore?: IdeaStore;
};

/** Pick Supabase when service role + URL are set; otherwise in-memory. */
export function getStore(): IdeaStore {
  if (globalForStore.__idea4aiIdeaStore) {
    return globalForStore.__idea4aiIdeaStore;
  }
  const store = isSupabaseConfigured()
    ? createSupabaseStore()
    : memoryStore;
  globalForStore.__idea4aiIdeaStore = store;
  return store;
}

export function resetStoreForTests(): void {
  delete globalForStore.__idea4aiIdeaStore;
}

export {
  createMemoryStore,
  memoryStore,
  createSupabaseStore,
  isSupabaseConfigured,
};
export type { IdeaStore, Idea, Run, RunStatus, StoreBackend } from "./types";
