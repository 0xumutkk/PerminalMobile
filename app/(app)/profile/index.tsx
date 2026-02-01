import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { usePrivy, useEmbeddedSolanaWallet, isConnected, isNotCreated, isCreating, hasError, isConnecting, isReconnecting, isDisconnected } from "@privy-io/expo";
import { supabase } from "../../../lib/supabase";
import type { Profile } from "../../../lib/supabase-types";

function shortenAddress(address: string, chars = 4) {
    if (!address || address.length < chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export default function ProfileScreen() {
    const router = useRouter();
    const { logout, user } = usePrivy();
    const solanaWallet = useEmbeddedSolanaWallet();
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);
    const [isLoadingWallet, setIsLoadingWallet] = useState(false);
    const loadAttempted = useRef(false);

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    const handleLoadWallet = async () => {
        if (!isDisconnected(solanaWallet) || !solanaWallet.getProvider) return;
        try {
            setIsLoadingWallet(true);
            await solanaWallet.getProvider();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert("Could not load wallet", msg);
        } finally {
            setIsLoadingWallet(false);
        }
    };

    const handleCreateWallet = async () => {
        if (!isNotCreated(solanaWallet)) return;
        try {
            setIsCreatingWallet(true);
            await solanaWallet.create();
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert("Wallet creation failed", msg);
        } finally {
            setIsCreatingWallet(false);
        }
    };

    // Auto-try to load wallet once when in disconnected state (e.g. after login, wallet exists but not loaded)
    const walletStatus = solanaWallet.status;
    useEffect(() => {
        if (walletStatus !== "disconnected" || typeof solanaWallet.getProvider !== "function" || loadAttempted.current) return;
        loadAttempted.current = true;
        setIsLoadingWallet(true);
        solanaWallet.getProvider()
            .then(() => setIsLoadingWallet(false))
            .catch(() => setIsLoadingWallet(false));
    }, [walletStatus]);

    const primaryAddress = isConnected(solanaWallet) && solanaWallet.wallets?.[0]
        ? solanaWallet.wallets[0].address
        : null;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [followCounts, setFollowCounts] = useState<{ followers: number; following: number } | null>(null);
    const [editing, setEditing] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editUsername, setEditUsername] = useState("");
    const [editBio, setEditBio] = useState("");
    const [saving, setSaving] = useState(false);

    /** Benzersiz takip edilen / takipçi sayısı (Leaderboard Friends ile aynı mantık). */
    const loadFollowCounts = useCallback(async (profileIds: string[]) => {
        const [followingRes, followersRes] = await Promise.all([
            supabase.from("follows").select("following_id").in("follower_id", profileIds),
            supabase.from("follows").select("follower_id").in("following_id", profileIds),
        ]);
        const following = followingRes.error
            ? 0
            : new Set((followingRes.data ?? []).map((r) => String(r.following_id))).size;
        const followers = followersRes.error
            ? 0
            : new Set((followersRes.data ?? []).map((r) => String(r.follower_id))).size;
        return { following, followers };
    }, []);

    useEffect(() => {
        if (!user?.id) {
            setProfile(null);
            setFollowCounts(null);
            setProfileLoading(false);
            return;
        }
        let cancelled = false;
        setProfileLoading(true);
        setProfileError(null);

        (async () => {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("id, wallet_address, username, display_name, avatar_url, bio, followers_count, following_count, trades_count, pnl, win_rate, created_at, updated_at")
                    .eq("id", user.id)
                    .single();

                if (cancelled) return;
                if (error) {
                    setProfileError(error.message);
                    setProfile(null);
                    return;
                }
                const row = data as Record<string, unknown>;
                setProfile({
                    id: String(row.id ?? ""),
                    wallet_address: row.wallet_address != null ? String(row.wallet_address) : null,
                    username: String(row.username ?? ""),
                    display_name: row.display_name != null ? String(row.display_name) : null,
                    avatar_url: row.avatar_url != null ? String(row.avatar_url) : null,
                    bio: row.bio != null ? String(row.bio) : null,
                    followers_count: typeof row.followers_count === "number" ? row.followers_count : Number(row.followers_count) || 0,
                    following_count: typeof row.following_count === "number" ? row.following_count : Number(row.following_count) || 0,
                    trades_count: typeof row.trades_count === "number" ? row.trades_count : Number(row.trades_count) || 0,
                    pnl: row.pnl != null ? Number(row.pnl) : null,
                    win_rate: row.win_rate != null ? Number(row.win_rate) : null,
                    created_at: row.created_at != null ? String(row.created_at) : undefined,
                    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
                } as Profile);

                // Follow sayıları: aynı cüzdana ait TÜM profil id'leri için; benzersiz kişi sayısı (Leaderboard ile uyumlu)
                const profileIdsForWallet: string[] = [user.id];
                if (primaryAddress) {
                    const { data: walletProfiles } = await supabase
                        .from("profiles")
                        .select("id")
                        .eq("wallet_address", primaryAddress);
                    if (!cancelled && walletProfiles?.length) {
                        const ids = [...new Set([user.id, ...walletProfiles.map((p) => String(p.id))])];
                        profileIdsForWallet.length = 0;
                        profileIdsForWallet.push(...ids);
                    }
                }
                const { following: followingCount, followers: followersCount } = await loadFollowCounts(profileIdsForWallet);
                if (cancelled) return;
                setFollowCounts({ following: followingCount, followers: followersCount });
            } finally {
                if (!cancelled) setProfileLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [user?.id, primaryAddress, loadFollowCounts]);

    // Profil ekranına dönüldüğünde (örn. follow/unfollow sonrası) sayıları güncelle (useCallback kullanmıyoruz; useFocusEffect içinde hook çağrısı hataya yol açar)
    useFocusEffect(() => {
        if (!user?.id || profileLoading) return;
        let cancelled = false;
        (async () => {
            const profileIdsForWallet: string[] = [user.id];
            if (primaryAddress) {
                const { data: walletProfiles } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("wallet_address", primaryAddress);
                if (!cancelled && walletProfiles?.length) {
                    const ids = [...new Set([user.id, ...walletProfiles.map((p) => String(p.id))])];
                    profileIdsForWallet.length = 0;
                    profileIdsForWallet.push(...ids);
                }
            }
            const counts = await loadFollowCounts(profileIdsForWallet);
            if (!cancelled) setFollowCounts(counts);
        })();
        return () => { cancelled = true; };
    });

    const startEditing = () => {
        if (profile) {
            setEditDisplayName(profile.display_name ?? "");
            setEditUsername(profile.username ?? "");
            setEditBio(profile.bio ?? "");
            setEditing(true);
        }
    };

    const saveProfile = async () => {
        if (!user?.id || !profile) return;
        setSaving(true);
        const { error } = await supabase
            .from("profiles")
            .update({
                display_name: editDisplayName.trim() || null,
                username: editUsername.trim() || profile.username,
                bio: editBio.trim() || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        setSaving(false);
        if (error) {
            Alert.alert("Update failed", error.message);
            return;
        }
        setProfile((prev) =>
            prev
                ? {
                      ...prev,
                      display_name: editDisplayName.trim() || null,
                      username: editUsername.trim() || profile.username,
                      bio: editBio.trim() || null,
                  }
                : null
        );
        setEditing(false);
    };

    const cancelEditing = () => {
        setEditing(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Profile</Text>

                {profileLoading ? (
                    <View style={styles.profileCard}>
                        <ActivityIndicator size="small" color="#a855f7" />
                    </View>
                ) : profileError ? (
                    <View style={styles.profileCard}>
                        <Text style={styles.errorText}>{profileError}</Text>
                    </View>
                ) : profile && !editing ? (
                    <View style={styles.profileCard}>
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <View style={styles.avatarPlaceholder} />
                        )}
                        <Text style={styles.displayName}>{profile.display_name || profile.username || "—"}</Text>
                        <Text style={styles.handle}>@{profile.username}</Text>
                        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
                        <View style={styles.statsRow}>
                            <Text style={styles.statText}>PnL: ${Number(profile.pnl ?? 0).toLocaleString()}</Text>
                            <Text style={styles.statText}>Win rate: {Math.round(profile.win_rate ?? 0)}%</Text>
                        </View>
                        <View style={styles.statsRow}>
                            <Text style={styles.statText}>
                                {(followCounts?.followers ?? profile.followers_count ?? 0).toLocaleString()} followers
                            </Text>
                            <Text style={styles.statText}>
                                {(followCounts?.following ?? profile.following_count ?? 0).toLocaleString()} following
                            </Text>
                        </View>
                        <TouchableOpacity onPress={startEditing} style={styles.editButton}>
                            <Text style={styles.editButtonText}>Edit profile</Text>
                        </TouchableOpacity>
                    </View>
                ) : profile && editing ? (
                    <View style={styles.profileCard}>
                        <Text style={styles.sectionLabel}>Display name</Text>
                        <TextInput
                            style={styles.input}
                            value={editDisplayName}
                            onChangeText={setEditDisplayName}
                            placeholder="Display name"
                            placeholderTextColor="#6b7280"
                            autoCapitalize="none"
                        />
                        <Text style={styles.sectionLabel}>Username</Text>
                        <TextInput
                            style={styles.input}
                            value={editUsername}
                            onChangeText={setEditUsername}
                            placeholder="@username"
                            placeholderTextColor="#6b7280"
                            autoCapitalize="none"
                        />
                        <Text style={styles.sectionLabel}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            value={editBio}
                            onChangeText={setEditBio}
                            placeholder="Bio"
                            placeholderTextColor="#6b7280"
                            multiline
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity onPress={cancelEditing} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveProfile} style={styles.saveButton} disabled={saving}>
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                <View style={styles.walletSection}>
                    <Text style={styles.sectionLabel}>Solana Wallet</Text>
                    {isCreating(solanaWallet) || isCreatingWallet ? (
                        <View style={styles.walletRow}>
                            <ActivityIndicator size="small" color="#a855f7" />
                            <Text style={styles.walletStatus}>Creating wallet...</Text>
                        </View>
                    ) : isConnecting(solanaWallet) || isReconnecting(solanaWallet) ? (
                        <View style={styles.walletRow}>
                            <ActivityIndicator size="small" color="#a855f7" />
                            <Text style={styles.walletStatus}>
                                {isReconnecting(solanaWallet) ? "Reconnecting..." : "Connecting..."}
                            </Text>
                        </View>
                    ) : hasError(solanaWallet) ? (
                        <Text style={styles.errorText}>{solanaWallet.error}</Text>
                    ) : primaryAddress ? (
                        <View style={styles.walletRow}>
                            <Text style={styles.address} selectable>
                                {primaryAddress}
                            </Text>
                            <Text style={styles.shortAddress}>{shortenAddress(primaryAddress)}</Text>
                        </View>
                    ) : isNotCreated(solanaWallet) ? (
                        <TouchableOpacity
                            onPress={handleCreateWallet}
                            style={styles.createWalletButton}
                            disabled={isCreatingWallet}
                        >
                            <Text style={styles.createWalletText}>Create Solana Wallet</Text>
                        </TouchableOpacity>
                    ) : isDisconnected(solanaWallet) && typeof solanaWallet.getProvider === "function" ? (
                        <TouchableOpacity
                            onPress={handleLoadWallet}
                            style={styles.createWalletButton}
                            disabled={isLoadingWallet}
                        >
                            <View style={styles.walletRow}>
                                {isLoadingWallet && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                                <Text style={styles.createWalletText}>{isLoadingWallet ? "Loading..." : "Load wallet"}</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.walletRow}>
                            <ActivityIndicator size="small" color="#a855f7" />
                            <Text style={styles.walletStatus}>Loading wallet...</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    scrollContent: { padding: 20, alignItems: "center" },
    title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
    profileCard: {
        width: "100%",
        marginTop: 16,
        backgroundColor: "#111",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#222",
        alignItems: "center",
    },
    avatar: { width: 72, height: 72, borderRadius: 36 },
    avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#222" },
    displayName: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 8 },
    handle: { color: "#a855f7", fontSize: 14, marginTop: 4 },
    bio: { color: "#9ca3af", fontSize: 14, marginTop: 8, textAlign: "center" },
    statsRow: { flexDirection: "row", gap: 16, marginTop: 8 },
    statText: { color: "#6b7280", fontSize: 13 },
    editButton: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#3b0764", borderRadius: 8 },
    editButtonText: { color: "#fff", fontWeight: "600" },
    input: {
        width: "100%",
        backgroundColor: "#1a1a1a",
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 8,
        padding: 12,
        color: "#fff",
        fontSize: 15,
        marginTop: 4,
        marginBottom: 12,
    },
    bioInput: { minHeight: 80, textAlignVertical: "top" },
    editActions: { flexDirection: "row", gap: 12, marginTop: 8 },
    cancelButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: "#333" },
    cancelButtonText: { color: "#9ca3af", fontWeight: "600" },
    saveButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#3b0764", borderRadius: 8, minWidth: 80, alignItems: "center" },
    saveButtonText: { color: "#fff", fontWeight: "600" },
    walletSection: {
        marginTop: 24,
        width: "100%",
        backgroundColor: "#111",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#222",
    },
    sectionLabel: { color: "#9ca3af", fontSize: 12, fontWeight: "600", marginBottom: 8 },
    walletRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    address: { color: "#e5e7eb", fontSize: 12, fontFamily: "monospace" },
    shortAddress: { color: "#a855f7", fontSize: 14, fontWeight: "600" },
    walletStatus: { color: "#6b7280", fontSize: 14, marginLeft: 8 },
    errorText: { color: "#ef4444", fontSize: 14 },
    createWalletButton: {
        backgroundColor: "#3b0764",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    createWalletText: { color: "#fff", fontWeight: "600" },
    logoutButton: { marginTop: 40, backgroundColor: "#111", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#331111" },
    logoutText: { color: "#ff4444", fontWeight: "600" },
});
