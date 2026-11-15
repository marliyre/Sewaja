import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWishlist } from "../../context/WishlistContext";
import { router } from "expo-router"; 

export default function WishlistScreen() {
  const { favorites, toggleFavorite } = useWishlist();

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      
      {/* HEADER */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#2D8B81" }}>Wishlist</Text>
      </View>

      {/* CONTENT */}
      {favorites.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 }}>
          <Ionicons name="heart-outline" size={70} color="#D1D5DB" />
          <Text style={{ marginTop: 18, fontSize: 20, fontWeight: "700", color: "#374151" }}>Belum ada wishlist</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 22 }}>
            Barang yang kamu sukai akan muncul di sini
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            
            {favorites.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } })}
                style={{ 
                  width: "48%", 
                  backgroundColor: "white", 
                  borderRadius: 24, 
                  marginBottom: 18, 
                  overflow: "hidden", 
                  shadowColor: "#000", 
                  shadowOpacity: 0.05, 
                  shadowRadius: 10, 
                  elevation: 3 
                }}
              >
                <View style={{ position: "relative" }}>
                  {/* Foto Produk */}
                  <Image source={{ uri: item.image }} style={{ width: "100%", height: 160 }} />
                  
                  {/* Icon Heart (Posisi sama seperti Home) */}
                  <TouchableOpacity 
                    onPress={() => toggleFavorite(item)} 
                    style={{ 
                      position: "absolute", 
                      top: 10, 
                      right: 10, 
                      width: 34, 
                      height: 34, 
                      borderRadius: 17, 
                      backgroundColor: "rgba(255,255,255,0.9)", 
                      justifyContent: "center", 
                      alignItems: "center" 
                    }}
                  >
                    <Ionicons name="heart" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Info Produk (Sama persis dengan Home) */}
                <View style={{ padding: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#49C5B6", marginBottom: 6 }}>
                    {item.category}
                  </Text>
                  <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D8B81" }}>
                    {item.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

          </View>
        </ScrollView>
      )}
    </View>
  );
}