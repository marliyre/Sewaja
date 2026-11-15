import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProducts } from "../../context/ProductContext"; 
import { useWishlist } from "../../context/WishlistContext";

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  
  const { products } = useProducts();
  const { favorites, toggleFavorite } = useWishlist();

  // 💡 STATE UNTUK MENGECEK KEPEMILIKAN BARANG
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const sessionData = await AsyncStorage.getItem("@currentUser");
      if (sessionData) setCurrentUser(JSON.parse(sessionData));
    };
    fetchUser();
  }, []);

  const stringId = Array.isArray(id) ? id[0] : id;
  const product = products.find(
    (item) => String(item.id) === String(stringId)
  );

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" }}>
        <Text style={{ fontSize: 16, color: "#6B7280", fontWeight: "600" }}>Product not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 14, backgroundColor: "#49C5B6", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 }}>
          <Text style={{ color: "white", fontWeight: "700" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 💡 LOGIKA KUNCI: Cek apakah email user yang login sama dengan email pemilik barang
  const isMyProduct = currentUser && (product as any).userEmail === currentUser.email;
  const isLiked = favorites.some((fav) => String(fav.id) === String(product.id));

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* IMAGE */}
        <View>
          <Image source={{ uri: product.image || (product as any).allImages?.[0] }} style={{ width: "100%", height: 340, backgroundColor: "#E5E7EB" }} />

          {/* BACK BUTTON */}
          <TouchableOpacity onPress={() => router.back()} style={{ position: "absolute", top: 55, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center" }}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          {/* HEART BUTTON */}
          <TouchableOpacity
            onPress={() => toggleFavorite({
              ...product,
              id: isNaN(Number(product.id)) ? product.id : Number(product.id)
            } as any)}
            style={{ position: "absolute", top: 55, right: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center" }}
          >
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={22} color={isLiked ? "#EF4444" : "#111827"} />
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <View style={{ padding: 22, marginTop: -20, backgroundColor: "#F9FAFB", borderTopLeftRadius: 30, borderTopRightRadius: 30 }}>
          
          <Text style={{ color: "#49C5B6", fontWeight: "700", marginBottom: 10 }}>{product.category}</Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 12 }}>{product.title}</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", color: "#2D8B81", marginBottom: 18 }}>{product.price}</Text>

          {/* INFO */}
          <View style={{ flexDirection: "row", marginBottom: 28, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={{ marginLeft: 6, color: "#6B7280", fontWeight: "600" }}>{product.rating || "0.0"}</Text>
              <Text style={{ marginLeft: 4, color: "#9CA3AF" }}>({product.reviewCount || 0} reviews)</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="location-outline" size={18} color="#6B7280" />
              <Text style={{ marginLeft: 6, color: "#6B7280" }}>{product.location || "No Location Specified"}</Text>
            </View>
          </View>

          {/* DESCRIPTION */}
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" }}>Description</Text>
          <Text style={{ color: "#6B7280", lineHeight: 24, marginBottom: 30 }}>{product.description || "No description provided for this product."}</Text>

          {/* OWNER CARD */}
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 20, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
            <Image
              source={{ uri: typeof product.owner === 'object' && product.owner?.avatar ? product.owner.avatar : "https://via.placeholder.com/150" }}
              style={{ width: 56, height: 56, borderRadius: 28, marginRight: 14 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: "#111827" }}>
                {typeof product.owner === 'object' ? product.owner?.name : (product.owner || "Owner Sewaja")}
                {isMyProduct && " (Anda)"}
              </Text>
              <Text style={{ color: "#6B7280", marginTop: 4 }}>{typeof product.owner === 'object' ? product.owner?.role : "Product Owner"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>

          {/* 💡 FIX: HANYA TAMPILKAN TOMBOL CHAT & TELEPON JIKA BUKAN BARANG SENDIRI */}
          {!isMyProduct && (
            <View style={{ flexDirection: "row", marginBottom: 30 }}>
              <TouchableOpacity
                onPress={() => {
                  const ownerName = typeof product.owner === 'object' ? product.owner?.name : (product.owner || "Owner Sewaja");
                  const ownerAva = typeof product.owner === 'object' && product.owner?.avatar ? product.owner.avatar : "";
                  router.push({ pathname: "/(tabs)/chat", params: { ownerName: ownerName, productTitle: product.title, ownerAvatar: ownerAva } });
                }}
                style={{ flex: 1, backgroundColor: "#111827", paddingVertical: 16, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 12 }}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Message Owner</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: "#EEFDFB", justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="call-outline" size={24} color="#2D8B81" />
              </TouchableOpacity>
            </View>
          )}

          {/* FEATURES & SPECS */}
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 14, color: "#111827" }}>Features & Specs</Text>
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 18, marginBottom: 28 }}>
            {(product as any).specs && (product as any).specs.length > 0 ? (
              (product as any).specs.map((spec: any, index: number) => (
                <View key={index} style={{ marginBottom: index === (product as any).specs.length - 1 ? 0 : 14 }}>
                  <Text style={{ color: "#111827", fontWeight: "700", marginBottom: 4 }}>{spec.label}</Text>
                  <Text style={{ color: "#6B7280" }}>{spec.value}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: "#6B7280" }}>Standard specifications applied to this item.</Text>
            )}
          </View>

          {/* RENTAL TERMS */}
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 14, color: "#111827" }}>Rental Terms</Text>
          <View style={{ backgroundColor: "white", borderRadius: 20, padding: 18, marginBottom: 40 }}>
            <View style={{ flexDirection: "row", marginBottom: 16 }}><Ionicons name="time-outline" size={18} color="#49C5B6" /><Text style={{ marginLeft: 10, color: "#6B7280", flex: 1 }}>Minimum rental duration is 1 day</Text></View>
            <View style={{ flexDirection: "row", marginBottom: 16 }}><Ionicons name="card-outline" size={18} color="#49C5B6" /><Text style={{ marginLeft: 10, color: "#6B7280", flex: 1 }}>Must provide identity card before renting</Text></View>
            <View style={{ flexDirection: "row", marginBottom: 16 }}><Ionicons name="alert-circle-outline" size={18} color="#49C5B6" /><Text style={{ marginLeft: 10, color: "#6B7280", flex: 1 }}>Late return will incur additional charges</Text></View>
            <View style={{ flexDirection: "row" }}><Ionicons name="shield-checkmark-outline" size={18} color="#49C5B6" /><Text style={{ marginLeft: 10, color: "#6B7280", flex: 1 }}>Damaged items must be compensated</Text></View>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION */}
      <View style={{ padding: 20, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
        {/* 💡 FIX: JIKA BARANG SENDIRI, TOMBOL RENT BERUBAH JADI ABU-ABU */}
        {isMyProduct ? (
          <TouchableOpacity disabled style={{ backgroundColor: "#9CA3AF", paddingVertical: 18, borderRadius: 20, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "white", fontWeight: "700", fontSize: 17 }}>Ini Barang Milik Anda</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push(`/booking/${product.id}`)} style={{ backgroundColor: "#49C5B6", paddingVertical: 18, borderRadius: 20, justifyContent: "center", alignItems: "center", shadowColor: "#49C5B6", shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }}>
            <Text style={{ color: "white", fontWeight: "700", fontSize: 17 }}>Rent Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}