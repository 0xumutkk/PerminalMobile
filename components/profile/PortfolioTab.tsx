import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { usePositions } from "../../hooks/usePositions";
import PositionCard from "./PositionCard";

interface PortfolioTabProps {
    usdcBalance: number | null;
    onRefresh?: () => void;
}

export default function PortfolioTab({ usdcBalance, onRefresh }: PortfolioTabProps) {
    const { activePositions, closedPositions, isLoading, refresh: refreshPositions } = usePositions();
    const [activeExpanded, setActiveExpanded] = useState(true);
    const [closedExpanded, setClosedExpanded] = useState(false);
    const [timeRange, setTimeRange] = useState("ALL");

    const onPullToRefresh = async () => {
        await Promise.all([
            refreshPositions(),
            onRefresh && onRefresh()
        ]);
    };

    const totalPositionValue = activePositions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPortfolioValue = (usdcBalance || 0) + totalPositionValue;
    const totalPnl = 125.40; // Mock PnL

    const timeRanges = ["1H", "6H", "1D", "1W", "1M", "ALL"];

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={onPullToRefresh} tintColor="#22c55e" />
            }
        >

            {/* Portfolio Value */}
            <View style={styles.valueHeader}>
                <Text style={styles.totalValue}>${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                <Text style={styles.pnlText}>+${totalPnl.toLocaleString()} <Text style={styles.pnlLabel}>All</Text></Text>
            </View>

            {/* Chart Placeholder */}
            <View style={styles.chartContainer}>
                <View style={styles.mockChart}>
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={[styles.gridLine, { top: i * 40 }]} />
                    ))}
                    <View style={styles.chartLine} />
                    <View style={styles.chartDot} />
                </View>
            </View>

            {/* Time Ranges */}
            <View style={styles.timeRangeContainer}>
                {timeRanges.map((range) => (
                    <TouchableOpacity
                        key={range}
                        onPress={() => setTimeRange(range)}
                        style={[styles.rangeButton, timeRange === range && styles.rangeButtonActive]}
                    >
                        <Text style={[styles.rangeButtonText, timeRange === range && styles.rangeButtonTextActive]}>{range}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
                <View style={styles.summaryCard}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBg, { backgroundColor: '#e0f2fe' }]}>
                            <MaterialIcons name="folder" size={14} color="#3b82f6" />
                        </View>
                        <Text style={styles.cardTitle}>Positions</Text>
                    </View>
                    <Text style={styles.cardValue}>${totalPositionValue >= 1000 ? (totalPositionValue / 1000).toFixed(2) + "K" : totalPositionValue.toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryCard, { marginLeft: 12 }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBg, { backgroundColor: '#dcfce7' }]}>
                            <MaterialIcons name="attach-money" size={14} color="#22c55e" />
                        </View>
                        <Text style={styles.cardTitle}>Cash</Text>
                    </View>
                    <Text style={styles.cardValue}>${(usdcBalance || 0) >= 1000 ? ((usdcBalance || 0) / 1000).toFixed(2) + "K" : (usdcBalance || 0).toFixed(2)}</Text>
                </View>
            </View>

            {/* Active Positions Section */}
            <View style={styles.positionsSection}>
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setActiveExpanded(!activeExpanded)}
                >
                    <Text style={styles.sectionTitle}>Active Positions</Text>
                    <View style={styles.sectionRight}>
                        <Text style={styles.sectionCount}>{activePositions.length}</Text>
                        <Feather name={activeExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                    </View>
                </TouchableOpacity>

                {activeExpanded && (
                    <View style={styles.positionsList}>
                        <View style={styles.sortRow}>
                            <Text style={styles.sortLabel}>Sort by</Text>
                            <TouchableOpacity style={styles.sortAction}>
                                <Text style={styles.sortValue}>Top</Text>
                                <MaterialIcons name="swap-vert" size={16} color="#666" style={{ marginLeft: 4 }} />
                            </TouchableOpacity>
                        </View>

                        {isLoading ? (
                            <ActivityIndicator color="#a855f7" style={{ margin: 20 }} />
                        ) : activePositions.length > 0 ? (
                            activePositions.map((p, i) => (
                                <PositionCard key={`${p.mint}-${i}`} position={p} />
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No active positions</Text>
                        )}
                    </View>
                )}
            </View>

            {/* Closed Positions Section */}
            <View style={styles.positionsSection}>
                <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setClosedExpanded(!closedExpanded)}
                >
                    <Text style={styles.sectionTitle}>Closed Positions</Text>
                    <View style={styles.sectionRight}>
                        <Text style={styles.sectionCount}>{closedPositions.length}</Text>
                        <Feather name={closedExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                    </View>
                </TouchableOpacity>

                {closedExpanded && (
                    <View style={styles.positionsList}>
                        <Text style={styles.emptyText}>No closed positions</Text>
                    </View>
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    valueHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        paddingHorizontal: 16,
        marginTop: 20,
    },
    totalValue: {
        color: "#fff",
        fontSize: 34,
        fontWeight: "700",
    },
    pnlText: {
        color: "#22c55e",
        fontSize: 18,
        fontWeight: "600",
    },
    pnlLabel: {
        color: "#666",
        fontSize: 14,
        fontWeight: "500",
    },
    chartContainer: {
        height: 200,
        marginVertical: 10,
        paddingHorizontal: 16,
    },
    mockChart: {
        flex: 1,
        position: 'relative',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: '#1a1a1a',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    chartLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 50,
        height: 2.5,
        backgroundColor: '#22c55e',
    },
    chartDot: {
        position: 'absolute',
        right: 0,
        bottom: 48,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22c55e',
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    timeRangeContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginVertical: 16,
    },
    rangeButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 14,
        backgroundColor: "#000",
        minWidth: 50,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#1a1a1a",
    },
    rangeButtonActive: {
        backgroundColor: "#22c55e",
        borderColor: "#22c55e",
    },
    rangeButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    rangeButtonTextActive: {
        color: "#fff",
    },
    summaryContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: 20,
        padding: 16,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    iconBg: {
        width: 24,
        height: 24,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    cardTitle: {
        color: "#000",
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 8,
    },
    cardValue: {
        color: "#000",
        fontSize: 26,
        fontWeight: "800",
    },
    positionsSection: {
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: "#0a0a0a",
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 19,
        fontWeight: "700",
    },
    sectionRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    sectionCount: {
        color: "#666",
        fontSize: 17,
        fontWeight: "600",
        marginRight: 6,
    },
    positionsList: {
        paddingHorizontal: 16,
    },
    sortRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    sortLabel: {
        color: "#666",
        fontSize: 15,
        fontWeight: "600",
    },
    sortAction: {
        flexDirection: "row",
        alignItems: "center",
    },
    sortValue: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
    emptyText: {
        color: "#444",
        textAlign: "center",
        marginVertical: 20,
        fontSize: 14,
    },
});

