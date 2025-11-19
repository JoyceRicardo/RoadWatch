"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface GenericStringStorage {
  getItem(key: string): string | Promise<string | null> | null;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

class GenericStringInMemoryStorage implements GenericStringStorage {
  #store = new Map<string, string>();
  getItem(key: string): string | Promise<string | null> | null {
    return this.#store.has(key) ? this.#store.get(key)! : null;
  }
  setItem(key: string, value: string): void | Promise<void> {
    this.#store.set(key, value);
  }
  removeItem(key: string): void | Promise<void> {
    this.#store.delete(key);
  }
}

const InMemoryStorageContext = createContext<{ storage: GenericStringStorage } | undefined>(undefined);

export function InMemoryStorageProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ storage: new GenericStringInMemoryStorage() }), []);
  return (
    <InMemoryStorageContext.Provider value={value}>
      {children}
    </InMemoryStorageContext.Provider>
  );
}

export function useInMemoryStorage() {
  const ctx = useContext(InMemoryStorageContext);
  if (!ctx) throw new Error("useInMemoryStorage must be used within InMemoryStorageProvider");
  return ctx;
}


