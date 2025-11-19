"use client";

import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { isConnected, accounts, connect, chainId } = useMetaMask();
  const pathname = usePathname();
  const addr = accounts?.[0];
  
  const navLinks: Array<{ href: string; label: string; icon: string }> = [
    { href: "/", label: "首页", icon: "🏠" },
    { href: "/submit", label: "上报", icon: "📝" },
    { href: "/records", label: "路况", icon: "🚗" },
    { href: "/profile", label: "我的", icon: "👤" },
  ];
  
  return (
    <header className="w-full sticky top-0 z-50 glass-strong border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              🚦
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight gradient-text">RoadWatch</div>
              <div className="text-xs text-gray-400">隐私路况监测</div>
            </div>
          </Link>
          
          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href as any}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActive 
                      ? "bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/20" 
                      : "hover:bg-white/5 text-gray-300 hover:text-white"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Wallet Info */}
          <div className="flex items-center gap-3">
            {chainId && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-gray-400">Chain:</span>
                <span className="font-semibold text-green-400">{chainId}</span>
              </div>
            )}
            
            {isConnected ? (
              <div className="px-4 py-2 rounded-xl glass-strong text-sm font-mono flex items-center gap-2 border border-blue-500/30">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span>{addr?.slice(0,6)}...{addr?.slice(-4)}</span>
              </div>
            ) : (
              <button className="btn-primary" onClick={connect}>
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">连接</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-around mt-4 pt-4 border-t border-white/5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href as any}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? "text-blue-400" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-xs font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}


