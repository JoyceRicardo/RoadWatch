"use client";

import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useRoadWatch } from "@/hooks/useRoadWatch";
import { useState } from "react";
import { Modal } from "./Modal";

function CategoryChip({ category }: { category: string }) {
  const categoryMap: Record<string, { color: string; icon: string; label: string }> = {
    congestion: { color: "chip-warning", icon: "🚗", label: "拥堵" },
    accident: { color: "chip-danger", icon: "⚠️", label: "事故" },
    construction: { color: "chip-primary", icon: "🚧", label: "施工" },
    weather: { color: "chip-primary", icon: "🌧️", label: "天气" },
    block: { color: "chip-danger", icon: "🚫", label: "封路" },
    others: { color: "chip-success", icon: "📌", label: "其他" },
  };
  
  const cat = categoryMap[category.toLowerCase()] || categoryMap.others;
  return (
    <span className={cat.color}>
      <span>{cat.icon}</span>
      <span>{cat.label}</span>
    </span>
  );
}

export function RecordList({ limit }: { limit?: number } = {}) {
  const { provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner, initialMockChains } = useMetaMaskEthersSigner();
  const { instance } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const rw = useRoadWatch({ instance, eip1193Provider: provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogCount, setDialogCount] = useState<bigint | null>(null);
  const [selected, setSelected] = useState<(typeof rw.records)[number] | null>(null);

  if (!rw.isDeployed) {
    return <div className="glass p-4 rounded-xl text-sm">本地合约未部署。请先在 action/contracts 运行部署脚本。</div>;
  }

  const displayRecords = limit ? rw.records.slice(0, limit) : rw.records;

  return (
    <div className="grid gap-6">
      {displayRecords.length === 0 && (
        <div className="glass p-8 rounded-2xl text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-sm text-gray-400">暂无路况记录</div>
        </div>
      )}
      {displayRecords.map((r) => (
        <div key={`rw-${r.id.toString()}`} className="card group">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <CategoryChip category={r.category} />
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span>🕐</span>
              <span>{new Date(Number(r.timestamp) * 1000).toLocaleString("zh-CN")}</span>
            </div>
          </div>
          
          {/* Description */}
          <div className="text-base text-gray-100 mb-4 leading-relaxed">{r.description}</div>
          
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <span>🏙️</span>
              <span>{r.city}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span>👤</span>
              <span className="font-mono text-xs">{r.reporter.slice(0, 6)}...{r.reporter.slice(-4)}</span>
            </div>
          </div>
          
          {/* Image */}
          {r.imageCID && (
            <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
              <img
                className="w-full max-h-80 object-cover transition-transform duration-300 group-hover:scale-105"
                src={`https://ipfs.io/ipfs/${r.imageCID}`}
                alt="路况图片"
              />
            </div>
          )}
          
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={async () => {
                setSelected(r);
                setDialogLoading(true);
                setDialogOpen(true);
                const count = await rw.viewAndDecrypt(r.id);
                setDialogCount(count ?? null);
                setExpanded((s) => ({ ...s, [r.id.toString()]: true }));
                setDialogLoading(false);
              }}
            >
              <span>👁️</span>
              <span>查看详情</span>
            </button>
            <button 
              className="btn-secondary"
              onClick={() => rw.decryptSeverity(r.id)}
            >
              🔓 解密严重程度
            </button>
            {r.severityClear !== undefined ? (
              <div className="px-4 py-2 rounded-lg glass-strong flex items-center gap-2">
                <span>🔢</span>
                <span className="text-sm font-semibold">严重程度：</span>
                <span className="text-lg font-bold gradient-text">{r.severityClear.toString()}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <span>🔒</span>
                <span>加密状态</span>
              </div>
            )}
          </div>

          {/* Details (shown after view tx) */}
          {expanded[r.id.toString()] && (
            <div className="mt-4 glass rounded-xl p-4 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div>🆔 记录ID：{r.id.toString()}</div>
                <div>📍 城市：{r.city}</div>
                <div>🏷️ 类型：{r.category}</div>
                <div>🕐 时间：{new Date(Number(r.timestamp) * 1000).toLocaleString("zh-CN")}</div>
                {r.imageCID && <div>🖼️ 图片：<a className="text-blue-400 underline" href={`https://ipfs.io/ipfs/${r.imageCID}`} target="_blank" rel="noreferrer">打开</a></div>}
              </div>
            </div>
          )}
        </div>
      ))}
      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="路况详情">
        {!selected ? (
          <div className="text-gray-400">未选择记录</div>
        ) : (
          <div className="space-y-4">
            {dialogLoading && (
              <div className="px-4 py-3 rounded-xl glass flex items-center gap-2 text-blue-300">
                <span className="animate-spin">⏳</span>
                <span>发送查看请求并解密中，请在钱包确认...</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">描述</div>
                <div className="text-sm">{selected.description}</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">城市</div>
                <div className="text-sm">{selected.city}</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">类别</div>
                <div className="text-sm">{selected.category}</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">时间</div>
                <div className="text-sm">{new Date(Number(selected.timestamp) * 1000).toLocaleString("zh-CN")}</div>
              </div>
              {selected.imageCID && (
                <div className="md:col-span-2 glass rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-2">图片</div>
                  <img className="rounded-lg w-full max-h-96 object-cover" src={`https://ipfs.io/ipfs/${selected.imageCID}`} alt="ipfs" />
                  <a className="text-blue-400 underline text-xs mt-2 inline-block" href={`https://ipfs.io/ipfs/${selected.imageCID}`} target="_blank" rel="noreferrer">在新标签打开</a>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {(() => {
                const rec = rw.records.find(x => x.id === selected.id);
                return rec?.severityClear !== undefined ? (
                  <div className="px-4 py-2 rounded-lg glass-strong flex items-center gap-2">
                    <span>🔢</span>
                    <span className="text-sm font-semibold">严重程度：</span>
                    <span className="text-lg font-bold gradient-text">{rec.severityClear.toString()}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <span>🔒</span>
                    <span>加密状态</span>
                  </div>
                );
              })()}
              {dialogCount !== null && (
                <div className="text-xs text-gray-400">已记录链上查看次数：{dialogCount.toString()}</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


