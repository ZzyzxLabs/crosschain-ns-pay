import { AnchorProvider } from "@coral-xyz/anchor";
import type {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

type SignableTransaction = Transaction | VersionedTransaction;

export type AnchorWallet = {
  publicKey: Keypair["publicKey"];
  signTransaction: <T extends SignableTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends SignableTransaction>(txs: T[]) => Promise<T[]>;
};

export function createAnchorProvider(connection: Connection, keypair: Keypair) {
  const wallet: AnchorWallet = {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends SignableTransaction>(tx: T) => {
      if ("partialSign" in tx) {
        (tx as Transaction).partialSign(keypair);
      } else {
        (tx as VersionedTransaction).sign([keypair]);
      }
      return tx;
    },
    signAllTransactions: async <T extends SignableTransaction>(txs: T[]) => {
      txs.forEach((tx) => {
        if ("partialSign" in tx) {
          (tx as Transaction).partialSign(keypair);
        } else {
          (tx as VersionedTransaction).sign([keypair]);
        }
      });
      return txs;
    },
  };

  return new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
}
