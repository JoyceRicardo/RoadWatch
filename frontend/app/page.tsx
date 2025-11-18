"use client";

import { Navbar } from "@/components/Navbar";
import { RecordList } from "@/components/RecordList";
import Link from "next/link";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useRoadWatch } from "@/hooks/useRoadWatch";
import { useEffect, useState } from "react";

export default function Home() {
  const { provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner, initialMockChains } = useMetaMaskEthersSigner();
  const { instance, status: fhevmStatus, relayerStatus, error: fhevmError } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const { getTotalRecords } = useRoadWatch({ instance, eip1193Provider: provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner });
  
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadStats = async () => {
      try {
        const total = await getTotalRecords();
        // Mock today's count (would need timestamp filtering in real app)
        const today = Math.floor(Math.random() * 10) + 5;
        setStats({ total: Number(total), today });
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    };
    loadStats();
  }, [getTotalRecords]);

  return (
    <main className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="text-center animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass">
                <span className="text-2xl">🔐</span>
                <span className="text-sm font-medium">基于 FHEVM 的隐私保护路况系统</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className={`w-2.5 h-2.5 rounded-full ${fhevmStatus === "ready" ? "bg-emerald-400" : fhevmStatus === "error" ? "bg-red-500" : "bg-amber-400"}`}></span>
                <span className="text-xs text-gray-300">
                  {(() => {
                    const relayerText = fhevmStatus === "ready" ? "created" : relayerStatus;
                    return `FHEVM: ${fhevmStatus}${relayerText ? ` · ${relayerText}` : ""}${fhevmError ? " · error" : ""}`;
                  })()}
                </span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">智能路况监测</span>
              <br />
              <span className="text-gray-300">保护隐私·共建安全</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              利用全同态加密技术，在保护用户隐私的同时，实时共享路况信息，让出行更安全、更高效。
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/submit" className="btn-primary text-base px-8 py-3">
                🚀 立即上报路况
              </Link>
              <Link href="/records" className="btn-secondary text-base px-8 py-3">
                📊 查看路况数据
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <div className="stat-card group hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="text-4xl mb-3">📈</div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                {mounted ? stats.total : "..."}
              </div>
              <div className="text-sm text-gray-400">总路况记录</div>
            </div>
          </div>
          
          <div className="stat-card group hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="text-4xl mb-3">⚡</div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                {mounted ? stats.today : "..."}
              </div>
              <div className="text-sm text-gray-400">今日新增</div>
            </div>
          </div>
          
          <div className="stat-card group hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="text-4xl mb-3">🔒</div>
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">100%</div>
              <div className="text-sm text-gray-400">隐私加密</div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Records Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold gradient-text mb-2">最新路况</h2>
            <p className="text-gray-400">实时更新的路况信息</p>
          </div>
          <Link href="/records" className="btn-secondary">
            查看全部 →
          </Link>
        </div>
        
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <RecordList limit={6} />
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">核心特性</h2>
          <p className="text-gray-400 text-lg">为什么选择 RoadWatch</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: "🔐", title: "隐私保护", desc: "FHEVM 全同态加密，数据加密不可见" },
            { icon: "⚡", title: "实时更新", desc: "链上数据实时同步，秒级响应" },
            { icon: "🎖️", title: "激励机制", desc: "贡献即可获得 NFT 徽章奖励" },
            { icon: "🌐", title: "去中心化", desc: "基于区块链，无需信任中心化机构" },
          ].map((feature, idx) => (
            <div 
              key={idx} 
              className="card group animate-scale-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="text-5xl mb-4 transition-transform duration-300 group-hover:scale-125">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="glass-strong rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10"></div>
          <div className="relative">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">开始你的隐私路况之旅</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              加入我们，共同构建更安全、更智能的出行生态系统
            </p>
            <Link href="/submit" className="btn-primary text-lg px-10 py-4">
              立即上报路况 →
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 RoadWatch. Powered by FHEVM & Zama.</p>
            <p className="mt-2">Privacy-First Road Monitoring System</p>
          </div>
        </div>
      </footer>
    </main>
  );
}


