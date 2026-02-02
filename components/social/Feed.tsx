import React, { useEffect, useCallback } from "react";
import { View, FlatList, Text, ActivityIndicator, StyleSheet, RefreshControl } from "react-native";
import { useFeed } from "../../hooks/useFeed";
import { PostCard } from "./PostCard";
import { CreatePost } from "./CreatePost";
import { MessageSquare } from "lucide-react-native";

interface FeedProps {
    userId?: string;
    marketId?: string;
}

export function Feed({ userId, marketId }: FeedProps) {
    const { posts, isLoading, error, fetchFeed } = useFeed(userId, marketId);
    const [refreshing, setRefreshing] = React.useState(false);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchFeed();
        setRefreshing(false);
    }, [fetchFeed]);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <PostCard post={item} />
    ), []);

    const ListHeaderComponent = useCallback(() => (
        <CreatePost onPostCreated={fetchFeed} />
    ), [fetchFeed]);

    const ListEmptyComponent = useCallback(() => {
        if (isLoading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#34d399" />
                </View>
            );
        }
        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text style={styles.retryText} onPress={() => fetchFeed()}>Tap to retry</Text>
                </View>
            );
        }
        return (
            <View style={styles.centerContainer}>
                <MessageSquare size={48} color="#475569" />
                <Text style={styles.emptyTitle}>
                    {marketId ? "No posts about this market yet" : "No posts yet"}
                </Text>
                <Text style={styles.emptySubtitle}>
                    {marketId ? "Be the first to share your thoughts!" : "Be the first to share something!"}
                </Text>
            </View>
        );
    }, [isLoading, error, marketId, fetchFeed]);

    return (
        <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34d399" />
            }
            ListHeaderComponent={!userId ? ListHeaderComponent : undefined} // Don't show create post on profile feed? Or do? Maybe show if own profile. For now, show on main feed.
            ListEmptyComponent={ListEmptyComponent}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: 20,
        backgroundColor: "#000",
        minHeight: "100%",
    },
    centerContainer: {
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        color: "#f43f5e",
        marginBottom: 8,
    },
    retryText: {
        color: "#94a3b8",
        textDecorationLine: "underline",
    },
    emptyTitle: {
        color: "#94a3b8",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 16,
    },
    emptySubtitle: {
        color: "#64748b",
        fontSize: 14,
        marginTop: 4,
    },
});
