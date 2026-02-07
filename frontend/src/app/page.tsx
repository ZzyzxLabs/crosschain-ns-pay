import { Header } from "./Header";
import { PayForm } from "./PayForm";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10">
        <Header />
        <main className="flex flex-1 items-center">
          <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300">
                Crosschain payments
              </p>
              <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
                Pay any name. Any chain. In seconds.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-slate-300">
                Resolve ENS, SNS, and Base names into destinations and send
                USDC instantly with a clean, modern flow.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  ENS + SNS ready
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Stablecoin rails
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Wallet connected
                </span>
              </div>
            </div>
            <PayForm />
          </div>
        </main>
      </div>
    </div>
  );
}
