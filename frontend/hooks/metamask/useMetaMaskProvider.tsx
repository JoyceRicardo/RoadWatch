"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type MetaMaskContextType = {
  provider: any | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  connect: () => void;
  error: Error | undefined;
};

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<any | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[] | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    setProvider(eth);
    if (!eth) return;
    eth.request({ method: "eth_accounts" })
      .then((accs: string[]) => setAccounts(accs))
      .catch(() => {});
    eth.request({ method: "eth_chainId" })
      .then((id: string) => setChainId(parseInt(id, 16)))
      .catch(() => {});

    const handleAcc = (accs: string[]) => setAccounts(accs);
    const handleChain = (id: string) => setChainId(parseInt(id, 16));
    eth.on?.("accountsChanged", handleAcc);
    eth.on?.("chainChanged", handleChain);
    return () => {
      eth.removeListener?.("accountsChanged", handleAcc);
      eth.removeListener?.("chainChanged", handleChain);
    };
  }, []);

  const connect = useCallback(() => {
    if (!provider) return;
    provider.request({ method: "eth_requestAccounts" })
      .then((accs: string[]) => setAccounts(accs))
      .catch((e: any) => setError(e));
  }, [provider]);

  const value = useMemo<MetaMaskContextType>(() => ({
    provider, chainId, accounts, isConnected: !!accounts && accounts.length > 0, connect, error
  }), [provider, chainId, accounts, connect, error]);

  return <MetaMaskContext.Provider value={value}>{children}</MetaMaskContext.Provider>;
}

export function useMetaMask() {
  const ctx = useContext(MetaMaskContext);
  if (!ctx) throw new Error("useMetaMask must be used within MetaMaskProvider");
  return ctx;
}


