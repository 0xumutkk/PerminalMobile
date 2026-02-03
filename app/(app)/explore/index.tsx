import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feed } from "../../../components/social/Feed";
import { Image } from "expo-image";
import { Gift, Star } from "lucide-react-native";

// Simple Segmented Control
function SegmentControl({ selected, onChange }: { selected: 'foryou' | 'people', onChange: (val: 'foryou' | 'people') => void }) {
    return (
        <View style={styles.segmentContainer}>
            <TouchableOpacity
                style={[styles.segmentButton, selected === 'foryou' && styles.segmentActive]}
                onPress={() => onChange('foryou')}
            >
                <Text style={[styles.segmentText, selected === 'foryou' && styles.segmentTextActive]}>For You</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.segmentButton, selected === 'people' && styles.segmentActive]}
                onPress={() => onChange('people')}
            >
                <Text style={[styles.segmentText, selected === 'people' && styles.segmentTextActive]}>People</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function ExploreScreen() {
    const [tab, setTab] = useState<'foryou' | 'people'>('foryou');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../../assets/app-logo.png")}
                        style={styles.logoImage}
                        contentFit="contain"
                    />
                </View>
                <Text style={styles.title}>Explore</Text>
                <TouchableOpacity style={styles.giftIconButton} hitSlop={12}>
                    <Gift color="#fff" size={20} strokeWidth={2.5} />
                </TouchableOpacity>
            </View>
            <SegmentControl selected={tab} onChange={setTab} />

            <View style={styles.content}>
                {tab === 'foryou' ? (
                    <Feed />
                ) : (
                    <View style={styles.comingSoon}>
                        <Text style={styles.comingSoonText}>People discovery coming soon</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    logoContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    logoImage: {
        width: "100%",
        height: "100%",
    },
    giftIconButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    segmentContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
    },
    segmentButton: {
        marginRight: 24,
        paddingVertical: 12,
    },
    segmentActive: {
        borderBottomWidth: 3,
        borderBottomColor: "#fff",
    },
    segmentText: {
        color: "#6b7280",
        fontSize: 18,
        fontWeight: "800",
    },
    segmentTextActive: {
        color: "#fff",
    },
    content: {
        flex: 1,
    },
    comingSoon: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    comingSoonText: {
        color: "#64748b",
    },
});
