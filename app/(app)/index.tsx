import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    ScrollView,
    Pressable,
    Modal,
    Alert,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { usePrivy, useEmbeddedSolanaWallet, isConnected } from "@privy-io/expo";
import { useFundSolanaWallet } from "@privy-io/expo/ui";
import { DepositModal } from "../../components/DepositModal";
import type { Market } from "../../lib/mock-data";
import { fetchMarketsForApp } from "../../lib/dflow";
import { MarketCardNative } from "../../components/MarketCardNative";
import { getSolBalance, getSolPriceUsd, getUsdcBalance } from "../../lib/solana";
import { LayoutGrid, Gift, DollarSign, Flame, Tag, X, Wallet, Trophy, Star } from "lucide-react-native";
import { TradePanel } from "../../components/market/TradePanel";
import { TradeSide } from "../../hooks/useTrade";

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
    const { fundWallet } = useFundSolanaWallet();
    const primaryAddress =
        isConnected(solanaWallet) && solanaWallet.wallets?.[0]
            ? solanaWallet.wallets[0].address
            : null;

    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [balanceError, setBalanceError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("Popular");
    const [categories, setCategories] = useState<string[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Trade Modal state
    const [showTradePanel, setShowTradePanel] = useState(false);
    const [tradingMarket, setTradingMarket] = useState<Market | null>(null);
    const [selectedSide, setSelectedSide] = useState<TradeSide>("YES");
    const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);

    const handleOpenTrade = (market: Market, side: TradeSide) => {
        setTradingMarket(market);
        setSelectedSide(side);
        setShowTradePanel(true);
    };

    const handleTradeSuccess = (signature: string) => {
        Alert.alert("Success", `Trade successful! Signature: ${signature.slice(0, 8)}...`);
        setShowTradePanel(false);
        // Refresh balance after trade
        if (primaryAddress) {
            getUsdcBalance(primaryAddress).then(setUsdcBalance);
        }
    };

    const handleDeposit = () => {
        setIsDepositModalVisible(true);
    };

    const handleSelectMethod = async (method: "apple_pay" | "google_pay" | "card") => {
        if (!primaryAddress) {
            Alert.alert("Wallet required", "Connect your Solana wallet first to deposit.");
            return;
        }

        setIsDepositModalVisible(false);

        try {
            const options: any = {
                address: primaryAddress,
            };

            if (method === "apple_pay") {
                options.defaultPaymentMethod = "apple_pay";
            } else if (method === "google_pay") {
                options.defaultPaymentMethod = "google_pay";
            } else {
                options.defaultPaymentMethod = "card";
            }

            await fundWallet(options);

            // Refresh balances
            getSolBalance(primaryAddress).then(setSolBalance);
            getUsdcBalance(primaryAddress).then(setUsdcBalance);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (!msg.includes("funding_flow_cancelled")) Alert.alert("Deposit", msg);
        }
    };

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

    const [markets, setMarkets] = useState<Market[]>([]);
    const [marketsLoading, setMarketsLoading] = useState(true);
    const [marketsError, setMarketsError] = useState<string | null>(null);

    const loadMarkets = useCallback(async () => {
        setMarketsError(null);
        try {
            const { markets: list, categories: cats } = await fetchMarketsForApp({ limit: 100, sort: "volume" });
            setMarkets(list);
            setCategories(cats);
        } catch (e) {
            setMarketsError(e instanceof Error ? e.message : "Failed to load markets");
            setMarkets([]);
            setCategories([]);
        } finally {
            setMarketsLoading(false);
        }
    }, []);

    const loadBalances = useCallback(async () => {
        if (!primaryAddress) return;
        setBalanceLoading(true);
        try {
            const [sol, usdc, price] = await Promise.all([
                getSolBalance(primaryAddress),
                getUsdcBalance(primaryAddress),
                getSolPriceUsd(),
            ]);
            setSolBalance(sol);
            setUsdcBalance(usdc);
            setSolPriceUsd(price);
        } catch (e) {
            setBalanceError(e instanceof Error ? e.message : "Failed to load balance");
        } finally {
            setBalanceLoading(false);
        }
    }, [primaryAddress]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadMarkets(), loadBalances()]);
        setRefreshing(false);
    }, [loadMarkets, loadBalances]);

    useEffect(() => {
        loadMarkets();
    }, [loadMarkets]);

    useEffect(() => {
        loadBalances();
    }, [loadBalances]);

    const solUsdValue =
        solBalance != null && solPriceUsd != null ? solBalance * solPriceUsd : null;
    const portfolioValue = (solUsdValue ?? 0) + (usdcBalance != null ? usdcBalance : 0);
    const cashValue = usdcBalance != null ? usdcBalance : 0;

    const filteredMarkets = useMemo(() => {
        if (selectedCategory === "Popular") return markets;
        return markets.filter((m) => m.category === selectedCategory);
    }, [markets, selectedCategory]);

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
                    <Image
                        source={require("../../assets/app-logo.png")}
                        style={styles.logoImage}
                        contentFit="contain"
                    />
                </View>
                <Text style={styles.handleText} numberOfLines={1}>
                    {primaryAddress ? headerLabel : "@adilcreates"}
                </Text>
                <Pressable style={styles.giftIconButton} hitSlop={12}>
                    <Gift color="#fff" size={20} strokeWidth={2.5} />
                </Pressable>
            </View>

            {/* Redesigned Stats Row: Positions | Cash | Deposit */}
            <View style={styles.statsRow}>
                <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>Positions</Text>
                    {balanceLoading ? (
                        <ActivityIndicator size="small" color="#000" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                    ) : (
                        <Text style={styles.statValue}>
                            ${portfolioValue >= 1000 ? (portfolioValue / 1000).toFixed(1) + "K" : portfolioValue.toFixed(1)}
                        </Text>
                    )}
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statColumn}>
                    <Text style={styles.statLabel}>Cash</Text>
                    {balanceLoading ? (
                        <ActivityIndicator size="small" color="#000" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
                    ) : (
                        <Text style={styles.statValue}>
                            ${cashValue >= 1000 ? (cashValue / 1000).toFixed(1) + "K" : cashValue.toFixed(1)}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.depositAction}
                    onPress={handleDeposit}
                    disabled={!primaryAddress}
                >
                    <Text style={styles.depositActionText}>Deposit</Text>
                </TouchableOpacity>
            </View>

            {/* Category filters: Popular + DFlow categories */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
                style={styles.categoryScrollView}
            >
                <Pressable
                    style={[styles.categoryPill, styles.starPill]}
                    onPress={() => setSelectedCategory("Popular")}
                >
                    <Star color="#fff" size={16} strokeWidth={2.5} fill="#fff" />
                </Pressable>

                <Pressable
                    style={[styles.categoryPill, selectedCategory === "Popular" && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory("Popular")}
                >
                    <Text style={[styles.categoryPillText, selectedCategory === "Popular" && styles.categoryPillTextActive]}>All</Text>
                </Pressable>
                {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                        <Pressable
                            key={cat}
                            style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Tag color={isSelected ? "#fff" : "#9ca3af"} size={16} strokeWidth={2} />
                            <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>{cat}</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{selectedCategory}</Text>
                <Text style={styles.viewAll}>View All</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar style="light" />
            <FlatList
                data={filteredMarkets}
                renderItem={({ item }) => (
                    <MarketCardNative
                        market={item}
                        onBuyYes={() => handleOpenTrade(item, "YES")}
                        onBuyNo={() => handleOpenTrade(item, "NO")}
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderHeader}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#a855f7"
                        colors={["#a855f7"]}
                        progressBackgroundColor="#111"
                    />
                }
                ListEmptyComponent={
                    !marketsLoading ? (
                        <View style={styles.emptyMarkets}>
                            <Text style={styles.emptyMarketsText}>
                                {marketsError ?? "No markets available."}
                            </Text>
                            {marketsError && (
                                <Text style={styles.emptyMarketsHint}>
                                    Check .env: EXPO_PUBLIC_DFLOW_MARKETS_API_URL and EXPO_PUBLIC_DFLOW_API_KEY (pond.dflow.net).
                                </Text>
                            )}
                        </View>
                    ) : null
                }
            />

            {/* Trade Modal */}
            <Modal
                visible={showTradePanel}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowTradePanel(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Trade</Text>
                            <TouchableOpacity onPress={() => setShowTradePanel(false)} style={styles.closeButton}>
                                <X color="#fff" size={24} />
                            </TouchableOpacity>
                        </View>
                        {tradingMarket && (
                            <TradePanel
                                market={tradingMarket}
                                onSuccess={handleTradeSuccess}
                                initialSide={selectedSide}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            <DepositModal
                visible={isDepositModalVisible}
                onClose={() => setIsDepositModalVisible(false)}
                onSelectMethod={handleSelectMethod}
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
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    logoImage: {
        width: "100%",
        height: "100%",
    },
    handleText: {
        flex: 1,
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
        textAlign: "center",
        marginHorizontal: 8,
    },
    giftIconButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#222",
    },
    statColumn: {
        flex: 1,
    },
    statLabel: {
        color: "#666",
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 4,
    },
    statValue: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: "#333",
        marginHorizontal: 16,
    },
    depositAction: {
        backgroundColor: "#fff",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
    },
    depositActionText: {
        color: "#000",
        fontSize: 18,
        fontWeight: "800",
    },
    categoryScrollView: {
        marginHorizontal: -16,
    },
    categoryScroll: {
        paddingHorizontal: 16,
        gap: 8,
        flexDirection: "row",
        marginBottom: 24,
    },
    categoryPill: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: "#111",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#222",
    },
    starPill: {
        width: 36,
        paddingHorizontal: 0,
    },
    categoryPillActive: {
        backgroundColor: "#22c55e",
        borderColor: "#22c55e",
    },
    categoryPillText: {
        color: "#999",
        fontSize: 14,
        fontWeight: "700",
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
    emptyMarkets: {
        paddingVertical: 40,
        alignItems: "center",
    },
    emptyMarketsText: {
        color: "#e5e7eb",
        fontSize: 15,
        textAlign: "center",
    },
    emptyMarketsHint: {
        color: "#6b7280",
        fontSize: 12,
        marginTop: 8,
        textAlign: "center",
        paddingHorizontal: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#000",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: "#333",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
});
