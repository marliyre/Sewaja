import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { products as initialProducts } from "../data/product"; 

export type ProductType = {
  id: string | number;         
  title: string;
  category: string;
  price: string;
  image: string;
  allImages?: string[];
  rating: string | number;     
  reviewCount: string | number;
  location: string;
  description: string;
  owner: {
    name: string;
    role: string;
    avatar: string;
    email?: string; // 💡 Disiapkan untuk sistem akun
  };
  userEmail?: string;          // 💡 Penanda kepemilikan barang
  isUploadedByUser?: boolean;  
  specs: { label: string; value: string }[];
  rentalTerms?: string[];      
  isMyProduct?: boolean;     
  daysRented?: number;       
};

type ProductContextType = {
  products: ProductType[];
  addProduct: (product: ProductType) => void;
  updateProduct: (id: string | number, updatedData: Partial<ProductType>) => void; // 💡 Fungsi Edit
  deleteProduct: (id: string | number) => void; // 💡 Fungsi Hapus
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<ProductType[]>(initialProducts as ProductType[]);

  // 💡 MENGAMBIL BARANG UPLOAD DARI MEMORI SAAT APLIKASI DIBUKA
  useEffect(() => {
    const loadCustomProducts = async () => {
      try {
        const savedProducts = await AsyncStorage.getItem("@custom_products");
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts);
          // Menggabungkan barang bawaan (dummy) dengan barang asli upload-an user
          setProducts([...parsedProducts, ...initialProducts as ProductType[]]);
        }
      } catch (error) {
        console.error("Gagal memuat produk kustom", error);
      }
    };
    loadCustomProducts();
  }, []);

  // 💡 FUNGSI PENYIMPANAN PERMANEN (Hanya menyimpan barang buatan User)
  const saveCustomProducts = async (currentProducts: ProductType[]) => {
    try {
      const customProducts = currentProducts.filter(p => p.isUploadedByUser);
      await AsyncStorage.setItem("@custom_products", JSON.stringify(customProducts));
    } catch (error) {
      console.error("Gagal menyimpan produk", error);
    }
  };

  const addProduct = (newProduct: ProductType) => {
    setProducts((prev) => {
      const updated = [newProduct, ...prev];
      saveCustomProducts(updated); // Simpan ke database
      return updated;
    });
  };

  const updateProduct = (id: string | number, updatedData: Partial<ProductType>) => {
    setProducts((prev) => {
      const updated = prev.map((p) => p.id.toString() === id.toString() ? { ...p, ...updatedData } : p);
      saveCustomProducts(updated); // Simpan ke database
      return updated;
    });
  };

  const deleteProduct = (id: string | number) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id.toString() !== id.toString());
      saveCustomProducts(updated); // Simpan ke database
      return updated;
    });
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProducts must be used within a ProductProvider");
  return context;
}