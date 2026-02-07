"use client";

import { useState } from "react";

export function PayForm() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const handleSend = () => {
    // TODO: implement send logic
    console.log("Send", { recipient, amount });
  };

  return (
    <section className="w-full max-w-md">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-sky-300">
              Send payment
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Pay a name in seconds
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Resolve a crosschain name and send USDC with a single tap.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white sm:flex">
            USDC
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recipient
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Search .eth, .sol, or .base.eth"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white placeholder-slate-500 shadow-sm outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white placeholder-slate-500 shadow-sm outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/20"
              />
              <button
                type="button"
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:border-white/20"
              >
                USDC
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <span>Estimated fee</span>
          <span>~$0.12</span>
        </div>

        <button
          onClick={handleSend}
          disabled={!recipient || !amount}
          className="mt-6 h-12 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:via-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send payment
        </button>
      </div>
    </section>
  );
}
