import React, { useState, useCallback } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, 
  Platform, ScrollView, StatusBar, ActivityIndicator, BackHandler 
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegisterScreen() {
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // State untuk validasi error & pesan sukses
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // State untuk pesan sukses tanpa pop-up
  const [systemError, setSystemError] = useState(""); // State untuk error sistem

  const theme = {
    bg: "#F9FAFB", card: "white", text: "#111827", subText: "#6B7280",    
    brandPrimary: "#49C5B6", brandDark: "#2D8B81", inputBg: "#F3F4F6",
  };

  const clearErrors = () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setSystemError("");
  };

  const handleRegister = async () => {
    clearErrors();
    let isValid = true;

    // 1. Validasi Nama Kosong
    if (!name) { 
      setNameError("Nama tidak boleh kosong"); 
      isValid = false; 
    }

    // 2. Validasi Format Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) { 
      setEmailError("Email tidak boleh kosong"); 
      isValid = false; 
    } else if (!emailRegex.test(email)) {
      setEmailError("Format email tidak valid (contoh: nama@email.com)");
      isValid = false;
    }

    // 3. Validasi Password Minimal 8 Karakter
    if (!password) { 
      setPasswordError("Password tidak boleh kosong"); 
      isValid = false; 
    } else if (password.length < 8) {
      setPasswordError("Password harus terdiri dari minimal 8 karakter");
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      // Ambil database user saat ini
      const usersJson = await AsyncStorage.getItem("@users");
      const users = usersJson ? JSON.parse(usersJson) : [];

      // Validasi apakah email sudah dipakai
      const existingUser = users.find((u: any) => u.email === email);
      if (existingUser) {
        setEmailError("Email ini sudah digunakan oleh akun lain.");
        setIsLoading(false);
        return;
      }

      // Simpan user baru ke database lokal
      const newUser = { name, email, password };
      users.push(newUser);
      await AsyncStorage.setItem("@users", JSON.stringify(users));

      setIsLoading(false);
      
      // Munculkan notifikasi sukses (TANPA POP-UP)
      setSuccessMsg("Akun berhasil dibuat! Mengalihkan ke halaman Login...");

      // Tunggu 2 detik, lalu otomatis pindah ke halaman login
      setTimeout(() => {
        router.back();
      }, 2000);

    } catch (error: any) {
      setIsLoading(false);
      setSystemError("Terjadi kesalahan pada sistem, coba lagi nanti.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" translucent={true} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingTop: 60 }}>
        
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 32, fontWeight: "900", color: theme.brandDark }}>Buat Akun</Text>
          <Text style={{ fontSize: 15, color: theme.subText, marginTop: 4, lineHeight: 22 }}>
            Bergabung dengan Sewaja dan mulai menyewa barang dengan mudah.
          </Text>
        </View>

        <View style={{ backgroundColor: "white", padding: 24, borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 12, elevation: 3, marginBottom: 40 }}>
          
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

          {/* INPUT NAMA */}
          <Text style={{ fontWeight: "700", fontSize: 13, color: theme.text, marginBottom: 8, marginLeft: 4 }}>Full Name</Text>
          <View style={{ 
            flexDirection: "row", alignItems: "center", backgroundColor: theme.inputBg, 
            borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: nameError ? 4 : 16,
            borderWidth: 1, borderColor: nameError ? "red" : "#E5E7EB"
          }}>
            <Feather name="user" size={18} color={nameError ? "red" : theme.subText} style={{ marginRight: 10 }} />
            <TextInput 
              placeholder="John Doe" placeholderTextColor="#9CA3AF" value={name}
              onChangeText={(text) => { setName(text); setNameError(""); }}
              editable={!isLoading && !successMsg} // Disable input jika sedang loading atau sukses
              style={{ flex: 1, color: theme.text, fontWeight: "600", fontSize: 15 }}
            />
          </View>
          {nameError ? <Text style={{ color: "red", fontSize: 12, marginLeft: 4, marginBottom: 12, fontWeight: "500" }}>{nameError}</Text> : null}

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
              onChangeText={(text) => { setEmail(text); setEmailError(""); }}
              keyboardType="email-address" autoCapitalize="none" editable={!isLoading && !successMsg}
              style={{ flex: 1, color: theme.text, fontWeight: "600", fontSize: 15 }}
            />
          </View>
          {emailError ? <Text style={{ color: "red", fontSize: 12, marginLeft: 4, marginBottom: 12, fontWeight: "500" }}>{emailError}</Text> : null}

          {/* INPUT PASSWORD */}
          <Text style={{ fontWeight: "700", fontSize: 13, color: theme.text, marginBottom: 8, marginLeft: 4 }}>Password</Text>
          <View style={{ 
            flexDirection: "row", alignItems: "center", backgroundColor: theme.inputBg, 
            borderRadius: 14, paddingHorizontal: 16, height: 52, marginBottom: passwordError ? 4 : 28,
            borderWidth: 1, borderColor: passwordError ? "red" : "#E5E7EB"
          }}>
            <Feather name="lock" size={18} color={passwordError ? "red" : theme.subText} style={{ marginRight: 10 }} />
            <TextInput 
              placeholder="Minimal 8 Karakter" placeholderTextColor="#9CA3AF" value={password}
              onChangeText={(text) => { setPassword(text); setPasswordError(""); }}
              secureTextEntry={secureText} autoCapitalize="none" editable={!isLoading && !successMsg}
              style={{ flex: 1, color: theme.text, fontWeight: "600", fontSize: 15 }}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subText} />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={{ color: "red", fontSize: 12, marginLeft: 4, marginBottom: 24, fontWeight: "500", marginTop: -12 }}>{passwordError}</Text> : null}

          {/* BUTTON REGISTER */}
          <TouchableOpacity 
            activeOpacity={0.8} onPress={handleRegister} disabled={isLoading || !!successMsg} // Disable kalau sukses biar nggak di-klik 2 kali
            style={{ backgroundColor: isLoading || successMsg ? "#9CA3AF" : theme.brandPrimary, height: 54, borderRadius: 16, justifyContent: "center", alignItems: "center", marginBottom: 16, flexDirection: "row" }}
          >
            {isLoading && <ActivityIndicator color="white" style={{ marginRight: 8 }} />}
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
              {isLoading ? "Memproses..." : successMsg ? "Berhasil!" : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: theme.subText, fontSize: 14 }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()} disabled={!!successMsg}>
              <Text style={{ color: successMsg ? "#9CA3AF" : theme.brandPrimary, fontWeight: "700", fontSize: 14 }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}