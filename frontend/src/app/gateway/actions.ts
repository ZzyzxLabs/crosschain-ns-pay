"use server";

import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { zeroAddress } from "viem";
import {
  burnIntent,
  burnIntentTypedData,
  burnIntentTypedDataForEvmToSolana,
  createBurnIntentEvmToSolana,
  EVM_CHAIN_CONFIG,
  GatewayClient,
  GATEWAY_CHAINS,
  getEvmAccount,
  getEvmChain,
  getSolanaAccount,
  getSolanaAccount2,
  parseUsdcToBigInt,
  SOLANA_ZERO_ADDRESS,
  transformBurnIntent,
  transformBurnIntentForApiEvmToSolana,
  type EvmChainName,
  SOLANA_CONFIG,
} from "@/lib/gateway";

export type ActionResult<T = undefined> = {
  ok: boolean;
  message?: string;
  data?: T;
};

export type BalanceEntry = {
  domain: number;
  chain: string;
  amount: string;
};

export type BalancesData = {
  evmDepositor: string;
  solanaDepositor: string;
  balances: BalanceEntry[];
};

const gatewayClient = new GatewayClient();

const initialMessage = <T>(message: string): ActionResult<T> => ({
  ok: false,
  message,
});

function getFormString(
  formData: FormData,
  name: string,
  fallback?: string,
): string {
  const raw = formData.get(name);
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required field: ${name}`);
}

function getOptionalFormString(
  formData: FormData,
  name: string,
): string | undefined {
  const raw = formData.get(name);
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  return undefined;
}

function resolveEvmChain(name: string) {
  if (!Object.prototype.hasOwnProperty.call(EVM_CHAIN_CONFIG, name)) {
    throw new Error(`Unsupported EVM chain: ${name}`);
  }
  return getEvmChain(name as EvmChainName);
}

function formatBalances(
  balances: Array<{ domain: number; balance: string }>,
): BalanceEntry[] {
  return balances.map((balance) => ({
    domain: balance.domain,
    chain: GATEWAY_CHAINS[balance.domain] ?? `Domain ${balance.domain}`,
    amount: `${balance.balance} USDC`,
  }));
}

export async function fetchBalancesAction(
  _: ActionResult<BalancesData>,
  __: FormData,
): Promise<ActionResult<BalancesData>> {
  try {
    const evmAccount = getEvmAccount();
    const solanaAccount = getSolanaAccount();

    const [evmBalances, solBalances] = await Promise.all([
      gatewayClient.balances(evmAccount.address),
      gatewayClient.balances(solanaAccount.address),
    ]);

    const evmEntries = formatBalances(evmBalances);
    const solEntries = formatBalances(solBalances);
    return {
      ok: true,
      message: "Balances updated",
      data: {
        evmDepositor: evmAccount.address,
        solanaDepositor: solanaAccount.address,
        balances: [...evmEntries, ...solEntries],
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load balances";
    return initialMessage(message);
  }
}

export async function depositFromEvmAction(
  _: ActionResult<{ txHash: string }>,
  formData: FormData,
): Promise<ActionResult<{ txHash: string }>> {
  try {
    const chainName = getFormString(formData, "chain", "avalancheFuji");
    const amountStr = getFormString(formData, "amount");
    const amount = parseUsdcToBigInt(amountStr);

    const account = getEvmAccount();
    const chain = resolveEvmChain(chainName);

    const balance = await chain.usdc.read.balanceOf([account.address]);
    if (balance < amount) {
      throw new Error("Insufficient USDC balance for deposit");
    }

    const approveHash = await chain.usdc.write.approve([
      chain.gatewayWallet.address,
      amount,
    ]);
    await chain.publicClient.waitForTransactionReceipt({ hash: approveHash });

    const depositHash = await chain.gatewayWallet.write.deposit([
      amount,
      chain.usdc.address,
    ]);
    await chain.publicClient.waitForTransactionReceipt({ hash: depositHash });

    return {
      ok: true,
      message: `Deposit submitted on ${chainName}.`,
      data: { txHash: depositHash },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deposit failed";
    return initialMessage(message);
  }
}

export async function depositFromSolAction(
  _: ActionResult<{ signature: string }>,
  formData: FormData,
): Promise<ActionResult<{ signature: string }>> {
  try {
    const amountStr = getFormString(formData, "amount");
    const amount = parseUsdcToBigInt(amountStr);

    const solana = getSolanaAccount();

    const userAta = getAssociatedTokenAddressSync(
      solana.usdc.publicKey,
      solana.publicKey,
    );
    const ataInfo = await getAccount(solana.connection, userAta);
    const currentBalance = BigInt(ataInfo.amount.toString());
    if (currentBalance < amount) {
      throw new Error(
        "Insufficient USDC balance. Top up at https://faucet.circle.com",
      );
    }

    const tx = await solana.gatewayWallet.deposit({
      amount: new BN(amount.toString()),
      tokenMint: solana.usdc.publicKey,
    });

    await solana.gatewayWallet.waitForConfirmation(tx);

    return {
      ok: true,
      message: "Solana deposit confirmed.",
      data: { signature: tx },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Solana deposit failed";
    return initialMessage(message);
  }
}

export async function transferFromEvmAction(
  _: ActionResult<{ mintTx: string }>,
  formData: FormData,
): Promise<ActionResult<{ mintTx: string }>> {
  try {
    const fromName = getFormString(formData, "from", "avalancheFuji");
    const toName = getFormString(formData, "to");
    const amountStr = getFormString(formData, "amount");
    const amount = parseUsdcToBigInt(amountStr);
    const recipientArg = getOptionalFormString(formData, "recipient");

    const evmAccount = getEvmAccount();
    const fromChain = resolveEvmChain(fromName);
    const isDestinationSolana = toName === "solanaDevnet";
    const toChain = isDestinationSolana ? null : resolveEvmChain(toName);

    const balances = await gatewayClient.balances(evmAccount.address);
    const sourceBalance = balances.find((b) => b.domain === fromChain.domain);
    const balanceStr =
      sourceBalance != null && typeof sourceBalance.balance === "string"
        ? String(sourceBalance.balance).trim()
        : "";
    let available = 0n;
    if (balanceStr && /^\d+(\.\d+)?$/.test(balanceStr)) {
      try {
        const parsed = parseUsdcToBigInt(balanceStr);
        if (parsed > 0n) available = parsed;
      } catch {
        // leave 0n
      }
    }
    if (available < amount) {
      throw new Error(
        "Insufficient Gateway balance on source chain. Deposit first.",
      );
    }

    let destinationRecipient: string;
    const solanaRecipient = getSolanaAccount();
    if (isDestinationSolana) {
      const walletAddress = recipientArg ?? solanaRecipient.address;
      const solanaRecipientPublicKey = new PublicKey(walletAddress);
      const usdcMint = new PublicKey(SOLANA_CONFIG.usdcMint);
      const recipientAta = getAssociatedTokenAddressSync(
        usdcMint,
        solanaRecipientPublicKey,
      );
      destinationRecipient = recipientAta.toBase58();

      const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        solanaRecipientPublicKey,
        recipientAta,
        solanaRecipientPublicKey,
        usdcMint,
      );
      const tx = new Transaction().add(createAtaIx);
      await sendAndConfirmTransaction(solanaRecipient.connection, tx, [
        solanaRecipient.keypair,
      ]);
    } else {
      destinationRecipient = recipientArg ?? evmAccount.address;
    }

    const intent = isDestinationSolana
      ? createBurnIntentEvmToSolana({
          sourceChain: fromName as EvmChainName,
          depositorAddress: evmAccount.address,
          recipientAddress: destinationRecipient,
          amount: amountStr,
        })
      : burnIntent({
          account: { address: evmAccount.address },
          from: {
            domain: fromChain.domain,
            gatewayWallet: { address: fromChain.gatewayWallet.address },
            gatewayMinter: { address: fromChain.gatewayMinter.address },
            usdc: { address: fromChain.usdc.address },
          },
          to: {
            domain: toChain!.domain,
            gatewayWallet: { address: toChain!.gatewayWallet.address },
            gatewayMinter: { address: toChain!.gatewayMinter.address },
            usdc: { address: toChain!.usdc.address },
          },
          amount: amountStr,
          recipient: destinationRecipient,
          destinationCaller: zeroAddress,
        });

    const typedData = isDestinationSolana
      ? burnIntentTypedDataForEvmToSolana(intent)
      : burnIntentTypedData(intent, false, false);
    const signature = await evmAccount.signTypedData(typedData as any);

    const transferPayload = isDestinationSolana
      ? transformBurnIntentForApiEvmToSolana(intent)
      : intent;
    const response = await gatewayClient.transfer([
      { burnIntent: transferPayload, signature },
    ]);

    if (isDestinationSolana) {
      const mintTx = await solanaRecipient.gatewayMinter.gatewayMint({
        attestation: response.attestation,
        signature: response.signature,
        usdcToken: solanaRecipient.usdc.publicKey,
      });
      await solanaRecipient.gatewayMinter.waitForConfirmation(mintTx);
      return { ok: true, message: "Minted on Solana.", data: { mintTx } };
    }

    const mintHash = await toChain!.gatewayMinter.write.gatewayMint([
      response.attestation,
      response.signature,
    ]);
    await toChain!.publicClient.waitForTransactionReceipt({ hash: mintHash });

    return {
      ok: true,
      message: `Minted on ${toName}.`,
      data: { mintTx: mintHash },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    return initialMessage(message);
  }
}

export async function transferFromSolAction(
  _: ActionResult<{ mintTx: string }>,
  formData: FormData,
): Promise<ActionResult<{ mintTx: string }>> {
  try {
    const toName = getFormString(formData, "to");
    const amountStr = getFormString(formData, "amount");
    const amount = parseUsdcToBigInt(amountStr);
    const recipientArg = getOptionalFormString(formData, "recipient");

    const solanaSender = getSolanaAccount();
    const isDestinationSolana = toName === "solanaDevnet";
    const evmDestination = isDestinationSolana ? null : resolveEvmChain(toName);

    const balances = await gatewayClient.balances(solanaSender.address);
    const sourceBalance = balances.find(
      (b) => b.domain === solanaSender.domain,
    );
    const balanceStr =
      sourceBalance != null && typeof sourceBalance.balance === "string"
        ? String(sourceBalance.balance).trim()
        : "";
    let available = 0n;
    if (balanceStr && /^\d+(\.\d+)?$/.test(balanceStr)) {
      try {
        const parsed = parseUsdcToBigInt(balanceStr);
        if (parsed > 0n) available = parsed;
      } catch {
        // leave 0n
      }
    }
    if (available < amount) {
      throw new Error("Insufficient Gateway balance on Solana. Deposit first.");
    }

    let destinationRecipient: string;

    if (isDestinationSolana) {
      const solanaRecipient = getSolanaAccount() ?? solanaSender;
      const walletAddress = recipientArg ?? solanaRecipient.address;
      const destinationWallet = new PublicKey(walletAddress);
      const recipientAta = getAssociatedTokenAddressSync(
        solanaSender.usdc.publicKey,
        destinationWallet,
      );
      destinationRecipient = recipientAta.toBase58();

      const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        solanaSender.publicKey,
        recipientAta,
        destinationWallet,
        solanaSender.usdc.publicKey,
      );
      const tx = new Transaction().add(createAtaIx);
      await sendAndConfirmTransaction(solanaSender.connection, tx, [
        solanaSender.keypair,
      ]);
    } else {
      const evmAccount = getEvmAccount();
      destinationRecipient = recipientArg ?? evmAccount.address;
    }

    const intent = burnIntent({
      account: { address: solanaSender.address },
      from: {
        domain: solanaSender.domain,
        gatewayWallet: {
          address: solanaSender.gatewayWallet.gatewayWalletAddress,
        },
        gatewayMinter: {
          address: solanaSender.gatewayMinter.gatewayMinterAddress,
        },
        usdc: { address: solanaSender.usdc.address },
      },
      to: {
        domain: isDestinationSolana
          ? solanaSender.domain
          : evmDestination!.domain,
        gatewayWallet: {
          address: isDestinationSolana
            ? solanaSender.gatewayWallet.gatewayWalletAddress
            : evmDestination!.gatewayWallet.address,
        },
        gatewayMinter: {
          address: isDestinationSolana
            ? solanaSender.gatewayMinter.gatewayMinterAddress
            : evmDestination!.gatewayMinter.address,
        },
        usdc: {
          address: isDestinationSolana
            ? solanaSender.usdc.address
            : evmDestination!.usdc.address,
        },
      },
      amount: amountStr,
      recipient: destinationRecipient,
      destinationCaller: isDestinationSolana
        ? SOLANA_ZERO_ADDRESS
        : zeroAddress,
    });

    const transformed = transformBurnIntent(intent, true, isDestinationSolana);
    const signature = solanaSender.gatewayWallet.signBurnIntent(transformed);

    const response = await gatewayClient.transfer([
      { burnIntent: transformed, signature },
    ]);

    if (isDestinationSolana) {
      const mintTx = await solanaSender.gatewayMinter.gatewayMint({
        attestation: response.attestation,
        signature: response.signature,
        usdcToken: solanaSender.usdc.publicKey,
      });
      await solanaSender.gatewayMinter.waitForConfirmation(mintTx);
      return { ok: true, message: "Minted on Solana.", data: { mintTx } };
    }

    const mintHash = await evmDestination!.gatewayMinter.write.gatewayMint([
      response.attestation,
      response.signature,
    ]);
    await evmDestination!.publicClient.waitForTransactionReceipt({
      hash: mintHash,
    });

    return {
      ok: true,
      message: `Minted on ${toName}.`,
      data: { mintTx: mintHash },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    return initialMessage(message);
  }
}
