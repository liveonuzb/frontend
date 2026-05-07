import { map, filter, find } from "lodash";
import React from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import PageTransition from "@/components/page-transition";
import { useAuthStore, useBreadcrumbStore, useChatStore } from "@/store";
import ChatSidebar from "@/modules/chat/components/ChatSidebar";
import { getChatBasePath, getChatPath } from "@/lib/app-paths.js";
import { useCoachClients, useCoachSessions } from "@/modules/coach/lib/hooks";
import {
  buildCoachChatTriage,
  filterChatsByTriage,
  getTodayKey,
  resolveChatTriageListPayload,
} from "@/modules/chat/lib/chat-triage.js";

const ChatLayout = () => {
  const navigate = useNavigate();
  const { chatId: activeChat } = useParams();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const { activeRole, user } = useAuthStore();
  const isCoach = activeRole === "COACH";

  const {
    contacts,
    initSocket,
    disconnectSocket,
    fetchRooms,
    getUnreadCount,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [triageFilter, setTriageFilter] = React.useState("all");
  const todayKey = React.useMemo(() => getTodayKey(), []);

  const { data: coachClientsData } = useCoachClients(
    { status: "active", lifecycle: "active", pageSize: 100 },
    { enabled: isCoach, staleTime: 30000 },
  );
  const { data: todaySessionsData } = useCoachSessions(
    {
      status: "all",
      dateFrom: todayKey,
      dateTo: todayKey,
      sortBy: "scheduledAt",
      sortDir: "asc",
      pageSize: 100,
    },
    { enabled: isCoach, staleTime: 30000 },
  );

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
    if (!searchQuery.trim()) return allChats;
    const query = searchQuery.toLowerCase();
    return filter(allChats, (chat) =>
      String(chat.name || "").toLowerCase().includes(query),
    );
  }, [allChats, searchQuery]);

  const coachClients = React.useMemo(
    () => resolveChatTriageListPayload(coachClientsData),
    [coachClientsData],
  );
  const todaySessions = React.useMemo(
    () => resolveChatTriageListPayload(todaySessionsData),
    [todaySessionsData],
  );
  const chatTriage = React.useMemo(
    () =>
      isCoach
        ? buildCoachChatTriage({
            chats: allChats,
            clients: coachClients,
            sessions: todaySessions,
            currentUserId: user?.id,
            getUnreadCount,
          })
        : { items: [], matchesByChatId: new Map() },
    [allChats, coachClients, getUnreadCount, isCoach, todaySessions, user?.id],
  );
  const filteredChats = React.useMemo(
    () =>
      isCoach
        ? filterChatsByTriage(
            searchFilteredChats,
            triageFilter,
            chatTriage.matchesByChatId,
          )
        : searchFilteredChats,
    [chatTriage.matchesByChatId, isCoach, searchFilteredChats, triageFilter],
  );

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
          filteredChats={filteredChats}
          activeChat={activeChat || null}
          handleChatSelect={handleChatSelect}
          getUnreadCount={getUnreadCount}
          getLastMessagePreview={getLastMessagePreview}
          getLastMessageTime={getLastMessageTime}
          triageItems={chatTriage.items}
          activeTriageFilter={triageFilter}
          onTriageFilterChange={setTriageFilter}
        />
        <Outlet />
      </div>
    </PageTransition>
  );
};

export default ChatLayout;
