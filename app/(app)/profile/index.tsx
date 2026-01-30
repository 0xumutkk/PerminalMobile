import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { usePrivy, useEmbeddedSolanaWallet, isConnected, isNotCreated, isCreating, hasError, isConnecting, isReconnecting, isDisconnected } from "@privy-io/expo";

function shortenAddress(address: string, chars = 4) {
    if (!address || address.length < chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export default function ProfileScreen() {
    const router = useRouter();
    const { logout, user } = usePrivy();
    const solanaWallet = useEmbeddedSolanaWallet();
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);
    const [isLoadingWallet, setIsLoadingWallet] = useState(false);
    const loadAttempted = useRef(false);

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    const handleLoadWallet = async () => {
        if (!isDisconnected(solanaWallet) || !solanaWallet.getProvider) return;
        try {
            setIsLoadingWallet(true);
            await solanaWallet.getProvider();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert("Could not load wallet", msg);
        } finally {
            setIsLoadingWallet(false);
        }
    };

    const handleCreateWallet = async () => {
        if (!isNotCreated(solanaWallet)) return;
        try {
            setIsCreatingWallet(true);
            await solanaWallet.create();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert("Wallet creation failed", msg);
        } finally {
            setIsCreatingWallet(false);
        }
    };

    // Auto-try to load wallet once when in disconnected state (e.g. after login, wallet exists but not loaded)
    const walletStatus = solanaWallet.status;
    useEffect(() => {
        if (walletStatus !== "disconnected" || typeof solanaWallet.getProvider !== "function" || loadAttempted.current) return;
        loadAttempted.current = true;
        setIsLoadingWallet(true);
        solanaWallet.getProvider()
            .then(() => setIsLoadingWallet(false))
            .catch(() => setIsLoadingWallet(false));
    }, [walletStatus]);

    const primaryAddress = isConnected(solanaWallet) && solanaWallet.wallets?.[0]
        ? solanaWallet.wallets[0].address
        : null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Profile</Text>
                {user?.id && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {user.id}
                    </Text>
                )}

                <View style={styles.walletSection}>
                    <Text style={styles.sectionLabel}>Solana Wallet</Text>
                    {isCreating(solanaWallet) || isCreatingWallet ? (
                        <View style={styles.walletRow}>
                            <ActivityIndicator size="small" color="#a855f7" />
                            <Text style={styles.walletStatus}>Creating wallet...</Text>
                        </View>
                    ) : isConnecting(solanaWallet) || isReconnecting(solanaWallet) ? (
                        <View style={styles.walletRow}>
                            <ActivityIndicator size="small" color="#a855f7" />
                            <Text style={styles.walletStatus}>
                                {isReconnecting(solanaWallet) ? "Reconnecting..." : "Connecting..."}
                            </Text>
                        </View>
                    ) : hasError(solanaWallet) ? (
                        <Text style={styles.errorText}>{solanaWallet.error}</Text>
                    ) : primaryAddress ? (
                        <View style={styles.walletRow}>
                            <Text style={styles.address} selectable>
                                {primaryAddress}
                            </Text>
                            <Text style={styles.shortAddress}>{shortenAddress(primaryAddress)}</Text>
                        </View>
                    ) : isNotCreated(solanaWallet) ? (
                        <TouchableOpacity
                            onPress={handleCreateWallet}
                            style={styles.createWalletButton}
                            disabled={isCreatingWallet}
                        >
                            <Text style={styles.createWalletText}>Create Solana Wallet</Text>
                        </TouchableOpacity>
                    ) : isDisconnected(solanaWallet) && typeof solanaWallet.getProvider === "function" ? (
                        <TouchableOpacity
                            onPress={handleLoadWallet}
                            style={styles.createWalletButton}
                            disabled={isLoadingWallet}
                        >
                            <View style={styles.walletRow}>
                                {isLoadingWallet && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                                <Text style={styles.createWalletText}>{isLoadingWallet ? "Loading..." : "Load wallet"}</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.walletRow}>
                            <ActivityIndicator size="small" color="#a855f7" />
                            <Text style={styles.walletStatus}>Loading wallet...</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    scrollContent: { padding: 20, alignItems: "center" },
    title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    subtitle: { color: "#666", fontSize: 12, marginTop: 8, textAlign: "center", maxWidth: "100%" },
    walletSection: {
        marginTop: 24,
        width: "100%",
        backgroundColor: "#111",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    sectionLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "600", marginBottom: 8 },
    walletRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    address: { color: "#e5e7eb", fontSize: 12, fontFamily: "monospace" },
    shortAddress: { color: "#a855f7", fontSize: 14, fontWeight: "600" },
    walletStatus: { color: "#6b7280", fontSize: 14, marginLeft: 8 },
    errorText: { color: "#ef4444", fontSize: 14 },
    createWalletButton: {
        backgroundColor: "#3b0764",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    createWalletText: { color: "#fff", fontWeight: "600" },
    logoutButton: { marginTop: 40, backgroundColor: "#111", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#331111" },
    logoutText: { color: "#ff4444", fontWeight: "600" },
});
