"use client";

import { SUPPORTED_EVM_CHAIN_NAMES, getChainDisplayName } from "@/lib/gateway";
import { useActionState } from "react";
import type { ActionResult } from "./actions";
import { depositFromEvmAction } from "./actions";

const initialState: ActionResult<{ txHash: string }> = { ok: false };

export function DepositFromEvm() {
  const [state, action, pending] = useActionState(
    depositFromEvmAction,
    initialState,
  );

  return (
    <section className='rounded-2xl border border-white/10 bg-white/5 p-6'>
      <h2 className='text-lg font-semibold text-white'>
        Deposit from EVM - ENV
      </h2>
      <p className='mt-1 text-sm text-slate-300'>
        Approve and deposit USDC into the Gateway wallet.
      </p>

      <form action={action} className='mt-4 grid gap-4'>
        <label className='grid gap-2 text-sm text-slate-200'>
          Source chain
          <select
            name='chain'
            defaultValue='avalancheFuji'
            className='rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white'
          >
            {SUPPORTED_EVM_CHAIN_NAMES.map((id) => (
              <option key={id} value={id}>
                {getChainDisplayName(id)}
              </option>
            ))}
          </select>
        </label>

        <label className='grid gap-2 text-sm text-slate-200'>
          Amount (USDC)
          <input
            name='amount'
            placeholder='1.25'
            className='rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white'
          />
        </label>

        <button
          type='submit'
          disabled={pending}
          className='rounded-full border border-sky-400/50 bg-sky-500/20 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {pending ? "Depositing..." : "Deposit"}
        </button>
      </form>

      {state.message ? (
        <p
          className={`mt-4 text-sm ${state.ok ? "text-emerald-300" : "text-rose-300"}`}
        >
          {state.message}
        </p>
      ) : null}
      {state.data?.txHash ? (
        <p className='mt-2 break-all text-xs text-slate-400'>
          Tx: {state.data.txHash}
        </p>
      ) : null}
    </section>
  );
}
