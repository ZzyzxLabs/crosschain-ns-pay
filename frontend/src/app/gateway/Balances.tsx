"use client";

import { useActionState } from "react";
import type { ActionResult, BalancesData } from "./actions";
import { fetchBalancesAction } from "./actions";

const initialState: ActionResult<BalancesData> = { ok: false };

export function Balances() {
  const [state, action, pending] = useActionState(fetchBalancesAction, initialState);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Gateway balances</h2>
          <p className="text-sm text-slate-300">Pull current USDC balances for EVM + Solana depositors.</p>
        </div>
        <form action={action}>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Refreshing..." : "Refresh"}
          </button>
        </form>
      </div>

      {state.data ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">EVM depositor</p>
              <p className="mt-2 font-mono text-sm text-white">{state.data.evmDepositor}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Solana depositor</p>
              <p className="mt-2 font-mono text-sm text-white">{state.data.solanaDepositor}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Balances by chain</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              {state.data.balances.length === 0 ? (
                <li className="text-slate-400">No balances yet.</li>
              ) : (
                state.data.balances.map((entry) => (
                  <li key={entry.domain} className="flex items-center justify-between">
                    <span>{entry.chain}</span>
                    <span className="font-medium text-white">{entry.amount}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-400">Run refresh to load balances.</p>
      )}

      {state.message ? (
        <p className={`mt-4 text-sm ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
