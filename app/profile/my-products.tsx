import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProducts } from "../../context/ProductContext";

export default function MyProductsScreen() {
  const router = useRouter();
  const { products, deleteProduct } = useProducts();
  
  // 💡 TAB UNTUK PINDAH MENU
  const [activeTab, setActiveTab] = useState<"products" | "incoming">("products");
  
  const [userEmail, setUserEmail] = useState("");
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);

  const theme = { bg: "#F9FAFB", text: "#111827", subText: "#6B7280", brandPrimary: "#49C5B6", border: "#E5E7EB", card: "white", brandDark: "#2D8B81" };

  const fetchData = async () => {
    try {
      const userData = await AsyncStorage.getItem("@currentUser");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserEmail(parsedUser.email);

        // Ambil data barang yang disewa orang (Pesanan Masuk)
        const historyJson = await AsyncStorage.getItem("@historyRents");
        if (historyJson) {
          const allHistory = JSON.parse(historyJson);
          const incoming = allHistory.filter((item: any) => item.ownerEmail === parsedUser.email);
          setIncomingOrders(incoming);
        }
      }
    } catch (error) { console.error(error); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, []));

  const myUploadedProducts = products.filter((p: any) => p.userEmail === userEmail);

  // 💡 EKSEKUSI ACC / TOLAK TANPA POP-UP
  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    try {
      const historyJson = await AsyncStorage.getItem("@historyRents");
      if (historyJson) {
        const allHistory = JSON.parse(historyJson);
        const updatedHistory = allHistory.map((item: any) => 
          item.transactionId === transactionId ? { ...item, status: newStatus } : item
        );
        await AsyncStorage.setItem("@historyRents", JSON.stringify(updatedHistory));
        fetchData(); // Refresh list otomatis
      }
    } catch (error) { console.error(error); }
  };

  // 💡 EKSEKUSI HAPUS PRODUK TANPA POP-UP
  const handleDeleteProduct = (id: string | number) => {
    deleteProduct(id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* HEADER & TABS */}
      <View style={{ paddingTop: 60, paddingHorizontal: 20, backgroundColor: "white" }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginRight: 16 }}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>Manajemen Produk</Text>
        </View>

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => setActiveTab("products")} style={{ flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 3, borderBottomColor: activeTab === "products" ? theme.brandPrimary : "transparent" }}>
            <Text style={{ fontWeight: activeTab === "products" ? "800" : "600", color: activeTab === "products" ? theme.brandPrimary : theme.subText }}>Produk Saya</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab("incoming")} style={{ flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 3, borderBottomColor: activeTab === "incoming" ? theme.brandPrimary : "transparent" }}>
            <Text style={{ fontWeight: activeTab === "incoming" ? "800" : "600", color: activeTab === "incoming" ? theme.brandPrimary : theme.subText }}>Pesanan Masuk</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {activeTab === "products" ? (
          // --- TAB 1: DAFTAR PRODUK SAYA ---
          myUploadedProducts.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Feather name="box" size={60} color="#D1D5DB" />
              <Text style={{ marginTop: 18, fontSize: 18, fontWeight: "700", color: theme.text }}>Belum Ada Produk</Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: theme.subText, textAlign: "center" }}>Anda belum mengunggah barang apapun.</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {myUploadedProducts.map((item: any) => (
                <View key={item.id} style={{ width: "48%", backgroundColor: "white", borderRadius: 24, marginBottom: 18, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                  
                  <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/product/${item.id}`)}>
                    <Image source={{ uri: item.image || item.allImages?.[0] }} style={{ width: "100%", height: 160, backgroundColor: "#F3F4F6" }} />
                    <View style={{ position: "absolute", top: 10, left: 10, backgroundColor: theme.brandPrimary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>Active</Text>
                    </View>
                    <View style={{ padding: 14 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: theme.brandPrimary, marginBottom: 6 }}>{item.category}</Text>
                      <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: "700", color: theme.text, marginBottom: 10 }}>{item.title}</Text>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: theme.brandDark }}>{item.price}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: theme.border }}>
                    <TouchableOpacity style={{ flex: 1, paddingVertical: 12, alignItems: "center", borderRightWidth: 1, borderRightColor: theme.border }}>
                      <Ionicons name="pencil" size={18} color={theme.subText} />
                    </TouchableOpacity>
                    {/* TOMBOL HAPUS BARANG TANPA POP-UP */}
                    <TouchableOpacity onPress={() => handleDeleteProduct(item.id)} style={{ flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: "#FEF2F2" }}>
                      <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                </View>
              ))}
            </View>
          )
        ) : (
          // --- TAB 2: PESANAN MASUK (ACC / TOLAK) ---
          incomingOrders.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 60 }}>
              <Feather name="inbox" size={60} color="#D1D5DB" />
              <Text style={{ marginTop: 18, fontSize: 18, fontWeight: "700", color: theme.text }}>Tidak Ada Pesanan</Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: theme.subText, textAlign: "center" }}>Belum ada orang yang menyewa barang Anda.</Text>
            </View>
          ) : (
            incomingOrders.map((item: any, index: number) => {
              const isPending = item.status === "Pending";
              const isOngoing = item.status === "Ongoing";
              const isCanceled = item.status === "Canceled" || item.status === "Rejected";

              const statusColor = isPending ? "#D97706" : (isOngoing ? theme.brandPrimary : "#EF4444"); 
              const statusBg = isPending ? "#FEF3C7" : (isOngoing ? "#D1FAE5" : "#FEF2F2");
              
              let statusText = item.status.toUpperCase();
              if (isPending) statusText = "PERLU DI-ACC";
              if (item.status === "Rejected") statusText = "DITOLAK OWNER";

              return (
                <View key={index} style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }}>
                  
                  <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/profile/rent-detail/${item.transactionId}`)}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="receipt-outline" size={16} color={theme.subText} style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: theme.subText }}>{item.date}</Text>
                      </View>
                      <View style={{ backgroundColor: statusBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 10, fontWeight: "800", color: statusColor }}>{statusText}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Image source={{ uri: item.image }} style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: "#F3F4F6", marginRight: 14 }} />
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 4 }}>{item.title}</Text>
                        <Text style={{ fontSize: 13, color: theme.subText, marginBottom: 8 }}>Penyewa: {item.renterName || "User"}</Text>
                        <Text style={{ fontSize: 15, fontWeight: "800", color: theme.brandDark }}>Rp {item.grandTotal.toLocaleString("id-ID")}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* 💡 TOMBOL ACC & TOLAK TANPA POP-UP */}
                  {isPending && (
                    <View style={{ flexDirection: "row", marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border }}>
                      <TouchableOpacity onPress={() => handleStatusUpdate(item.transactionId, "Rejected")} style={{ flex: 1, backgroundColor: "#FEF2F2", paddingVertical: 10, borderRadius: 12, alignItems: "center", marginRight: 8 }}>
                        <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>Tolak</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleStatusUpdate(item.transactionId, "Ongoing")} style={{ flex: 1, backgroundColor: theme.brandPrimary, paddingVertical: 10, borderRadius: 12, alignItems: "center", marginLeft: 8 }}>
                        <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>Terima (ACC)</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              );
            })
          )
        )}
      </ScrollView>
    </View>
  );
}