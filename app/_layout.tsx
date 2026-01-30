import { Slot } from "expo-router";
import { LogBox } from "react-native";
import { PrivyAuthProvider } from "../components/auth/PrivyAuthProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Privy SDK may call embeddedWallet.ping() (e.g. on AppState "active") before the
// WebView proxy is set, which logs "Embedded wallet proxy not initialized".
// This is benign (ping returns false); suppress the red error overlay.
LogBox.ignoreLogs(["Embedded wallet proxy not initialized"]);

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <PrivyAuthProvider>
                <Slot />
            </PrivyAuthProvider>
        </SafeAreaProvider>
    );
}
