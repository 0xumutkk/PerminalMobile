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
import { useEmbeddedSolanaWallet, isConnected } from "@privy-io/expo";
import { useFundSolanaWallet } from "@privy-io/expo/ui";
import { DepositModal } from "../../components/DepositModal";
import type { Market } from "../../lib/mock-data";
import { fetchMarketsForApp } from "../../lib/dflow";
import { MarketCardNative } from "../../components/MarketCardNative";
import { getSolBalance, getSolPriceUsd, getUsdcBalance } from "../../lib/solana";
import { TradePanel } from "../../components/market/TradePanel";
import { TradeSide } from "../../hooks/useTrade";
import { Bell, Flame, Landmark, Trophy, Bitcoin, Plus } from "lucide-react-native";

function formatCompactMoney(value: number): { whole: string; decimal: string } {
    const fixed = value.toFixed(2);
    const [whole, decimal] = fixed.split(".");
    return {
        whole: `$${Number(whole).toLocaleString("en-US")}`,
        decimal: `.${decimal}`,
    };
}

function categoryToIcon(category: string) {
    const normalized = category.toLowerCase();
    if (normalized === "popular") return Flame;
    if (normalized.includes("politic")) return Landmark;
    if (normalized.includes("sport")) return Trophy;
    if (normalized.includes("crypto")) return Bitcoin;
    return null;
}

function categoryPillLabel(category: string) {
    if (category === "Popular") return "Popular";
    return category;
}

export default function HomeFeed() {
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

            getSolBalance(primaryAddress).then(setSolBalance);
            getUsdcBalance(primaryAddress).then(setUsdcBalance);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (!msg.includes("funding_flow_cancelled")) Alert.alert("Deposit", msg);
        }
    };

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
        setBalanceError(null);
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
    const portfolioValue = (solUsdValue ?? 0) + (usdcBalance ?? 0);
    const cashValue = usdcBalance ?? 0;

    const portfolioText = formatCompactMoney(portfolioValue);
    const cashText = formatCompactMoney(cashValue);

    const filterItems = useMemo(() => {
        const preferred = ["Popular", "Politics", "Sports", "Crypto"];
        const cleanCategories = categories.filter((cat) => !preferred.includes(cat));
        return [...preferred, ...cleanCategories];
    }, [categories]);

    const filteredMarkets = useMemo(() => {
        if (selectedCategory === "Popular") return markets;
        return markets.filter((m) => m.category === selectedCategory);
    }, [markets, selectedCategory]);

    const renderHeader = () => (
        <View style={styles.headerSection}>
            <View style={styles.topCard}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>Home</Text>
                    <Pressable style={styles.bellButton}>
                        <Bell size={20} color="#8d8d8d" strokeWidth={1.8} />
                    </Pressable>
                </View>

                <View style={styles.balanceRow}>
                    <View style={styles.balanceColumns}>
                        <View>
                            <Text style={styles.balanceLabel}>Portfolio</Text>
                            {balanceLoading ? (
                                <ActivityIndicator size="small" color="#777" style={styles.balanceLoader} />
                            ) : (
                                <Text style={styles.balanceValue}>
                                    {portfolioText.whole}
                                    <Text style={styles.balanceValueDecimal}>{portfolioText.decimal}</Text>
                                </Text>
                            )}
                        </View>
                        <View>
                            <Text style={styles.balanceLabel}>Cash</Text>
                            {balanceLoading ? (
                                <ActivityIndicator size="small" color="#777" style={styles.balanceLoader} />
                            ) : (
                                <Text style={styles.balanceValue}>
                                    {cashText.whole}
                                    <Text style={styles.balanceValueDecimal}>{cashText.decimal}</Text>
                                </Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.depositAction}
                        onPress={handleDeposit}
                        disabled={!primaryAddress}
                    >
                        <Text style={styles.depositActionText}>Deposit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScrollView}
                contentContainerStyle={styles.categoryScrollContent}
            >
                {filterItems.map((category) => {
                    const isSelected = selectedCategory === category;
                    const Icon = categoryToIcon(category);

                    return (
                        <Pressable
                            key={category}
                            style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            {Icon ? (
                                <Icon
                                    size={16}
                                    strokeWidth={2}
                                    color={isSelected ? "#3b82f7" : "rgba(0,0,0,0.4)"}
                                />
                            ) : null}
                            <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                                {categoryPillLabel(category)}
                            </Text>
                        </Pressable>
                    );
                })}

                <Pressable style={styles.addFilterPill}>
                    <Plus size={16} color="rgba(0,0,0,0.4)" strokeWidth={2.3} />
                </Pressable>
            </ScrollView>

            {balanceError ? <Text style={styles.balanceError}>{balanceError}</Text> : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar style="dark" />
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
                ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#8d8d8d"
                        colors={["#8d8d8d"]}
                        progressBackgroundColor="#f0f0f0"
                    />
                }
                ListEmptyComponent={
                    !marketsLoading ? (
                        <View style={styles.emptyMarkets}>
                            <Text style={styles.emptyMarketsText}>
                                {marketsError ?? "No markets available."}
                            </Text>
                        </View>
                    ) : null
                }
            />

            <Modal
                visible={showTradePanel}
                animationType="slide"
                transparent
                onRequestClose={() => setShowTradePanel(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
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
        backgroundColor: "#f0f0f0",
    },
    listContent: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 108,
    },
    headerSection: {
        marginBottom: 10,
    },
    topCard: {
        backgroundColor: "#fff",
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
    },
    titleRow: {
        height: 42,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        color: "#171717",
        fontSize: 24,
        lineHeight: 32,
        fontWeight: "700",
        letterSpacing: -0.6,
    },
    bellButton: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    balanceRow: {
        marginTop: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    balanceColumns: {
        flexDirection: "row",
        gap: 24,
    },
    balanceLabel: {
        color: "rgba(0,0,0,0.4)",
        fontSize: 14,
        lineHeight: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    balanceValue: {
        color: "#000",
        fontSize: 20,
        lineHeight: 22,
        fontWeight: "500",
    },
    balanceValueDecimal: {
        color: "rgba(0,0,0,0.4)",
    },
    balanceLoader: {
        marginTop: 8,
    },
    depositAction: {
        height: 50,
        minWidth: 142,
        borderRadius: 16,
        paddingHorizontal: 18,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.2)",
        backgroundColor: "#efefef",
    },
    depositActionText: {
        color: "#111",
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "700",
        letterSpacing: -0.3,
    },
    categoryScrollView: {
        marginTop: 8,
    },
    categoryScrollContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 2,
    },
    categoryPill: {
        height: 30,
        borderRadius: 32,
        paddingLeft: 8,
        paddingRight: 12,
        backgroundColor: "rgba(0,0,0,0.05)",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 4,
    },
    categoryPillActive: {
        backgroundColor: "rgba(59,130,247,0.15)",
    },
    categoryPillText: {
        color: "rgba(0,0,0,0.4)",
        fontSize: 14,
        lineHeight: 16,
        fontWeight: "500",
    },
    categoryPillTextActive: {
        color: "#3b82f7",
    },
    addFilterPill: {
        height: 30,
        minWidth: 30,
        borderRadius: 32,
        borderWidth: 1.5,
        borderColor: "rgba(0,0,0,0.08)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    listSeparator: {
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.12)",
        borderStyle: "dashed",
        marginVertical: 0,
    },
    emptyMarkets: {
        paddingVertical: 40,
        alignItems: "center",
    },
    emptyMarketsText: {
        color: "#6f6f6f",
        fontSize: 15,
        textAlign: "center",
    },
    balanceError: {
        marginTop: 8,
        color: "#b42318",
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },
    modalContent: {
        maxHeight: "92%",
        backgroundColor: "#000",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 40,
    },
});
