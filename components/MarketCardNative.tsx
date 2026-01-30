import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { type Market } from "../lib/mock-data";
import { useRouter } from "expo-router";

export interface MarketCardNativeProps {
    market: Market;
}

export function MarketCardNative({ market }: MarketCardNativeProps) {
    const router = useRouter();
    const yesPercent = Math.round(market.yesPrice * 100);
    const noPercent = 100 - yesPercent;

    // Format volume
    const formattedVolume =
        market.volume >= 1_000_000
            ? `$${(market.volume / 1_000_000).toFixed(1)}M Vol`
            : market.volume >= 1_000
                ? `$${(market.volume / 1_000).toFixed(0)}K Vol`
                : `$${market.volume} Vol`;

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
            <View style={styles.header}>
                <View style={styles.imageContainer}>
                    {market.imageUrl ? (
                        <Image
                            source={market.imageUrl}
                            contentFit="cover"
                            style={styles.image as any}
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

                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={2}>
                        {market.title}
                    </Text>

                    <View style={styles.metaRow}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{market.category}</Text>
                        </View>
                        <Text style={styles.metaText}>{formattedVolume}</Text>
                        <Text style={styles.metaText}>•</Text>
                        <Text style={styles.metaText}>{formattedResolveDate}</Text>
                    </View>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressYes, { width: `${yesPercent}%` }]} />
                    <View style={[styles.progressNo, { width: `${noPercent}%` }]} />
                </View>
            </View>

            {/* Labels */}
            <View style={styles.labelRow}>
                <Text style={styles.yesLabel}>
                    {yesPercent}% {market.yesLabel || "YES"}
                </Text>
                <Text style={styles.noLabel}>
                    {noPercent}% {market.noLabel || "NO"}
                </Text>
            </View>

            {/* Quick Trade Buttons */}
            <View style={styles.buttonRow}>
                <View style={[styles.tradeButton, styles.yesButton]}>
                    <Text style={styles.yesButtonText}>Buy Yes {yesPercent}¢</Text>
                </View>
                <View style={[styles.tradeButton, styles.noButton]}>
                    <Text style={styles.noButtonText}>Buy No {noPercent}¢</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#111",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    cardPressed: {
        opacity: 0.9,
        borderColor: "#333",
    },
    header: {
        flexDirection: "row",
        gap: 12,
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#222",
        borderWidth: 1,
        borderColor: "#333",
    },
    image: {
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
        fontSize: 20,
        fontWeight: "bold",
    },
    titleContainer: {
        flex: 1,
        justifyContent: "center",
        gap: 6,
    },
    title: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    badge: {
        backgroundColor: "#1a1a1a",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#333",
    },
    badgeText: {
        color: "#9ca3af",
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    metaText: {
        color: "#6b7280",
        fontSize: 11,
    },
    progressContainer: {
        marginTop: 16,
    },
    progressBarBackground: {
        height: 6,
        width: "100%",
        backgroundColor: "#1a1a1a",
        borderRadius: 3,
        flexDirection: "row",
        overflow: "hidden",
    },
    progressYes: {
        height: "100%",
        backgroundColor: "#10b981", // Emerald-500
    },
    progressNo: {
        height: "100%",
        backgroundColor: "#ef4444", // Rose-500
    },
    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    yesLabel: {
        color: "#10b981",
        fontSize: 12,
        fontWeight: "600",
    },
    noLabel: {
        color: "#ef4444",
        fontSize: 12,
        fontWeight: "600",
        textAlign: "right",
        flex: 1,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 16,
    },
    tradeButton: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    yesButton: {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "rgba(16, 185, 129, 0.3)",
    },
    noButton: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "rgba(239, 68, 68, 0.3)",
    },
    yesButtonText: {
        color: "#10b981",
        fontSize: 13,
        fontWeight: "600",
    },
    noButtonText: {
        color: "#ef4444",
        fontSize: 13,
        fontWeight: "600",
    },
});
