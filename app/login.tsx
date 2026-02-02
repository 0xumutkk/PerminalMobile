import React, { useEffect } from "react";
import { Text, View, TouchableOpacity, StyleSheet, Image, Platform } from "react-native";
import { usePrivy, useLoginWithOAuth } from "@privy-io/expo";
import { StatusBar } from "expo-status-bar";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// Simple icons
const AppleIcon = () => (
    <View style={{ marginRight: 8 }}>
        <Text style={{ fontSize: 20 }}></Text>
    </View>
);

function LoginButtons({ disabled }: { disabled: boolean }) {
    const { login } = useLoginWithOAuth();

    const handleLogin = async (provider: "google" | "apple" | "twitter" | "discord" | "tiktok" | "linkedin" | "spotify" | "instagram") => {
        try {
            await login({ provider });
        } catch (err) {
            console.error(`Login with ${provider} failed:`, err);
        }
    };

    return (
        <View style={styles.buttonContainer}>
            {Platform.OS === 'ios' && (
                <TouchableOpacity
                    onPress={() => handleLogin("apple")}
                    style={[styles.button, styles.appleButton, disabled && styles.buttonDisabled]}
                    disabled={disabled}
                    activeOpacity={0.8}
                >
                    <AppleIcon />
                    <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                onPress={() => handleLogin("google")}
                style={[styles.button, styles.googleButton, disabled && styles.buttonDisabled]}
                disabled={disabled}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
                    style={{ width: 18, height: 18, marginRight: 8 }}
                    resizeMode="contain"
                />
                {/* Better: Custom view for G if image fails */}
                <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function LoginScreen() {
    const { isReady, user } = usePrivy();

    if (isReady && user) {
        return <Redirect href="/(app)" />;
    }

    const logoSource = require("../assets/logo.png");

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.content}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <Image
                        source={logoSource}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* Text Section */}
                <View style={styles.textSection}>
                    <Text style={styles.headline}>
                        Start trading everything with your friends.
                    </Text>
                </View>

                {/* Login Buttons */}
                <LoginButtons disabled={!isReady} />

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.termsText}>
                        By signing up, you agree to our Terms of Service and Privacy Policy.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000", // Dark background
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "space-between",
        paddingBottom: 20,
    },
    logoSection: {
        marginTop: 60, // Top spacing
        alignItems: "flex-start",
    },
    logo: {
        width: 80,
        height: 80,
    },
    textSection: {
        flex: 1,
        justifyContent: "center",
        marginBottom: 40,
    },
    headline: {
        fontSize: 34,
        fontWeight: "bold",
        color: "#fff", // White text
        lineHeight: 42,
        letterSpacing: -0.5,
    },
    buttonContainer: {
        gap: 12,
        marginBottom: 24,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 30, // Pill shape
        borderWidth: 1,
        width: "100%",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    appleButton: {
        backgroundColor: "#fff", // White button
        borderColor: "#fff",
    },
    appleButtonText: {
        color: "#000", // Black text
        fontSize: 17,
        fontWeight: "600",
        marginLeft: 8,
    },
    googleButton: {
        backgroundColor: "#1a1a1a", // Dark gray
        borderColor: "#333", // Subtle border
    },
    googleButtonText: {
        color: "#fff", // White text
        fontSize: 17,
        fontWeight: "600",
        marginLeft: 8,
    },
    googleIconContainer: {
        // Simple G icon placeholder if image fails loading or for layout
        position: 'absolute',
        left: 24,
        opacity: 0, // Hidden if using image, specifically managed via Image component above
    },
    googleIconText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold"
    },
    footer: {
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    termsText: {
        textAlign: "center",
        color: "#9ca3af", // Gray-400 (Lighter gray for dark mode)
        fontSize: 12,
        lineHeight: 18,
    },
});
