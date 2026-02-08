"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { ConnectKitButton } from "connectkit";
import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  http,
  parseUnits,
} from "viem";
import {
  EVM_CHAIN_CONFIG,
  EVM_GATEWAY_WALLET,
  getChainDisplayName,
  SUPPORTED_EVM_CHAIN_NAMES,
  type EvmChainName,
} from "@/lib/gateway";
import { gatewayWalletAbi } from "@/lib/gateway/evm/contracts";

function parseAmount(input: string): bigint | null {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) return null;
  try {
    return parseUnits(trimmed, 6);
  } catch {
    return null;
  }
}

export function DepositFromEvmButton() {
  const { address, isConnected } = useAccount();
  const chainIdConnected = useChainId();
  const { mutateAsync: switchChainAsync } = useSwitchChain();
  const { mutateAsync: writeContractAsync } = useWriteContract();

  const [chainName, setChainName] = useState<EvmChainName>("baseSepolia");
  const [amountInput, setAmountInput] = useState("");
  const [status, setStatus] = useState<{
    ok: boolean;
    message: string;
    txHash?: string;
  } | null>(null);
  const [pending, setPending] = useState(false);

  const chainId = EVM_CHAIN_CONFIG[chainName].chain.id;

  const deposit = useCallback(async () => {
    if (!address) {
      setStatus({ ok: false, message: "Wallet not connected" });
      return;
    }
    const amount = parseAmount(amountInput);
    if (!amount || amount <= 0n) {
      setStatus({ ok: false, message: "Enter a valid USDC amount" });
      return;
    }

    setPending(true);
    setStatus(null);

    try {
      const config = EVM_CHAIN_CONFIG[chainName];
      const usdcAddress = config.usdc;

      if (chainIdConnected !== chainId) {
        await switchChainAsync({ chainId });
      }

      setStatus({
        ok: true,
        message: `Approving ${formatUnits(amount, 6)} USDC...`,
      });
      const approveHash = await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [EVM_GATEWAY_WALLET, amount],
      });
      const publicClient = createPublicClient({
        chain: config.chain,
        transport: http(config.chain.rpcUrls.default.http[0]),
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      setStatus({ ok: true, message: "Depositing to Gateway Wallet..." });
      const depositHash = await writeContractAsync({
        address: EVM_GATEWAY_WALLET,
        abi: gatewayWalletAbi,
        functionName: "deposit",
        args: [usdcAddress, amount],
      });
      setStatus({
        ok: true,
        message: `Deposit submitted on ${getChainDisplayName(chainName)}.`,
        txHash: depositHash,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deposit failed";
      setStatus({ ok: false, message });
    } finally {
      setPending(false);
    }
  }, [
    address,
    chainName,
    amountInput,
    chainId,
    chainIdConnected,
    switchChainAsync,
    writeContractAsync,
  ]);

  if (!isConnected) {
    return (
      <div className='rounded-2xl border border-white/10 bg-white/5 p-6'>
        <h2 className='text-lg font-semibold text-white'>
          Deposit from EVM (connected wallet)
        </h2>
        <p className='mt-1 text-sm text-slate-300'>
          Connect your wallet to deposit USDC into the Gateway.
        </p>
        <div className='mt-4'>
          <ConnectKitButton />
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-2xl border border-white/10 bg-white/5 p-6'>
      <h2 className='text-lg font-semibold text-white'>
        Deposit from EVM - Wallet
      </h2>
      <p className='mt-1 text-sm text-slate-300'>
        Using connected wallet:{" "}
        <span className='font-mono text-slate-200'>{address}</span>
      </p>

      <div className='mt-4 grid gap-4'>
        <label className='grid gap-2 text-sm text-slate-200'>
          Chain
          <select
            value={chainName}
            onChange={(e) => setChainName(e.target.value as EvmChainName)}
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
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder='2'
            className='rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-white'
          />
        </label>

        <button
          type='button'
          onClick={deposit}
          disabled={pending}
          className='rounded-full border border-sky-400/50 bg-sky-500/20 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {pending ? "Depositing..." : "Deposit"}
        </button>
      </div>

      {status && (
        <p
          className={`mt-4 text-sm ${status.ok ? "text-emerald-300" : "text-rose-300"}`}
        >
          {status.message}
        </p>
      )}
      {status?.txHash && (
        <p className='mt-2 break-all text-xs text-slate-400'>
          Tx: {status.txHash}
        </p>
      )}
    </div>
  );
}
