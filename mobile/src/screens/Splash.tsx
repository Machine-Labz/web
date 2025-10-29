import React, { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMobileWallet } from "../providers/MobileWalletProvider";

type Props = NativeStackScreenProps<any>;

export default function Splash({ navigation }: Props) {
  const { connected, authorize } = useMobileWallet();

  useEffect(() => {
    if (connected) {
      navigation.replace("Transaction");
    }
  }, [connected, navigation]);

  const onConnect = async () => {
    try {
      await authorize();
      navigation.replace("Transaction");
    } catch (e) {
      // noop
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/splash.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Cloak</Text>
      <Text style={styles.subtitle}>Privacy · Solana · ZK</Text>
      <TouchableOpacity onPress={onConnect} style={styles.button}>
        <Text style={styles.buttonText}>Connect Wallet</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  image: { width: "80%", height: 220, marginBottom: 24 },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "#9aa0a6", fontSize: 14, marginBottom: 24 },
  button: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
