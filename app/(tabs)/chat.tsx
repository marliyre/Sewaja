import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChatScreen() {
  const router = useRouter();
  const { ownerName, productTitle, ownerAvatar } = useLocalSearchParams<{ ownerName?: string; productTitle?: string; ownerAvatar?: string }>();

  const [currentUser, setCurrentUser] = useState<any>(null); 
  const [inboxList, setInboxList] = useState<any[]>([]);
  const [messagesDB, setMessagesDB] = useState<any>({});
  const [isDataLoaded, setIsDataLoaded] = useState(false); 
  
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [isRoomVisible, setIsRoomVisible] = useState(false);
  const [replyText, setReplyText] = useState("");

  const getRealtimeTime = () => {
    const now = new Date();
    let hours = now.getHours(); const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12; hours = hours ? hours : 12; 
    return `${hours}:${minutes < 10 ? "0" + minutes : minutes} ${ampm}`;
  };

  // 1. MEMUAT DATA CHAT (Menampilkan chat di mana nama kita ada di dalamnya)
  useEffect(() => {
    const loadChatData = async () => {
      try {
        const sessionData = await AsyncStorage.getItem("@currentUser");
        const user = sessionData ? JSON.parse(sessionData) : { email: "guest", name: "Guest" };
        setCurrentUser(user);

        const savedInbox = await AsyncStorage.getItem("@inboxList");
        const savedMessages = await AsyncStorage.getItem("@messagesDB");

        if (savedInbox && savedMessages) {
          const allInbox = JSON.parse(savedInbox);
          // 💡 LOGIKA BARU: Filter jika namaku ada di dalam partisipan Room ini
          const myInbox = allInbox.filter((chat: any) => chat.participants && chat.participants.includes(user.name));
          setInboxList(myInbox);
          setMessagesDB(JSON.parse(savedMessages));
        } else {
          setInboxList([]);
          setMessagesDB({});
        }
      } catch (error) { console.error(error); } 
      finally { setIsDataLoaded(true); }
    };
    loadChatData();
  }, []);

  // 2. MENYIMPAN OTOMATIS (Menyimpan tanpa menimpa chat orang lain)
  useEffect(() => {
    if (isDataLoaded && currentUser) {
      AsyncStorage.getItem("@inboxList").then(saved => {
        const allInbox = saved ? JSON.parse(saved) : [];
        // Hapus chat room milik kita yang lama, lalu timpa dengan versi terbaru dari state
        const otherUsersInbox = allInbox.filter((chat: any) => !(chat.participants && chat.participants.includes(currentUser.name)));
        AsyncStorage.setItem("@inboxList", JSON.stringify([...otherUsersInbox, ...inboxList]));
      });
      AsyncStorage.setItem("@messagesDB", JSON.stringify(messagesDB)); 
    }
  }, [inboxList, messagesDB, isDataLoaded]);

  // 3. MEMBUAT ROOM BARU (RoomID = Gabungan Nama A & B)
  useEffect(() => {
    if (isDataLoaded && ownerName && currentUser) {
      // Cari apakah sudah ada chat dengan target ownerName ini
      const existingChat = inboxList.find(chat => chat.participants && chat.participants.includes(ownerName));

      if (existingChat) {
        setSelectedChat(existingChat);
        setIsRoomVisible(true);
      } else {
        // 💡 LOGIKA BARU: ID Room adalah gabungan nama agar bisa saling balas
        const newRoomId = "room_" + [currentUser.name, ownerName].sort().join("_");
        const initialMessageText = `Hi, apakah "${productTitle || "produk ini"}" masih tersedia untuk disewa?`;
        
        const newInboxItem = {
          id: newRoomId,
          participants: [currentUser.name, ownerName], // Menyimpan kedua nama
          profiles: {
            [currentUser.name]: { avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}` },
            [ownerName]: { avatar: ownerAvatar || `https://ui-avatars.com/api/?name=${ownerName}` }
          },
          text: initialMessageText,
          time: getRealtimeTime(),
          unread: true, // Akan bernilai unread untuk orang lain
          lastSender: currentUser.name,
          online: true 
        };

        setInboxList(prev => [newInboxItem, ...prev]);
        setMessagesDB(prev => ({ ...prev, [newRoomId]: [{ id: "init_1", sender: currentUser.name, text: initialMessageText, time: getRealtimeTime() }] }));
        setSelectedChat(newInboxItem);
        setIsRoomVisible(true);
      }
      router.setParams({ ownerName: "", productTitle: "", ownerAvatar: "" });
    }
  }, [ownerName, productTitle, isDataLoaded, currentUser]);

  const handleOpenRoom = (chatItem: any) => {
    setSelectedChat(chatItem); setIsRoomVisible(true);
    // Matikan notifikasi unread jika kita buka
    if (chatItem.lastSender !== currentUser?.name) {
      setInboxList(prev => prev.map(item => (item.id === chatItem.id ? { ...item, unread: false } : item)));
    }
  };

  const handleSendMessage = () => {
    if (!replyText.trim() || !selectedChat) return;
    const timeStamp = getRealtimeTime();
    
    setMessagesDB(prev => ({ ...prev, [selectedChat.id]: [...(prev[selectedChat.id] || []), { id: Math.random().toString(), sender: currentUser.name, text: replyText, time: timeStamp }] }));
    
    setInboxList(prevList => {
      const filtered = prevList.map(item => item.id === selectedChat.id ? { ...item, text: replyText, time: timeStamp, lastSender: currentUser.name, unread: true } : item);
      const targetIndex = filtered.findIndex(item => item.id === selectedChat.id);
      if (targetIndex > 0) return [filtered[targetIndex], ...filtered.filter(item => item.id !== selectedChat.id)];
      return filtered;
    });
    setReplyText("");
  };

  const theme = { bg: "#F9FAFB", card: "white", text: "#111827", subText: "#6B7280", border: "#E5E7EB", brandText: "#2D8B81", brandPrimary: "#49C5B6", chatMe: "#49C5B6", chatOther: "#E5E7EB" };

  if (!isDataLoaded) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}><ActivityIndicator size="large" color={theme.brandPrimary} /></View>;

  // 💡 LOGIKA UI TAMPILAN: Ubah struktur data khusus untuk tampilan agar foto & nama yang muncul adalah "Lawan Bicara"
  const displayInbox = inboxList.map(chat => {
    const targetName = chat.participants.find((p: string) => p !== currentUser?.name) || chat.participants[0];
    return {
      ...chat,
      name: targetName,
      avatar: chat.profiles?.[targetName]?.avatar || `https://ui-avatars.com/api/?name=${targetName}`,
      unread: chat.lastSender !== currentUser?.name ? chat.unread : false
    };
  });

  const displaySelectedChat = selectedChat ? {
    ...selectedChat,
    name: selectedChat.participants.find((p: string) => p !== currentUser?.name) || selectedChat.participants[0],
    avatar: selectedChat.profiles?.[selectedChat.participants.find((p: string) => p !== currentUser?.name) || selectedChat.participants[0]]?.avatar || "https://ui-avatars.com/api/?name=User"
  } : null;

  const activeRoomMessages = selectedChat ? messagesDB[selectedChat.id] || [] : [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 60 }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20, backgroundColor: "white", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: theme.brandText }}>Messages</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 20, marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "white", paddingHorizontal: 16, height: 56, borderRadius: 18, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 }}>
          <Ionicons name="search-outline" size={22} color="#6B7280" />
          <TextInput placeholder="Search message history..." placeholderTextColor="#9CA3AF" style={{ marginLeft: 10, color: theme.text, flex: 1, fontSize: 15 }} />
        </View>
      </View>

      {displayInbox.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 30 }}>
          <Ionicons name="chatbubbles-outline" size={60} color="#D1D5DB" />
          <Text style={{ marginTop: 18, fontSize: 16, fontWeight: "700", color: theme.subText }}>Belum ada pesan</Text>
        </View>
      ) : (
        <FlatList
          data={displayInbox} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => handleOpenRoom(selectedChat ? selectedChat : inboxList.find(c => c.id === item.id))} style={{ flexDirection: "row", padding: 16, backgroundColor: theme.card, borderRadius: 24, marginBottom: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
              <View>
                <Image source={{ uri: item.avatar }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 14 }} />
                {item.online && <View style={{ position: "absolute", bottom: 0, right: 14, width: 14, height: 14, borderRadius: 7, backgroundColor: "#22C55E", borderWidth: 2, borderColor: "white" }} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ fontWeight: "700", fontSize: 15, color: theme.text }}>{item.name}</Text><Text style={{ fontSize: 12, color: item.unread ? theme.brandPrimary : theme.subText, fontWeight: item.unread ? "700" : "400" }}>{item.time}</Text></View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <Text numberOfLines={1} style={{ color: item.unread ? theme.text : theme.subText, fontWeight: item.unread ? "600" : "400", fontSize: 13, flex: 1, marginRight: 10 }}>{item.text}</Text>
                  {item.lastSender === currentUser?.name && <Ionicons name="checkmark-done" size={18} color={theme.brandPrimary} />}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* MODAL ROOM CHAT */}
      <Modal animationType="slide" visible={isRoomVisible} onRequestClose={() => setIsRoomVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 55, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <TouchableOpacity onPress={() => setIsRoomVisible(false)} style={{ padding: 4, marginRight: 8 }}><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
            {displaySelectedChat && (
              <>
                <View>
                  <Image source={{ uri: displaySelectedChat.avatar }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                  {displaySelectedChat.online && <View style={{ position: "absolute", bottom: -2, right: 10, width: 12, height: 12, borderRadius: 6, backgroundColor: "#22C55E", borderWidth: 2, borderColor: "white" }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: 16, color: theme.text }}>{displaySelectedChat.name}</Text>
                  <Text style={{ fontSize: 12, color: displaySelectedChat.online ? theme.brandPrimary : theme.subText, fontWeight: displaySelectedChat.online ? "600" : "500" }}>{displaySelectedChat.online ? "Online" : "Offline"}</Text>
                </View>
              </>
            )}
          </View>

          <FlatList
            data={activeRoomMessages} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 }}
            renderItem={({ item }) => {
              // 💡 TENTUKAN WARNA BUBBLE JIKA INI PESAN KITA ATAU BUKAN
              const isMe = item.sender === currentUser?.name;
              return (
                <View style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%", marginBottom: 14 }}>
                  <View style={{ backgroundColor: isMe ? theme.chatMe : theme.chatOther, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomRightRadius: isMe ? 4 : 20, borderBottomLeftRadius: isMe ? 20 : 4 }}>
                    <Text style={{ color: isMe ? "white" : theme.text, fontSize: 15, lineHeight: 20 }}>{item.text}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: isMe ? "flex-end" : "flex-start", marginTop: 4, paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 10, color: theme.subText, marginRight: isMe ? 4 : 0 }}>{item.time}</Text>
                    {isMe && <Ionicons name="checkmark-done" size={14} color={theme.brandPrimary} />}
                  </View>
                </View>
              );
            }}
          />

          <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "white", flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, paddingBottom: Platform.OS === 'ios' ? 25 : 12 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 24, paddingHorizontal: 16, height: 48, marginRight: 12 }}>
              <TextInput placeholder="Type your message..." placeholderTextColor="#9CA3AF" value={replyText} onChangeText={setReplyText} style={{ flex: 1, color: theme.text, fontSize: 15 }} />
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={handleSendMessage} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.brandPrimary, justifyContent: "center", alignItems: "center", shadowColor: theme.brandPrimary, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3 }}>
              <Ionicons name="send" size={18} color="white" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}