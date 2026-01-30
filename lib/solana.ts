import { Connection, PublicKey } from "@solana/web3.js";

const LAMPORTS_PER_SOL = 1e9;

/** USDC mint on Solana mainnet */
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export const SOLANA_RPC_URL =
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

let connection: Connection | null = null;

export function getConnection(): Connection {
    if (!connection) {
        connection = new Connection(SOLANA_RPC_URL);
    }
    return connection;
}

/**
 * Fetch SOL balance in lamports, then convert to SOL.
 */
export async function getSolBalance(address: string): Promise<number> {
    const conn = getConnection();
    const publicKey = new PublicKey(address);
    const lamports = await conn.getBalance(publicKey);
    return lamports / LAMPORTS_PER_SOL;
}

/**
 * Fetch USDC (SPL token) balance for an address.
 * Returns 0 if no USDC token account exists.
 */
export async function getUsdcBalance(address: string): Promise<number> {
    const conn = getConnection();
    const owner = new PublicKey(address);
    const accounts = await conn.getParsedTokenAccountsByOwner(owner, {
        mint: USDC_MINT,
    });
    if (!accounts.value.length) return 0;
    const info = accounts.value[0].account.data.parsed?.info;
    const uiAmount = info?.tokenAmount?.uiAmount;
    return typeof uiAmount === "number" ? uiAmount : 0;
}

/**
 * Fetch current SOL/USD price from CoinGecko (no key required).
 * Returns null on error or if rate-limited.
 */
export async function getSolPriceUsd(): Promise<number | null> {
    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
            { headers: { Accept: "application/json" } }
        );
        if (!res.ok) return null;
        const data = (await res.json()) as { solana?: { usd?: number } };
        return data.solana?.usd ?? null;
    } catch {
        return null;
    }
}
