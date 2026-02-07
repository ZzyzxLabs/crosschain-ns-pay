"use client";

import { ConnectKitButton } from "connectkit";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white shadow-sm">
          XNP
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            Crosschain NS Pay
          </p>
          <p className="text-xs text-slate-400">Send to any name</p>
        </div>
      </div>
      <ConnectKitButton />
    </header>
  );
}
