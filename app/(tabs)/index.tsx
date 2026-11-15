import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert
} from "react-native";
import { useState, useCallback } from "react"; // 💡 Tambahkan useCallback
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router"; // 💡 Tambahkan useFocusEffect
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useWishlist } from "../../context/WishlistContext";
import { useProducts } from "../../context/ProductContext";
import { categories } from "../../data/product";

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [userName, setUserName] = useState("Guest");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { favorites, toggleFavorite } = useWishlist();
  const { products } = useProducts();

  // 💡 FIX: useFocusEffect akan memicu fetch data setiap kali layar Home dibuka/kembali
  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        try {
          const sessionData = await AsyncStorage.getItem("@currentUser");
          if (sessionData) {
            const user = JSON.parse(sessionData);
            setCurrentUser(user);
            setUserName(user.name); 
          }
        } catch (error) {
          console.error("Gagal memuat data user", error);
        }
      };
      fetchUser();
    }, [])
  );

  const filteredItems = products.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      
      {/* HEADER DINAMIS */}
      <View style={{ paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: "white", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* 💡 FIX: Avatar dinamis, jika ada foto profil tampilkan foto, jika tidak tampilkan logo */}
          <Image 
            source={currentUser?.avatar ? { uri: currentUser.avatar } : require('../../assets/images/logo-sewaja.png')} 
            style={{ width: 42, height: 42, marginRight: 12, borderRadius: 21, backgroundColor: "#E5E7EB" }} 
          />
          <View>
            <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "600", marginBottom: 2 }}>Halo, {userName} 👋</Text>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#2D8B81", lineHeight: 26 }}>Sewaja</Text>
          </View>
        </View>
        <TouchableOpacity style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#EEFDFB", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="notifications-outline" size={22} color="#2D8B81" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        
        {/* SEARCH */}
        <View style={{ marginTop: 20, marginBottom: 20, backgroundColor: "white", borderRadius: 18, paddingHorizontal: 16, height: 56, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }}>
          <Ionicons name="search-outline" size={22} color="#6B7280" />
          <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search cameras, tools, etc..." placeholderTextColor="#9CA3AF" style={{ flex: 1, marginLeft: 10, fontSize: 15 }} />
          <Ionicons name="options-outline" size={22} color="#2D8B81" />
        </View>

        {/* CATEGORY */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {categories.map((category, index) => {
            const isActive = selectedCategory === category;
            return (
              <TouchableOpacity key={index} onPress={() => setSelectedCategory(category)} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: isActive ? "#49C5B6" : "white", marginRight: 10 }}>
                <Text style={{ color: isActive ? "white" : "#374151", fontWeight: "600" }}>{category}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* CARD GRID */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {filteredItems.map((item) => {
            const isMyProduct = currentUser && (item as any).userEmail === currentUser.email;

            return (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => {
                  if (isMyProduct) {
                    router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } });
                  } else {
                    router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } });
                  }
                }} 
                activeOpacity={0.9} 
                style={{ width: "48%", backgroundColor: "white", borderRadius: 24, marginBottom: 18, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}
              >
                <View style={{ position: "relative" }}>
                  <Image source={{ uri: item.image }} style={{ width: "100%", height: 160 }} />
                  
                  {isMyProduct && (
                    <View style={{ position: "absolute", top: 10, left: 10, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>Milik Anda</Text>
                    </View>
                  )}

                  <TouchableOpacity onPress={() => toggleFavorite(item as any)} style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center" }}>
                    <Ionicons name={favorites.some((fav: any) => fav.id.toString() === item.id.toString()) ? "heart" : "heart-outline"} size={18} color={favorites.some((fav: any) => fav.id.toString() === item.id.toString()) ? "#EF4444" : "#374151"} />
                  </TouchableOpacity>
                </View>
                
                <View style={{ padding: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#49C5B6", marginBottom: 6 }}>{item.category}</Text>
                  <Text numberOfLines={2} style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 10 }}>{item.title}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#2D8B81" }}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </View>
  );
}