import React, { useState, useEffect } from "react";
import { 
  View, Text, ScrollView, Image, TouchableOpacity, Modal, 
  TextInput, KeyboardAvoidingView, Platform, Alert, StatusBar 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker"; // Modul untuk buka Galeri

export default function ProfileScreen() {
  const router = useRouter(); 
  const [isModalVisible, setIsModalVisible] = useState(false);

  // State data profil
  const [name, setName] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [phone, setPhone] = useState("081234567890"); 
  const [password, setPassword] = useState("********");
  
  // State khusus foto profil (Avatar default jika belum ada)
  const [avatar, setAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb");

  const theme = {
    bg: "#F9FAFB", card: "white", text: "#111827", subText: "#6B7280", border: "#E5E7EB",     
    brandPrimary: "#49C5B6", brandDark: "#2D8B81", badgeBg: "#EEFDFB", inputBg: "#F3F4F6"
  };

  // MENGAMBIL DATA AKUN SAAT HALAMAN DIMUAT
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const sessionData = await AsyncStorage.getItem("@currentUser");
        if (sessionData) {
          const user = JSON.parse(sessionData);
          setName(user.name);
          setEmail(user.email);
          setPassword(user.password);
          // Jika user sudah pernah ganti foto, tampilkan fotonya
          if (user.avatar) {
            setAvatar(user.avatar); 
          }
        }
      } catch (error) {
        console.error("Gagal memuat data akun", error);
      }
    };
    loadUserData();
  }, [isModalVisible]);

  // --- FUNGSI BUKA GALERI UNTUK UBAH FOTO PROFIL ---
  const handlePickImage = async () => {
    // 1. Minta izin akses galeri
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Akses Ditolak", "Kami membutuhkan izin galeri untuk mengganti foto profil Anda.");
      return;
    }

    // 2. Buka galeri HP
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Hanya izinkan foto
      allowsEditing: true, // Izinkan user memotong (crop) foto
      aspect: [1, 1], // Format rasio kotak (persegi)
      quality: 0.5, // Kompresi agar tidak terlalu berat
    });

    // 3. Jika user memilih foto (tidak batal), simpan sementara ke state
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // --- FUNGSI SIMPAN PERUBAHAN ---
  const handleSaveSettings = async () => {
    if (password.length < 8) {
      Alert.alert("Gagal", "Password harus minimal 8 karakter!");
      return;
    }

    try {
      const sessionData = await AsyncStorage.getItem("@currentUser");
      if (sessionData) {
        const currentUser = JSON.parse(sessionData);
        
        // Simpan semua perubahan (Nama, Email, Password, & Foto Profil)
        const updatedUser = { ...currentUser, name, email, password, avatar };
        
        // Update data yang sedang aktif
        await AsyncStorage.setItem("@currentUser", JSON.stringify(updatedUser));

        // Update juga di daftar seluruh akun agar data aman
        const usersJson = await AsyncStorage.getItem("@users");
        if (usersJson) {
          const users = JSON.parse(usersJson);
          const userIndex = users.findIndex((u: any) => u.email === currentUser.email);
          if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            await AsyncStorage.setItem("@users", JSON.stringify(users));
          }
        }
      }
      setIsModalVisible(false);
      Alert.alert("Sukses", "Data profil dan foto berhasil diperbarui.");
    } catch (error) {
      Alert.alert("Error", "Gagal menyimpan perubahan.");
    }
  };

  // --- FUNGSI LOGOUT ---
  const handleLogout = async () => {
    setIsModalVisible(false);
    try {
      await AsyncStorage.removeItem("@currentUser");
      router.replace("/login"); 
    } catch (error) {
      console.error("Gagal Logout", error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 60 }}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.bg} translucent={true} />
      
      {/* HEADER BAR PROFILE */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: theme.brandDark }}>Profile</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setIsModalVisible(true)} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "white", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
          <Ionicons name="settings-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10 }}>
        
        {/* USER INFO CARD */}
        <View style={{ alignItems: "center", backgroundColor: theme.card, borderRadius: 28, padding: 24, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          {/* FOTO PROFIL UTAMA */}
          <Image source={{ uri: avatar }} style={{ width: 90, height: 90, borderRadius: 45, marginBottom: 14, backgroundColor: theme.inputBg }} />
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.text }}>{name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.badgeBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginTop: 8 }}>
            <Ionicons name="checkmark-circle" size={16} color={theme.brandPrimary} style={{ marginRight: 6 }} />
            <Text style={{ color: theme.brandDark, fontWeight: "700", fontSize: 13 }}>Trusted Owner</Text>
          </View>
        </View>

        {/* MENU UTAMA PROFILE */}
        <Text style={{ fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 14, marginLeft: 4 }}>Dashboard</Text>
        <View style={{ backgroundColor: theme.card, borderRadius: 24, paddingVertical: 8, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 40 }}>
          
          <TouchableOpacity activeOpacity={0.6} onPress={() => router.push("/profile/my-products")} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.badgeBg, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
              <Ionicons name="cube-outline" size={20} color={theme.brandDark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: theme.text }}>My Products</Text>
              <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>Kelola barang yang kamu sewakan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.6} onPress={() => router.push("/profile/history-rents")} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF7ED", justifyContent: "center", alignItems: "center", marginRight: 16 }}>
              <Ionicons name="time-outline" size={20} color="#EA580C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: theme.text }}>History Rents</Text>
              <Text style={{ fontSize: 12, color: theme.subText, marginTop: 2 }}>Riwayat transaksi sewa menyewa kamu</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL SETTINGS & UBAH FOTO */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View style={{ backgroundColor: "white", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: "85%" }}>
            
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text }}>Account Settings</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* --- AREA UBAH FOTO PROFIL --- */}
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={{ position: "relative" }}>
                  <Image source={{ uri: avatar }} style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: theme.inputBg }} />
                  {/* Ikon Kamera di pojok bawah foto */}
                  <View style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: theme.brandPrimary, width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "white" }}>
                    <Ionicons name="camera" size={14} color="white" />
                  </View>
                </TouchableOpacity>
                <Text style={{ color: theme.subText, fontSize: 12, marginTop: 8 }}>Ketuk foto untuk mengubah</Text>
              </View>

              <Text style={{ fontWeight: "700", fontSize: 14, color: theme.text, marginBottom: 8 }}>Full Name</Text>
              <TextInput value={name} onChangeText={setName} style={{ backgroundColor: theme.inputBg, paddingHorizontal: 16, height: 50, borderRadius: 14, marginBottom: 16, color: theme.text, fontWeight: "600" }} />

              <Text style={{ fontWeight: "700", fontSize: 14, color: theme.text, marginBottom: 8 }}>Email Address (Tidak bisa diubah)</Text>
              <TextInput value={email} editable={false} style={{ backgroundColor: "#E5E7EB", paddingHorizontal: 16, height: 50, borderRadius: 14, marginBottom: 16, color: theme.subText, fontWeight: "600" }} />

              <Text style={{ fontWeight: "700", fontSize: 14, color: theme.text, marginBottom: 8 }}>Phone Number</Text>
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ backgroundColor: theme.inputBg, paddingHorizontal: 16, height: 50, borderRadius: 14, marginBottom: 16, color: theme.text, fontWeight: "600" }} />

              <Text style={{ fontWeight: "700", fontSize: 14, color: theme.text, marginBottom: 8 }}>Password Baru</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ backgroundColor: theme.inputBg, paddingHorizontal: 16, height: 50, borderRadius: 14, marginBottom: 24, color: theme.text, fontWeight: "600" }} />

              <TouchableOpacity activeOpacity={0.8} onPress={handleSaveSettings} style={{ backgroundColor: theme.brandPrimary, height: 54, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2", height: 54, borderRadius: 16, marginBottom: 20 }}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 16 }}>Log Out</Text>
              </TouchableOpacity>
            </ScrollView>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}