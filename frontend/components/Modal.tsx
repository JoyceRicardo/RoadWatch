"use client";

import { ReactNode, useEffect } from "react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[92vw] max-w-2xl mx-auto glass-strong rounded-3xl p-6 md:p-8 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl md:text-2xl font-bold gradient-text">{title ?? "详情"}</h3>
          <button className="btn-secondary px-3 py-1.5" onClick={onClose}>✖</button>
        </div>
        <div className="text-sm md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
}


