"use client";

import { useActionState } from "react";
import type { ActionResult } from "./actions";
import { depositFromSolAction } from "./actions";

const initialState: ActionResult<{ signature: string }> = { ok: false };

export function DepositFromSol() {
  const [state, action, pending] = useActionState(depositFromSolAction, initialState);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold text-white">Deposit from Solana</h2>
      <p className="mt-1 text-sm text-slate-300">Send USDC into the Gateway wallet program.</p>

      <form action={action} className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm text-slate-200">
          Amount (USDC)
          <input
            name="amount"
            placeholder="0.5"
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Depositing..." : "Deposit"}
        </button>
      </form>

      {state.message ? (
        <p className={`mt-4 text-sm ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      ) : null}
      {state.data?.signature ? (
        <p className="mt-2 break-all text-xs text-slate-400">Tx: {state.data.signature}</p>
      ) : null}
    </section>
  );
}
