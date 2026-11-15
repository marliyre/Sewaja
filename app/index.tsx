import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  View, Text, Image, TouchableOpacity, StatusBar, 
  ActivityIndicator, Dimensions, Animated, BackHandler, ScrollView 
} from "react-native";
import { useRouter, Redirect, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const HEADER_HEIGHT = height * 0.55;

export default function LandingPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  // --- ANIMATION VALUES ---
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Animasi untuk elemen atas (muncul berurutan saat baru buka)
  const introAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;

  // --- KUNCI TOMBOL BACK (Keluar Aplikasi) ---
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp(); 
        return true; 
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const theme = {
    bg: "#F9FAFB",         
    card: "white",         
    text: "#111827",       
    subText: "#6B7280",    
    brandPrimary: "#49C5B6", 
    brandDark: "#2D8B81",    
    badgeBg: "#EEFDFB",
    inputBg: "#F3F4F6",
    border: "#E5E7EB" // Sudah diperbaiki agar tidak error
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await AsyncStorage.getItem("@currentUser");
        if (session) setHasSession(true);
      } catch (error) {
        console.error("Gagal mengecek sesi:", error);
      } finally {
        setIsChecking(false);
      }
    };
    checkSession();
  }, []);

  // Menjalankan animasi berurutan (Stagger) saat aplikasi baru dibuka
  useEffect(() => {
    if (!isChecking && !hasSession) {
      Animated.stagger(150, [
        Animated.timing(introAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(statsAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(featuresAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]).start();
    }
  }, [isChecking, hasSession]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.brandPrimary} />
      </View>
    );
  }

  if (hasSession) return <Redirect href="/(tabs)" />;

  // --- SCROLL INTERPOLATIONS (Efek muncul perlahan saat di-scroll ke bawah) ---
  const imageScale = scrollY.interpolate({ inputRange: [-100, 0, HEADER_HEIGHT], outputRange: [1.2, 1, 1.15], extrapolate: "clamp" });
  const imageTranslateY = scrollY.interpolate({ inputRange: [0, HEADER_HEIGHT], outputRange: [0, -50], extrapolate: "clamp" });

  // Scroll reveal untuk Kategori
  const categoryOpacity = scrollY.interpolate({ inputRange: [50, 200], outputRange: [0, 1], extrapolate: "clamp" });
  const categoryTranslateY = scrollY.interpolate({ inputRange: [50, 200], outputRange: [40, 0], extrapolate: "clamp" });

  // Scroll reveal untuk Cara Kerja
  const stepsOpacity = scrollY.interpolate({ inputRange: [250, 400], outputRange: [0, 1], extrapolate: "clamp" });
  const stepsTranslateY = scrollY.interpolate({ inputRange: [250, 400], outputRange: [40, 0], extrapolate: "clamp" });

  // Scroll reveal untuk Testimoni
  const reviewOpacity = scrollY.interpolate({ inputRange: [450, 600], outputRange: [0, 1], extrapolate: "clamp" });
  const reviewTranslateY = scrollY.interpolate({ inputRange: [450, 600], outputRange: [40, 0], extrapolate: "clamp" });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle="dark-content" translucent={true} backgroundColor="transparent" />
      
      {/* HEADER PARALLAX */}
      <Animated.View style={{ 
        position: "absolute", width: width, height: HEADER_HEIGHT, backgroundColor: theme.bg,
        transform: [{ translateY: imageTranslateY }, { scale: imageScale }]
      }}>
        <Image 
          source={{ uri: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=1000" }} 
          style={{ width: "100%", height: "100%" }} 
          resizeMode="cover"
        />
        {/* Gradient halus di bawah gambar agar menyatu dengan background putih */}
        <View style={{ position: "absolute", bottom: 0, width: "100%", height: 100, backgroundColor: "rgba(255,255,255,0.8)" }} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT - 60, paddingBottom: 150 }}
      >
        <View style={{ 
          backgroundColor: "white", borderTopLeftRadius: 40, borderTopRightRadius: 40, 
          paddingBottom: 40, alignItems: "center", minHeight: height,
          shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, elevation: 10,
        }}>
          
          {/* SECTION 1: INTRO */}
          <Animated.View style={{ 
            alignItems: "center", paddingHorizontal: 28, width: "100%",
            opacity: introAnim, 
            transform: [{ translateY: introAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
          }}>
            <View style={{ 
              width: 80, height: 80, backgroundColor: "white", borderRadius: 24, 
              justifyContent: "center", alignItems: "center", marginTop: -40, 
              shadowColor: theme.brandDark, shadowOpacity: 0.12, shadowRadius: 15, elevation: 8 
            }}>
              <Image source={require('../assets/images/logo-sewaja.png')} style={{ width: 52, height: 52, borderRadius: 14 }} />
            </View>

            <Text style={{ fontSize: 13, fontWeight: "800", color: theme.brandPrimary, marginTop: 24, letterSpacing: 2 }}>SEWAJA APP</Text>
            <Text style={{ fontSize: 34, fontWeight: "900", color: theme.text, marginTop: 8, textAlign: "center", lineHeight: 42 }}>
              Sewa Apapun, {"\n"}Kapanpun.
            </Text>
            <Text style={{ fontSize: 15, color: theme.subText, textAlign: "center", marginTop: 14, lineHeight: 24 }}>
              Lebih hemat daripada beli. Temukan ribuan barang untuk disewa dari orang-orang di sekitarmu.
            </Text>
          </Animated.View>

          {/* SECTION 2: STATISTIK */}
          <Animated.View style={{ 
            flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: 32, paddingHorizontal: 20,
            opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
          }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: theme.brandDark }}>10k+</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: theme.subText, marginTop: 4 }}>Pengguna</Text>
            </View>
            <View style={{ width: 1, height: 40, backgroundColor: theme.border }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: theme.brandDark }}>5k+</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: theme.subText, marginTop: 4 }}>Barang</Text>
            </View>
            <View style={{ width: 1, height: 40, backgroundColor: theme.border }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: theme.brandDark }}>50+</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: theme.subText, marginTop: 4 }}>Kota</Text>
            </View>
          </Animated.View>

          {/* SECTION 3: FEATURES (2x2 Grid) */}
          <Animated.View style={{ 
            width: "100%", paddingHorizontal: 24, marginTop: 40,
            opacity: featuresAnim, transform: [{ translateY: featuresAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }]
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
              <View style={{ width: "48%", backgroundColor: theme.badgeBg, padding: 20, borderRadius: 24 }}>
                <Feather name="shield" size={28} color={theme.brandDark} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 4 }}>Aman</Text>
                <Text style={{ fontSize: 12, color: theme.subText, lineHeight: 18 }}>Verifikasi identitas ketat untuk keamanan.</Text>
              </View>
              <View style={{ width: "48%", backgroundColor: "#FFF7ED", padding: 20, borderRadius: 24 }}>
                <Ionicons name="wallet-outline" size={28} color="#EA580C" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 4 }}>Hemat</Text>
                <Text style={{ fontSize: 12, color: theme.subText, lineHeight: 18 }}>Harga sewa harian yang sangat terjangkau.</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ width: "48%", backgroundColor: "#F3E8FF", padding: 20, borderRadius: 24 }}>
                <Feather name="map-pin" size={28} color="#9333EA" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 4 }}>Terdekat</Text>
                <Text style={{ fontSize: 12, color: theme.subText, lineHeight: 18 }}>Cari barang dari tetangga di kotamu.</Text>
              </View>
              <View style={{ width: "48%", backgroundColor: "#E0F2FE", padding: 20, borderRadius: 24 }}>
                <MaterialCommunityIcons name="handshake-outline" size={28} color="#0284C7" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 4 }}>Cuan</Text>
                <Text style={{ fontSize: 12, color: theme.subText, lineHeight: 18 }}>Sewakan barangmu dan dapatkan uang.</Text>
              </View>
            </View>
          </Animated.View>

          {/* SECTION 4: KATEGORI POPULER (SCROLL REVEAL) */}
          <Animated.View style={{ 
            width: "100%", marginTop: 50,
            opacity: categoryOpacity, transform: [{ translateY: categoryTranslateY }]
          }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, paddingHorizontal: 24, marginBottom: 16 }}>Kategori Populer</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
              {[
                { name: "Kamera", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=300" },
                { name: "Camping", img: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=300" },
                { name: "Gaming", img: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=300" },
                { name: "Otomotif", img: "https://images.unsplash.com/photo-1558981806-ec527fa84239?q=80&w=300" }
              ].map((cat, idx) => (
                <View key={idx} style={{ marginRight: 16, alignItems: "center" }}>
                  <Image source={{ uri: cat.img }} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 8, backgroundColor: theme.inputBg }} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }}>{cat.name}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* SECTION 5: CARA KERJA (SCROLL REVEAL) */}
          <Animated.View style={{ 
            width: "100%", marginTop: 50, paddingHorizontal: 24,
            opacity: stepsOpacity, transform: [{ translateY: stepsTranslateY }]
          }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, marginBottom: 24 }}>Sangat Mudah</Text>
            
            <View style={{ flexDirection: "row", marginBottom: 24 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.badgeBg, justifyContent: "center", alignItems: "center", marginRight: 16 }}><Text style={{ color: theme.brandDark, fontWeight: "900", fontSize: 18 }}>1</Text></View>
              <View style={{ flex: 1, justifyContent: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 4 }}>Pilih Barang</Text><Text style={{ fontSize: 13, color: theme.subText, lineHeight: 20 }}>Temukan perlengkapan yang kamu butuhkan dengan harga terbaik.</Text></View>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 24 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.badgeBg, justifyContent: "center", alignItems: "center", marginRight: 16 }}><Text style={{ color: theme.brandDark, fontWeight: "900", fontSize: 18 }}>2</Text></View>
              <View style={{ flex: 1, justifyContent: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 4 }}>Booking & Chat</Text><Text style={{ fontSize: 13, color: theme.subText, lineHeight: 20 }}>Pesan langsung dan ngobrol dengan pemilik untuk lokasi pengambilan.</Text></View>
            </View>
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.badgeBg, justifyContent: "center", alignItems: "center", marginRight: 16 }}><Text style={{ color: theme.brandDark, fontWeight: "900", fontSize: 18 }}>3</Text></View>
              <View style={{ flex: 1, justifyContent: "center" }}><Text style={{ fontSize: 16, fontWeight: "800", color: theme.text, marginBottom: 4 }}>Pakai & Kembalikan</Text><Text style={{ fontSize: 13, color: theme.subText, lineHeight: 20 }}>Gunakan sesuai kebutuhanmu, dan kembalikan tepat pada waktunya.</Text></View>
            </View>
          </Animated.View>

          {/* SECTION 6: TESTIMONI (SCROLL REVEAL) */}
          <Animated.View style={{ 
            width: "100%", marginTop: 50, paddingHorizontal: 24,
            opacity: reviewOpacity, transform: [{ translateY: reviewTranslateY }]
          }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, marginBottom: 20 }}>Apa Kata Mereka?</Text>
            <View style={{ backgroundColor: theme.inputBg, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Image source={{ uri: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=150" }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: theme.text }}>Reza Rahadian</Text>
                  <View style={{ flexDirection: "row", marginTop: 2 }}>
                    {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={12} color="#F59E0B" />)}
                  </View>
                </View>
              </View>
              <Text style={{ fontSize: 14, color: theme.subText, lineHeight: 22, fontStyle: "italic" }}>
                "Nggak nyangka sewa tenda di Sewaja gampang banget. Owner-nya responsif, barangnya wangi dan bersih. Bakal langganan buat muncak bulan depan!"
              </Text>
            </View>
          </Animated.View>

        </View>
      </Animated.ScrollView>

      {/* FLOATING CTA BUTTON (Tetap di atas segalanya) */}
      <Animated.View style={{ 
        position: "absolute", bottom: 30, left: 24, right: 24, 
        opacity: introAnim, transform: [{ translateY: introAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] 
      }}>
        <TouchableOpacity 
          activeOpacity={0.9} onPress={() => router.push("/login")}
          style={{ height: 60, backgroundColor: theme.brandPrimary, borderRadius: 20, justifyContent: "center", alignItems: "center", flexDirection: "row", shadowColor: theme.brandPrimary, shadowOpacity: 0.4, shadowRadius: 15, elevation: 6 }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "800", marginRight: 10 }}>Mulai Eksplorasi</Text>
          <Ionicons name="arrow-forward" size={22} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}