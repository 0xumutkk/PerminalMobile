import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Position } from "../../hooks/usePositions";
import { Feather } from "@expo/vector-icons";

interface PositionCardProps {
    position: Position;
    onPress?: () => void;
}

export default function PositionCard({ position, onPress }: PositionCardProps) {
    const isPositive = position.pnl >= 0;

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.leftContent}>
                <Image
                    source={position.imageUrl ? { uri: position.imageUrl } : null}
                    style={styles.image}
                />
                <View style={styles.details}>
                    <Text style={styles.title} numberOfLines={1}>{position.marketTitle}</Text>
                    <View style={styles.subDetail}>
                        <Text style={styles.amountText}>{position.amount >= 1000 ? (position.amount / 1000).toFixed(1) + 'k' : position.amount} </Text>
                        <View style={[styles.sideBadge, position.side === "YES" ? styles.yesBg : styles.noBg]}>
                            <Text style={styles.sideText}>{position.side === "YES" ? "Yes" : "No"}</Text>
                        </View>
                        <Text style={styles.costText}> Shares at {Math.round(position.currentPrice * 100)}¢</Text>
                    </View>
                </View>
            </View>

            <View style={styles.rightContent}>
                <Text style={styles.valueText}>${position.currentValue >= 1000 ? (position.currentValue / 1000).toFixed(1) + 'K' : position.currentValue.toFixed(2)}</Text>
                <Text style={[styles.pnlText, isPositive ? styles.pnlPositive : styles.pnlNegative]}>
                    {isPositive ? "+" : ""}${position.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "space-between",
    },
    leftContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    image: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#111",
    },
    details: {
        marginLeft: 12,
        flex: 1,
    },
    title: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 4,
    },
    subDetail: {
        flexDirection: "row",
        alignItems: "center",
    },
    amountText: {
        color: "#888",
        fontSize: 14,
        fontWeight: "500",
    },
    sideBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginHorizontal: 4,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 38,
    },
    yesBg: {
        backgroundColor: "#22c55e",
    },
    noBg: {
        backgroundColor: "#ef4444",
    },
    sideText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "800",
    },
    costText: {
        color: "#888",
        fontSize: 14,
        fontWeight: "500",
    },
    rightContent: {
        alignItems: "flex-end",
        marginLeft: 10,
    },
    valueText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 2,
    },
    pnlText: {
        fontSize: 14,
        fontWeight: "600",
    },
    pnlPositive: {
        color: "#22c55e",
    },
    pnlNegative: {
        color: "#ef4444",
    },
});

