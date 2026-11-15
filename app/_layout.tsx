import { Stack } from "expo-router";

// Import Provider dari folder context Anda
// Pastikan path "../context/..." sesuai dengan lokasi folder Anda
import { ProductProvider } from "../context/ProductContext";
import { WishlistProvider } from "../context/WishlistContext";
import { ThemeProvider } from "../context/ThemeContext"; 

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ProductProvider>
        <WishlistProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </WishlistProvider>
      </ProductProvider>
    </ThemeProvider>
  );
}