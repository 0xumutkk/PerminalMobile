import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { usePrivy } from "@privy-io/expo";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useTrade } from "../../../hooks/useTrade";
import { useProfile } from "../../../hooks/useProfile";
import PortfolioTab from "../../../components/profile/PortfolioTab";
import { Feed } from "../../../components/social/Feed";

export default function ProfileScreen() {
    const router = useRouter();
    const { logout } = usePrivy();
    const { profile, isLoading: profileLoading } = useProfile();
    const { usdcBalance, fetchBalance } = useTrade();
    const [activeTab, setActiveTab] = useState<"Portfolio" | "Posts">("Portfolio");

    const formatCount = (count: number | null | undefined) => {
        if (!count) return "0";
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

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

            {/* Profile Header - Fixed at top */}
            <View style={styles.headerSection}>
                <View style={styles.avatarRow}>
                    <Image
                        source={profile?.avatar_url ? { uri: profile.avatar_url } : require("../../../assets/icon.png")}
                        style={styles.avatar}
                    />
                    <View style={styles.mainStats}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{formatCount(profile?.followers_count)}</Text>
                            <Text style={styles.statLabel}>Followers</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{formatCount(profile?.following_count)}</Text>
                            <Text style={styles.statLabel}>Following</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{formatCount(profile?.trades_count)}</Text>
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

            {/* Tab Content - takes remaining space */}
            {activeTab === "Portfolio" ? (
                <PortfolioTab usdcBalance={usdcBalance} onRefresh={fetchBalance} />
            ) : (
                <Feed userId={profile?.id} />
            )}
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

