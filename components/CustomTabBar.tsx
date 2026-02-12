import React from "react";
import { View, Pressable, StyleSheet, Dimensions, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import { HomeFilledIcon, GlobeFilledIcon, IncentiveIcon, SearchIcon } from "./TabBarIcons";

const PROFILE_AVATAR = "https://www.figma.com/api/mcp/asset/2e4567f9-2300-4518-964f-d6427d5eb261";
const TAB_BAR_WIDTH = 316;
const TAB_BAR_BG = "#e8e8e8";
const ACTIVE_PILL_BG = "#ededed";
const ACTIVE_ICON = "#171717";
const INACTIVE_ICON = "#8e8e8e";

type TabIconComponent = React.ComponentType<{ color: string }>;
const ICONS: Record<string, TabIconComponent> = {
    index: HomeFilledIcon,
    "leaderboard/index": IncentiveIcon,
    "explore/index": GlobeFilledIcon,
    "search/index": SearchIcon,
};

const VISIBLE_ROUTES = ["index", "leaderboard/index", "explore/index", "search/index", "profile/index"];

export function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
    const bottomInset = insets?.bottom ?? 0;
    const left = (Dimensions.get("window").width - TAB_BAR_WIDTH) / 2;
    const visibleRoutes = state.routes.filter((r) => VISIBLE_ROUTES.includes(r.name));

    return (
        <View
            style={[styles.container, { paddingBottom: bottomInset }]}
            pointerEvents="box-none"
        >
            <View
                style={[
                    styles.tabBar,
                    { left, bottom: Platform.OS === "ios" ? 10 + bottomInset : 8 + bottomInset },
                ]}
            >
                {visibleRoutes.map((route) => {
                    const index = state.routes.findIndex((r) => r.key === route.key);
                    const focused = index === state.index;
                    const isProfile = route.name === "profile/index";

                    const onPress = () => {
                        const event = navigation.emit({
                            type: "tabPress",
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!focused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const IconComponent = ICONS[route.name];
                    const color = focused ? ACTIVE_ICON : INACTIVE_ICON;

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            style={[
                                styles.tabItem,
                                focused && styles.tabItemActive,
                                !focused && !isProfile && styles.tabItemInactive,
                            ]}
                        >
                            {isProfile ? (
                                <Image
                                    source={{ uri: PROFILE_AVATAR }}
                                    contentFit="cover"
                                    style={styles.profileIcon}
                                />
                            ) : IconComponent ? (
                                <IconComponent color={color} />
                            ) : null}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
    },
    tabBar: {
        position: "absolute",
        width: TAB_BAR_WIDTH,
        height: 53,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        padding: 4,
        gap: 2,
        backgroundColor: TAB_BAR_BG,
        borderRadius: 24,
    },
    tabItem: {
        flex: 1,
        height: 45,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    tabItemActive: {
        backgroundColor: ACTIVE_PILL_BG,
    },
    tabItemInactive: {
        opacity: 0.5,
    },
    profileIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
});
