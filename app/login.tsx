import React, { useState, useCallback } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, 
  Platform, ScrollView, Image, StatusBar, ActivityIndicator, Modal, BackHandler
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();
  
  // --- KUNCI TOMBOL BACK (Kembali ke Landing Page) ---
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/"); // Lempar ke Landing Page
        return true; 
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  // State Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // State Error & Sukses (Login)
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [systemError, setSystemError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // State untuk Modal Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetName, setResetName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  // State Error & Sukses (Modal)
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const theme = {
    bg: "#F9FAFB", card: "white", text: "#111827", subText: "#6B7280",    
    brandPrimary: "#49C5B6", brandDark: "#2D8B81", inputBg: "#F3F4F6",
  };

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setSystemError("");
    setSuccessMsg("");
  };

  const clearModalState = () => {
    setModalError("");
    setModalSuccess("");
  };

  // --- FUNGSI LOGIN ---
  const handleLogin = async () => {
    clearErrors();
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validasi Email
    if (!email) { 
      setEmailError("Email tidak boleh kosong"); 
      isValid = false; 
    } else if (!emailRegex.test(email)) {
      setEmailError("Format email tidak valid");
      isValid = false;
    }

    // Validasi Password
    if (!password) { 
      setPasswordError("Password tidak boleh kosong"); 
      isValid = false; 
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      const usersJson = await AsyncStorage.getItem("@users");
      const users = usersJson ? JSON.parse(usersJson) : [];

      // Cari user (mengabaikan huruf besar/kecil)
      const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        setSystemError("Akun belum terdaftar, silakan Sign Up.");
        setIsLoading(false);
        return;
      }

      if (user.password !== password) {
        setPasswordError("Password yang Anda masukkan salah.");
        setIsLoading(false);
        return;
      }

      // Berhasil
      await AsyncStorage.setItem("@currentUser", JSON.stringify(user));
      setSuccessMsg("Login berhasil!");
      
      // FIX: Pindah halaman secara instan agar tidak stuck di "Memproses..."
      setIsLoading(false);
      router.replace("/(tabs)");

    } catch (error: any) {
      setIsLoading(false);
      setSystemError("Terjadi kesalahan pada sistem.");
    }
  };

  // --- FUNGSI FORGOT PASSWORD ---
  const handleResetPassword = async () => {
    clearModalState();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!resetEmail || !resetName || !newPassword) {
      setModalError("Semua kolom harus diisi.");
      return;
    }
    if (!emailRegex.test(resetEmail)) {
      setModalError("Format email tidak valid.");
      return;
    }
    if (newPassword.length < 8) {
      setModalError("Password baru minimal 8 karakter.");
      return;
    }

    setIsResetting(true);
    try {
      const usersJson = await AsyncStorage.getItem("@users");
      let users = usersJson ? JSON.parse(usersJson) : [];
      
      const userIndex = users.findIndex((u: any) => u.email.toLowerCase() === resetEmail.toLowerCase());

      if (userIndex === -1) {
        setModalError("Email tidak ditemukan dalam sistem kami.");
        setIsResetting(false);
        return;
      }

      // Verifikasi Keamanan: Nama Lengkap
      if (users[userIndex].name.toLowerCase() !== resetName.toLowerCase()) {
        setModalError("Nama Lengkap tidak cocok dengan data email ini.");
        setIsResetting(false);
        return;
      }

      // Simpan Password Baru
      users[userIndex].password = newPassword;
      await AsyncStorage.setItem("@users", JSON.stringify(users));

      setModalSuccess("Password berhasil diubah! Mengalihkan...");
      
      setTimeout(() => {
        setIsResetting(false);
        setShowForgotModal(false);
        setResetEmail("");
        setResetName("");
        setNewPassword("");
        clearModalState();
      }, 2000);
      
    } catch (error) {
      setIsResetting(false);
      setModalError("Gagal mereset password.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" translucent={true} />
      
      {/* MODAL FORGOT PASSWORD */}
      <Modal visible={showForgotModal} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "white", padding: 24, borderRadius: 24, elevation: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, marginBottom: 8 }}>Reset Password</Text>
            <Text style={{ fontSize: 13, color: theme.subText, marginBottom: 24 }}>Masukkan data Anda untuk memverifikasi kepemilikan akun.</Text>

            {/* Notifikasi Modal */}
            {modalSuccess ? (
              <View style={{ backgroundColor: "#D1FAE5", padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#10B981" }}>
                <Text style={{ color: "#047857", fontWeight: "700", textAlign: "center", fontSize: 13 }}>{modalSuccess}</Text>
              </View>
            ) : null}
            {modalError ? (
              <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#EF4444" }}>
                <Text style={{ color: "#B91C1C", fontWeight: "700", textAlign: "center", fontSize: 13 }}>{modalError}</Text>
              </View>
            ) : null}

            <TextInput 
              placeholder="Email Terdaftar" placeholderTextColor="#9CA3AF" value={resetEmail} onChangeText={setResetEmail}
              keyboardType="email-address" autoCapitalize="none" editable={!isResetting && !modalSuccess}
              style={{ backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB", color: theme.text }}
            />
            <TextInput 
              placeholder="Nama Lengkap Sesuai Akun" placeholderTextColor="#9CA3AF" value={resetName} onChangeText={setResetName}
              editable={!isResetting && !modalSuccess}
              style={{ backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB", color: theme.text }}
            />
            <TextInput 
              placeholder="Password Baru (Min. 8 Karakter)" placeholderTextColor="#9CA3AF" value={newPassword} onChangeText={setNewPassword}
              secureTextEntry autoCapitalize="none" editable={!isResetting && !modalSuccess}
              style={{ backgroundColor: theme.inputBg, borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB", color: theme.text }}
            />

            <TouchableOpacity onPress={handleResetPassword} disabled={isResetting || !!modalSuccess} style={{ backgroundColor: isResetting || modalSuccess ? "#9CA3AF" : theme.brandPrimary, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
              {isResetting ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "700" }}>{modalSuccess ? "Berhasil!" : "Simpan Password Baru"}</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setShowForgotModal(false); clearModalState(); }} disabled={!!modalSuccess} style={{ height: 40, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: modalSuccess ? "#9CA3AF" : theme.subText, fontWeight: "600" }}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* END MODAL */}

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingTop: 60 }}>
        
        {/* AREA LOGO */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, backgroundColor: theme.bg, borderRadius: 24, marginBottom: 16 }}>
            <Image source={require('../assets/images/logo-sewaja.png')} style={{ width: 90, height: 90, borderRadius: 24 }} />
          </View>
          <Text style={{ fontSize: 32, fontWeight: "900", color: theme.brandDark }}>Sewaja</Text>
          <Text style={{ fontSize: 14, color: theme.subText, marginTop: 4, textAlign: "center", paddingHorizontal: 10, lineHeight: 20 }}>
            Sewa barang terpercaya dan mudah di sekitarmu
          </Text>
        </View>

        <View style={{ backgroundColor: "white", padding: 24, borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, elevation: 3, marginBottom: 40 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, marginBottom: 20 }}>Welcome Back</Text>

          {/* NOTIFIKASI SUKSES (Inline) */}
          {successMsg ? (
            <View style={{ backgroundColor: "#D1FAE5", padding: 14, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: "#10B981" }}>
              <Text style={{ color: "#047857", fontWeight: "700", textAlign: "center", fontSize: 13 }}>{successMsg}</Text>
            </View>
          ) : null}

          {/* NOTIFIKASI ERROR SISTEM (Inline) */}
          {systemError ? (
            <View style={{ backgroundColor: "#FEE2E2", padding: 14, borderRadius: 14, marginBottom: 20, borderWidth: 1, borderColor: "#EF4444" }}>
              <Text style={{ color: "#B91C1C", fontWeight: "700", textAlign: "center", fontSize: 13 }}>{systemError}</Text>
            </View>
          ) : null}

          {/* INPUT EMAIL */}
          <Text style={{ fontWeight: "700", fontSize: 13, color: theme.text, marginBottom: 8, marginLeft: 4 }}>Email Address</Text>
          <View style={{ 
            flexDirection: "row", alignItems: "center", backgroundColor: theme.inputBg, 
            borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: emailError ? 4 : 16,
            borderWidth: 1, borderColor: emailError ? "red" : "#E5E7EB"
          }}>
            <Feather name="mail" size={18} color={emailError ? "red" : theme.subText} style={{ marginRight: 10 }} />
            <TextInput 
              placeholder="test@gmail.com" placeholderTextColor="#9CA3AF" value={email}
              onChangeText={(text) => { setEmail(text); setEmailError(""); setSystemError(""); }}
              keyboardType="email-address" autoCapitalize="none" editable={!isLoading && !successMsg}
              style={{ flex: 1, color: theme.text, fontWeight: "600", fontSize: 15 }}
            />
          </View>
          {emailError ? <Text style={{ color: "red", fontSize: 12, marginLeft: 4, marginBottom: 12, fontWeight: "500" }}>{emailError}</Text> : null}

          {/* INPUT PASSWORD */}
          <Text style={{ fontWeight: "700", fontSize: 13, color: theme.text, marginBottom: 8, marginLeft: 4 }}>Password</Text>
          <View style={{ 
            flexDirection: "row", alignItems: "center", backgroundColor: theme.inputBg, 
            borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: passwordError ? 4 : 12,
            borderWidth: 1, borderColor: passwordError ? "red" : "#E5E7EB"
          }}>
            <Feather name="lock" size={18} color={passwordError ? "red" : theme.subText} style={{ marginRight: 10 }} />
            <TextInput 
              placeholder="******" placeholderTextColor="#9CA3AF" value={password}
              onChangeText={(text) => { setPassword(text); setPasswordError(""); setSystemError(""); }}
              secureTextEntry={secureText} autoCapitalize="none" editable={!isLoading && !successMsg}
              style={{ flex: 1, color: theme.text, fontWeight: "600", fontSize: 15 }}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subText} />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={{ color: "red", fontSize: 12, marginLeft: 4, marginBottom: 12, fontWeight: "500" }}>{passwordError}</Text> : null}

          {/* FORGOT PASSWORD TRIGGER */}
          <TouchableOpacity onPress={() => { clearErrors(); setShowForgotModal(true); }} disabled={isLoading || !!successMsg} style={{ alignSelf: "flex-end", marginBottom: 24, marginRight: 4 }}>
            <Text style={{ color: theme.brandPrimary, fontWeight: "700", fontSize: 13 }}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* BUTTON LOGIN */}
          <TouchableOpacity 
            activeOpacity={0.8} onPress={handleLogin} disabled={isLoading || !!successMsg}
            style={{ backgroundColor: isLoading || successMsg ? "#9CA3AF" : theme.brandPrimary, height: 54, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 16, flexDirection: "row" }}
          >
            {isLoading ? <ActivityIndicator color="white" style={{ marginRight: 8 }} /> : null}
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>{isLoading ? "Memproses..." : successMsg ? "Berhasil!" : "Sign In"}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: theme.subText, fontSize: 14 }}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/register")} disabled={isLoading || !!successMsg}>
              <Text style={{ color: successMsg ? "#9CA3AF" : theme.brandPrimary, fontWeight: "700", fontSize: 14 }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}