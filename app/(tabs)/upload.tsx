import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator, // 💡 Tambahan untuk Loading
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProducts } from "../../context/ProductContext";

const CATEGORIES = ["Photography", "Tools", "Electronics", "Books", "Sports", "Fashion", "Vehicles", "Real Estate"];
type SpecType = { label: string; value: string; };

export default function UploadScreen() {
  const { addProduct } = useProducts();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem("@currentUser");
      if (userData) setCurrentUser(JSON.parse(userData));
    };
    fetchUser();
  }, []);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [fullAddress, setFullAddress] = useState(""); 
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [specs, setSpecs] = useState<SpecType[]>([{ label: "", value: "" }]);
  const [rentalTerms, setRentalTerms] = useState<string[]>([""]);

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // 💡 STATE BARU UNTUK POLISHING UX
  const [missingFields, setMissingFields] = useState<string[]>([]); 
  const [isPublishing, setIsPublishing] = useState(false);

  const [region, setRegion] = useState({
    latitude: -6.9175, longitude: 107.6191, latitudeDelta: 0.0122, longitudeDelta: 0.0121,
  });

  const theme = { bg: "#F9FAFB", card: "white", text: "#111827", subText: "#6B7280", border: "#E5E7EB", brandDark: "#2D8B81", brandPrimary: "#49C5B6", badgeBg: "#EEFDFB", inputBg: "#F3F4F6" };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Akses Ditolak", "Kami membutuhkan izin galeri.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) {
      setMediaFiles([...mediaFiles, ...result.assets.map((asset) => asset.uri)]);
      setMissingFields(prev => prev.filter(f => f !== "media")); // Hilangkan error merah jika sudah diisi
    }
  };

  const removeMedia = (index: number) => setMediaFiles(mediaFiles.filter((_, i) => i !== index));

  const handleMapConfirm = async () => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: region.latitude, longitude: region.longitude });
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const completeAddress = [address.street || address.name, address.streetNumber, address.district || address.subregion, address.city].filter(Boolean).join(", ");
        setFullAddress(completeAddress || "Lokasi Terpilih");
        setMissingFields(prev => prev.filter(f => f !== "address")); // Hilangkan error
      }
    } catch (error) { setFullAddress("Lokasi Terpilih"); }
    setIsMapVisible(false);
  };

  const handleAddSpec = () => setSpecs([...specs, { label: "", value: "" }]);
  const handleSpecChange = (index: number, fields: keyof SpecType, text: string) => { const updatedSpecs = [...specs]; updatedSpecs[index][fields] = text; setSpecs(updatedSpecs); };
  const handleRemoveSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));

  const handleAddTerm = () => setRentalTerms([...rentalTerms, ""]);
  const handleTermChange = (index: number, text: string) => { const updatedTerms = [...rentalTerms]; updatedTerms[index] = text; setRentalTerms(updatedTerms); };
  const handleRemoveTerm = (index: number) => setRentalTerms(rentalTerms.filter((_, i) => i !== index));

  const handlePublish = () => {
    // 💡 VALIDASI VISUAL (Mencatat field mana saja yang kosong)
    const missing = [];
    if (!title) missing.push("title");
    if (!price) missing.push("price");
    if (!fullAddress) missing.push("address");
    if (mediaFiles.length === 0) missing.push("media");

    if (missing.length > 0) {
      setMissingFields(missing);
      setErrorMessage("Harap lengkapi semua kolom yang ditandai merah.");
      return;
    }
    
    setMissingFields([]);
    setErrorMessage(""); 
    setIsPublishing(true); // 💡 Aktifkan Layar Loading

    const validSpecs = specs.filter((s) => s.label.trim() !== "" && s.value.trim() !== "");
    const validTerms = rentalTerms.filter((t) => t.trim() !== "");
    const ownerName = currentUser ? currentUser.name : "You (Owner)";
    const ownerEmail = currentUser ? currentUser.email : "guest";
    const ownerAvatar = currentUser && currentUser.avatar ? currentUser.avatar : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde";

    const newProduct = {
      id: Date.now().toString() as unknown as number, 
      userEmail: ownerEmail,
      title, category: selectedCategory,
      price: `Rp ${parseInt(price).toLocaleString("id-ID")}/day`,
      image: mediaFiles[0], allImages: mediaFiles, 
      rating: 5, reviewCount: 0, location: fullAddress, description,
      owner: { name: ownerName, role: "Verified Renter", avatar: ownerAvatar, email: ownerEmail },
      isUploadedByUser: true, specs: validSpecs, rentalTerms: validTerms,
    };

    // 💡 Jeda sebentar agar terasa seperti aplikasi "bekerja" ke server
    setTimeout(() => {
      addProduct(newProduct);
      setIsPublishing(false);
      router.replace("/(tabs)");
    }, 1200);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: theme.bg }}>
      
      {/* 💡 OVERLAY LOADING SAAT PUBLISH */}
      <Modal visible={isPublishing} transparent={true} animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "white", padding: 24, borderRadius: 20, alignItems: "center", elevation: 10 }}>
            <ActivityIndicator size="large" color={theme.brandPrimary} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "700", color: theme.text }}>Mempublikasikan...</Text>
          </View>
        </View>
      </Modal>

      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: "white", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: theme.brandDark }}>Upload Item</Text>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.badgeBg, justifyContent: "center", alignItems: "center" }}><Ionicons name="cloud-upload-outline" size={22} color={theme.brandDark} /></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        {/* CARD 1: MEDIA UPLOAD */}
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="images" size={20} color={theme.brandPrimary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>Foto & Video Barang</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
            {/* 💡 BORDER MERAH JIKA MEDIA KOSONG */}
            <TouchableOpacity onPress={pickMedia} style={{ width: 100, height: 100, borderRadius: 16, borderStyle: "dashed", borderWidth: 2, borderColor: missingFields.includes("media") ? "#EF4444" : theme.brandPrimary, backgroundColor: missingFields.includes("media") ? "#FEF2F2" : theme.badgeBg, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
              <Ionicons name="camera-outline" size={32} color={missingFields.includes("media") ? "#EF4444" : theme.brandDark} />
              <Text style={{ fontSize: 12, color: missingFields.includes("media") ? "#EF4444" : theme.brandDark, fontWeight: "700", marginTop: 6 }}>Add Media</Text>
            </TouchableOpacity>

            {mediaFiles.map((uri, index) => (
              <View key={index} style={{ width: 100, height: 100, marginRight: 12, position: "relative" }}>
                <Image source={{ uri }} style={{ width: "100%", height: "100%", borderRadius: 16 }} />
                <TouchableOpacity onPress={() => removeMedia(index)} style={{ position: "absolute", top: 4, right: 4, backgroundColor: "rgba(239, 68, 68, 0.9)", borderRadius: 12, padding: 4 }}><Ionicons name="close" size={16} color="white" /></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* CARD 2: INFORMASI UTAMA */}
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="information-circle" size={20} color={theme.brandPrimary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>Informasi Utama</Text>
          </View>

          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.subText, marginBottom: 8, marginLeft: 4 }}>Nama Barang</Text>
          {/* 💡 BORDER MERAH JIKA TITLE KOSONG */}
          <TextInput value={title} onChangeText={(text) => { setTitle(text); setMissingFields(prev => prev.filter(f => f !== "title")); }} placeholder="Cth: Kamera Sony Alpha 7 IV" placeholderTextColor="#9CA3AF" style={{ backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 16, height: 56, color: theme.text, borderWidth: missingFields.includes("title") ? 2 : 1, borderColor: missingFields.includes("title") ? "#EF4444" : theme.border, marginBottom: 16, fontSize: 15 }} />

          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.subText, marginBottom: 8, marginLeft: 4 }}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginBottom: 16 }}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: isActive ? theme.brandPrimary : theme.inputBg, marginRight: 10, borderWidth: 1, borderColor: isActive ? theme.brandPrimary : theme.border }}>
                  <Text style={{ color: isActive ? "white" : theme.subText, fontWeight: "600" }}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.subText, marginBottom: 8, marginLeft: 4 }}>Harga Sewa per Hari (Rp)</Text>
          {/* 💡 BORDER MERAH JIKA PRICE KOSONG */}
          <TextInput value={price} onChangeText={(text) => { setPrice(text); setMissingFields(prev => prev.filter(f => f !== "price")); }} keyboardType="number-pad" placeholder="Cth: 150000" placeholderTextColor="#9CA3AF" style={{ backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 16, height: 56, color: theme.text, borderWidth: missingFields.includes("price") ? 2 : 1, borderColor: missingFields.includes("price") ? "#EF4444" : theme.border, fontSize: 15 }} />
        </View>

        {/* CARD 3: LOKASI & DESKRIPSI */}
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="map" size={20} color={theme.brandPrimary} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>Lokasi & Deskripsi</Text>
          </View>

          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.subText, marginBottom: 8, marginLeft: 4 }}>Alamat Lengkap Lokasi Barang</Text>
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            {/* 💡 BORDER MERAH JIKA LOKASI KOSONG */}
            <TextInput value={fullAddress} onChangeText={(text) => { setFullAddress(text); setMissingFields(prev => prev.filter(f => f !== "address")); }} placeholder="Ketik alamat lengkap beserta jalan..." placeholderTextColor="#9CA3AF" multiline={true} style={{ flex: 1, backgroundColor: theme.inputBg, borderRadius: 16, paddingHorizontal: 16, paddingTop: 16, minHeight: 56, color: theme.text, borderWidth: missingFields.includes("address") ? 2 : 1, borderColor: missingFields.includes("address") ? "#EF4444" : theme.border, marginRight: 10, fontSize: 14 }} />
            <TouchableOpacity onPress={() => setIsMapVisible(true)} style={{ width: 56, height: 56, backgroundColor: theme.badgeBg, borderRadius: 16, justifyContent: "center", alignItems: "center" }}><Ionicons name="location" size={24} color={theme.brandDark} /></TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, fontWeight: "700", color: theme.subText, marginBottom: 8, marginLeft: 4 }}>Deskripsi Kondisi & Kelengkapan</Text>
          <TextInput value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Ceritakan kondisi barang, aksesoris yang didapat, dll..." placeholderTextColor="#9CA3AF" style={{ backgroundColor: theme.inputBg, borderRadius: 16, padding: 16, color: theme.text, borderWidth: 1, borderColor: theme.border, minHeight: 100, textAlignVertical: "top", fontSize: 15 }} />
        </View>

        {/* CARD 4: FITUR & ATURAN SEWA */}
        <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}>
          {/* FITUR / SPECS */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}><Ionicons name="list" size={20} color={theme.brandPrimary} style={{ marginRight: 8 }} /><Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>Spesifikasi</Text></View>
            <TouchableOpacity onPress={handleAddSpec} style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.badgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}><Ionicons name="add" size={16} color={theme.brandDark} /><Text style={{ color: theme.brandDark, fontWeight: "700", marginLeft: 4, fontSize: 12 }}>Add</Text></TouchableOpacity>
          </View>
          {specs.map((spec, index) => (
            <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <TextInput value={spec.label} onChangeText={(text) => handleSpecChange(index, "label", text)} placeholder="Label (cth: Resolusi)" placeholderTextColor="#9CA3AF" style={{ flex: 1, backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14, height: 48, color: theme.text, borderWidth: 1, borderColor: theme.border, marginRight: 8, fontSize: 14 }} />
              <TextInput value={spec.value} onChangeText={(text) => handleSpecChange(index, "value", text)} placeholder="Nilai (cth: 24MP)" placeholderTextColor="#9CA3AF" style={{ flex: 1, backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14, height: 48, color: theme.text, borderWidth: 1, borderColor: theme.border, marginRight: 8, fontSize: 14 }} />
              {specs.length > 1 && (<TouchableOpacity onPress={() => handleRemoveSpec(index)} style={{ padding: 8, backgroundColor: "#FEF2F2", borderRadius: 10 }}><Ionicons name="trash-outline" size={18} color="#EF4444" /></TouchableOpacity>)}
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 20 }} />

          {/* ATURAN SEWA */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}><Ionicons name="shield-checkmark" size={20} color={theme.brandPrimary} style={{ marginRight: 8 }} /><Text style={{ fontSize: 16, fontWeight: "700", color: theme.text }}>Aturan Sewa</Text></View>
            <TouchableOpacity onPress={handleAddTerm} style={{ flexDirection: "row", alignItems: "center", backgroundColor: theme.badgeBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}><Ionicons name="add" size={16} color={theme.brandDark} /><Text style={{ color: theme.brandDark, fontWeight: "700", marginLeft: 4, fontSize: 12 }}>Add</Text></TouchableOpacity>
          </View>
          {rentalTerms.map((term, index) => (
            <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <TextInput value={term} onChangeText={(text) => handleTermChange(index, text)} placeholder="Cth: Wajib menjaminkan KTP asli" placeholderTextColor="#9CA3AF" style={{ flex: 1, backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14, height: 48, color: theme.text, borderWidth: 1, borderColor: theme.border, marginRight: 8, fontSize: 14 }} />
              {rentalTerms.length > 1 && (<TouchableOpacity onPress={() => handleRemoveTerm(index)} style={{ padding: 8, backgroundColor: "#FEF2F2", borderRadius: 10 }}><Ionicons name="trash-outline" size={18} color="#EF4444" /></TouchableOpacity>)}
            </View>
          ))}
        </View>

        {errorMessage !== "" && <Text style={{ color: "#EF4444", marginBottom: 16, textAlign: "center", fontWeight: "700" }}>{errorMessage}</Text>}

        <TouchableOpacity activeOpacity={0.8} onPress={handlePublish} disabled={isPublishing} style={{ backgroundColor: theme.brandPrimary, paddingVertical: 18, borderRadius: 20, justifyContent: "center", alignItems: "center", shadowColor: theme.brandPrimary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 }}>
          <Text style={{ color: "white", fontWeight: "800", fontSize: 17 }}>Publish Item Sekarang</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MAP MODAL */}
      <Modal visible={isMapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView style={{ flex: 1 }} initialRegion={region} onRegionChangeComplete={(r) => setRegion(r)}><Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} /></MapView>
          <TouchableOpacity onPress={() => setIsMapVisible(false)} style={{ position: "absolute", top: 50, left: 20, width: 44, height: 44, backgroundColor: "white", borderRadius: 22, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 }}><Ionicons name="close" size={24} color="#111827" /></TouchableOpacity>
          <View style={{ position: "absolute", bottom: 40, left: 20, right: 20 }}>
            <TouchableOpacity onPress={handleMapConfirm} style={{ backgroundColor: theme.brandPrimary, padding: 18, borderRadius: 20, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 }}><Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>Pilih Lokasi Ini</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}