import map from "lodash/map";
import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import toLower from "lodash/toLower";
import trim from "lodash/trim";
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

  const searchFilteredChats = React.useMemo(() => {
    if (!trim(searchQuery)) return allChats;
    const query = toLower(searchQuery);
    return filter(allChats, (chat) =>
      includes(toLower(String(chat.name || "")), query),
    );
  }, [allChats, searchQuery]);

  const filteredChats = searchFilteredChats;

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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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
