import Link from "next/link";
import { Balances } from "./Balances";
import { DepositFromEvm } from "./DepositFromEvm";
import { DepositFromSol } from "./DepositFromSol";
import { TransferFromEvm } from "./TransferFromEvm";
import { TransferFromSol } from "./TransferFromSol";

export default function GatewayConsolePage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Circle Gateway</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Gateway operator console</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Manage deposits, balances, and cross-chain transfers across EVM and Solana from one place.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
          >
            Back to landing
          </Link>
        </div>

        <Balances />

        <div className="grid gap-6 lg:grid-cols-2">
          <DepositFromEvm />
          <DepositFromSol />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TransferFromEvm />
          <TransferFromSol />
        </div>
      </div>
    </div>
  );
}
