import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Keyboard } from "react-native";
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

    // Auto-quote when amount or side changes
    useEffect(() => {
        const numAmount = parseFloat(amount);
        if (numAmount >= 1) {
            const outputMint = side === "YES" ? market.yesMint : market.noMint;
            if (outputMint) {
                getQuote({ outputMint, amountUsdc: numAmount, side });
            }
        }
    }, [amount, side, market.yesMint, market.noMint, getQuote]);

    const handleTrade = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount < 1) return;

        Keyboard.dismiss();

        const outputMint = side === "YES" ? market.yesMint : market.noMint;
        if (!outputMint) return;

        const signature = await buy({
            marketId: market.id,
            outputMint,
            amountUsdc: numAmount,
            side,
        });

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

            {/* Quick Amounts */}
            <View style={styles.quickAmountRow}>
                {[10, 50, 100].map((val) => (
                    <TouchableOpacity
                        key={val}
                        style={styles.quickAmountButton}
                        onPress={() => setQuickAmount(val)}
                    >
                        <Text style={styles.quickAmountText}>${val}</Text>
                    </TouchableOpacity>
                ))}
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
                        <View style={styles.quoteRow}>
                            <Text style={styles.quoteLabel}>Est. Shares</Text>
                            <Text style={styles.quoteValue}>
                                {parseFloat(quote.outAmount).toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.quoteRow}>
                            <Text style={styles.quoteLabel}>Price Impact</Text>
                            <Text style={[styles.quoteValue, parseFloat(quote.priceImpactPct) > 2 ? styles.warningText : {}]}>
                                {quote.priceImpactPct}%
                            </Text>
                        </View>
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
    infoSection: {
        height: 60,
        justifyContent: "center",
        marginBottom: 16,
    },
    quoteInfo: {
        gap: 4,
    },
    quoteRow: {
        flexDirection: "row",
        justifyContent: "space-between",
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
