import { usePrivy, useEmbeddedSolanaWallet, isConnected } from "@privy-io/expo";
import { useCallback } from "react";
import { Connection, VersionedTransaction } from "@solana/web3.js";

const SOLANA_RPC_URL = process.env.EXPO_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

export function useAuth() {
    const { user, isReady: privyReady } = usePrivy();
    const solanaWallet = useEmbeddedSolanaWallet();

    // Map Privy user to the interface expected by social hooks
    // Look specifically for a Solana wallet
    const solanaAccount = user?.linked_accounts?.find((a: any) =>
        (a.type === 'wallet' && a.chain_type === 'solana')
    );
    const emailAccount = user?.linked_accounts?.find((a: any) => a.type === 'email');

    // Also try to get address directly from useEmbeddedSolanaWallet if connected
    const embeddedAddress = isConnected(solanaWallet) ? solanaWallet.wallets[0]?.address : null;

    const activeWallet = (solanaAccount as any)?.address || embeddedAddress
        ? { address: (solanaAccount as any)?.address || embeddedAddress }
        : null;

    const signAndSendTransaction = useCallback(async (transactionBytes: Uint8Array) => {
        if (!isConnected(solanaWallet)) {
            throw new Error("Solana wallet not connected");
        }

        const wallet = solanaWallet.wallets[0];
        const provider = await wallet.getProvider();

        const connection = new Connection(SOLANA_RPC_URL);
        const transaction = VersionedTransaction.deserialize(transactionBytes);

        const { signature } = await provider.request({
            method: 'signAndSendTransaction',
            params: {
                transaction,
                connection,
            }
        });

        return { signature };
    }, [solanaWallet]);

    return {
        authenticated: !!user,
        user: user ? { ...user, email: emailAccount ? { address: (emailAccount as any).address } : undefined } : null,
        activeWallet,
        isReady: privyReady && isConnected(solanaWallet),
        signAndSendTransaction,
        solanaWalletStatus: solanaWallet.status,
    };
}
