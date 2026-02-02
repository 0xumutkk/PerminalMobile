import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { Profile } from "../lib/database.types";
import { Buffer } from "buffer";

export function useProfile() {
    const { authenticated, activeWallet, user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getCurrentUserId = useCallback(() => {
        if (user?.email?.address) {
            try {
                // Compatible with web implementation
                return Buffer.from(user.email.address).toString('base64').replace(/[^a-zA-Z0-9]/g, "").slice(0, 36);
            } catch (e) {
                return user.email.address;
            }
        }
        if (activeWallet?.address) {
            return activeWallet.address;
        }
        return null;
    }, [user, activeWallet]);

    const fetchProfile = useCallback(async () => {
        const userId = getCurrentUserId();
        if (!userId) {
            setProfile(null);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .maybeSingle();

            if (data) {
                setProfile(data as any);
            } else if (!data) {
                // Profile doesn't exist, create one
                // Generate a unique username
                const baseUsername = activeWallet?.address
                    ? `user_${activeWallet.address.slice(0, 8).toLowerCase()}`
                    : `user_${userId.slice(0, 8).toLowerCase()}`;

                const { data: newProfile, error: createError } = await supabase
                    .from("profiles")
                    .insert({
                        id: userId,
                        username: baseUsername,
                        display_name: null,
                        wallet_address: activeWallet?.address || null,
                        bio: null,
                        avatar_url: null,
                    } as any)
                    .select()
                    .single();

                if (createError) {
                    if (createError.code === "23505") {
                        // Username taken, retry with random
                        const randomSuffix = Math.random().toString(36).slice(2, 6);
                        const { data: retryProfile } = await supabase
                            .from("profiles")
                            .insert({
                                id: userId,
                                username: `${baseUsername}_${randomSuffix}`,
                                wallet_address: activeWallet?.address || null,
                            } as any)
                            .select()
                            .single();
                        if (retryProfile) setProfile(retryProfile);
                    } else {
                        console.error("Create profile error:", createError);
                    }
                } else if (newProfile) {
                    setProfile(newProfile as any);
                }
            }
        } catch (err) {
            console.error("Profile error:", err);
            setError(err instanceof Error ? err.message : "Profile Error");
        } finally {
            setIsLoading(false);
        }
    }, [getCurrentUserId, activeWallet]);

    useEffect(() => {
        if (authenticated) {
            fetchProfile();
        } else {
            setProfile(null);
        }
    }, [authenticated, fetchProfile]);

    return { profile, isLoading, error, fetchProfile };
}

export function useUserProfile(username: string | null) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!username) {
            setProfile(null);
            return;
        }

        const fetchUserProfile = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { data, error: fetchError } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("username", username)
                    .single();

                if (fetchError && fetchError.code !== "PGRST116") {
                    throw fetchError;
                }

                setProfile(data as any);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to fetch profile";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [username]);

    return { profile, isLoading, error };
}
