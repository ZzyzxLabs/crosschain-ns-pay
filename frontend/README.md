# Gateway Frontend

This Next.js app includes a Gateway operator console for balances, deposits, and transfers across EVM and Solana.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` and click **Open Gateway Console** to access `/gateway`.

## Environment Variables

Create a `.env.local` in `frontend/` with:

- `EVM_PRIVATE_KEY` (hex private key for the EVM sender)
- `SOLANA_PRIVATE_KEYPAIR_1` (JSON array keypair for Solana sender)
- `SOLANA_PRIVATE_KEYPAIR_2` (optional JSON array keypair for Solana recipient)
- `GATEWAY_API_BASE_URL` (optional, default is Circle Gateway testnet API)
- `RPC_SEPOLIA`, `RPC_BASE_SEPOLIA`, `RPC_AVALANCHE_FUJI`, `RPC_SOLANA_DEVNET` (optional RPC overrides)

## Notes

- Deposits must finalize before balances are available to transfer.
- For Solana transfers, the console will create the destination ATA automatically.
