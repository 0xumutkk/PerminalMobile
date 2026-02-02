import { usePrivy } from "@privy-io/expo";

export function useAuth() {
    const { user, isReady } = usePrivy();

    // Map Privy user to the interface expected by social hooks
    // user.linked_accounts contains the wallet and email info
    const walletAccount = user?.linked_accounts?.find((a: any) => a.type === 'wallet');
    const emailAccount = user?.linked_accounts?.find((a: any) => a.type === 'email');

    const activeWallet = walletAccount ? { address: (walletAccount as any).address } : null;

    return {
        authenticated: !!user,
        user: user ? { ...user, email: emailAccount ? { address: (emailAccount as any).address } : undefined } : null,
        activeWallet,
        isReady,
    };
}
