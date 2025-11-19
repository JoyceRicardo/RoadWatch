"use client";

import { ethers } from "ethers";
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { useInMemoryStorage } from "./useInMemoryStorage";
import { RoadWatchAddresses } from "@/abi/RoadWatchAddresses";
import { RoadWatchManagerABI } from "@/abi/RoadWatchManagerABI";

export type RWRecord = {
  id: bigint;
  reporter: string;
  description: string;
  city: string;
  category: string;
  imageCID: string;
  timestamp: bigint;
  severityHandle?: string;
  severityClear?: bigint;
};

function formatAddr(a: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

type ManagerInfo = {
  address?: `0x${string}`;
  abi: typeof RoadWatchManagerABI.abi;
  chainId?: number;
  chainName?: string;
};

function getManagerByChainId(chainId: number | undefined): ManagerInfo {
  if (!chainId) return { abi: RoadWatchManagerABI.abi };
  const entry = (RoadWatchAddresses as any)[chainId.toString()];
  if (!entry) return { abi: RoadWatchManagerABI.abi, chainId };
  return { abi: RoadWatchManagerABI.abi, address: entry.manager as `0x${string}`, chainId: entry.chainId, chainName: entry.chainName };
}

export function useRoadWatch(parameters: {
  instance: FhevmInstance | undefined;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const { storage } = useInMemoryStorage();
  const { instance, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner } = parameters;
  const [records, setRecords] = useState<RWRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const manager = useMemo(() => getManagerByChainId(chainId), [chainId]);

  const refresh = useCallback(async () => {
    if (!manager.address || !ethersReadonlyProvider) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const c = new ethers.Contract(manager.address, manager.abi, ethersReadonlyProvider);
      const count: bigint = await c.getRecordCount();
      const ids = Array.from({ length: Number(count) }, (_, i) => BigInt(i + 1)).reverse().slice(0, 20);
      const fetched: RWRecord[] = [];
      for (const id of ids) {
        try {
          const [rid, reporter, description, city, category, imageCID, timestamp] = await c.getRecord(id);
          fetched.push({ id: rid, reporter, description, city, category, imageCID, timestamp });
        } catch {}
      }
      setRecords(fetched);
    } finally {
      setLoading(false);
    }
  }, [manager.address, manager.abi, ethersReadonlyProvider]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(async (params: { description: string; city: string; category: string; imageCID: string; severity: number }) => {
    if (!instance || !ethersSigner || !manager.address) return;
    setSubmitting(true);
    setMessage("加密中...");
    try {
      const input = instance.createEncryptedInput(manager.address, await ethersSigner.getAddress());
      input.add32(params.severity);
      const enc = await input.encrypt();
      setMessage("上链中...");
      const c = new ethers.Contract(manager.address, manager.abi, ethersSigner);
      const tx: ethers.TransactionResponse = await c.submitRecord(params.description, params.city, params.category, params.imageCID, enc.handles[0], enc.inputProof);
      await tx.wait();
      setMessage("提交成功");
      await refresh();
    } catch (e) {
      setMessage("提交失败");
    } finally {
      setSubmitting(false);
    }
  }, [instance, ethersSigner, manager.address, manager.abi, refresh]);

  const decryptSeverity = useCallback(async (recordId: bigint) => {
    if (!instance || !ethersSigner || !manager.address) return;
    try {
      const c = new ethers.Contract(manager.address, manager.abi, ethersReadonlyProvider ?? ethersSigner);
      const handle: string = await c.getSeverity(recordId);
      const sig = await FhevmDecryptionSignature.loadOrSign(instance, [manager.address], ethersSigner, storage);
      if (!sig) return;
      const resAny = (await instance.userDecrypt(
        [{ handle, contractAddress: manager.address }],
        sig.privateKey, sig.publicKey, sig.signature, sig.contractAddresses, sig.userAddress, sig.startTimestamp, sig.durationDays
      )) as any;
      const clear = resAny[handle] as bigint;
      setRecords((prev) => prev.map((r) => r.id === recordId ? { ...r, severityHandle: handle, severityClear: clear } : r));
    } catch {}
  }, [instance, ethersSigner, manager.address, ethersReadonlyProvider, storage]);

  const getTotalRecords = useCallback(async (): Promise<bigint> => {
    if (!manager.address || !ethersReadonlyProvider) return BigInt(0);
    try {
      const c = new ethers.Contract(manager.address, manager.abi, ethersReadonlyProvider);
      const count: bigint = await c.getRecordCount();
      return count;
    } catch {
      return BigInt(0);
    }
  }, [manager.address, manager.abi, ethersReadonlyProvider]);

  const getUserContributionCount = useCallback(async (userAddress: string): Promise<bigint> => {
    if (!manager.address || !ethersReadonlyProvider) return BigInt(0);
    try {
      const c = new ethers.Contract(manager.address, manager.abi, ethersReadonlyProvider);
      const ids: bigint[] = await c.getRecordsByReporter(userAddress);
      return BigInt(ids.length);
    } catch {
      return BigInt(0);
    }
  }, [manager.address, manager.abi, ethersReadonlyProvider]);

  const getUserBadgeState = useCallback(async (userAddress: string): Promise<{ claimedBitmap: number; maxEligibleLevel: number; contributionCount: bigint } | null> => {
    if (!manager.address || !ethersReadonlyProvider) return null;
    try {
      const c = new ethers.Contract(manager.address, manager.abi, ethersReadonlyProvider);
      const result = await c.getUserBadgeState(userAddress);
      // result: [claimedBitmap(uint8), maxEligibleLevel(uint8 or 255), contributionCount(uint256)]
      return {
        claimedBitmap: Number(result[0]),
        maxEligibleLevel: Number(result[1]),
        contributionCount: BigInt(result[2]),
      };
    } catch {
      return null;
    }
  }, [manager.address, manager.abi, ethersReadonlyProvider]);

  const claimBadge = useCallback(async (level: number) => {
    if (!manager.address || !ethersSigner) return;
    const c = new ethers.Contract(manager.address, manager.abi, ethersSigner);
    const tx: ethers.TransactionResponse = await c.claimBadge(level);
    await tx.wait();
    await refresh();
  }, [manager.address, manager.abi, ethersSigner, refresh]);

  const requestView = useCallback(async (recordId: bigint): Promise<bigint | null> => {
    if (!manager.address || !ethersSigner) return null;
    const c = new ethers.Contract(manager.address, manager.abi, ethersSigner);
    const tx: ethers.TransactionResponse = await c.requestView(recordId);
    const receipt = await tx.wait();
    // Try to refetch count via call (optional)
    try {
      const count: bigint = await c.viewCount(recordId);
      return count;
    } catch {
      return null;
    }
  }, [manager.address, manager.abi, ethersSigner]);

  const viewAndDecrypt = useCallback(async (recordId: bigint): Promise<bigint | null> => {
    const count = await requestView(recordId); // requires wallet tx
    await decryptSeverity(recordId); // then decrypt locally
    return count;
  }, [requestView, decryptSeverity]);

  return {
    managerAddress: manager.address,
    records,
    loading,
    message,
    submitting,
    submit,
    decryptSeverity,
    requestView,
    viewAndDecrypt,
    getUserContributionCount,
    getUserBadgeState,
    claimBadge,
    getTotalRecords,
    formatAddr,
    isDeployed: !!manager.address && manager.address !== ethers.ZeroAddress
  };
}


