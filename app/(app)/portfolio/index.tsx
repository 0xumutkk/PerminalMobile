import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { usePrivy, useEmbeddedSolanaWallet, isConnected } from "@privy-io/expo";
import { supabase } from "../../../lib/supabase";
import type { Profile } from "../../../lib/supabase-types";
import { LayoutGrid, User, BarChart3, Trophy } from "lucide-react-native";

function formatPnl(value: number): string {
    const abs = Math.abs(value);
    const sign = value >= 0 ? "+" : "-";
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
    return `${sign}$${abs.toFixed(2)}`;
}

function RankBadge({ rank }: { rank: number }) {
    const isTopThree = rank <= 3;
    const colors = ["#D4AF37", "#C0C0C0", "#CD7F32"] as const;
    const bg = isTopThree ? colors[rank - 1] : "#222";
    return (
        <View style={[styles.rankBadge, { backgroundColor: bg }]}>
            <Text style={[styles.rankText, isTopThree && styles.rankTextDark]}>{rank}</Text>
        </View>
    );
}

function LeaderboardRow({
    profile,
    rank,
    onPress,
}: {
    profile: Profile;
    rank: number;
    onPress?: () => void;
}) {
    const pnl = profile.pnl ?? 0;
    const winRate = profile.win_rate ?? 0;
    const isPositive = pnl >= 0;

    return (
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
            <RankBadge rank={rank} />
            <View style={styles.avatarWrap}>
                {profile.avatar_url ? (
                    <Image
                        source={{ uri: profile.avatar_url }}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <User color="#6b7280" size={20} strokeWidth={2} />
                    </View>
                )}
            </View>
            <View style={styles.nameCol}>
                <Text style={styles.displayName} numberOfLines={1}>
                    {profile.display_name || profile.username}
                </Text>
                <Text style={styles.handle}>@{profile.username}</Text>
            </View>
            <Text style={[styles.pnl, isPositive ? styles.pnlPositive : styles.pnlNegative]}>
                {formatPnl(pnl)}
            </Text>
            <View style={styles.winRateWrap}>
                <Trophy color="#9ca3af" size={14} strokeWidth={2} />
                <Text style={styles.winRateText}>{Math.round(winRate)}</Text>
            </View>
        </Pressable>
    );
}

export default function LeaderboardScreen() {
    const router = useRouter();
    const { user } = usePrivy();
    const solanaWallet = useEmbeddedSolanaWallet();
    const primaryAddress =
        isConnected(solanaWallet) && solanaWallet.wallets?.[0]
            ? solanaWallet.wallets[0].address
            : null;

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<"Friends" | "All">("All");
    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [followRefreshKey, setFollowRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        supabase
            .from("profiles")
            .select("id, wallet_address, username, display_name, avatar_url, pnl, win_rate")
            .order("pnl", { ascending: false })
            .then(({ data, error: err }) => {
                if (cancelled) return;
                if (err) {
                    setError(err.message);
                    setProfiles([]);
                    return;
                }
                setProfiles((data as Profile[]) ?? []);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const myProfile = useMemo(
        () =>
            primaryAddress
                ? profiles.find((p) => p.wallet_address === primaryAddress)
                : null,
        [profiles, primaryAddress]
    );
    const myRank = myProfile
        ? profiles.findIndex((p) => p.id === myProfile.id) + 1
        : null;
    const myPnl = myProfile?.pnl ?? null;

    // Takip ettiklerim: aynı cüzdana ait tüm profil id'leri için (wallet-id ve did:privy id) follows çek
    const myProfileIds = useMemo(() => {
        const ids = new Set<string>();
        if (user?.id) ids.add(user.id);
        if (primaryAddress && profiles.length)
            profiles.filter((p) => p.wallet_address === primaryAddress).forEach((p) => ids.add(p.id));
        return Array.from(ids);
    }, [user?.id, primaryAddress, profiles]);

    useEffect(() => {
        if (myProfileIds.length === 0) {
            setFollowingIds([]);
            return;
        }
        let cancelled = false;
        supabase
            .from("follows")
            .select("following_id")
            .in("follower_id", myProfileIds)
            .then(({ data }) => {
                if (cancelled) return;
                const ids = [...new Set((data ?? []).map((r) => r.following_id))];
                setFollowingIds(ids);
            });
        return () => { cancelled = true; };
    }, [myProfileIds.join(","), followRefreshKey]);

    useFocusEffect(
        useCallback(() => {
            setFollowRefreshKey((k) => k + 1);
        }, [])
    );

    const listData = useMemo(
        () =>
            tab === "Friends"
                ? profiles.filter((p) => followingIds.includes(p.id))
                : profiles,
        [tab, profiles, followingIds]
    );

    const renderHeader = () => (
        <>
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <LayoutGrid color="#a855f7" size={24} strokeWidth={2} />
                </View>
                <Text style={styles.headerTitle}>Leaderboard</Text>
                <View style={styles.headerRight}>
                    <Pressable style={styles.headerIcon} hitSlop={12}>
                        <LayoutGrid color="#9ca3af" size={22} strokeWidth={2} />
                    </Pressable>
                    <Pressable style={styles.headerIcon} hitSlop={12} onPress={() => router.push("/profile")}>
                        <User color="#9ca3af" size={22} strokeWidth={2} />
                    </Pressable>
                </View>
            </View>

            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, tab === "Friends" && styles.tabActive]}
                    onPress={() => setTab("Friends")}
                >
                    <Text style={[styles.tabText, tab === "Friends" && styles.tabTextActive]}>
                        Friends
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, tab === "All" && styles.tabActive]}
                    onPress={() => setTab("All")}
                >
                    <Text style={[styles.tabText, tab === "All" && styles.tabTextActive]}>All</Text>
                </Pressable>
            </View>

            <View style={styles.yourRankCard}>
                <BarChart3 color="#9ca3af" size={20} strokeWidth={2} />
                <View style={styles.yourRankContent}>
                    <Text style={styles.yourRankLabel}>Your rank</Text>
                    <View style={styles.yourRankRow}>
                        <Text style={styles.yourRankNumber}>
                            {myRank != null ? `#${myRank.toLocaleString()}` : "—"}
                        </Text>
                        {myPnl != null && (
                            <Text
                                style={[
                                    styles.yourRankPnl,
                                    myPnl >= 0 ? styles.pnlPositive : styles.pnlNegative,
                                ]}
                            >
                                {formatPnl(myPnl)}
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>Rank</Text>
                <Text style={[styles.listHeaderText, styles.listHeaderRight]}>PnL</Text>
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#a855f7" />
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => (
                        <LeaderboardRow
                            profile={item}
                            rank={index + 1}
                            onPress={() => router.push(`/profile/${item.id}`)}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>
                                {tab === "Friends"
                                    ? !myProfile
                                        ? "Sign in to see friends."
                                        : "No friends yet. Follow users to see them here."
                                    : "No profiles yet."}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: "#ef4444",
        fontSize: 15,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#1a1a1a",
    },
    logoContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    headerRight: {
        flexDirection: "row",
        gap: 8,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
    tabs: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 24,
    },
    tab: {
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    tabActive: {
        borderBottomColor: "#a855f7",
    },
    tabText: {
        color: "#6b7280",
        fontSize: 16,
        fontWeight: "600",
    },
    tabTextActive: {
        color: "#fff",
    },
    yourRankCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginHorizontal: 16,
        marginTop: 20,
        padding: 16,
        backgroundColor: "#111",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    yourRankContent: {
        flex: 1,
    },
    yourRankLabel: {
        color: "#6b7280",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 4,
    },
    yourRankRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    yourRankNumber: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    yourRankPnl: {
        fontSize: 18,
        fontWeight: "bold",
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 8,
    },
    listHeaderText: {
        color: "#6b7280",
        fontSize: 12,
        fontWeight: "600",
    },
    listHeaderRight: {
        marginRight: 60,
    },
    listContent: {
        paddingBottom: 24,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#111",
    },
    rowPressed: {
        backgroundColor: "#111",
    },
    rankBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    rankText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    rankTextDark: {
        color: "#1a1a1a",
    },
    avatarWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: "hidden",
    },
    avatar: {
        width: 40,
        height: 40,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#222",
        alignItems: "center",
        justifyContent: "center",
    },
    nameCol: {
        flex: 1,
        minWidth: 0,
    },
    displayName: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
    handle: {
        color: "#6b7280",
        fontSize: 13,
        marginTop: 2,
    },
    pnl: {
        fontSize: 15,
        fontWeight: "bold",
        minWidth: 72,
        textAlign: "right",
    },
    pnlPositive: {
        color: "#10b981",
    },
    pnlNegative: {
        color: "#ef4444",
    },
    winRateWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    winRateText: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "600",
    },
    empty: {
        paddingVertical: 40,
        alignItems: "center",
    },
    emptyText: {
        color: "#6b7280",
        fontSize: 15,
    },
});
