import { map, filter, find } from "lodash";
import React from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import PageTransition from "@/components/page-transition";
import { useAuthStore, useBreadcrumbStore, useChatStore } from "@/store";
import ChatSidebar from "@/modules/chat/components/ChatSidebar";
import { getChatBasePath, getChatPath } from "@/lib/app-paths.js";

const ChatLayout = () => {
  const navigate = useNavigate();
  const { chatId: activeChat } = useParams();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { activeRole } = useAuthStore();
  const isCoach = activeRole === "COACH";

  const {
    contacts,
    initSocket,
    disconnectSocket,
    fetchRooms,
    getUnreadCount,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/", title: "Asosiy" },
      { url: getChatBasePath(activeRole), title: "Chat" },
    ]);
    initSocket();
    fetchRooms();
    return () => disconnectSocket();
  }, [activeRole, disconnectSocket, fetchRooms, initSocket, setBreadcrumbs]);

  const allChats = React.useMemo(() => {
    return map(contacts, (chat) => ({
      ...chat,
      chatId: chat.id,
    }));
  }, [contacts]);

  const filteredChats = React.useMemo(() => {
    if (!searchQuery.trim()) return allChats;
    const query = searchQuery.toLowerCase();
    return filter(allChats, (chat) =>
      String(chat.name || "").toLowerCase().includes(query),
    );
  }, [allChats, searchQuery]);

  const getLastMessagePreview = React.useCallback(
    (chatId) => {
      const room = find(contacts, (chat) => chat.id === chatId);
      if (!room?.lastMessage) return null;
      return room.lastMessage.text;
    },
    [contacts],
  );

  const getLastMessageTime = React.useCallback(
    (chatId) => {
      const room = find(contacts, (chat) => chat.id === chatId);
      if (!room?.lastMessage?.createdAt) return null;
      return new Date(room.lastMessage.createdAt).toLocaleTimeString("uz", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [contacts],
  );

  const handleChatSelect = React.useCallback(
    (chatId, messageId = null) => {
      if (!chatId) return;
      const search = messageId ? `?msgId=${encodeURIComponent(messageId)}` : "";
      navigate(getChatPath(activeRole, chatId, search));
      setSearchQuery("");
    },
    [activeRole, navigate],
  );

  return (
    <PageTransition className="h-dvh overflow-hidden">
      <div className="flex h-full w-full overflow-hidden bg-background relative">
        <ChatSidebar
          showMobileChat={Boolean(activeChat)}
          isCoach={isCoach}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          contacts={allChats}
          filteredChats={filteredChats}
          activeChat={activeChat || null}
          handleChatSelect={handleChatSelect}
          getUnreadCount={getUnreadCount}
          getLastMessagePreview={getLastMessagePreview}
          getLastMessageTime={getLastMessageTime}
        />
        <Outlet />
      </div>
    </PageTransition>
  );
};

export default ChatLayout;
