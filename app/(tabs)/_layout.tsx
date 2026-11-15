import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform } from "react-native";

export default function TabLayout() {
  const theme = {
    brandPrimary: "#49C5B6",
    inactive: "#9CA3AF",
    bg: "white",
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Menyembunyikan header bawaan
        tabBarActiveTintColor: theme.brandPrimary,
        tabBarInactiveTintColor: theme.inactive,
        tabBarHideOnKeyboard: true, // Sembunyikan tab bar saat keyboard muncul
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopWidth: 0, // Menghilangkan garis keras di atas tab bar
          elevation: 15,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: -5 },
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 25 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 4,
        },
      }}
    >
      {/* 1. TAB HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 2. TAB WISHLIST */}
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 3. TAB UPLOAD (TOMBOL TENGAH MENGAMBANG) */}
      <Tabs.Screen
        name="upload"
        options={{
          title: "Upload",
          tabBarLabel: () => null, // Sembunyikan teks label
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                top: Platform.OS === "ios" ? -15 : -20,
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.brandPrimary,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: theme.brandPrimary,
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 6,
                borderWidth: 4,
                borderColor: "white", 
              }}
            >
              <Ionicons 
                name="add" 
                size={32} 
                color="white" 
                style={{ transform: [{ rotate: focused ? "45deg" : "0deg" }] }}
              />
            </View>
          ),
        }}
      />

      {/* 4. TAB CHAT */}
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 5. TAB PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* ========================================================= */}
      {/* 💡 FIX: MENYEMBUNYIKAN TAB EXPLORE BAWAAN EXPO ROUTER    */}
      {/* ========================================================= */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Ini akan membuat tab "Explore" hilang dari layar
        }}
      />

    </Tabs>
  );
}