import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Share2, Info, TrendingUp, Users, Calendar } from "lucide-react-native";
import { MOCK_MARKETS } from "../../../lib/mock-data";
import { MarketChartNative } from "../../../components/MarketChartNative";
import { Image } from "expo-image";

function MarketDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const market = MOCK_MARKETS.find((m) => m.id === id);

    if (!market) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Market not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = 100 - yesPercent;
    const isUp = market.priceHistory[market.priceHistory.length - 1].value >= market.priceHistory[0].value;
    const chartColor = isUp ? "#10b981" : "#ef4444";

    const handleTrade = (side: string) => {
        Alert.alert("Trade", `${side} trade functionality coming soon in Phase 4!`);
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
                <MarketChartNative data={market.priceHistory} color={chartColor} />

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

            {/* Sticky Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.tradeButton, styles.buyYesButton]}
                    onPress={() => handleTrade("YES")}
                >
                    <Text style={styles.tradeButtonText}>Buy YES {yesPercent}¢</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tradeButton, styles.buyNoButton]}
                    onPress={() => handleTrade("NO")}
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
