import React from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { type ChartPoint } from "../lib/mock-data";

export interface MarketChartNativeProps {
    data: ChartPoint[];
    color?: string;
}

/** Simple SVG line chart compatible with Expo Go (no wagmi-charts / reanimated). */
export function MarketChartNative({ data, color = "#10b981" }: MarketChartNativeProps) {
    const chartWidth = Dimensions.get("window").width - 32;
    const chartHeight = 200;
    const padding = { top: 12, right: 12, bottom: 12, left: 12 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    if (!data || data.length === 0) {
        return (
            <View style={[styles.container, styles.emptyContainer]}>
                <Text style={styles.emptyText}>No chart data available</Text>
            </View>
        );
    }

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const n = data.length;

    const points = data.map((d, i) => {
        const x = padding.left + (i / Math.max(n - 1, 1)) * innerWidth;
        const y = padding.top + innerHeight - ((d.value - minVal) / range) * innerHeight;
        return { x, y };
    });

    const pathD = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");
    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`;

    return (
        <View style={styles.container}>
            <Svg width={chartWidth} height={chartHeight}>
                <Defs>
                    <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity={0.3} />
                        <Stop offset="1" stopColor={color} stopOpacity={0} />
                    </LinearGradient>
                </Defs>
                <Path d={areaD} fill="url(#chartGradient)" />
                <Path
                    d={pathD}
                    stroke={color}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
            <View style={styles.labelRow}>
                <Text style={styles.labelSubtext}>
                    Start <Text style={[styles.labelText, { color }]}>{Math.round((data[0]?.value ?? 0) * 100)}%</Text>
                </Text>
                <Text style={styles.labelSubtext}>
                    Now <Text style={[styles.labelText, { color }]}>{Math.round((data[data.length - 1]?.value ?? 0) * 100)}%</Text>
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 240,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        marginVertical: 16,
    },
    emptyContainer: {
        padding: 20,
        backgroundColor: "#111",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 14,
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 16,
        marginTop: 8,
        gap: 8,
    },
    labelText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    labelSubtext: {
        fontSize: 12,
        color: "#6b7280",
    },
});
