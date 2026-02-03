import { DFlowQuoteResponse, DFlowOrderStatus } from "../types/dflow-trade.types";

const DFLOW_TRADE_API_URL = process.env.EXPO_PUBLIC_DFLOW_TRADE_API_URL || "https://dev-quote-api.dflow.net";
const DFLOW_API_KEY = process.env.EXPO_PUBLIC_DFLOW_API_KEY || "";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DECIMALS = 6;

class DFlowTradeService {
    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        };
        if (DFLOW_API_KEY) {
            headers["x-api-key"] = DFLOW_API_KEY;
        }
        return headers;
    }

    /**
     * Get a swap quote from DFlow
     * Returns transaction to sign and quote details
     */
    async getQuote(params: {
        outputMint: string;
        amountUsdc: number;
        userPublicKey: string;
        slippageBps?: number;
    }): Promise<DFlowQuoteResponse> {
        // Validate amount is a valid positive number
        if (isNaN(params.amountUsdc) || params.amountUsdc <= 0) {
            throw new Error("Invalid amount: must be a positive number");
        }

        // Convert USDC amount to smallest unit (6 decimals)
        const amountLamports = Math.floor(params.amountUsdc * Math.pow(10, USDC_DECIMALS));


        const searchParams = new URLSearchParams({
            inputMint: USDC_MINT,
            outputMint: params.outputMint,
            amount: amountLamports.toString(),
            slippageBps: (params.slippageBps || 100).toString(), // Default 1% for prediction markets
            userPublicKey: params.userPublicKey,
        });

        const url = `${DFLOW_TRADE_API_URL}/order?${searchParams.toString()}`;
        console.log(`[DFlowTradeService] Fetching quote: ${url}`);

        const response = await fetch(url, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `DFlow quote failed: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.msg) {
                    errorMessage = `${errorJson.msg}`;
                }
            } catch (e) {
                // Not JSON, use generic message
            }
            console.error(`[DFlowTradeService] Quote failed (${response.status}):`, errorText);
            throw new Error(errorMessage);
        }

        return response.json();
    }

    /**
     * Get order status for async execution
     */
    async getOrderStatus(orderId: string): Promise<DFlowOrderStatus> {
        const url = `${DFLOW_TRADE_API_URL}/status/${orderId}`;
        const response = await fetch(url, {
            method: "GET",
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Status check failed: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Poll for async order completion
     */
    async waitForCompletion(
        orderId: string,
        maxAttempts = 30,
        intervalMs = 2000
    ): Promise<DFlowOrderStatus> {
        for (let i = 0; i < maxAttempts; i++) {
            const status = await this.getOrderStatus(orderId);

            if (status.status === "completed") {
                return status;
            }
            if (status.status === "failed") {
                throw new Error(status.error || "Trade execution failed");
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }

        throw new Error("Order polling timeout");
    }

    formatUsdcAmount(lamports: string | number): string {
        const amount = typeof lamports === "string" ? parseInt(lamports) : lamports;
        return (amount / Math.pow(10, USDC_DECIMALS)).toFixed(2);
    }
}

export const dflowTradeService = new DFlowTradeService();
