import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Share2, Info, TrendingUp, Users, Calendar, Plus, Minus, ChevronUp, X } from "lucide-react-native";
import type { Market } from "../../../lib/mock-data";
import { fetchMarketForApp, fetchDflowMarketCandlesticks } from "../../../lib/dflow";
import { MarketChartNative } from "../../../components/MarketChartNative";
import { TradePanel } from "../../../components/market/TradePanel";
import { TradeSide } from "../../../hooks/useTrade";
import { Image } from "expo-image";
import { Modal } from "react-native";

type TabKey = "position" | "about" | "holders" | "activity";

const POSITION_PLACEHOLDER = {
    balance: "21.3k",
    balanceLabel: "No Shares",
    avgCost: "51¢",
    todaysReturn: "+$8,322.23",
    todaysReturnPct: "+98.7%",
    value: "$21,234.23",
    totalInvested: "$13,245.12",
    totalReturn: "+$118,322.23",
    totalReturnPct: "+2,37K%",
};

const ACTIVITY_PLACEHOLDER = [
    { type: "buy" as const, time: "9:41 AM, Nov 17", amount: "$12,234.56", detail: "No Shares @ 51¢" },
    { type: "sell" as const, time: "9:40 AM, Nov 17", amount: "$12,234.56", detail: null },
];

function MarketDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("position");
    const [showTradePanel, setShowTradePanel] = useState(false);
    const [initialSide, setInitialSide] = useState<TradeSide>("YES");

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setError("Invalid market");
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchMarketForApp(id)
            .then((m) => {
                if (cancelled) return;
                if (!m) {
                    setError("Market not found");
                    return;
                }
                const ticker = m.ticker ?? m.id;
                return fetchDflowMarketCandlesticks(ticker)
                    .then((history) => {
                        if (!cancelled) setMarket({ ...m, priceHistory: history.length ? history : m.priceHistory ?? [] });
                    })
                    .catch(() => {
                        if (!cancelled) setMarket({ ...m, priceHistory: m.priceHistory ?? [] });
                    });
            })
            .catch((e) => {
                if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [id]);

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#a855f7" />
                <Text style={styles.loadingText}>Loading market...</Text>
            </View>
        );
    }

    if (error || !market) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error ?? "Market not found"}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = 100 - yesPercent;
    const priceHistory = market.priceHistory ?? [];
    const isUp = priceHistory.length >= 2
        ? priceHistory[priceHistory.length - 1].value >= priceHistory[0].value
        : true;
    const chartColor = isUp ? "#10b981" : "#ef4444";

    const handleOpenTrade = (side: TradeSide) => {
        setInitialSide(side);
        setShowTradePanel(true);
    };

    const handleTradeSuccess = (signature: string) => {
        Alert.alert("Success", `Trade successful! Signature: ${signature.slice(0, 8)}...`);
        setShowTradePanel(false);
        // We might want to refresh the position here in a future phase
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.header} edges={["top"]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{market.title}</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <Share2 color="#fff" size={24} />
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.titleSection}>
                    <View style={styles.marketImageContainer}>
                        {market.imageUrl && (
                            <Image source={market.imageUrl} style={styles.marketImage} contentFit="cover" />
                        )}
                    </View>
                    <Text style={styles.marketTitle}>{market.title}</Text>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{market.category}</Text>
                    </View>
                </View>

                {/* Chart Section */}
                {priceHistory.length > 0 && (
                    <MarketChartNative data={priceHistory} color={chartColor} />
                )}

                {/* Position / About / Holders / Activity block (chart altı, ~350px) */}
                <View style={styles.positionBlock}>
                    <View style={styles.tabRow}>
                        {(["position", "about", "holders", "activity"] as const).map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                style={styles.tab}
                            >
                                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                                    {tab === "position" ? "Position" : tab === "about" ? "About" : tab === "holders" ? "Holders" : "Activity"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {activeTab === "position" && (
                        <>
                            <View style={styles.positionColumns}>
                                <View style={styles.positionCol}>
                                    <View style={styles.positionRow}>
                                        <Text style={styles.positionLabel}>Balance</Text>
                                        <View style={styles.balanceValueRow}>
                                            <Text style={styles.positionValue}>{POSITION_PLACEHOLDER.balance}</Text>
                                            <View style={styles.noSharesPill}><Text style={styles.noSharesText}>{POSITION_PLACEHOLDER.balanceLabel}</Text></View>
                                            <Text style={styles.positionValue}>Shares</Text>
                                        </View>
                                    </View>
                                    <View style={styles.positionRow}>
                                        <Text style={styles.positionLabel}>Avg. Cost</Text>
                                        <Text style={styles.positionValue}>{POSITION_PLACEHOLDER.avgCost}</Text>
                                    </View>
                                    <View style={styles.positionRow}>
                                        <Text style={styles.positionLabel}>Today's Return</Text>
                                        <View style={styles.returnRow}>
                                            <Text style={[styles.positionValue, styles.positiveText]}>{POSITION_PLACEHOLDER.todaysReturn}</Text>
                                            <View style={styles.returnPctRow}>
                                                <ChevronUp color="#10b981" size={14} strokeWidth={2.5} />
                                                <Text style={[styles.positionValue, styles.positiveText]}>{POSITION_PLACEHOLDER.todaysReturnPct}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.positionCol}>
                                    <View style={styles.positionRow}>
                                        <Text style={styles.positionLabel}>Value</Text>
                                        <Text style={styles.positionValue}>{POSITION_PLACEHOLDER.value}</Text>
                                    </View>
                                    <View style={styles.positionRow}>
                                        <Text style={styles.positionLabel}>Total Invested</Text>
                                        <Text style={styles.positionValue}>{POSITION_PLACEHOLDER.totalInvested}</Text>
                                    </View>
                                    <View style={styles.positionRow}>
                                        <Text style={styles.positionLabel}>Total Return</Text>
                                        <View style={styles.returnRow}>
                                            <Text style={[styles.positionValue, styles.positiveText]}>{POSITION_PLACEHOLDER.totalReturn}</Text>
                                            <View style={styles.returnPctRow}>
                                                <ChevronUp color="#10b981" size={14} strokeWidth={2.5} />
                                                <Text style={[styles.positionValue, styles.positiveText]}>{POSITION_PLACEHOLDER.totalReturnPct}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.yourActivityTitle}>Your Activity</Text>
                            {ACTIVITY_PLACEHOLDER.map((item, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.activityRow}
                                    onPress={() => handleOpenTrade(item.type === "buy" ? "YES" : "NO")}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.activityIcon, item.type === "buy" ? styles.activityIconBuy : styles.activityIconSell]}>
                                        {item.type === "buy" ? <Plus color="#fff" size={14} strokeWidth={3} /> : <Minus color="#fff" size={14} strokeWidth={3} />}
                                    </View>
                                    <View style={styles.activityContent}>
                                        <View style={styles.activityTop}>
                                            <Text style={styles.activityAction}>{item.type === "buy" ? "Buy" : "Sell"}</Text>
                                            <Text style={styles.activityTime}>{item.time}</Text>
                                        </View>
                                        <Text style={styles.activityAmount}>{item.amount}</Text>
                                        {item.detail ? <Text style={styles.activityDetail}>{item.detail}</Text> : null}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    {activeTab === "about" && (
                        <View style={styles.tabContent}>
                            <Text style={styles.descriptionText}>{market.description}</Text>
                        </View>
                    )}

                    {activeTab === "holders" && (
                        <View style={styles.tabContent}>
                            <Text style={styles.placeholderText}>Holders list coming soon</Text>
                        </View>
                    )}

                    {activeTab === "activity" && (
                        <View style={styles.tabContent}>
                            <Text style={styles.placeholderText}>Activity feed coming soon</Text>
                        </View>
                    )}
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <TrendingUp color="#666" size={16} />
                        <Text style={styles.statLabel}>Volume</Text>
                        <Text style={styles.statValue}>${(market.volume / 1000).toFixed(0)}K</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Users color="#666" size={16} />
                        <Text style={styles.statLabel}>Chance</Text>
                        <Text style={[styles.statValue, { color: chartColor }]}>{yesPercent}%</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Calendar color="#666" size={16} />
                        <Text style={styles.statLabel}>Resolves</Text>
                        <Text style={styles.statValue}>
                            {new Date(market.resolveDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Text>
                    </View>
                </View>

                {/* Description Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Info color="#a855f7" size={18} />
                        <Text style={styles.sectionTitle}>About this market</Text>
                    </View>
                    <Text style={styles.descriptionText}>{market.description}</Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

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
                        <TradePanel market={market} onSuccess={handleTradeSuccess} />
                    </View>
                </View>
            </Modal>

            {/* Sticky Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.tradeButton, styles.buyYesButton]}
                    onPress={() => handleOpenTrade("YES")}
                >
                    <Text style={styles.tradeButtonText}>Buy YES {yesPercent}¢</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tradeButton, styles.buyNoButton]}
                    onPress={() => handleOpenTrade("NO")}
                >
                    <Text style={styles.tradeButtonText}>Buy NO {noPercent}¢</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    centered: {
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: "#666",
        marginTop: 12,
        fontSize: 14,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#111",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        flex: 1,
        textAlign: "center",
        marginHorizontal: 16,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#111",
        alignItems: "center",
        justifyContent: "center",
    },
    scrollContent: {
        padding: 16,
    },
    titleSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    marketImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: "hidden",
        backgroundColor: "#111",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#222",
    },
    marketImage: {
        width: "100%",
        height: "100%",
    },
    marketTitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        lineHeight: 28,
    },
    categoryBadge: {
        backgroundColor: "#1a1025",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#3b0764",
    },
    categoryText: {
        color: "#a855f7",
        fontSize: 12,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    positionBlock: {
        width: "100%",
        minHeight: 350,
        marginTop: 16,
        marginBottom: 24,
        backgroundColor: "#0a0a0a",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#111",
        padding: 16,
    },
    tabRow: {
        flexDirection: "row",
        marginBottom: 16,
        gap: 8,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    tabLabel: {
        color: "#6b7280",
        fontSize: 14,
        fontWeight: "600",
    },
    tabLabelActive: {
        color: "#fff",
    },
    positionColumns: {
        flexDirection: "row",
        gap: 24,
    },
    positionCol: {
        flex: 1,
        gap: 12,
    },
    positionRow: {
        gap: 4,
    },
    positionLabel: {
        color: "#6b7280",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    positionValue: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "bold",
    },
    balanceValueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
    },
    noSharesPill: {
        backgroundColor: "#ef4444",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 99,
    },
    noSharesText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    positiveText: {
        color: "#10b981",
    },
    returnRow: {
        gap: 4,
    },
    returnPctRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    yourActivityTitle: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 12,
    },
    activityRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#1a1a1a",
    },
    activityIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    activityIconBuy: {
        backgroundColor: "#10b981",
    },
    activityIconSell: {
        backgroundColor: "#ef4444",
    },
    activityContent: {
        flex: 1,
    },
    activityTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 2,
    },
    activityAction: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    activityTime: {
        color: "#6b7280",
        fontSize: 12,
    },
    activityAmount: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    activityDetail: {
        color: "#ef4444",
        fontSize: 12,
        marginTop: 2,
    },
    tabContent: {
        paddingVertical: 8,
    },
    placeholderText: {
        color: "#6b7280",
        fontSize: 14,
    },
    statsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#0a0a0a",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#111",
        alignItems: "center",
        gap: 4,
    },
    statLabel: {
        color: "#666",
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    statValue: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    section: {
        backgroundColor: "#0a0a0a",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#111",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    descriptionText: {
        color: "#9ca3af",
        fontSize: 14,
        lineHeight: 22,
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
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.9)",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
        flexDirection: "row",
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: "#111",
    },
    tradeButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    buyYesButton: {
        backgroundColor: "#10b981",
    },
    buyNoButton: {
        backgroundColor: "#ef4444",
    },
    tradeButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    errorContainer: {
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    errorText: {
        color: "#fff",
        fontSize: 18,
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: "#a855f7",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default MarketDetailScreen;
