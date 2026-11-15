import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HistoryRentsScreen() {
  const router = useRouter();
  const [myRents, setMyRents] = useState<any[]>([]);

  const theme = { bg: "#F9FAFB", card: "white", text: "#111827", subText: "#6B7280", brandPrimary: "#49C5B6", border: "#E5E7EB", brandDark: "#2D8B81" };

  const fetchHistory = async () => {
    try {
      const currentUserJson = await AsyncStorage.getItem("@currentUser");
      const user = currentUserJson ? JSON.parse(currentUserJson) : { email: "guest" };

      const historyJson = await AsyncStorage.getItem("@historyRents");
      if (historyJson) {
        const allHistory = JSON.parse(historyJson);
        // Hanya ambil transaksi di mana saya adalah PENYEWA
        const rents = allHistory.filter((item: any) => item.userEmail === user.email);
        setMyRents(rents);
      }
    } catch (error) {
      console.error("Gagal memuat histori:", error);
    }
  };

  useFocusEffect(useCallback(() => { fetchHistory(); }, []));

  // 💡 EKSEKUSI BATAL TANPA POP-UP
  const handleCancel = async (transactionId: string) => {
    try {
      const historyJson = await AsyncStorage.getItem("@historyRents");
      if (historyJson) {
        const allHistory = JSON.parse(historyJson);
        const updatedHistory = allHistory.map((item: any) => 
          item.transactionId === transactionId ? { ...item, status: "Canceled" } : item
        );
        await AsyncStorage.setItem("@historyRents", JSON.stringify(updatedHistory));
        fetchHistory(); // Refresh tampilan seketika
      }
    } catch (error) { console.error(error); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* HEADER */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "white", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginRight: 16 }}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>Riwayat Sewa Saya</Text>
      </View>

      {myRents.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 }}>
          <Feather name="clock" size={60} color="#D1D5DB" />
          <Text style={{ marginTop: 18, fontSize: 18, fontWeight: "700", color: theme.text }}>Belum Ada Transaksi</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: theme.subText, textAlign: "center", lineHeight: 22 }}>Kamu belum pernah menyewa barang. Yuk, mulai cari barang di Home!</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          {myRents.map((item: any, index: number) => {
            const isPending = item.status === "Pending";
            const isOngoing = item.status === "Ongoing";
            const isCanceled = item.status === "Canceled" || item.status === "Rejected";

            const statusColor = isPending ? "#D97706" : (isOngoing ? theme.brandPrimary : "#EF4444"); 
            const statusBg = isPending ? "#FEF3C7" : (isOngoing ? "#D1FAE5" : "#FEF2F2");
            
            let statusText = item.status.toUpperCase();
            if (isPending) statusText = "MENUNGGU ACC";
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
                      <Text style={{ fontSize: 13, color: theme.subText, marginBottom: 8 }}>Sewa: {item.duration} hari</Text>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: theme.brandDark }}>Rp {item.grandTotal.toLocaleString("id-ID")}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* 💡 TOMBOL BATAL (Muncul hanya jika masih Pending) */}
                {isPending && (
                  <View style={{ flexDirection: "row", marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border }}>
                    <TouchableOpacity onPress={() => handleCancel(item.transactionId)} style={{ flex: 1, backgroundColor: "#FEF2F2", paddingVertical: 10, borderRadius: 12, alignItems: "center" }}>
                      <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>Batalkan Pesanan</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}