import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feed } from "../../../components/social/Feed";

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

export default function MarketsScreen() {
    const [tab, setTab] = useState<'foryou' | 'people'>('foryou');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Explore</Text>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    title: {
        color: "#fff",
        fontSize: 24,
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
        borderBottomWidth: 2,
        borderBottomColor: "#34d399", // emerald-400
    },
    segmentText: {
        color: "#64748b", // slate-500
        fontSize: 16,
        fontWeight: "600",
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
