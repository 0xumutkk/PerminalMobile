import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import { dflowTradeService } from "../lib/services/dflowTrade";
import { DFlowQuoteResponse } from "../lib/types/dflow-trade.types";

export type TradeSide = "YES" | "NO";

export interface TradeParams {
    marketId: string;
    outputMint: string; // Token mint to receive
    amountUsdc: number; // Amount in USDC
    side: TradeSide;
}

export interface TradeState {
    isLoading: boolean;
    isQuoting: boolean;
    isSigning: boolean;
    isConfirming: boolean;
    error: string | null;
    signature: string | null;
    quote: DFlowQuoteResponse | null;
    usdcBalance: number | null;
}

const initialState: TradeState = {
    isLoading: false,
    isQuoting: false,
    isSigning: false,
    isConfirming: false,
    error: null,
    signature: null,
    quote: null,
    usdcBalance: null,
};

const SOLANA_RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export function useTrade() {
    const { isReady, authenticated, activeWallet, signAndSendTransaction } = useAuth();
    const [state, setState] = useState<TradeState>(initialState);

    const fetchBalance = useCallback(async () => {
        if (!activeWallet?.address) return;
        try {
            const { getUsdcBalance } = await import("../lib/solana");
            const balance = await getUsdcBalance(activeWallet.address);
            setState((s) => ({ ...s, usdcBalance: balance }));
        } catch (error) {
            console.error("[Trade] Failed to fetch balance:", error);
        }
    }, [activeWallet]);

    useEffect(() => {
        if (authenticated && activeWallet?.address) {
            fetchBalance();
        }
    }, [authenticated, activeWallet, fetchBalance]);

    const reset = useCallback(() => {
        setState(initialState);
    }, []);

    /**
     * Get a quote without executing
     */
    const getQuote = useCallback(
        async (params: Omit<TradeParams, "marketId">) => {
            if (!activeWallet?.address) {
                setState((s) => ({ ...s, error: "Wallet not connected" }));
                return null;
            }

            setState((s) => ({ ...s, isQuoting: true, error: null }));

            try {
                const quote = await dflowTradeService.getQuote({
                    outputMint: params.outputMint,
                    amountUsdc: params.amountUsdc,
                    userPublicKey: activeWallet.address,
                    slippageBps: 100, // 1% slippage for prediction markets
                });

                setState((s) => ({ ...s, isQuoting: false, quote }));
                return quote;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Quote failed";
                setState((s) => ({ ...s, isQuoting: false, error: message }));
                return null;
            }
        },
        [activeWallet]
    );

    /**
     * Execute a trade (get quote, sign, and submit)
     */
    const buy = useCallback(
        async (params: TradeParams) => {
            if (!isReady) {
                setState((s) => ({ ...s, error: "Authentication not ready" }));
                return null;
            }

            if (!authenticated || !activeWallet?.address) {
                setState((s) => ({ ...s, error: "Please connect your wallet first" }));
                return null;
            }

            setState((s) => ({
                ...initialState,
                usdcBalance: s.usdcBalance,
                isLoading: true,
                isQuoting: true,
            }));

            try {
                console.log(`[Trade] Getting quote for ${params.amountUsdc} USDC -> ${params.side}`);

                const quote = await dflowTradeService.getQuote({
                    outputMint: params.outputMint,
                    amountUsdc: params.amountUsdc,
                    userPublicKey: activeWallet.address,
                    slippageBps: 100,
                });

                setState((s) => ({
                    ...s,
                    isQuoting: false,
                    isSigning: true,
                    quote,
                }));

                console.log(`[Trade] Preparing transaction...`);
                // Base64 to Uint8Array for signAndSendTransaction
                const transactionBytes = Buffer.from(quote.transaction, "base64");

                console.log(`[Trade] Signing and sending via Privy...`);
                const result = await signAndSendTransaction(transactionBytes);
                const signature = result.signature;

                setState((s) => ({
                    ...s,
                    isSigning: false,
                    isConfirming: true,
                }));

                console.log(`[Trade] Transaction sent: ${signature}`);

                // Handle based on execution mode
                if (quote.executionMode === "async") {
                    console.log(`[Trade] Async mode - waiting for dFlow completion...`);
                    // Note: Use orderId if available, otherwise signature?
                    // According to dFlow Trade API, status check usually uses Order ID
                    const status = await dflowTradeService.waitForCompletion(quote.orderId || signature);

                    if (status.status === "failed") {
                        throw new Error(status.error || "Trade execution failed");
                    }
                } else {
                    console.log(`[Trade] Sync mode - confirming transaction...`);
                    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
                    const latestBlockhash = await connection.getLatestBlockhash();
                    const confirmation = await connection.confirmTransaction(
                        {
                            signature,
                            blockhash: latestBlockhash.blockhash,
                            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
                        },
                        "confirmed"
                    );

                    if (confirmation.value.err) {
                        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
                    }
                }

                setState((s) => ({
                    ...s,
                    isLoading: false,
                    isQuoting: false,
                    isSigning: false,
                    isConfirming: false,
                    error: null,
                    signature,
                    quote,
                }));

                return signature;
            } catch (error) {
                console.error(`[Trade] Error:`, error);
                const message = error instanceof Error ? error.message : "Trade failed";
                setState((s) => ({ ...initialState, usdcBalance: s.usdcBalance, error: message }));
                return null;
            }
        },
        [isReady, authenticated, activeWallet, signAndSendTransaction]
    );

    return {
        buy,
        getQuote,
        reset,
        ...state,
        fetchBalance,
        isWalletConnected: authenticated && !!activeWallet?.address,
        walletAddress: activeWallet?.address,
    };
}
