import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useProfile } from "../../hooks/useProfile";
import { useInteractions } from "../../hooks/useInteractions";
import { Image } from "expo-image";

export function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
    const { profile } = useProfile();
    const { createPost, isSubmitting } = useInteractions();
    const [content, setContent] = useState("");

    const handlePost = async () => {
        if (!content.trim()) return;
        const result = await createPost(content);
        if (result) {
            setContent("");
            onPostCreated();
        }
    };

    if (!profile) return null; // Don't show if not logged in / profile not loaded

    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarFallback}>
                        <Text style={styles.fallbackText}>{(profile?.username || "U").charAt(0).toUpperCase()}</Text>
                    </View>
                )}
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="What's happening?"
                    placeholderTextColor="#64748b"
                    style={styles.input}
                    multiline
                    value={content}
                    onChangeText={setContent}
                />
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, (!content.trim() || isSubmitting) && styles.disabledButton]}
                        onPress={handlePost}
                        disabled={!content.trim() || isSubmitting}
                    >
                        {isSubmitting ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.buttonText}>Post</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
        backgroundColor: "#000",
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
        backgroundColor: "#1e293b",
        alignItems: "center",
        justifyContent: "center",
    },
    fallbackText: {
        color: "#94a3b8",
        fontWeight: "bold",
    },
    inputContainer: {
        flex: 1,
    },
    input: {
        color: "#fff",
        fontSize: 16,
        minHeight: 40,
        textAlignVertical: "top", // Android
        marginBottom: 12,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    button: {
        backgroundColor: "#34d399", // emerald-400
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    disabledButton: {
        backgroundColor: "#064e3b", // emerald-900
        opacity: 0.5,
    },
    buttonText: {
        color: "#000",
        fontWeight: "bold",
        fontSize: 14,
    },
});
