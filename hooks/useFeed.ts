import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Post, Profile } from "../lib/database.types";

export interface FeedPost extends Post {
    author: Profile;
    user_has_liked: boolean;
    user_has_reposted: boolean;
}

export function useFeed(userId?: string, marketId?: string) {
    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFeed = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Basic query: fetch all posts with author profile
            let query = supabase
                .from("posts")
                .select(`
                    *,
                    author:profiles!user_id(*)
                `)
                .order("created_at", { ascending: false });

            // If userId is provided, fetch only that user's posts
            if (userId) {
                query = query.eq("user_id", userId);
            }

            // If marketId is provided, fetch only posts tagged to that market
            if (marketId) {
                query = query.eq("market_id", marketId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Transform data to match FeedPost interface
            // Note: In a real app with Auth, we would check if *current user* liked/reposted
            // For now, we default to false
            const feedPosts: FeedPost[] = (data || []).map((post: any) => ({
                ...post,
                author: post.author,
                user_has_liked: false, // TODO: Implement check
                user_has_reposted: false // TODO: Implement check
            }));

            setPosts(feedPosts);
        } catch (err) {
            console.error("Error fetching feed:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch feed");
        } finally {
            setIsLoading(false);
        }
    }, [userId, marketId]);

    return { posts, isLoading, error, fetchFeed };
}
