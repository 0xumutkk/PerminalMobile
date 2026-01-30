import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEmbeddedSolanaWallet, isConnected } from "@privy-io/expo";
import { getSolBalance, getSolPriceUsd, getUsdcBalance } from "../../../lib/solana";

function shortenAddress(address: string, chars = 4) {
    if (!address || address.length < chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

function formatSol(value: number): string {
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.01) return value.toFixed(4);
    if (value > 0) return value.toFixed(6);
    return "0";
}

function formatUsd(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatUsdc(value: number): string {
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.01) return value.toFixed(4);
    if (value > 0) return value.toFixed(6);
    return "0";
}

export default function PortfolioScreen() {
    const solanaWallet = useEmbeddedSolanaWallet();
    const primaryAddress = isConnected(solanaWallet) && solanaWallet.wallets?.[0]
        ? solanaWallet.wallets[0].address
        : null;

    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!primaryAddress) {
            setSolBalance(null);
            setUsdcBalance(null);
            setSolPriceUsd(null);
            setError(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        Promise.all([getSolBalance(primaryAddress), getUsdcBalance(primaryAddress), getSolPriceUsd()])
            .then(([sol, usdc, price]) => {
                if (!cancelled) {
                    setSolBalance(sol);
                    setUsdcBalance(usdc);
                    setSolPriceUsd(price);
                }
            })
            .catch((e) => {
                if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [primaryAddress]);

    const solUsdValue = solBalance != null && solPriceUsd != null ? solBalance * solPriceUsd : null;
    const totalUsdValue = (solUsdValue ?? 0) + (usdcBalance != null ? usdcBalance : 0);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Your Portfolio</Text>
            <Text style={styles.subtitle}>Track your positions</Text>
            {primaryAddress && (
                <View style={styles.walletCard}>
                    <Text style={styles.walletLabel}>Connected wallet</Text>
                    <Text style={styles.walletAddress} selectable>
                        {primaryAddress}
                    </Text>
                    <Text style={styles.walletShort}>{shortenAddress(primaryAddress)}</Text>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Balance</Text>
                        {loading ? (
                            <ActivityIndicator size="small" color="#a855f7" />
                        ) : error ? (
                            <Text style={styles.balanceError}>{error}</Text>
                        ) : solBalance != null || usdcBalance != null ? (
                            <View>
                                <Text style={styles.balanceSol}>
                                    {[
                                        solBalance != null && `${formatSol(solBalance)} SOL`,
                                        usdcBalance != null && `${formatUsdc(usdcBalance)} USDC`,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </Text>
                                {(solUsdValue != null || (usdcBalance != null && usdcBalance > 0)) && (
                                    <Text style={styles.balanceUsd}>{formatUsd(totalUsdValue)}</Text>
                                )}
                            </View>
                        ) : null}
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000", padding: 20, alignItems: "center" },
    title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    subtitle: { color: "#666", fontSize: 16, marginTop: 8 },
    walletCard: {
        marginTop: 24,
        width: "100%",
        maxWidth: 400,
        backgroundColor: "#111",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    walletLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "600", marginBottom: 6 },
    walletAddress: { color: "#e5e7eb", fontSize: 12, fontFamily: "monospace" },
    walletShort: { color: "#a855f7", fontSize: 14, fontWeight: "600", marginTop: 4 },
    balanceRow: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#222", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    balanceLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "600" },
    balanceSol: { color: "#fff", fontSize: 18, fontWeight: "bold" },
    balanceUsd: { color: "#6b7280", fontSize: 14, marginTop: 2 },
    balanceError: { color: "#ef4444", fontSize: 14 },
});
