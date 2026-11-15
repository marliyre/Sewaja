import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProducts } from "../../../context/ProductContext"; 

export default function RentDetailScreen() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const { products } = useProducts();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const theme = { bg: "#F9FAFB", card: "white", text: "#111827", subText: "#6B7280", border: "#E5E7EB", brandPrimary: "#49C5B6", brandDark: "#2D8B81", badgeBg: "#EEFDFB", inputBg: "#F3F4F6" };

  useEffect(() => {
    const init = async () => {
      const userJson = await AsyncStorage.getItem("@currentUser");
      if (userJson) setCurrentUser(JSON.parse(userJson));
      await fetchTransactionDetails();
    };
    init();
  }, [id]);

  const fetchTransactionDetails = async () => {
    try {
      const historyJson = await AsyncStorage.getItem("@historyRents");
      if (historyJson) {
        const history = JSON.parse(historyJson);
        const foundTx = history.find((t: any) => String(t.transactionId) === String(id));
        setTransaction(foundTx);
      }
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  if (isLoading || !transaction) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={theme.brandPrimary} /></View>;

  // 💡 LOGIKA CERDAS: CEK SIAPA YANG MEMBUKA RESI INI
  const isRenter = currentUser?.email === transaction.userEmail;
  const isOwner = currentUser?.email === transaction.ownerEmail;

  // --- LOGIKA DENDA KETERLAMBATAN ---
  const today = new Date();
  const endDateObj = new Date(transaction.endDateIso);
  const isLate = today > endDateObj && transaction.status !== "Completed";
  const penaltyFee = isLate ? Math.round(transaction.sisaTagihan * 0.1) : 0; 
  const totalHarusDibayar = transaction.sisaTagihan + penaltyFee;
  
  const isLunas = transaction.status === "Completed" || transaction.sisaTagihan <= 0;

  // --- FUNGSI TAMBAH HARI (KHUSUS PENYEWA - TANPA POPUP) ---
  const handleAddDay = async () => {
    setIsProcessing(true);
    try {
      const historyJson = await AsyncStorage.getItem("@historyRents");
      let history = JSON.parse(historyJson!);
      let txIndex = history.findIndex((t: any) => String(t.transactionId) === String(id));

      const dailyPrice = transaction.grandTotal / transaction.duration;
      history[txIndex].duration += 1;
      history[txIndex].grandTotal += dailyPrice;
      history[txIndex].sisaTagihan += dailyPrice; 

      const newEndD = new Date(history[txIndex].endDateIso);
      newEndD.setDate(newEndD.getDate() + 1);
      history[txIndex].endDateIso = newEndD.toISOString();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      history[txIndex].endDate = `${newEndD.getDate()} ${monthNames[newEndD.getMonth()]} ${newEndD.getFullYear()}`;

      await AsyncStorage.setItem("@historyRents", JSON.stringify(history));
      setTransaction(history[txIndex]);
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  // --- FUNGSI UBAH METODE (KHUSUS PENYEWA - TANPA POPUP) ---
  const handleChangeMethod = async () => {
    setIsProcessing(true);
    try {
      const historyJson = await AsyncStorage.getItem("@historyRents");
      let history = JSON.parse(historyJson!);
      let txIndex = history.findIndex((t: any) => String(t.transactionId) === String(id));
      
      const currentMethod = history[txIndex].method;
      const newMethod = currentMethod === "delivery" ? "pickup" : "delivery";
      let feeDiff = newMethod === "delivery" ? 25000 : -25000;
      
      history[txIndex].method = newMethod;
      history[txIndex].grandTotal += feeDiff;
      history[txIndex].sisaTagihan += feeDiff;

      await AsyncStorage.setItem("@historyRents", JSON.stringify(history));
      setTransaction(history[txIndex]);
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  // --- FUNGSI PELUNASAN (KHUSUS PENYEWA) ---
  const handlePelunasan = async () => {
    setIsProcessing(true);
    try {
      const historyJson = await AsyncStorage.getItem("@historyRents");
      let history = JSON.parse(historyJson!);
      let txIndex = history.findIndex((t: any) => String(t.transactionId) === String(id));

      // 💡 FIX: HANYA MENGUBAH SISA TAGIHAN JADI 0, STATUS TETAP DIBIARKAN
      // Agar tombol ACC & Tolak milik Owner tidak hilang meskipun sudah lunas!
      history[txIndex].sisaTagihan = 0; 

      await AsyncStorage.setItem("@historyRents", JSON.stringify(history));
      setTransaction(history[txIndex]);
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  // --- FUNGSI ACC / TOLAK (KHUSUS OWNER) ---
  const handleOwnerAction = async (newStatus: string) => {
    setIsProcessing(true);
    try {
      const historyJson = await AsyncStorage.getItem("@historyRents");
      let history = JSON.parse(historyJson!);
      let txIndex = history.findIndex((t: any) => String(t.transactionId) === String(id));

      history[txIndex].status = newStatus; // "Ongoing" untuk ACC, "Rejected" untuk Tolak

      await AsyncStorage.setItem("@historyRents", JSON.stringify(history));
      setTransaction(history[txIndex]);
    } catch (error) { console.error(error); }
    setIsProcessing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={true} />
      
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "white", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.inputBg, justifyContent: "center", alignItems: "center", marginRight: 16 }}><Ionicons name="arrow-back" size={22} color={theme.text} /></TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>Resi Penyewaan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        {/* STATUS PESANAN */}
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: theme.subText }}>Status</Text>
            <View style={{ backgroundColor: transaction.status === "Pending" ? "#FEF3C7" : theme.badgeBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: transaction.status === "Pending" ? "#D97706" : theme.brandPrimary }}>
                {transaction.status === "Pending" ? (isOwner ? "PERLU DI-ACC" : "MENUNGGU ACC") : transaction.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 12 }} />
          <Text style={{ fontSize: 12, color: theme.subText }}>No. Transaksi: <Text style={{ fontWeight: "700", color: theme.text }}>{transaction.transactionId}</Text></Text>
        </View>

        {/* BARANG DISEWA */}
        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginBottom: 12, marginLeft: 4 }}>Barang</Text>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row" }}>
            <Image source={{ uri: transaction.image }} style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: theme.inputBg, marginRight: 16 }} />
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 8 }}>{transaction.title}</Text>
              
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: theme.subText }}>Durasi: {transaction.duration} Hari</Text>
                
                {/* TOMBOL TAMBAH HARI: HANYA UNTUK PENYEWA */}
                {isRenter && transaction.status !== "Completed" && transaction.status !== "Canceled" && transaction.status !== "Rejected" && (
                  <TouchableOpacity onPress={handleAddDay} disabled={isProcessing} style={{ backgroundColor: theme.badgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: theme.brandPrimary }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: theme.brandDark }}>+ Tambah Hari</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={{ fontSize: 13, color: theme.subText, marginTop: 4 }}>Pengembalian: <Text style={{ fontWeight: "700", color: theme.text }}>{transaction.endDate}</Text></Text>
            </View>
          </View>
        </View>

        {/* INFORMASI PENYEWA & PENGIRIMAN */}
        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginBottom: 12, marginLeft: 4 }}>Informasi Penyewa</Text>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: theme.subText, fontSize: 14 }}>Nama Penyewa</Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: "700" }}>{transaction.renterName || "User"}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: theme.subText, fontSize: 14 }}>Metode Pembayaran</Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: "700" }}>{transaction.paymentMethod}</Text>
          </View>
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <View>
              <Text style={{ color: theme.subText, fontSize: 14 }}>Pengiriman</Text>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "700" }}>{transaction.method === "delivery" ? "Dikirim Owner" : "Ambil Sendiri"}</Text>
            </View>
            
            {/* TOMBOL UBAH METODE: HANYA UNTUK PENYEWA */}
            {isRenter && transaction.status !== "Completed" && transaction.status !== "Canceled" && transaction.status !== "Rejected" && (
              <TouchableOpacity onPress={handleChangeMethod} disabled={isProcessing} style={{ justifyContent: "center", backgroundColor: theme.badgeBg, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.brandPrimary }}>
                <Text style={{ color: theme.brandDark, fontWeight: "800", fontSize: 11 }}>Ganti Metode</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* KYC KTP & SELFIE: HANYA DITAMPILKAN UNTUK PEMILIK BARANG (OWNER) */}
          {isOwner && (
            <>
              <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 16, borderStyle: "dashed", borderWidth: 1, borderColor: theme.border }} />
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "700", marginBottom: 12 }}>Dokumen Identitas (KYC)</Text>
              <View style={{ flexDirection: "row" }}>
                <View style={{ flex: 1, height: 100, backgroundColor: theme.inputBg, borderRadius: 12, marginRight: 8, overflow: "hidden" }}>
                  {transaction.ktpProof ? (
                    <Image source={{ uri: transaction.ktpProof }} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />
                  ) : (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ fontSize: 12, color: theme.subText, fontWeight: "600" }}>KTP Tidak Ada</Text></View>
                  )}
                </View>
                <View style={{ flex: 1, height: 100, backgroundColor: theme.inputBg, borderRadius: 12, marginLeft: 8, overflow: "hidden" }}>
                  {transaction.selfieProof ? (
                    <Image source={{ uri: transaction.selfieProof }} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />
                  ) : (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={{ fontSize: 12, color: theme.subText, fontWeight: "600" }}>Selfie Tidak Ada</Text></View>
                  )}
                </View>
              </View>
            </>
          )}
        </View>

        {/* RINCIAN PEMBAYARAN & DENDA */}
        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginBottom: 12, marginLeft: 4 }}>Pembayaran & Pelunasan</Text>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: theme.subText, fontSize: 14 }}>Total Transaksi</Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>Rp {transaction.grandTotal.toLocaleString("id-ID")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: theme.subText, fontSize: 14 }}>DP Awal (Sudah Bayar)</Text>
            <Text style={{ color: "#10B981", fontSize: 14, fontWeight: "700" }}>- Rp {transaction.dpPaid.toLocaleString("id-ID")}</Text>
          </View>

          {/* DENDA MUNCUL JIKA TELAT & BELUM LUNAS */}
          {isLate && !isLunas && (
            <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View>
                <Text style={{ color: "#B91C1C", fontSize: 14, fontWeight: "700" }}>Denda Keterlambatan (10%)</Text>
                <Text style={{ color: "#B91C1C", fontSize: 11, marginTop: 2 }}>Melewati batas {transaction.endDate}</Text>
              </View>
              <Text style={{ color: "#B91C1C", fontSize: 14, fontWeight: "800" }}>+ Rp {penaltyFee.toLocaleString("id-ID")}</Text>
            </View>
          )}
          
          <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 16, borderStyle: "dashed", borderWidth: 1, borderColor: theme.border }} />
          
          {/* SISA HARUS DIBAYAR (OTOMATIS LUNAS) */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: (isRenter && !isLunas) || (isOwner && transaction.status === "Pending") ? 20 : 10 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>Sisa Harus Dibayar</Text>
            <Text style={{ color: isLunas ? "#10B981" : theme.brandPrimary, fontSize: 18, fontWeight: "900" }}>
              {isLunas ? "LUNAS" : `Rp ${totalHarusDibayar.toLocaleString("id-ID")}`}
            </Text>
          </View>

          {/* TOMBOL PELUNASAN: HANYA UNTUK PENYEWA JIKA BELUM LUNAS */}
          {isRenter && !isLunas && transaction.status !== "Canceled" && transaction.status !== "Rejected" && (
            <TouchableOpacity onPress={handlePelunasan} disabled={isProcessing} style={{ backgroundColor: theme.brandPrimary, height: 50, borderRadius: 16, justifyContent: "center", alignItems: "center", flexDirection: "row" }}>
              <Ionicons name="wallet" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: "white", fontSize: 15, fontWeight: "800" }}>Bayar Pelunasan</Text>
            </TouchableOpacity>
          )}

          {/* 💡 TOMBOL ACC & TOLAK: HANYA UNTUK OWNER JIKA STATUS PENDING */}
          {isOwner && transaction.status === "Pending" && (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity onPress={() => handleOwnerAction("Rejected")} disabled={isProcessing} style={{ flex: 1, backgroundColor: "#FEF2F2", height: 50, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 8 }}>
                <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "800" }}>Tolak Pesanan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleOwnerAction("Ongoing")} disabled={isProcessing} style={{ flex: 1, backgroundColor: theme.brandPrimary, height: 50, borderRadius: 16, justifyContent: "center", alignItems: "center", marginLeft: 8 }}>
                <Text style={{ color: "white", fontSize: 15, fontWeight: "800" }}>Terima (ACC)</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

      </ScrollView>
    </View>
  );
}