import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { type Market } from "../lib/mock-data";
import { useRouter } from "expo-router";
import { FileText } from "lucide-react-native";

export interface MarketCardNativeProps {
    market: Market;
    onBuyYes?: (market: Market) => void;
    onBuyNo?: (market: Market) => void;
}

export function MarketCardNative({ market, onBuyYes, onBuyNo }: MarketCardNativeProps) {
    const router = useRouter();
    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = 100 - yesPercent;

    const handleBuyYes = (e: any) => {
        if (onBuyYes) {
            e.stopPropagation();
            onBuyYes(market);
        }
    };

    const handleBuyNo = (e: any) => {
        if (onBuyNo) {
            e.stopPropagation();
            onBuyNo(market);
        }
    };

    // Format volume
    const formattedVolume =
        market.volume >= 1_000_000
            ? `$${(market.volume / 1_000_000).toFixed(1)}M`
            : market.volume >= 1_000
                ? `$${(market.volume / 1_000).toFixed(0)}K`
                : `$${market.volume}`;

    // Format date
    const formattedResolveDate = market.resolveDate
        ? new Date(market.resolveDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })
        : "TBD";

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed
            ]}
            onPress={() => router.push(`/market/${market.id}`)}
        >
            {/* Header: Image + Title + RulesIcon */}
            <View style={styles.topSection}>
                <View style={styles.marketImageContainer}>
                    {market.imageUrl ? (
                        <Image
                            source={market.imageUrl}
                            contentFit="cover"
                            style={styles.marketImage as any}
                            transition={200}
                        />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text style={styles.placeholderText}>
                                {market.category.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.titleWrapper}>
                    <Text style={styles.marketTitle} numberOfLines={2}>
                        {market.title}
                    </Text>
                </View>

                {/* Percentage Gauge */}
                <View style={styles.gaugeContainer}>
                    <View style={styles.gaugeBackground}>
                        <View style={[styles.gaugeFill, { transform: [{ rotate: '45deg' }] }]} />
                    </View>
                    <Text style={styles.gaugeText}>{yesPercent}%</Text>
                </View>

                <View style={styles.rulesIcon}>
                    <FileText color="#999" size={18} />
                </View>
            </View>

            {/* Binary Trade Row */}
            <View style={styles.tradeRow}>
                <Pressable
                    style={({ pressed }) => [styles.binaryButton, styles.yesBinary, pressed && { opacity: 0.8 }]}
                    onPress={handleBuyYes}
                >
                    <Text style={styles.yesBinaryText}>Yes</Text>
                </Pressable>
                <Pressable
                    style={({ pressed }) => [styles.binaryButton, styles.noBinary, pressed && { opacity: 0.8 }]}
                    onPress={handleBuyNo}
                >
                    <Text style={styles.noBinaryText}>No</Text>
                </Pressable>
            </View>

            {/* Footer: Volume + Avatar Stack */}
            <View style={styles.footerRow}>
                <Text style={styles.volumeText}>{formattedVolume} Volume</Text>
                <View style={styles.avatarStack}>
                    <View style={[styles.avatar, { backgroundColor: '#3b82f6', zIndex: 3 }]} />
                    <View style={[styles.avatar, { backgroundColor: '#10b981', zIndex: 2, marginLeft: -8 }]} />
                    <View style={[styles.avatar, { backgroundColor: '#f59e0b', zIndex: 1, marginLeft: -8 }]} />
                    <Text style={styles.avatarCount}>+14</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#1a1a1a",
    },
    cardPressed: {
        opacity: 0.7,
    },
    topSection: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    marketImageContainer: {
        width: 44,
        height: 44,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
    },
    marketImage: {
        width: "100%",
        height: "100%",
    },
    placeholderImage: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a1a1a",
    },
    placeholderText: {
        color: "#444",
        fontSize: 18,
        fontWeight: "bold",
    },
    titleWrapper: {
        flex: 1,
        marginHorizontal: 12,
    },
    marketTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        lineHeight: 22,
    },
    rulesIcon: {
        padding: 4,
    },
    tradeRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    binaryButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    yesBinary: {
        backgroundColor: "rgba(34, 197, 94, 0.25)", // Solidified Green
    },
    noBinary: {
        backgroundColor: "rgba(239, 68, 68, 0.25)", // Solidified Red
    },
    yesBinaryText: {
        color: "#22c55e",
        fontSize: 18,
        fontWeight: "700",
    },
    noBinaryText: {
        color: "#ef4444",
        fontSize: 18,
        fontWeight: "700",
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
    },
    volumeText: {
        color: "#666",
        fontSize: 14,
        fontWeight: "600",
    },
    avatarStack: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#111",
    },
    avatarCount: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
        marginLeft: 6,
    },
    gaugeContainer: {
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    gaugeBackground: {
        position: "absolute",
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 4,
        borderColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
    },
    gaugeFill: {
        position: "absolute",
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 4,
        borderColor: "#22c55e",
        borderTopColor: "transparent",
        borderRightColor: "transparent",
    },
    gaugeText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "800",
    },
});
