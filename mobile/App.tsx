import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { MobileWalletProvider } from "./src/providers/MobileWalletProvider";
import Splash from "./src/screens/Splash";
import TransactionScreen from "./src/screens/TransactionScreen";

enableScreens(true);

const Stack = createNativeStackNavigator();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Load any async assets/config here if needed
      } finally {
        setAppIsReady(true);
      }
    };
    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0b0f",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <MobileWalletProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Splash" component={Splash} />
            <Stack.Screen name="Transaction" component={TransactionScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </MobileWalletProvider>
    </SafeAreaProvider>
  );
}
