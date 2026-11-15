import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Modal } from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import { useProducts } from "../../context/ProductContext";

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { products } = useProducts();

  const stringId = Array.isArray(id) ? id[0] : id;
  const product = products.find((item) => String(item.id) === String(stringId));

  const [availableDates, setAvailableDates] = useState<any[]>([]);
  const [bookedRanges, setBookedRanges] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [duration, setDuration] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  
  const [ktpUri, setKtpUri] = useState<string | null>(null); 
  const [selfieUri, setSelfieUri] = useState<string | null>(null); 
  const [isVerifying, setIsVerifying] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false); 

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState("BCA Virtual Account");

  const theme = { bg: "#F9FAFB", card: "white", text: "#111827", subText: "#6B7280", border: "#E5E7EB", brandPrimary: "#49C5B6", brandDark: "#2D8B81", badgeBg: "#EEFDFB", inputBg: "#F3F4F6" };

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const historyJson = await AsyncStorage.getItem("@historyRents");
        if (historyJson) {
          const history = JSON.parse(historyJson);
          const productBookings = history.filter((tx: any) => 
            String(tx.productId) === String(stringId) && 
            (tx.status === "Ongoing" || tx.status === "Pending") &&
            tx.startDateIso
          );
          
          const ranges = productBookings.map((tx: any) => ({
            start: new Date(tx.startDateIso).setHours(0,0,0,0),
            end: new Date(tx.endDateIso).setHours(0,0,0,0)
          }));
          setBookedRanges(ranges);
        }
      } catch (error) { console.error(error); }
    };
    fetchBookedDates();
  }, [stringId]);

  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({ fullDate: d, dayName: i === 0 ? "Hari Ini" : i === 1 ? "Besok" : dayNames[d.getDay()], dateNum: d.getDate(), monthStr: monthNames[d.getMonth()], year: d.getFullYear() });
    }
    setAvailableDates(dates);
    
    const firstAvailable = dates.find(item => !isDateBooked(item.fullDate));
    if (firstAvailable) setSelectedDate(firstAvailable);
  }, [bookedRanges]);

  const isDateBooked = (dateObj: Date) => {
    const current = new Date(dateObj).setHours(0,0,0,0);
    return bookedRanges.some(range => current >= range.start && current <= range.end);
  };

  const handleAddDuration = () => {
    const nextDuration = duration + 1;
    const nextEndD = new Date(selectedDate.fullDate);
    nextEndD.setDate(nextEndD.getDate() + nextDuration);
    
    const endTimestamp = nextEndD.setHours(0,0,0,0);
    const startTimestamp = selectedDate.fullDate.setHours(0,0,0,0);
    const isConflict = bookedRanges.some(range => (startTimestamp <= range.end && endTimestamp >= range.start));
    
    if (isConflict) {
      Alert.alert("Jadwal Terbatas", "Anda tidak bisa menambah hari lagi karena menabrak jadwal penyewa lain.");
    } else {
      setDuration(nextDuration);
    }
  };

  const handleSelectDate = (item: any) => {
    setSelectedDate(item);
    setDuration(1);
  };

  if (!product) return null;

  const getReturnDateObj = () => {
    if (!selectedDate) return new Date();
    const returnD = new Date(selectedDate.fullDate);
    returnD.setDate(returnD.getDate() + duration);
    return returnD;
  };

  const getReturnDate = () => {
    const returnD = getReturnDateObj();
    return `${dayNames[returnD.getDay()]}, ${returnD.getDate()} ${monthNames[returnD.getMonth()]} ${returnD.getFullYear()}`;
  };

  const rawPrice = parseInt(product.price.replace(/[^0-9]/g, "")) || 0;
  const subTotal = rawPrice * duration;
  const serviceFee = 15000;
  const deliveryFee = deliveryMethod === "delivery" ? 25000 : 0; 
  const grandTotal = subTotal + serviceFee + deliveryFee; 
  const dpPaid = Math.round(grandTotal * 0.3); 
  const sisaTagihan = grandTotal - dpPaid;

  const handleUploadKTP = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) return Alert.alert("Akses Ditolak", "Izinkan akses galeri untuk unggah KTP.");
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) setKtpUri(result.assets[0].uri);
  };

  const handleTakeSelfie = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) return Alert.alert("Akses Ditolak", "Izinkan akses kamera untuk mengambil foto wajah.");
    let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.8, cameraType: ImagePicker.CameraType.front });
    if (!result.canceled) setSelfieUri(result.assets[0].uri);
  };

  const checkFaceMatchAPI = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    setIsVerifying(false);
    return true; 
  };

  const handlePrePaymentCheck = async () => {
    if (!ktpUri || !selfieUri) return Alert.alert("Data Tidak Lengkap", "Kamu WAJIB mengunggah foto KTP dan Selfie Wajah.");
    const end = getReturnDateObj().setHours(0,0,0,0);
    const start = selectedDate.fullDate.setHours(0,0,0,0);
    const isConflict = bookedRanges.some(range => (start <= range.end && end >= range.start));
    if (isConflict) return Alert.alert("Jadwal Penuh", "Durasi menabrak jadwal sewa orang lain.");
    const isFaceMatch = await checkFaceMatchAPI();
    if (!isFaceMatch) return;
    setShowPaymentModal(true);
  };

  const handleFinalCheckout = async () => {
    setShowPaymentModal(false);
    setIsProcessing(true);

    try {
      const currentUserJson = await AsyncStorage.getItem("@currentUser");
      const currentUser = currentUserJson ? JSON.parse(currentUserJson) : { email: "guest" };
      
      // 💡 FIX: AMBIL IDENTITAS PEMILIK BARANG
      const productOwnerEmail = (product as any).userEmail || "admin@sewaja.com";

      const newTransaction = {
        transactionId: "TRX-" + Date.now(),
        userEmail: currentUser.email, // <--- Si Penyewa
        ownerEmail: productOwnerEmail, // <--- Si Pemilik Barang (Untuk Tab Pesanan Masuk)
        productId: product.id,
        title: product.title,
        image: product.image,
        grandTotal: grandTotal,
        dpPaid: dpPaid,
        sisaTagihan: sisaTagihan,
        paymentMethod: selectedBank,
        ktpProof: ktpUri,
        selfieProof: selfieUri,
        date: `${selectedDate.dateNum} ${selectedDate.monthStr} ${selectedDate.year}`,
        endDate: getReturnDate(),
        startDateIso: selectedDate.fullDate.toISOString(),
        endDateIso: getReturnDateObj().toISOString(), 
        status: "Pending", 
        duration: duration,
        method: deliveryMethod,
        renterName: currentUser.name // Tambahan nama penyewa agar owner tahu
      };

      const existingHistoryJson = await AsyncStorage.getItem("@historyRents");
      const existingHistory = existingHistoryJson ? JSON.parse(existingHistoryJson) : [];
      await AsyncStorage.setItem("@historyRents", JSON.stringify([newTransaction, ...existingHistory]));

      setTimeout(() => {
        setIsProcessing(false);
        Alert.alert(
          "Pembayaran DP Berhasil! 🎉",
          `Pembayaran via ${selectedBank} telah diverifikasi. Menunggu persetujuan owner.`,
          [{ text: "Lihat Resi", onPress: () => router.replace("/profile/history-rents") }]
        );
      }, 1500);

    } catch (error) {
      setIsProcessing(false);
      Alert.alert("Gagal", "Terjadi kesalahan sistem.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={true} />
      
      <Modal visible={showPaymentModal} transparent={true} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "white", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 40, elevation: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: theme.text }}>Pilih Pembayaran</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}><Ionicons name="close-circle" size={28} color={theme.subText} /></TouchableOpacity>
            </View>

            <View style={{ backgroundColor: theme.badgeBg, padding: 16, borderRadius: 16, alignItems: "center", marginBottom: 24, borderWidth: 1, borderColor: theme.brandPrimary }}>
              <Text style={{ fontSize: 13, color: theme.brandDark, fontWeight: "600", marginBottom: 4 }}>Total DP (30%)</Text>
              <Text style={{ fontSize: 28, fontWeight: "900", color: theme.brandDark }}>Rp {dpPaid.toLocaleString("id-ID")}</Text>
            </View>

            <Text style={{ fontSize: 14, fontWeight: "700", color: theme.text, marginBottom: 12 }}>Transfer Bank & E-Wallet</Text>
            
            <View style={{ marginBottom: 24 }}>
              {["BCA Virtual Account", "Mandiri Virtual Account", "GoPay", "QRIS"].map((bank, index) => (
                <TouchableOpacity 
                  key={index} activeOpacity={0.7} onPress={() => setSelectedBank(bank)}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: selectedBank === bank ? theme.badgeBg : theme.inputBg, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: selectedBank === bank ? theme.brandPrimary : "transparent" }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: selectedBank === bank ? theme.brandDark : theme.text }}>{bank}</Text>
                  <Ionicons name={selectedBank === bank ? "radio-button-on" : "radio-button-off"} size={22} color={selectedBank === bank ? theme.brandPrimary : theme.subText} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              activeOpacity={0.8} onPress={handleFinalCheckout} 
              style={{ backgroundColor: theme.brandPrimary, paddingVertical: 16, borderRadius: 16, justifyContent: "center", alignItems: "center", shadowColor: theme.brandPrimary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Bayar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "white", flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.inputBg, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        {/* Konten UI Sisanya 100% Persis (Produk, Tanggal, Metode, KYC, Tagihan) */}
        
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16, marginBottom: 24, flexDirection: "row", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <Image source={{ uri: product.image }} style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: theme.inputBg, marginRight: 16 }} />
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.brandPrimary, marginBottom: 4 }}>{product.category}</Text>
            <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 8 }}>{product.title}</Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: theme.brandDark }}>{product.price}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginBottom: 12 }}>Tanggal Mulai Sewa</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 10 }}>
            {availableDates.map((item, index) => {
              const isSelected = selectedDate?.dateNum === item.dateNum && selectedDate?.monthStr === item.monthStr;
              const isBooked = isDateBooked(item.fullDate); 
              return (
                <TouchableOpacity
                  key={index} activeOpacity={0.8} 
                  onPress={() => !isBooked && handleSelectDate(item)}
                  disabled={isBooked}
                  style={{ width: 72, height: 84, backgroundColor: isBooked ? theme.border : (isSelected ? theme.brandPrimary : theme.card), borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12, borderWidth: 2, borderColor: isSelected ? theme.brandPrimary : "transparent", shadowColor: isSelected ? theme.brandPrimary : "#000", shadowOpacity: isSelected ? 0.3 : 0.04, shadowRadius: 8, elevation: 3, opacity: isBooked ? 0.5 : 1 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: isSelected ? "rgba(255,255,255,0.9)" : theme.subText, marginBottom: 4 }}>{isBooked ? "Penuh" : item.dayName}</Text>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: isSelected ? "white" : theme.text, marginBottom: 2, textDecorationLine: isBooked ? 'line-through' : 'none' }}>{item.dateNum}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: isSelected ? "rgba(255,255,255,0.9)" : theme.subText }}>{item.monthStr}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginBottom: 12 }}>Durasi & Pengembalian</Text>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <View><Text style={{ fontSize: 15, fontWeight: "700", color: theme.text }}>Berapa Hari?</Text></View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.inputBg, borderRadius: 16, padding: 4 }}>
              <TouchableOpacity onPress={() => setDuration(Math.max(1, duration - 1))} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "white", justifyContent: "center", alignItems: "center" }}><Ionicons name="remove" size={20} color={theme.text} /></TouchableOpacity>
              <Text style={{ marginHorizontal: 16, fontSize: 16, fontWeight: "800", color: theme.text }}>{duration}</Text>
              <TouchableOpacity onPress={handleAddDuration} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "white", justifyContent: "center", alignItems: "center" }}><Ionicons name="add" size={20} color={theme.text} /></TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 16 }} />
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.badgeBg, padding: 14, borderRadius: 16 }}>
            <Ionicons name="calendar" size={20} color={theme.brandDark} style={{ marginRight: 12 }} />
            <View>
              <Text style={{ fontSize: 12, color: theme.brandDark, fontWeight: "600", marginBottom: 2 }}>Harus dikembalikan pada:</Text>
              <Text style={{ fontSize: 14, color: theme.brandDark, fontWeight: "800" }}>{getReturnDate()}</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginBottom: 12 }}>Metode Pengambilan</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setDeliveryMethod("pickup")} style={{ flex: 1, backgroundColor: deliveryMethod === "pickup" ? theme.badgeBg : theme.card, borderRadius: 20, padding: 16, marginRight: 8, borderWidth: 2, borderColor: deliveryMethod === "pickup" ? theme.brandPrimary : "transparent", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: deliveryMethod === "pickup" ? theme.brandPrimary : theme.inputBg, justifyContent: "center", alignItems: "center", marginBottom: 10 }}><Ionicons name="storefront" size={20} color={deliveryMethod === "pickup" ? "white" : theme.subText} /></View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: deliveryMethod === "pickup" ? theme.brandDark : theme.text }}>Ambil Sendiri</Text>
            <Text style={{ fontSize: 12, color: theme.subText, marginTop: 4 }}>Gratis</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => setDeliveryMethod("delivery")} style={{ flex: 1, backgroundColor: deliveryMethod === "delivery" ? theme.badgeBg : theme.card, borderRadius: 20, padding: 16, marginLeft: 8, borderWidth: 2, borderColor: deliveryMethod === "delivery" ? theme.brandPrimary : "transparent", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, alignItems: "center" }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: deliveryMethod === "delivery" ? theme.brandPrimary : theme.inputBg, justifyContent: "center", alignItems: "center", marginBottom: 10 }}><Ionicons name="bicycle" size={22} color={deliveryMethod === "delivery" ? "white" : theme.subText} /></View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: deliveryMethod === "delivery" ? theme.brandDark : theme.text }}>Dikirim Owner</Text>
            <Text style={{ fontSize: 12, color: theme.subText, marginTop: 4 }}>+ Rp 25.000</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginBottom: 12 }}>KYC Verification</Text>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleUploadKTP} style={{ flex: 1, height: 140, backgroundColor: theme.inputBg, borderRadius: 16, marginRight: 8, borderWidth: ktpUri ? 0 : 2, borderStyle: ktpUri ? "solid" : "dashed", borderColor: theme.brandPrimary, overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
              {ktpUri ? <Image source={{ uri: ktpUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : <View style={{ alignItems: "center" }}><Ionicons name="card" size={32} color={theme.brandPrimary} /><Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginTop: 8 }}>Foto KTP</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={handleTakeSelfie} style={{ flex: 1, height: 140, backgroundColor: theme.inputBg, borderRadius: 16, marginLeft: 8, borderWidth: selfieUri ? 0 : 2, borderStyle: selfieUri ? "solid" : "dashed", borderColor: theme.brandPrimary, overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
              {selfieUri ? <Image source={{ uri: selfieUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : <View style={{ alignItems: "center" }}><MaterialIcons name="face-retouching-natural" size={34} color={theme.brandPrimary} /><Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginTop: 8 }}>Selfie Wajah</Text></View>}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text, marginBottom: 12 }}>Rincian Tagihan</Text>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: theme.subText, fontSize: 14 }}>Sewa ({duration} hari)</Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>Rp {subTotal.toLocaleString("id-ID")}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <Text style={{ color: theme.subText, fontSize: 14 }}>Biaya Layanan</Text>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>Rp {serviceFee.toLocaleString("id-ID")}</Text>
          </View>
          
          <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 16, borderStyle: "dashed", borderWidth: 1, borderColor: theme.border }} />
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>Total Biaya</Text>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>Rp {grandTotal.toLocaleString("id-ID")}</Text>
          </View>

          <View style={{ backgroundColor: "#FEF3C7", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
            <Text style={{ color: "#D97706", fontSize: 14, fontWeight: "700" }}>DP Dibayar Sekarang (30%)</Text>
            <Text style={{ color: "#D97706", fontSize: 14, fontWeight: "800" }}>- Rp {dpPaid.toLocaleString("id-ID")}</Text>
          </View>

          <View style={{ backgroundColor: theme.badgeBg, padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: theme.brandDark, fontSize: 14, fontWeight: "700" }}>Sisa Pelunasan</Text>
            <Text style={{ color: theme.brandDark, fontSize: 14, fontWeight: "800" }}>Rp {sisaTagihan.toLocaleString("id-ID")}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: "white", borderTopWidth: 1, borderTopColor: theme.border, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.subText, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>DP (Bayar Awal)</Text>
          <Text style={{ color: theme.brandDark, fontSize: 20, fontWeight: "900" }}>Rp {dpPaid.toLocaleString("id-ID")}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={handlePrePaymentCheck} disabled={isProcessing || isVerifying} style={{ width: "50%", backgroundColor: isProcessing || isVerifying ? "#9CA3AF" : theme.brandPrimary, paddingVertical: 16, borderRadius: 16, justifyContent: "center", alignItems: "center", shadowColor: theme.brandPrimary, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 }}>
          {isVerifying || isProcessing ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Bayar DP Saja</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}