"use client";

import { Navbar } from "@/components/Navbar";
import { SubmitForm } from "@/components/SubmitForm";
import { useState } from "react";
import Link from "next/link";

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitted = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <span className="text-xl">📝</span>
            <span className="text-sm font-medium">安全 • 隐私 • 匿名</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">上报路况信息</h1>
          <p className="text-gray-400 text-lg">
            您的数据将通过 FHEVM 加密保护，严重程度信息完全匿名
          </p>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 animate-scale-in text-center">
            ✅ 路况信息上报成功！感谢您的贡献
          </div>
        )}

        {/* Main Form Card */}
        <div className="glass-strong rounded-3xl p-8 md:p-12 animate-slide-up">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">填写路况详情</h2>
            <p className="text-sm text-gray-400">
              请尽可能详细地描述路况信息，帮助其他用户做出更好的出行决策
            </p>
          </div>
          
          <SubmitForm onSubmitted={handleSubmitted} />
          
          {/* Info Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="text-2xl mb-2">🔐</div>
              <div className="text-sm font-semibold mb-1">端到端加密</div>
              <div className="text-xs text-gray-400">严重程度数据完全加密</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-semibold mb-1">即时上链</div>
              <div className="text-xs text-gray-400">数据实时同步到区块链</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl mb-2">🎖️</div>
              <div className="text-sm font-semibold mb-1">获得徽章</div>
              <div className="text-xs text-gray-400">贡献者将获得 NFT 奖励</div>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-12 glass rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>💡</span>
            <span>上报指南</span>
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>请提供准确的路况类型，如拥堵、事故、施工等</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>描述中可包含具体位置、影响范围等关键信息</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>如有现场照片，建议上传到 IPFS 并填写 CID</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>严重程度使用 0-100 分值，数值越高表示情况越严重</span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/records" className="btn-secondary">
            查看已上报路况 →
          </Link>
        </div>
      </div>
    </main>
  );
}

