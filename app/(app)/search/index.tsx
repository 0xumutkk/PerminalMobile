import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Search</Text>
            <Text style={styles.subtitle}>Find markets and topics</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        padding: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    subtitle: { color: "#666", fontSize: 16, marginTop: 8 },
});
