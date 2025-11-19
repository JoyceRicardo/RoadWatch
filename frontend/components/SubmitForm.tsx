"use client";

import { useState } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useRoadWatch } from "@/hooks/useRoadWatch";

export function SubmitForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner, initialMockChains } = useMetaMaskEthersSigner();
  const { instance, status } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const rw = useRoadWatch({ instance, eip1193Provider: provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner });

  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("Congestion");
  const [imageCID, setImageCID] = useState("");
  const [severity, setSeverity] = useState(50);
  const [busy, setBusy] = useState(false);

  const canSubmit = !!rw.managerAddress && instance && ethersSigner && status === "ready" && !busy;

  return (
    <div className="space-y-5">
      {!rw.isDeployed && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>合约未部署或地址未写入。请先部署本地合约。</span>
        </div>
      )}
      
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>📝</span>
          <span>描述</span>
        </label>
        <textarea 
          className="input-field min-h-[100px] resize-none" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="例如：主干道拥堵，车速 < 10km/h"
        />
      </div>
      
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>🏙️</span>
          <span>城市</span>
        </label>
        <input 
          className="input-field" 
          value={city} 
          onChange={(e) => setCity(e.target.value)} 
          placeholder="Shanghai" 
        />
      </div>
      
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>🏷️</span>
          <span>类别</span>
        </label>
        <select 
          className="input-field cursor-pointer" 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="Congestion">🚗 拥堵 (Congestion)</option>
          <option value="Accident">⚠️ 事故 (Accident)</option>
          <option value="Construction">🚧 施工 (Construction)</option>
          <option value="Weather">🌧️ 天气 (Weather)</option>
          <option value="Block">🚫 封路 (Block)</option>
          <option value="Others">📌 其他 (Others)</option>
        </select>
      </div>
      
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>📷</span>
          <span>图片 CID（IPFS）</span>
        </label>
        <input 
          className="input-field font-mono text-xs" 
          value={imageCID} 
          onChange={(e) => setImageCID(e.target.value)} 
          placeholder="bafy..." 
        />
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <span>ℹ️</span>
          <span>当前示例仅填写 CID。后续可集成 Web3.storage/Pinata 直传。</span>
        </div>
      </div>
      
      <div className="grid gap-3">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <span>🔒</span>
          <span>严重程度（FHE 加密，0-100）</span>
        </label>
        <div className="relative">
          <input 
            type="range" 
            min={0} 
            max={100} 
            value={severity} 
            onChange={(e) => setSeverity(parseInt(e.target.value))}
            className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/50 hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
            style={{
              background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(34, 211, 238) ${severity}%, rgba(255,255,255,0.05) ${severity}%, rgba(255,255,255,0.05) 100%)`
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">低</span>
          <div className="px-4 py-2 rounded-lg glass-strong">
            <span className="text-lg font-bold gradient-text">{severity}</span>
          </div>
          <span className="text-xs text-gray-400">高</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3 pt-4">
        <button
          className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          disabled={!canSubmit}
          onClick={async () => {
            try {
              setBusy(true);
              await rw.submit({ description, city, category, imageCID, severity });
              setDescription(""); 
              setCity(""); 
              setCategory("Congestion"); 
              setImageCID("");
              setSeverity(50);
              onSubmitted();
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>提交中...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>提交路况</span>
            </span>
          )}
        </button>
        
        {rw.message && (
          <div className="text-sm text-center text-gray-400 flex items-center justify-center gap-2">
            <span>ℹ️</span>
            <span>{rw.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}


