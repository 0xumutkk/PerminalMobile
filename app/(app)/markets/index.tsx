import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MarketsScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Markets</Text>
            <Text style={styles.subtitle}>Explore prediction markets</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000", padding: 20, justifyContent: "center", alignItems: "center" },
    title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    subtitle: { color: "#666", fontSize: 16, marginTop: 8 },
});
