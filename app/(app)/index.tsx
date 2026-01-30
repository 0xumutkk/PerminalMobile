import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    ScrollView,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { usePrivy, useEmbeddedSolanaWallet, isConnected } from "@privy-io/expo";
import { MOCK_MARKETS } from "../../lib/mock-data";
import type { Market, MarketCategory } from "../../lib/mock-data";
import { MarketCardNative } from "../../components/MarketCardNative";
import { getSolBalance, getSolPriceUsd, getUsdcBalance } from "../../lib/solana";
import { LayoutGrid, Gift, DollarSign, Flame, Building2, Trophy, Bitcoin } from "lucide-react-native";

const CATEGORY_FILTERS: { key: "Popular" | MarketCategory; label: string; icon: typeof Flame }[] = [
    { key: "Popular", label: "Popular", icon: Flame },
    { key: "Politics", label: "Politics", icon: Building2 },
    { key: "Sports", label: "Sports", icon: Trophy },
    { key: "Crypto", label: "Crypto", icon: Bitcoin },
];

function shortenAddress(address: string, chars = 4): string {
    if (!address || address.length < chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

function formatUsd(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

function formatUsdc(value: number): string {
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.01) return value.toFixed(4);
    if (value > 0) return value.toFixed(6);
    return "0";
}

export default function HomeFeed() {
    const { user } = usePrivy();
    const solanaWallet = useEmbeddedSolanaWallet();
    const primaryAddress =
        isConnected(solanaWallet) && solanaWallet.wallets?.[0]
            ? solanaWallet.wallets[0].address
            : null;

    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<"Popular" | MarketCategory>("Popular");

    useEffect(() => {
        if (!primaryAddress) {
            setSolBalance(null);
            setUsdcBalance(null);
            setSolPriceUsd(null);
            setBalanceError(null);
            return;
        }
        let cancelled = false;
        setBalanceLoading(true);
        setBalanceError(null);
        Promise.all([
            getSolBalance(primaryAddress),
            getUsdcBalance(primaryAddress),
            getSolPriceUsd(),
        ])
            .then(([sol, usdc, price]) => {
                if (!cancelled) {
                    setSolBalance(sol);
                    setUsdcBalance(usdc);
                    setSolPriceUsd(price);
                }
            })
            .catch((e) => {
                if (!cancelled) {
                    setBalanceError(e instanceof Error ? e.message : "Failed to load balance");
                }
            })
            .finally(() => {
                if (!cancelled) setBalanceLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [primaryAddress]);

    const solUsdValue =
        solBalance != null && solPriceUsd != null ? solBalance * solPriceUsd : null;
    const portfolioValue = (solUsdValue ?? 0) + (usdcBalance != null ? usdcBalance : 0);
    const cashValue = usdcBalance != null ? usdcBalance : 0;

    const filteredMarkets = useMemo(() => {
        if (selectedCategory === "Popular") return MOCK_MARKETS;
        return MOCK_MARKETS.filter((m) => m.category === selectedCategory);
    }, [selectedCategory]);

    const headerLabel =
        (user?.id && String(user.id).length < 20
            ? `@${String(user.id).replace(/^.*\./, "").slice(0, 12)}`
            : null) ??
        (primaryAddress ? shortenAddress(primaryAddress) : "Wallet");

    const renderHeader = () => (
        <View style={styles.headerSection}>
            {/* Top bar: logo left, handle center, gift right */}
            <View style={styles.topBar}>
                <View style={styles.logoContainer}>
                    <LayoutGrid color="#a855f7" size={24} strokeWidth={2} />
                </View>
                <Text style={styles.handleText} numberOfLines={1}>
                    {primaryAddress ? headerLabel : "Wallet"}
                </Text>
                <Pressable style={styles.giftButton} hitSlop={12}>
                    <Gift color="#9ca3af" size={24} strokeWidth={2} />
                </Pressable>
            </View>

            {/* Portfolio + Cash cards side by side */}
            <View style={styles.balanceRow}>
                <View style={styles.portfolioCard}>
                    <Text style={styles.cardLabel}>Portfolio</Text>
                    {balanceLoading ? (
                        <ActivityIndicator size="small" color="#a855f7" style={{ marginVertical: 8 }} />
                    ) : balanceError ? (
                        <Text style={styles.cardError}>{balanceError}</Text>
                    ) : (
                        <>
                            <Text style={styles.cardValue}>{formatUsd(portfolioValue)}</Text>
                            <View style={styles.changeBadge}>
                                <Text style={styles.changeText}>+0.00%</Text>
                            </View>
                        </>
                    )}
                </View>
                <View style={styles.cashCard}>
                    <Text style={styles.cardLabel}>Cash</Text>
                    {balanceLoading ? (
                        <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 8 }} />
                    ) : (
                        <View style={styles.cashValueRow}>
                            <Text style={styles.cardValue}>{formatUsd(cashValue)}</Text>
                            <View style={styles.cashIcon}>
                                <DollarSign color="#fff" size={16} strokeWidth={2.5} />
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Category filters */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
                style={styles.categoryScrollView}
            >
                {CATEGORY_FILTERS.map(({ key, label, icon: Icon }) => {
                    const isSelected = selectedCategory === key;
                    return (
                        <Pressable
                            key={key}
                            style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                            onPress={() => setSelectedCategory(key)}
                        >
                            <Icon
                                color={isSelected ? "#fff" : "#9ca3af"}
                                size={16}
                                strokeWidth={2}
                                style={styles.categoryIcon}
                            />
                            <Text
                                style={[
                                    styles.categoryPillText,
                                    isSelected && styles.categoryPillTextActive,
                                ]}
                            >
                                {label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {selectedCategory === "Popular" ? "Popular" : selectedCategory}
                </Text>
                <Text style={styles.viewAll}>View All</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar style="light" />
            <FlatList
                data={filteredMarkets}
                renderItem={({ item }) => <MarketCardNative market={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    listContent: {
        padding: 16,
        paddingTop: 8,
    },
    headerSection: {
        marginBottom: 20,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    logoContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
    handleText: {
        flex: 1,
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginHorizontal: 8,
    },
    giftButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
    balanceRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    portfolioCard: {
        flex: 1,
        backgroundColor: "#111",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    cashCard: {
        flex: 1,
        backgroundColor: "#111",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    cardLabel: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 6,
    },
    cardValue: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
    },
    cardError: {
        color: "#ef4444",
        fontSize: 12,
    },
    changeBadge: {
        alignSelf: "flex-start",
        marginTop: 6,
    },
    changeText: {
        color: "#10b981",
        fontSize: 12,
        fontWeight: "600",
    },
    cashValueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    cashIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#3b82f6",
        alignItems: "center",
        justifyContent: "center",
    },
    categoryScrollView: {
        marginHorizontal: -16,
    },
    categoryScroll: {
        paddingHorizontal: 16,
        gap: 10,
        flexDirection: "row",
        marginBottom: 20,
    },
    categoryPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#222",
    },
    categoryPillActive: {
        backgroundColor: "#3b0764",
        borderColor: "#6b21a8",
    },
    categoryIcon: {
        marginRight: 6,
    },
    categoryPillText: {
        color: "#9ca3af",
        fontSize: 14,
        fontWeight: "600",
    },
    categoryPillTextActive: {
        color: "#fff",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    viewAll: {
        color: "#a855f7",
        fontSize: 14,
        fontWeight: "600",
    },
});
