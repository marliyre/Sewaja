import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ItemType = {
  id: number | string; // 💡 FIX: Aman untuk ID berbentuk angka maupun string
  title: string;
  category: string;
  price: string;
  image: string;
  userEmail?: string;
};

type WishlistContextType = {
  favorites: ItemType[];
  toggleFavorite: (item: ItemType) => void;
};

const WishlistContext = createContext<WishlistContextType>({
  favorites: [],
  toggleFavorite: () => {},
});

export function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favorites, setFavorites] = useState<ItemType[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 💡 LOGIKA CERDAS: Memeriksa otomatis jika ada pergantian akun (Login/Logout)
  useEffect(() => {
    let lastEmail: string | null = "init";
    
    const checkUserInterval = setInterval(async () => {
      try {
        const sessionData = await AsyncStorage.getItem("@currentUser");
        const currentEmail = sessionData ? JSON.parse(sessionData).email : null;

        // Jika ada pergantian akun, load database wishlist KHUSUS akun tersebut
        if (currentEmail !== lastEmail) {
          lastEmail = currentEmail;
          setUserEmail(currentEmail);

          if (currentEmail) {
            const storedWishlist = await AsyncStorage.getItem(`@wishlist_${currentEmail}`);
            if (storedWishlist) {
              setFavorites(JSON.parse(storedWishlist));
            } else {
              setFavorites([]);
            }
          } else {
            setFavorites([]); // Kosongkan wishlist jika logout
          }
        }
      } catch (error) {
        console.error("Gagal memeriksa akun", error);
      }
    }, 1000); // Mengecek setiap 1 detik agar responsif

    return () => clearInterval(checkUserInterval);
  }, []);

  // 💡 FUNGSI TOGGLE YANG DISIMPAN KE DATABASE AKUN MASING-MASING
  const toggleFavorite = async (item: ItemType) => {
    if (!userEmail) return; // Jika belum login, abaikan

    let updatedFavorites;
    const exists = favorites.find((fav) => String(fav.id) === String(item.id));

    if (exists) {
      updatedFavorites = favorites.filter((fav) => String(fav.id) !== String(item.id));
    } else {
      updatedFavorites = [...favorites, item];
    }

    // Update tampilan seketika
    setFavorites(updatedFavorites);

    // Simpan permanen ke brankas/laci khusus akun ini
    try {
      await AsyncStorage.setItem(`@wishlist_${userEmail}`, JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error("Gagal menyimpan wishlist:", error);
    }
  };

  return (
    <WishlistContext.Provider
      value={{ favorites, toggleFavorite }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);