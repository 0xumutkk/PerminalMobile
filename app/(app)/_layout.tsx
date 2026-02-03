import { View } from "react-native";
import { Tabs } from "expo-router";
import { Home, ArrowUpCircle, Globe, Search, User } from "lucide-react-native";
import { StyleSheet, Platform } from "react-native";
import { ProfileSync } from "../../components/ProfileSync";

const TAB_ICON_SIZE = 22;

function TabIcon({
    focused,
    Icon,
}: {
    focused: boolean;
    Icon: typeof Home;
}) {
    const color = focused ? "#fff" : "#6b7280";
    return (
        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Icon color={color} size={TAB_ICON_SIZE} strokeWidth={2} />
        </View>
    );
}

export default function AppLayout() {
    return (
        <>
            <ProfileSync />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: "#fff",
                    tabBarInactiveTintColor: "#6b7280",
                    tabBarShowLabel: false,
                    tabBarIcon: ({ focused }) => null,
                    sceneStyle: styles.sceneContainer,
                    tabBarBackground: () => <View style={styles.tabBarBackground} />,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} Icon={Home} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="portfolio/index"
                    options={{
                        title: "Portfolio",
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} Icon={ArrowUpCircle} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="markets/index"
                    options={{
                        title: "Markets",
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} Icon={Globe} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="search/index"
                    options={{
                        title: "Search",
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} Icon={Search} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile/index"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ focused }) => (
                            <TabIcon focused={focused} Icon={User} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="market/[id]"
                    options={{
                        href: null,
                    }}
                />
                <Tabs.Screen
                    name="profile/[id]"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </>
    );
}

const styles = StyleSheet.create({
    sceneContainer: {
        backgroundColor: "#000",
    },
    tabBarBackground: {
        flex: 1,
        backgroundColor: "#000",
    },
    tabBar: {
        backgroundColor: "rgba(15, 15, 15, 0.95)",
        borderTopWidth: 0,
        height: Platform.OS === "ios" ? 72 : 56,
        paddingTop: 8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    iconWrap: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrapActive: {
        backgroundColor: "#1f1f1f",
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
});
