"use client";

import { Navbar } from "@/components/Navbar";
import { RecordList } from "@/components/RecordList";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useRoadWatch } from "@/hooks/useRoadWatch";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function RecordsPage() {
  const { provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner, initialMockChains } = useMetaMaskEthersSigner();
  const { instance } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const { getTotalRecords } = useRoadWatch({ instance, eip1193Provider: provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner });
  
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "congestion" | "accident" | "construction">("all");

  useEffect(() => {
    const loadTotal = async () => {
      try {
        const count = await getTotalRecords();
        setTotal(Number(count));
      } catch (e) {
        console.error("Failed to load total", e);
      }
    };
    loadTotal();
  }, [getTotalRecords]);

  return (
    <main className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">路况数据</h1>
              <p className="text-gray-400 text-lg">实时更新的全链路况信息</p>
            </div>
            <Link href="/submit" className="btn-primary">
              + 上报路况
            </Link>
          </div>
          
          {/* Stats Bar */}
          <div className="glass rounded-2xl p-6 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">
                📊
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text">{total}</div>
                <div className="text-sm text-gray-400">总记录数</div>
              </div>
            </div>
            
            <div className="h-12 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">实时</div>
                <div className="text-sm text-gray-400">链上同步</div>
              </div>
            </div>
            
            <div className="h-12 w-px bg-white/10"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">
                🔒
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">加密</div>
                <div className="text-sm text-gray-400">隐私保护</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-400 font-medium">筛选类型：</span>
            {[
              { key: "all", label: "全部", icon: "🌐" },
              { key: "congestion", label: "拥堵", icon: "🚗" },
              { key: "accident", label: "事故", icon: "⚠️" },
              { key: "construction", label: "施工", icon: "🚧" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  filter === item.key
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                    : "glass hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Records Grid */}
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <RecordList />
        </div>

        {/* Empty State */}
        <div className="mt-12 text-center">
          <div className="inline-flex flex-col items-center gap-4 p-8 glass rounded-2xl">
            <div className="text-6xl">📭</div>
            <div className="text-lg font-semibold">没有更多记录了</div>
            <div className="text-sm text-gray-400">成为第一个上报路况的用户</div>
            <Link href="/submit" className="btn-primary mt-2">
              立即上报 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

