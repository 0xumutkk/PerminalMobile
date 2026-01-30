import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Text } from "react-native";
import { LineChart, useLineChart } from "react-native-wagmi-charts";
import * as Haptics from "expo-haptics";
import { type ChartPoint } from "../lib/mock-data";

export interface MarketChartNativeProps {
    data: ChartPoint[];
    color?: string;
}

function ChartContent({ color }: { color: string }) {
    const { currentIndex } = useLineChart();

    useEffect(() => {
        if (currentIndex.value !== -1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [currentIndex]);

    return (
        <>
            <LineChart.Path color={color} width={2.5}>
                <LineChart.Gradient color={color} />
            </LineChart.Path>
            <LineChart.CursorCrosshair color="#fff">
                <LineChart.Tooltip
                    textStyle={styles.tooltipText}
                    cursorGutter={10}
                />
                <LineChart.PriceText
                    style={styles.priceText}
                    format={({ value }) => `${Math.round(Number(value) * 100)}%`}
                />
            </LineChart.CursorCrosshair>
        </>
    );
}

export function MarketChartNative({ data, color = "#10b981" }: MarketChartNativeProps) {
    const chartWidth = Dimensions.get("window").width - 32;

    if (!data || data.length === 0) {
        return (
            <View style={[styles.container, styles.emptyContainer]}>
                <Text style={styles.emptyText}>No chart data available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LineChart.Provider data={data}>
                <LineChart width={chartWidth} height={220}>
                    <ChartContent color={color} />
                </LineChart>
            </LineChart.Provider>
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
    tooltipText: {
        color: "#fff",
        backgroundColor: "#000",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: "bold",
        padding: 4,
    },
    priceText: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
});
