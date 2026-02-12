import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { type Market } from "../lib/mock-data";
import { useRouter } from "expo-router";
import { ArrowUpCircle } from "lucide-react-native";

export interface MarketCardNativeProps {
    market: Market;
    onBuyYes?: (market: Market) => void;
    onBuyNo?: (market: Market) => void;
}

function formatVolume(value: number) {
    return `$${Math.max(0, Math.round(value)).toLocaleString("en-US")} Vol.`;
}

export function MarketCardNative({ market, onBuyYes, onBuyNo }: MarketCardNativeProps) {
    const router = useRouter();
    const yesPercent = Math.round(market.yesPrice * 100);
    const priceDelta = (market.yesPrice - 0.5) * 100;
    const deltaSign = priceDelta >= 0 ? "+" : "";
    const isRateOutcomesCard = /fed decision/i.test(market.title);

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

    if (isRateOutcomesCard) {
        const rates = [
            { label: "50+ bps", probability: "50%" },
            { label: "25+ bps", probability: "10%" },
            { label: "No Change", probability: "5%" },
        ];

        return (
            <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => router.push(`/market/${market.id}`)}
            >
                <View style={styles.rateHeader}>
                    <View style={styles.marketImageContainer}>
                        {market.imageUrl ? (
                            <Image
                                source={market.imageUrl}
                                contentFit="cover"
                                style={styles.marketImage as any}
                                transition={120}
                            />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Text style={styles.placeholderText}>
                                    {market.category.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.marketTitle} numberOfLines={2}>
                        {market.title}
                    </Text>
                </View>

                <View style={styles.rateRows}>
                    {rates.map((rate) => (
                        <View style={styles.rateRow} key={rate.label}>
                            <View style={styles.rateLeft}>
                                <Text style={styles.rateLabel}>{rate.label}</Text>
                                {rate.label !== "No Change" ? (
                                    <ArrowUpCircle color="rgba(0,0,0,0.25)" size={14} strokeWidth={2} />
                                ) : null}
                            </View>

                            <View style={styles.rateRight}>
                                <Text style={styles.rateProbability}>{rate.probability}</Text>
                                <Pressable
                                    style={({ pressed }) => [styles.rateYes, pressed && styles.buttonPressed]}
                                    onPress={handleBuyYes}
                                >
                                    <Text style={styles.rateYesText}>Yes</Text>
                                </Pressable>
                                <Pressable
                                    style={({ pressed }) => [styles.rateNo, pressed && styles.buttonPressed]}
                                    onPress={handleBuyNo}
                                >
                                    <Text style={styles.rateNoText}>No</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.footerRow}>
                    <Text style={styles.volumeText}>{formatVolume(market.volume)}</Text>

                    <View style={styles.crowdSection}>
                        <View style={styles.crowdStack}>
                            <View style={[styles.crowdDot, styles.crowdDotYes]} />
                            <View style={[styles.crowdDot, styles.crowdDotNo]} />
                        </View>
                        <Text style={styles.crowdCount}>+14</Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/market/${market.id}`)}
        >
            <View style={styles.topRow}>
                <View style={styles.titleSection}>
                    <View style={styles.marketImageContainer}>
                        {market.imageUrl ? (
                            <Image
                                source={market.imageUrl}
                                contentFit="cover"
                                style={styles.marketImage as any}
                                transition={120}
                            />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Text style={styles.placeholderText}>
                                    {market.category.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.marketTitle} numberOfLines={2}>
                        {market.title}
                    </Text>
                </View>

                <View style={styles.statSection}>
                    <Text style={[styles.deltaText, priceDelta < 0 && styles.deltaTextNegative]}>
                        {deltaSign}
                        {Math.abs(priceDelta).toFixed(1)}%
                    </Text>
                    <Text style={styles.percentText}>{yesPercent}%</Text>
                </View>
            </View>

            <View style={styles.tradeRow}>
                <Pressable
                    style={({ pressed }) => [styles.binaryButton, styles.yesButton, pressed && styles.buttonPressed]}
                    onPress={handleBuyYes}
                >
                    <Text style={styles.yesText}>{market.yesLabel ?? "Yes"}</Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [styles.binaryButton, styles.noButton, pressed && styles.buttonPressed]}
                    onPress={handleBuyNo}
                >
                    <Text style={styles.noText}>{market.noLabel ?? "No"}</Text>
                </Pressable>
            </View>

            <View style={styles.footerRow}>
                <Text style={styles.volumeText}>{formatVolume(market.volume)}</Text>

                <View style={styles.crowdSection}>
                    <View style={styles.crowdStack}>
                        <View style={[styles.crowdDot, styles.crowdDotYes]} />
                        <View style={[styles.crowdDot, styles.crowdDotNo]} />
                    </View>
                    <Text style={styles.crowdCount}>+14</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingTop: 10,
        paddingBottom: 8,
        paddingHorizontal: 10,
    },
    cardPressed: {
        opacity: 0.85,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    titleSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
        paddingRight: 8,
    },
    marketImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
    },
    marketImage: {
        width: "100%",
        height: "100%",
    },
    placeholderImage: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f2f2f2",
    },
    placeholderText: {
        color: "#8c8c8c",
        fontSize: 14,
        fontWeight: "700",
    },
    marketTitle: {
        flex: 1,
        color: "#000",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
    },
    statSection: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 6,
    },
    deltaText: {
        color: "#34c759",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
    },
    deltaTextNegative: {
        color: "#ff453a",
    },
    percentText: {
        color: "#000",
        fontSize: 24,
        lineHeight: 28,
        fontWeight: "600",
    },
    tradeRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 10,
    },
    binaryButton: {
        flex: 1,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonPressed: {
        opacity: 0.85,
    },
    yesButton: {
        backgroundColor: "rgba(180,151,90,0.15)",
    },
    noButton: {
        backgroundColor: "rgba(255,0,0,0.15)",
    },
    yesText: {
        color: "#b4975a",
        fontSize: 14,
        lineHeight: 16,
        fontWeight: "500",
    },
    noText: {
        color: "#ff0000",
        fontSize: 14,
        lineHeight: 16,
        fontWeight: "500",
    },
    footerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rateHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    rateRows: {
        gap: 10,
        marginBottom: 12,
    },
    rateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rateLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    rateLabel: {
        color: "rgba(0,0,0,0.4)",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
    },
    rateRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    rateProbability: {
        color: "#000",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
        minWidth: 30,
        textAlign: "right",
    },
    rateYes: {
        width: 48,
        height: 24,
        borderRadius: 8,
        backgroundColor: "rgba(52,199,89,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    rateNo: {
        width: 48,
        height: 24,
        borderRadius: 8,
        backgroundColor: "rgba(255,69,58,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    rateYesText: {
        color: "#34c759",
        fontSize: 14,
        lineHeight: 16,
        fontWeight: "600",
    },
    rateNoText: {
        color: "#ff453a",
        fontSize: 14,
        lineHeight: 16,
        fontWeight: "600",
    },
    volumeText: {
        color: "rgba(0,0,0,0.6)",
        fontSize: 12,
        lineHeight: 12,
        fontWeight: "500",
    },
    crowdSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    crowdStack: {
        flexDirection: "row",
        alignItems: "center",
    },
    crowdDot: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 0.4,
        borderColor: "#fff",
    },
    crowdDotYes: {
        backgroundColor: "#34c759",
        marginRight: -6,
    },
    crowdDotNo: {
        backgroundColor: "#ff0000",
    },
    crowdCount: {
        color: "#7d7d7d",
        fontSize: 12,
        lineHeight: 12,
        fontWeight: "500",
    },
});
