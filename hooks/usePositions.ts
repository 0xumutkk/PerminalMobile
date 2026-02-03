import { useState, useEffect, useCallback } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useAuth } from "./useAuth";
import { SOLANA_RPC_URL } from "../lib/solana";
import { fetchDflowEvents, dflowEventMarketToMarket } from "../lib/dflow";
import { Market } from "../lib/mock-data";

export interface Position {
    marketId: string;
    marketTitle: string;
    side: "YES" | "NO";
    amount: number; // Shares
    currentPrice: number;
    currentValue: number;
    costBasis: number;
    pnl: number;
    pnlPct: number;
    imageUrl?: string;
    mint: string;
}

export function usePositions() {
    const { activeWallet } = useAuth();
    const [activePositions, setActivePositions] = useState<Position[]>([]);
    const [closedPositions, setClosedPositions] = useState<Position[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPositions = useCallback(async () => {
        if (!activeWallet?.address) return;

        console.log("[usePositions] Fetching positions for:", activeWallet.address);
        setIsLoading(true);
        setError(null);
        try {
            const connection = new Connection(SOLANA_RPC_URL, "confirmed");
            const owner = new PublicKey(activeWallet.address);

            // 1. Fetch token accounts (Legacy & Token-2022)
            const tokenProgramId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
            const token2022ProgramId = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"); // Official Token-2022

            console.log("[usePositions] Fetching accounts from Legacy and Token-2022 programs...");
            const [tokenAccounts, token2022Accounts] = await Promise.all([
                connection.getParsedTokenAccountsByOwner(owner, { programId: tokenProgramId }),
                connection.getParsedTokenAccountsByOwner(owner, { programId: token2022ProgramId }).catch(e => {
                    console.warn("[usePositions] Token-2022 fetch failed:", e.message);
                    return { value: [] };
                })
            ]);
            console.log(`[usePositions] Legacy accounts: ${tokenAccounts.value.length}, Token-2022 accounts: ${token2022Accounts.value.length}`);





            // 2. Filter for non-zero balances
            const allAccounts = [...tokenAccounts.value, ...token2022Accounts.value];
            const holdings = allAccounts
                .map((a) => ({
                    mint: a.account.data.parsed.info.mint as string,
                    amount: a.account.data.parsed.info.tokenAmount.uiAmount as number,
                }))
                .filter((h) => h.amount > 0);

            console.log("[usePositions] Found non-zero holdings:", holdings.length);

            if (holdings.length === 0) {
                setActivePositions([]);
                setIsLoading(false);
                return;
            }

            // 3. Fetch a large chunk of markets to increase matching probability (up to 300)
            const markets: Market[] = [];
            let cursor: number | null = null;

            for (let i = 0; i < 10; i++) {
                const { events, cursor: nextCursor } = await fetchDflowEvents({
                    limit: 100,
                    cursor: cursor || undefined,
                    status: "active"
                });

                events.forEach(e => {
                    if (e.markets) {
                        e.markets.forEach(m => {
                            markets.push(dflowEventMarketToMarket(e, m));
                        });
                    }
                });

                cursor = nextCursor;
                if (!cursor || events.length < 100) break;
            }

            console.log("[usePositions] Fetched markets for potential match:", markets.length);

            // 4. Match holdings to markets
            const positions: Position[] = [];

            for (const h of holdings) {
                // Ignore USDC
                if (h.mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") continue;

                console.log(`[usePositions] Checking mint: ${h.mint} (amount: ${h.amount})`);
                const market = markets.find(m => m.yesMint === h.mint || m.noMint === h.mint);

                if (market) {
                    const side = market.yesMint === h.mint ? "YES" : "NO";
                    const currentPrice = side === "YES" ? market.yesPrice : (1 - market.yesPrice);

                    positions.push({
                        marketId: market.id,
                        marketTitle: market.title,
                        side,
                        amount: h.amount,
                        currentPrice,
                        currentValue: h.amount * currentPrice,
                        costBasis: 0,
                        pnl: 0,
                        pnlPct: 0,
                        imageUrl: market.imageUrl,
                        mint: h.mint,
                    });
                } else {
                    console.log("[usePositions] No market match found for token:", h.mint);
                }
            }

            console.log("[usePositions] Final positions count:", positions.length);
            setActivePositions(positions);
        } catch (err) {
            console.error("[usePositions] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch positions");
        } finally {
            setIsLoading(false);
        }
    }, [activeWallet]);

    useEffect(() => {
        fetchPositions();
    }, [fetchPositions]);

    return { activePositions, closedPositions, isLoading, error, refresh: fetchPositions };
}

