"use client";

import {
  SUPPORTED_EVM_CHAIN_NAMES,
  SUPPORTED_TRANSFER_TO_CHAIN_NAMES,
  getChainDisplayName,
} from "@/lib/gateway";
import { useActionState } from "react";
import type { ActionResult } from "./actions";
import { transferFromEvmAction } from "./actions";

const initialState: ActionResult<{ mintTx: string }> = { ok: false };

export function TransferFromEvm() {
  const [state, action, pending] = useActionState(transferFromEvmAction, initialState);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold text-white">Transfer from EVM</h2>
      <p className="mt-1 text-sm text-slate-300">
        Burn deposited USDC and mint on another EVM chain or Solana.
      </p>

      <form action={action} className="mt-4 grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-200">
            From
            <select
              name="from"
              defaultValue="avalancheFuji"
              className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white"
            >
              {SUPPORTED_EVM_CHAIN_NAMES.map((id) => (
                <option key={id} value={id}>
                  {getChainDisplayName(id)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-200">
            To
            <select
              name="to"
              defaultValue="baseSepolia"
              className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white"
            >
              {SUPPORTED_TRANSFER_TO_CHAIN_NAMES.map((id) => (
                <option key={id} value={id}>
                  {getChainDisplayName(id)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-2 text-sm text-slate-200">
          Amount (USDC)
          <input
            name="amount"
            placeholder="0.25"
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white"
          />
        </label>

        <label className="grid gap-2 text-sm text-slate-200">
          Recipient (optional)
          <input
            name="recipient"
            placeholder="EVM address or Solana wallet"
            className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white"
          />
          <span className="text-xs text-slate-400">
            If sending to Solana, enter the destination wallet address (an ATA will be created).
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-indigo-400/50 bg-indigo-500/20 px-4 py-2 text-sm text-indigo-100 transition hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Transferring..." : "Transfer"}
        </button>
      </form>

      {state.message ? (
        <p className={`mt-4 text-sm ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>
          {state.message}
        </p>
      ) : null}
      {state.data?.mintTx ? (
        <p className="mt-2 break-all text-xs text-slate-400">Mint Tx: {state.data.mintTx}</p>
      ) : null}
    </section>
  );
}
