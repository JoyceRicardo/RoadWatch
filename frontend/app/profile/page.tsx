"use client";

import { Navbar } from "@/components/Navbar";
import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useRoadWatch } from "@/hooks/useRoadWatch";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { isConnected, accounts, connect } = useMetaMask();
  const { provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner, initialMockChains } = useMetaMaskEthersSigner();
  const { instance } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const { getUserBadgeState, getTotalRecords, claimBadge } = useRoadWatch({ instance, eip1193Provider: provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner });
  const [claimedBitmap, setClaimedBitmap] = useState(0);
  const [maxEligibleLevel, setMaxEligibleLevel] = useState<number>(255);
  const [stats, setStats] = useState({ total: 0, userContributions: 0 });
  const thresholds = [1, 5, 20, 50];

  useEffect(() => {
    if (!isConnected || !accounts?.[0]) return;
    const loadData = async () => {
      try {
        const userAddress = accounts[0];
        const state = await getUserBadgeState(userAddress);
        if (state) {
          setClaimedBitmap(state.claimedBitmap);
          setMaxEligibleLevel(state.maxEligibleLevel);
          setStats((s) => ({ ...s, userContributions: Number(state.contributionCount) }));
        }
        const total = await getTotalRecords();
        setStats((s) => ({ ...s, total: Number(total) }));
      } catch (e) {
        console.error("Failed to load profile data", e);
      }
    };
    loadData();
  }, [isConnected, accounts, getUserBadgeState, getTotalRecords]);

  if (!isConnected) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-20 text-center">
          <div className="glass-strong rounded-3xl p-12 animate-scale-in">
            <div className="text-6xl mb-6">🔌</div>
            <h2 className="text-3xl font-bold gradient-text mb-4">请连接钱包</h2>
            <p className="text-gray-400 mb-8">
              连接您的 MetaMask 钱包以查看个人中心
            </p>
            <button onClick={connect} className="btn-primary text-lg px-10 py-4">
              Connect Wallet
            </button>
          </div>
        </div>
      </main>
    );
  }

  const badgeInfo = [
    { level: 0, name: "新手上路", icon: "🚗", color: "from-gray-500 to-gray-600", requirement: "上报 1 条路况" },
    { level: 1, name: "热心市民", icon: "🌟", color: "from-blue-500 to-cyan-500", requirement: "上报 5 条路况" },
    { level: 2, name: "路况达人", icon: "🏆", color: "from-purple-500 to-pink-500", requirement: "上报 20 条路况" },
    { level: 3, name: "传奇贡献者", icon: "👑", color: "from-yellow-500 to-orange-500", requirement: "上报 50 条路况" },
  ];

  const highestClaimed = (() => {
    for (let i = 3; i >= 0; i--) {
      if ((claimedBitmap & (1 << i)) !== 0) return i;
    }
    return -1;
  })();
  const currentBadge = highestClaimed >= 0 ? badgeInfo[highestClaimed] : badgeInfo[0];
  const nextClaimableLevel = (() => {
    const maxLevel = maxEligibleLevel === 255 ? -1 : Math.min(3, maxEligibleLevel);
    if (maxLevel < 0) return null;
    for (let i = 0; i <= maxLevel; i++) {
      if ((claimedBitmap & (1 << i)) === 0) return i;
    }
    return null;
  })();
  const nextBadge = typeof nextClaimableLevel === "number" ? badgeInfo[nextClaimableLevel] : null;

  return (
    <main className="min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Profile Header */}
        <div className="mb-12 animate-fade-in">
          <div className="glass-strong rounded-3xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"></div>
            
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${currentBadge.color} flex items-center justify-center text-6xl shadow-2xl transform hover:scale-110 transition-transform duration-300`}>
                {currentBadge.icon}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="text-sm text-gray-400 mb-2">当前等级</div>
                <h1 className="text-4xl font-bold gradient-text mb-3">{currentBadge.name}</h1>
                <div className="text-sm text-gray-300 font-mono mb-4">
                  {accounts?.[0]?.slice(0, 10)}...{accounts?.[0]?.slice(-8)}
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="chip-primary">
                    📊 已贡献 {stats.userContributions} 条
                  </div>
                  <div className="chip-success">
                    🎖️ 已领取等级 {highestClaimed >= 0 ? highestClaimed : 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-up">
          <div className="stat-card group hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="text-4xl mb-3">📝</div>
              <div className="text-3xl font-bold gradient-text mb-2">{stats.userContributions}</div>
              <div className="text-sm text-gray-400">我的贡献</div>
            </div>
          </div>
          
          <div className="stat-card group hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="text-4xl mb-3">🏆</div>
              <div className="text-3xl font-bold gradient-text mb-2">{highestClaimed >= 0 ? highestClaimed : 0}</div>
              <div className="text-sm text-gray-400">已领取等级</div>
            </div>
          </div>
          
          <div className="stat-card group hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="text-4xl mb-3">🌍</div>
              <div className="text-3xl font-bold gradient-text mb-2">
                {stats.userContributions > 0 ? Math.round((stats.userContributions / stats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-400">贡献占比</div>
            </div>
          </div>
        </div>

        {/* Badge Progress */}
        {nextBadge && (
          <div className="mb-12 glass-strong rounded-2xl p-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>🎯</span>
              <span>领取进度</span>
            </h2>
            
            <div className="flex items-center gap-6 mb-6">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${currentBadge.color} flex items-center justify-center text-3xl`}>
                {currentBadge.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">距离可领取</span>
                  <span className="text-sm font-semibold">{stats.userContributions} / {thresholds[nextBadge.level]}</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                    style={{ 
                      width: `${Math.min((stats.userContributions / thresholds[nextBadge.level]) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${nextBadge.color} flex items-center justify-center text-3xl opacity-50`}>
                {nextBadge.icon}
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              {stats.userContributions >= thresholds[nextBadge.level] ? (
                <span className="text-green-400">已满足条件，可领取 {nextBadge.name}</span>
              ) : (
                <>再上报 {Math.max(0, thresholds[nextBadge.level] - stats.userContributions)} 条路况即可领取 <span className="text-white font-semibold ml-1">{nextBadge.name}</span></>
              )}
            </div>
            <div className="mt-6">
              <button
                className="btn-primary"
                onClick={async () => {
                  if (typeof nextClaimableLevel === "number") {
                    await claimBadge(nextClaimableLevel);
                    window.location.reload();
                  }
                }}
                disabled={!(typeof nextClaimableLevel === "number" && stats.userContributions >= thresholds[nextBadge.level])}
              >
                🎖️ 领取 {nextBadge.name}
              </button>
            </div>
          </div>
        )}

        {/* All Badges */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span>🏅</span>
            <span>全部徽章</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {badgeInfo.map((badgeItem, idx) => {
              const isUnlocked = (claimedBitmap & (1 << idx)) !== 0;
              return (
                <div
                  key={idx}
                  className={`card relative ${isUnlocked ? "" : "opacity-40"}`}
                >
                  {isUnlocked && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    </div>
                  )}
                  <div className={`w-20 h-20 mx-auto rounded-xl bg-gradient-to-br ${badgeItem.color} flex items-center justify-center text-4xl mb-4 ${isUnlocked ? "badge-glow" : ""}`}>
                    {badgeItem.icon}
                  </div>
                  <h3 className="text-lg font-bold text-center mb-2">{badgeItem.name}</h3>
                  <p className="text-xs text-gray-400 text-center">{badgeItem.requirement}</p>
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="text-2xl">🔒</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-scale-in" style={{ animationDelay: "0.3s" }}>
          <div className="glass-strong rounded-2xl p-8 inline-block">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-2">继续贡献，解锁更多徽章</h3>
            <p className="text-sm text-gray-400 mb-6">每一次上报都让出行更安全</p>
            <Link href="/submit" className="btn-primary">
              立即上报路况 →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

