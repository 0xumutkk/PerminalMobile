import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { usePrivy, useEmbeddedSolanaWallet, isConnected } from "@privy-io/expo";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTrade } from "../../../hooks/useTrade";
import { useProfile } from "../../../hooks/useProfile";
import PortfolioTab from "../../../components/profile/PortfolioTab";

export default function ProfileScreen() {
    const router = useRouter();
    const { logout } = usePrivy();
    const { profile, isLoading: profileLoading } = useProfile();
    const { usdcBalance, fetchBalance } = useTrade();
    const [activeTab, setActiveTab] = useState<"Portfolio" | "Posts">("Portfolio");

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header / Navbar */}
            <View style={styles.navbar}>
                <TouchableOpacity style={styles.usernameRow}>
                    <Text style={styles.navbarUsername}>@{profile?.username || "user"}</Text>
                    <MaterialCommunityIcons name="twitter" size={16} color="#666" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                <View style={styles.navbarActions}>
                    <TouchableOpacity style={styles.navButton}>
                        <Ionicons name="time-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navButton} onPress={handleLogout}>
                        <Ionicons name="settings-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} stickyHeaderIndices={[2]}>
                {/* Profile Info */}
                <View style={styles.headerSection}>
                    <View style={styles.avatarRow}>
                        <Image
                            source={profile?.avatar_url ? { uri: profile.avatar_url } : require("../../../assets/icon.png")}
                            style={styles.avatar}
                        />
                        <View style={styles.mainStats}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>12.3K</Text>
                                <Text style={styles.statLabel}>Followers</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>33.3K</Text>
                                <Text style={styles.statLabel}>Following</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>1,3K</Text>
                                <Text style={styles.statLabel}>Trades</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.displayName}>{profile?.display_name || profile?.username || "User"}</Text>
                    <Text style={styles.bio}>{profile?.bio || "Do Everything Great or Die"}</Text>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "Portfolio" && styles.activeTab]}
                        onPress={() => setActiveTab("Portfolio")}
                    >
                        <Text style={[styles.tabText, activeTab === "Portfolio" && styles.activeTabText]}>Portfolio</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "Posts" && styles.activeTab]}
                        onPress={() => setActiveTab("Posts")}
                    >
                        <Text style={[styles.tabText, activeTab === "Posts" && styles.activeTabText]}>Posts</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === "Portfolio" ? (
                        <PortfolioTab usdcBalance={usdcBalance} onRefresh={fetchBalance} />
                    ) : (
                        <View style={styles.emptyContent}>
                            <Text style={styles.emptyText}>No posts yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    navbar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    usernameRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    navbarUsername: {
        color: "#666",
        fontSize: 16,
        fontWeight: "600",
    },
    navbarActions: {
        flexDirection: "row",
    },
    navButton: {
        marginLeft: 16,
    },
    scrollContent: {},
    headerSection: {
        paddingHorizontal: 16,
        marginTop: 10,
    },
    avatarRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: "#111",
    },
    mainStats: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-around",
        marginLeft: 10,
    },
    statBox: {
        alignItems: "center",
    },
    statValue: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    statLabel: {
        color: "#666",
        fontSize: 12,
        marginTop: 2,
    },
    displayName: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 4,
    },
    bio: {
        color: "#fff",
        fontSize: 16,
        marginTop: 12,
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#111",
        backgroundColor: "#000",
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomColor: "#fff",
    },
    tabText: {
        color: "#666",
        fontSize: 16,
        fontWeight: "600",
    },
    activeTabText: {
        color: "#fff",
    },
    tabContent: {
        flex: 1,
    },
    emptyContent: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        color: "#444",
        fontSize: 16,
    }
});

