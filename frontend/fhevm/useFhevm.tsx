import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance, FhevmAbortError, FhevmRelayerStatusType } from "./internal/fhevm";

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmGoState;
  relayerStatus?: FhevmRelayerStatusType;
} {
  const { provider, chainId, initialMockChains, enabled = true } = parameters;

  const [instance, _setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, _setStatus] = useState<FhevmGoState>("idle");
  const [error, _setError] = useState<Error | undefined>(undefined);
  const [_isRunning, _setIsRunning] = useState<boolean>(enabled);
  const [_providerChanged, _setProviderChanged] = useState<number>(0);
  const _abortControllerRef = useRef<AbortController | null>(null);
  const _providerRef = useRef<string | ethers.Eip1193Provider | undefined>(provider);
  const _chainIdRef = useRef<number | undefined>(chainId);
  const _mockChainsRef = useRef<Record<number, string> | undefined>(initialMockChains);
  const [relayerStatus, _setRelayerStatus] = useState<FhevmRelayerStatusType | undefined>(undefined);

  const refresh = useCallback(() => {
    if (_abortControllerRef.current) {
      _providerRef.current = undefined;
      _chainIdRef.current = undefined;
      _abortControllerRef.current.abort();
      _abortControllerRef.current = null;
    }
    _providerRef.current = provider;
    _chainIdRef.current = chainId;
    _setInstance(undefined);
    _setError(undefined);
    _setStatus("idle");
    if (provider !== undefined) {
      _setProviderChanged((prev) => prev + 1);
    }
  }, [provider, chainId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!_isRunning) return;
    if (_abortControllerRef.current) return;
    if (!_providerRef.current || _chainIdRef.current === undefined) return;
    _abortControllerRef.current = new AbortController();
    const signal = _abortControllerRef.current.signal;
    _setStatus("loading");
    createFhevmInstance({
      signal,
      provider: _providerRef.current,
      mockChains: _mockChainsRef.current,
      onStatusChange: (s) => {
        _setRelayerStatus(s);
        console.log(`[useFhevm] status=${s}`);
      }
    })
      .then((i) => {
        if (signal.aborted) return;
        _setInstance(i);
        _setError(undefined);
        _setStatus("ready");
        _abortControllerRef.current = null;
      })
      .catch((e) => {
        if (signal.aborted) return;
        _setInstance(undefined);
        _setError(e instanceof FhevmAbortError ? undefined : e);
        _setStatus("error");
        _abortControllerRef.current = null;
      });
  }, [_isRunning, _providerChanged]);

  return { instance, refresh, error, status, relayerStatus };
}


