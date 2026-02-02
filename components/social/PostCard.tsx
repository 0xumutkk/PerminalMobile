import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { FeedPost } from "../../hooks/useFeed";
import { formatTimeAgo } from "../../lib/utils";
import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal } from "lucide-react-native";
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
            <View style={styles.contentContainer}>
                {/* Avatar */}
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

                <View style={styles.rightColumn}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerInfo}>
                            <Text style={styles.displayName} numberOfLines={1}>
                                {post.author?.display_name || post.author?.username || "User"}
                            </Text>
                            <Text style={styles.username} numberOfLines={1}>
                                @{post.author?.username}
                            </Text>
                            <Text style={styles.dot}>·</Text>
                            <Text style={styles.timeAgo}>{timeAgo}</Text>
                        </View>
                        <TouchableOpacity style={styles.moreButton}>
                            <MoreHorizontal size={16} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Market Context */}
                    {post.market_slug && (
                        <View style={styles.marketBadge}>
                            <Text style={styles.marketText}>
                                Market: {post.market_question || "Prediction Market"}
                            </Text>
                        </View>
                    )}

                    {/* Content */}
                    <Text style={styles.content}>{post.content}</Text>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {/* Comments */}
                        <TouchableOpacity style={styles.actionButton}>
                            <MessageCircle size={18} color="#6b7280" />
                            <Text style={styles.actionText}>{post.comments_count || 0}</Text>
                        </TouchableOpacity>

                        {/* Repost */}
                        <TouchableOpacity style={styles.actionButton} onPress={handleRepost}>
                            <Repeat2 size={18} color={reposted ? "#10b981" : "#6b7280"} />
                            <Text style={[styles.actionText, reposted && { color: "#10b981" }]}>{repostsCount || 0}</Text>
                        </TouchableOpacity>

                        {/* Like */}
                        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                            <Heart size={18} color={liked ? "#f43f5e" : "#6b7280"} fill={liked ? "#f43f5e" : "transparent"} />
                            <Text style={[styles.actionText, liked && { color: "#f43f5e" }]}>{likesCount || 0}</Text>
                        </TouchableOpacity>

                        {/* Share */}
                        <TouchableOpacity style={styles.actionButton}>
                            <Share2 size={18} color="#6b7280" />
                        </TouchableOpacity>
                    </View>
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
    contentContainer: {
        flexDirection: "row",
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#1e293b",
    },
    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(6, 78, 59, 0.5)", // emerald-900/50
        alignItems: "center",
        justifyContent: "center",
    },
    avatarFallbackText: {
        color: "#34d399", // emerald-400
        fontWeight: "bold",
        fontSize: 16,
    },
    rightColumn: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    headerInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    displayName: {
        color: "#f1f5f9", // slate-100
        fontWeight: "bold",
        fontSize: 15,
        marginRight: 4,
        maxWidth: 120, // Limit width to prevent overflow
    },
    username: {
        color: "#64748b", // slate-500
        fontSize: 14,
        marginRight: 4,
        maxWidth: 100,
    },
    dot: {
        color: "#64748b",
        fontSize: 14,
        marginRight: 4,
    },
    timeAgo: {
        color: "#64748b",
        fontSize: 14,
    },
    moreButton: {
        padding: 4,
    },
    marketBadge: {
        backgroundColor: "rgba(2, 44, 34, 0.3)", // emerald-950/30
        borderWidth: 1,
        borderColor: "rgba(16, 185, 129, 0.2)", // emerald-500/20
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: "flex-start",
        marginBottom: 8,
    },
    marketText: {
        color: "#34d399", // emerald-400
        fontSize: 12,
    },
    content: {
        color: "#e2e8f0", // slate-200
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 12,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        maxWidth: "90%",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 4,
    },
    actionText: {
        color: "#64748b", // slate-500
        fontSize: 13,
        marginLeft: 4,
    },
});
