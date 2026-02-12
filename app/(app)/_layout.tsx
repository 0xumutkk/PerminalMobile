import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { ProfileSync } from "../../components/ProfileSync";
import { CustomTabBar } from "../../components/CustomTabBar";

export default function AppLayout() {
    return (
        <>
            <ProfileSync />
            <Tabs
                tabBar={(props) => <CustomTabBar {...props} />}
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    sceneStyle: styles.sceneContainer,
                }}
            >
                <Tabs.Screen name="index" options={{ title: "Home" }} />
                <Tabs.Screen name="leaderboard/index" options={{ title: "Leaderboard" }} />
                <Tabs.Screen name="explore/index" options={{ title: "Explore" }} />
                <Tabs.Screen name="search/index" options={{ title: "Search" }} />
                <Tabs.Screen name="profile/index" options={{ title: "Profile" }} />
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
        backgroundColor: "#f0f0f0",
    },
});
