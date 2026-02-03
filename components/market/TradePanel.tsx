import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Keyboard } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTrade, TradeSide } from "../../hooks/useTrade";
import { useFundSolanaWallet } from "@privy-io/expo/ui";
import { Market } from "../../lib/mock-data";

interface TradePanelProps {
    market: Market;
    onSuccess?: (signature: string) => void;
    initialSide?: TradeSide;
}

export function TradePanel({ market, onSuccess, initialSide = "YES" }: TradePanelProps) {
    const { buy, getQuote, isLoading, isQuoting, isSigning, isConfirming, error, quote, reset, usdcBalance, walletAddress } = useTrade();
    const { fundWallet } = useFundSolanaWallet();
    const [side, setSide] = useState<TradeSide>(initialSide);
    const [amount, setAmount] = useState<string>("");
    const [slippageBps, setSlippageBps] = useState<number | null>(null); // null = Auto (Default 1%)

    // Sync side if initialSide changes
    useEffect(() => {
        setSide(initialSide);
    }, [initialSide]);

    // Reset state when market changes
    useEffect(() => {
        reset();
    }, [market.id, reset]);

    // Helper for quick amounts
    const setQuickAmount = (val: number) => {
        setAmount(val.toString());
    };

    // Auto-quote when amount or side changes (debounced)
    useEffect(() => {
        const numAmount = parseFloat(amount);
        if (numAmount < 1) return;

        const outputMint = side === "YES" ? market.yesMint : market.noMint;
        if (!outputMint) return;

        // Debounce quote requests to prevent rapid API calls
        const timeoutId = setTimeout(() => {
            getQuote({ outputMint, amountUsdc: numAmount, side, slippageBps: slippageBps || 100 });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [amount, side, market.yesMint, market.noMint, slippageBps]);


    const handleTrade = async () => {
        console.log("[TradePanel] handleTrade called!");
        console.log("[TradePanel] amount:", amount, "side:", side);
        console.log("[TradePanel] isLoading:", isLoading, "isButtonDisabled:", isButtonDisabled);

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 1) {
            console.log("[TradePanel] Invalid amount, returning early");
            return;
        }

        Keyboard.dismiss();

        const outputMint = side === "YES" ? market.yesMint : market.noMint;
        console.log("[TradePanel] outputMint:", outputMint);
        if (!outputMint) {
            console.log("[TradePanel] No outputMint, returning early");
            return;
        }

        console.log("[TradePanel] Calling buy()...");
        const expectedPrice = side === "YES" ? market.yesPrice : (1 - market.yesPrice);

        const signature = await buy({
            marketId: market.id,
            outputMint,
            amountUsdc: numAmount,
            side,
            slippageBps: slippageBps || 100,
            expectedPrice,
        });

        console.log("[TradePanel] buy() returned:", signature);
        if (signature && onSuccess) {
            onSuccess(signature);
        }
    };

    const handleFundWallet = async () => {
        if (!walletAddress) return;
        try {
            await fundWallet({ address: walletAddress });
        } catch (e) {
            console.error("[TradePanel] Funding error:", e);
        }
    };

    const isButtonDisabled = isLoading || !amount || parseFloat(amount) < 1;
    const isInsufficientBalance = usdcBalance !== null && amount && parseFloat(amount) > usdcBalance;

    return (
        <View style={styles.container}>
            {/* Side Selection */}
            <View style={styles.sideContainer}>
                <TouchableOpacity
                    style={[styles.sideButton, side === "YES" && styles.yesActive]}
                    onPress={() => setSide("YES")}
                >
                    <Text style={[styles.sideLabel, side === "YES" && styles.whiteText]}>YES</Text>
                    <Text style={[styles.priceLabel, side === "YES" && styles.whiteText]}>
                        {(market.yesPrice * 100).toFixed(0)}¢
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.sideButton, side === "NO" && styles.noActive]}
                    onPress={() => setSide("NO")}
                >
                    <Text style={[styles.sideLabel, side === "NO" && styles.whiteText]}>NO</Text>
                    <Text style={[styles.priceLabel, side === "NO" && styles.whiteText]}>
                        {((1 - market.yesPrice) * 100).toFixed(0)}¢
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Slippage Settings */}
            <View style={styles.slippageRow}>
                <Text style={styles.slippageLabel}>Slippage</Text>
                <View style={styles.slippageOptions}>
                    <TouchableOpacity
                        style={[styles.slippageButton, slippageBps === null && styles.slippageButtonActive]}
                        onPress={() => setSlippageBps(null)}
                    >
                        <Text style={[styles.slippageText, slippageBps === null && styles.whiteText]}>Auto</Text>
                    </TouchableOpacity>
                    {[50, 100, 500].map((bps) => (
                        <TouchableOpacity
                            key={bps}
                            style={[styles.slippageButton, slippageBps === bps && styles.slippageButtonActive]}
                            onPress={() => setSlippageBps(bps)}
                        >
                            <Text style={[styles.slippageText, slippageBps === bps && styles.whiteText]}>
                                {bps / 100}%
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputSection}>
                <View style={styles.inputWrapper}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="#666"
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                    />
                    <Text style={styles.currencySuffix}>USDC</Text>
                </View>
                {usdcBalance !== null && (
                    <Text style={styles.balanceText}>Balance: {usdcBalance.toFixed(2)} USDC</Text>
                )}
            </View>

            {/* Quote Info */}
            <View style={styles.infoSection}>
                {isQuoting ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : quote ? (
                    <View style={styles.quoteInfo}>
                        {(() => {
                            const outAmountUI = parseFloat(quote.outAmount) / 1000000;
                            const amountNum = parseFloat(amount) || 0;
                            const marketPrice = side === "YES" ? market.yesPrice : (1 - market.yesPrice);
                            const executionPrice = amountNum / outAmountUI;
                            const priceGapPct = ((executionPrice - marketPrice) / marketPrice) * 100;
                            const theoreticalShares = amountNum / marketPrice;

                            return (
                                <>
                                    <View style={styles.quoteRow}>
                                        <Text style={styles.quoteLabel}>Market Price</Text>
                                        <Text style={styles.quoteValue}>{(marketPrice * 100).toFixed(2)}¢</Text>
                                    </View>
                                    <View style={styles.quoteRow}>
                                        <Text style={styles.quoteLabel}>Execution Price</Text>
                                        <Text style={[styles.quoteValue, priceGapPct > 5 ? styles.warningText : {}]}>
                                            {(executionPrice * 100).toFixed(2)}¢
                                        </Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <View style={styles.quoteRow}>
                                        <Text style={styles.quoteLabel}>Theoretical Shares</Text>
                                        <Text style={[styles.quoteValue, { color: '#666' }]}>
                                            {theoreticalShares.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                        </Text>
                                    </View>
                                    <View style={styles.quoteRow}>
                                        <Text style={styles.quoteLabel}>Actual Shares (Quote)</Text>
                                        <Text style={[styles.quoteValue, priceGapPct > 10 ? styles.errorText : {}]}>
                                            {outAmountUI.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                        </Text>
                                    </View>
                                    <View style={styles.quoteRow}>
                                        <Text style={styles.quoteLabel}>Price Impact</Text>
                                        <Text style={[
                                            styles.quoteValue,
                                            priceGapPct > 5 ? styles.warningText : priceGapPct > 15 ? styles.errorText : {}
                                        ]}>
                                            {priceGapPct > 0.01 ? `${priceGapPct.toFixed(2)}%` : "0%"}
                                        </Text>
                                    </View>
                                    {priceGapPct > 15 && (
                                        <View style={styles.dangerAlert}>
                                            <MaterialIcons name="warning" size={14} color="#ef4444" />
                                            <Text style={styles.dangerAlertText}>Extremely low liquidity!</Text>
                                        </View>
                                    )}
                                </>
                            );
                        })()}
                    </View>
                ) : (
                    <Text style={styles.placeholderInfo}>Enter an amount to see quote</Text>
                )}
            </View>

            {/* Error Message */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Action Button */}
            <TouchableOpacity
                style={[
                    styles.buyButton,
                    isButtonDisabled && styles.buyButtonDisabled,
                    side === "YES" ? styles.yesBg : styles.noBg
                ]}
                onPress={handleTrade}
                disabled={isButtonDisabled}
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.loadingText}>
                            {isQuoting ? "Quoting..." : isSigning ? "Sign in Wallet..." : "Confirming..."}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.buyButtonText}>
                        Buy {side} for ${amount || "0"}
                    </Text>
                )}
            </TouchableOpacity>

            {/* Insufficient Balance Prompt */}
            {isInsufficientBalance && !isLoading && (
                <TouchableOpacity style={styles.fundPrompt} onPress={handleFundWallet}>
                    <Text style={styles.fundPromptText}>
                        Insufficient balance. <Text style={styles.fundLink}>Add funds</Text>
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#111",
        borderRadius: 20,
        padding: 16,
        marginTop: 16,
    },
    sideContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    sideButton: {
        flex: 1,
        backgroundColor: "#222",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#333",
    },
    yesActive: {
        backgroundColor: "#10b981", // Emerald 500
        borderColor: "#10b981",
    },
    noActive: {
        backgroundColor: "#ef4444", // Red 500
        borderColor: "#ef4444",
    },
    sideLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#999",
        marginBottom: 4,
    },
    priceLabel: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    whiteText: {
        color: "#fff",
    },
    quickAmountRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    quickAmountButton: {
        flex: 1,
        backgroundColor: "#1a1a1a",
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#333",
    },
    quickAmountText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    inputSection: {
        marginBottom: 16,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#222",
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: "#333",
    },
    currencyPrefix: {
        fontSize: 20,
        color: "#fff",
        marginRight: 4,
    },
    input: {
        flex: 1,
        fontSize: 20,
        color: "#fff",
        fontWeight: "bold",
    },
    currencySuffix: {
        fontSize: 14,
        color: "#666",
        fontWeight: "bold",
    },
    balanceText: {
        color: "#999",
        fontSize: 12,
        marginTop: 6,
        textAlign: "right",
    },
    slippageRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    slippageLabel: {
        color: "#999",
        fontSize: 14,
        fontWeight: "600",
    },
    slippageOptions: {
        flexDirection: "row",
        gap: 8,
    },
    slippageButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: "#1a1a1a",
        borderWidth: 1,
        borderColor: "#333",
    },
    slippageButtonActive: {
        backgroundColor: "#444",
        borderColor: "#666",
    },
    slippageText: {
        color: "#999",
        fontSize: 12,
        fontWeight: "bold",
    },
    infoSection: {
        backgroundColor: "#111",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    quoteInfo: {
        gap: 6,
    },
    quoteRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    divider: {
        height: 1,
        backgroundColor: "#222",
        marginVertical: 4,
    },
    dangerAlert: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
        gap: 6,
    },
    dangerAlertText: {
        color: "#ef4444",
        fontSize: 12,
        fontWeight: "bold",
    },
    quoteLabel: {
        color: "#999",
        fontSize: 14,
    },
    quoteValue: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    placeholderInfo: {
        color: "#666",
        fontSize: 14,
        textAlign: "center",
    },
    warningText: {
        color: "#f59e0b", // Amber 500
    },
    errorText: {
        color: "#ef4444",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 16,
    },
    buyButton: {
        height: 56,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    buyButtonDisabled: {
        opacity: 0.5,
    },
    yesBg: {
        backgroundColor: "#10b981",
    },
    noBg: {
        backgroundColor: "#ef4444",
    },
    buyButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    loadingText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    fundPrompt: {
        marginTop: 12,
        alignItems: "center",
        paddingVertical: 8,
    },
    fundPromptText: {
        color: "#999",
        fontSize: 14,
    },
    fundLink: {
        color: "#a855f7",
        fontWeight: "bold",
        textDecorationLine: "underline",
    },
});
