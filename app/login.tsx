import React from "react";
import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { usePrivy, useLoginWithOAuth, hasError } from "@privy-io/expo";
import { StatusBar } from "expo-status-bar";
import { Redirect } from "expo-router";

function UnauthenticatedView() {
    const { login, state: loginState } = useLoginWithOAuth({
        onError: (error) => {
            console.error("OAuth login error:", error);
        },
    });

    const handleLogin = async () => {
        try {
            await login({ provider: "google" });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error("Login error:", message);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>PERMINAL</Text>
                <Text style={styles.subtitle}>Mobile Terminal for Solana</Text>
            </View>

            <TouchableOpacity
                onPress={handleLogin}
                style={styles.button}
                disabled={loginState.status === "loading"}
            >
                <Text style={styles.buttonText}>
                    {loginState.status === "loading" ? "Connecting..." : "Login with Google"}
                </Text>
            </TouchableOpacity>

            {hasError(loginState) && loginState.error && (
                <Text style={styles.errorText}>{loginState.error.message}</Text>
            )}

            <Text style={styles.terms}>
                By continuing, you agree to our Terms and Conditions.
            </Text>
        </ScrollView>
    );
}

export default function LoginScreen() {
    const { isReady, user, error: privyError, logout } = usePrivy();

    if (isReady && user) {
        return <Redirect href="/(app)" />;
    }

    if (privyError) {
        return (
            <View style={[styles.container, { padding: 40 }]}>
                <StatusBar style="light" />
                <Text style={{ color: "#ff4444", fontSize: 24, fontWeight: "bold", textAlign: "center" }}>SDK Error</Text>
                <Text style={{ color: "#ccc", marginTop: 10, textAlign: "center" }}>{privyError.message}</Text>
                <TouchableOpacity onPress={() => logout()} style={[styles.button, { marginTop: 30, backgroundColor: "#441111" }]}>
                    <Text style={{ color: "#fff" }}>Reset Session</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!isReady) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <Text style={styles.subtitle}>Initializing...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            <StatusBar style="light" />
            <UnauthenticatedView />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    header: {
        alignItems: "center",
        marginBottom: 48,
    },
    title: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "bold",
        textAlign: "center",
    },
    subtitle: {
        color: "#9ca3af",
        fontSize: 16,
        marginTop: 8,
        textAlign: "center",
    },
    button: {
        backgroundColor: "#fff",
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 9999,
        width: "100%",
        alignItems: "center",
    },
    buttonText: {
        color: "#000",
        fontSize: 18,
        fontWeight: "600",
    },
    terms: {
        color: "#6b7280",
        fontSize: 12,
        marginTop: 32,
        textAlign: "center",
    },
    errorText: {
        color: "#ef4444",
        fontSize: 14,
        marginTop: 16,
        textAlign: "center",
        paddingHorizontal: 16,
    },
});
