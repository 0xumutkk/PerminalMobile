import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { FeedPost } from "../../hooks/useFeed";
import { formatTimeAgo } from "../../lib/utils";
import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, ArrowUp, ArrowDown } from "lucide-react-native";
import { useInteractions } from "../../hooks/useInteractions";

interface PostCardProps {
    post: FeedPost;
}

export function PostCard({ post }: PostCardProps) {
    const { toggleLike, toggleRepost } = useInteractions();

    const [liked, setLiked] = useState(post.user_has_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [reposted, setReposted] = useState(post.user_has_reposted);
    const [repostsCount, setRepostsCount] = useState(post.reposts_count);

    const handleLike = async () => {
        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));

        const success = await toggleLike(post.id);
        if (success === null) {
            // Revert on failure
            setLiked(!newLiked);
            setLikesCount(prev => !newLiked ? prev + 1 : Math.max(0, prev - 1));
        }
    };

    const handleRepost = async () => {
        // Optimistic update
        const newReposted = !reposted;
        setReposted(newReposted);
        setRepostsCount(prev => newReposted ? prev + 1 : Math.max(0, prev - 1));

        const success = await toggleRepost(post.id);
        if (success === null) {
            // Revert
            setReposted(!newReposted);
            setRepostsCount(prev => !newReposted ? prev + 1 : Math.max(0, prev - 1));
        }
    };

    const timeAgo = formatTimeAgo(post.created_at);

    return (
        <View style={styles.container}>
            <View style={styles.postBody}>
                {/* Header Row */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.avatarContainer}>
                        {post.author?.avatar_url ? (
                            <Image
                                source={{ uri: post.author.avatar_url }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarFallbackText}>
                                    {(post.author?.username || "U").charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.headerTextCol}>
                        <View style={styles.nameRow}>
                            <Text style={styles.displayName} numberOfLines={1}>
                                {post.author?.display_name || post.author?.username || "User"}
                            </Text>
                            <Text style={styles.username} numberOfLines={1}>
                                @{post.author?.username}
                            </Text>
                            <Text style={styles.dot}>·</Text>
                            <Text style={styles.timeAgo}>{timeAgo}</Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <Text style={styles.postText}>{post.content}</Text>

                {/* Integrated Market Card - Only show if market data exists */}
                {post.market_slug && (
                    <View style={styles.integratedMarketCard}>
                        <View style={styles.marketTop}>
                            <View style={styles.marketImageWrap}>
                                <Image
                                    source="https://api.dicebear.com/7.x/identicon/svg?seed=market"
                                    style={styles.marketImage}
                                />
                            </View>
                            <View style={styles.marketMeta}>
                                <Text style={styles.marketQuestion} numberOfLines={2}>
                                    {post.market_question || "Prediction Market"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.marketFooter}>
                            <View style={styles.entryRow}>
                                <Text style={styles.entryLabel}>Prediction Market</Text>
                            </View>
                            <TouchableOpacity style={styles.inlineTradeButton}>
                                <Text style={styles.inlineTradeText}>Trade</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionItem} onPress={handleLike}>
                        <ArrowUp size={20} color={liked ? "#22c55e" : "#6b7280"} />
                        <Text style={[styles.actionLabel, { color: liked ? '#22c55e' : '#6b7280' }]}>
                            {likesCount || 0}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <ArrowDown size={20} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem} onPress={handleRepost}>
                        <Repeat2 size={20} color={reposted ? "#10b981" : "#6b7280"} />
                        <Text style={[styles.actionLabel, { color: reposted ? '#10b981' : '#6b7280' }]}>
                            {repostsCount || 0}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionItem}>
                        <Share2 size={20} color="#6b7280" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937", // slate-800
        padding: 12,
        backgroundColor: "#000",
    },
    postBody: {
        width: "100%",
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    avatarContainer: {
        marginRight: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarFallback: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarFallbackText: {
        color: "#6b7280",
        fontSize: 14,
        fontWeight: "bold",
    },
    headerTextCol: {
        flex: 1,
        gap: 2,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    displayName: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
    },
    username: {
        color: "#6b7280",
        fontSize: 14,
        fontWeight: "600",
    },
    dot: {
        color: "#444",
        fontSize: 14,
    },
    timeAgo: {
        color: "#6b7280",
        fontSize: 14,
        fontWeight: "500",
    },
    tagRow: {
        flexDirection: "row",
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTagText: {
        fontSize: 11,
        fontWeight: "800",
    },
    profitPercent: {
        color: "#22c55e",
        fontSize: 18,
        fontWeight: "900",
    },
    postText: {
        color: "#e2e8f0",
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
        fontWeight: "500",
    },
    integratedMarketCard: {
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderRadius: 24,
        borderWidth: 2,
        borderColor: "#3b82f6",
        padding: 16,
        marginBottom: 16,
    },
    marketTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    marketImageWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
    },
    marketImage: {
        width: "100%",
        height: "100%",
    },
    marketMeta: {
        flex: 1,
    },
    marketQuestion: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
        lineHeight: 20,
    },
    gaugeContainerMini: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    gaugeBackgroundMini: {
        position: "absolute",
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.1)",
    },
    gaugeFillMini: {
        position: "absolute",
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: "#22c55e",
        borderTopColor: "transparent",
        borderRightColor: "transparent",
    },
    gaugeTextMini: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "900",
    },
    marketDetails: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    sidePill: {
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    sideText: {
        color: "#22c55e",
        fontSize: 20,
        fontWeight: "900",
    },
    sharesCol: {
        flex: 1,
    },
    sharesLabel: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
    },
    sharesValue: {
        color: "#ccc",
        fontSize: 14,
        fontWeight: "600",
    },
    marketFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        marginHorizontal: -16,
        padding: 16,
    },
    entryRow: {
        flexDirection: "row",
        gap: 20,
    },
    entryLabel: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        fontWeight: "800",
    },
    entryValue: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "900",
    },
    inlineTradeButton: {
        backgroundColor: "#111",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    inlineTradeText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "900",
    },
    marketSocial: {
        marginTop: 12,
    },
    socialAvatarStackMini: {
        flexDirection: "row",
        alignItems: "center",
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#3b82f6",
    },
    miniAvatarMore: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#222",
        marginLeft: -10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#3b82f6",
    },
    miniAvatarMoreText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "800",
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 4,
    },
    actionItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: "800",
    },
});
