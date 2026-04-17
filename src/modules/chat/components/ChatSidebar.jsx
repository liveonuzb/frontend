import React, { useState, useMemo } from "react";
import { filter, map, find, take, includes } from "lodash";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    SearchIcon,
    BookmarkIcon,
    HomeIcon,
    MessageSquareIcon,
    Users2Icon,
    BellDotIcon,
    PinIcon,
    MoreVerticalIcon,
    GripVerticalIcon,
    PencilLineIcon,
    CheckIcon,
    UserPlusIcon,
    Loader2Icon,
    MessageCircleIcon,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import { useChatStore } from "@/store";
import { toast } from "sonner";
import { api } from "@/hooks/api/use-api";

// DnD Kit imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ChatSidebar = ({
    showMobileChat,
    isCoach,
    initialTab = "all",
    searchQuery,
    setSearchQuery,
    contacts,
    filteredChats,
    activeChat,
    handleChatSelect,
    getUnreadCount,
    getLastMessagePreview,
    getLastMessageTime,
    bookmarks = [],
}) => {
    const navigate = useNavigate();
    const {
        searchGlobalMessages,
        pinnedChats,
        togglePinChat,
        chatOrder,
        reorderChats,
        isLoading
    } = useChatStore();
    
    const [activeTab, setActiveRoleTab] = useState("all");
    const [typeFilter, setTypeFilter] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);

    const [friends, setFriends] = useState([]);
    const [isFriendsLoading, setIsFriendsLoading] = useState(false);
    const [creatingRoomUserId, setCreatingRoomUserId] = useState(null);
    const [connections, setConnections] = useState([]);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchFriendsList = React.useCallback(async () => {
        setIsFriendsLoading(true);
        try {
            const response = await api.get("/users/me/friends");
            setFriends(response?.data?.items || []);
        } catch (error) {
            setFriends([]);
        } finally {
            setIsFriendsLoading(false);
        }
    }, []);

    const fetchConnections = React.useCallback(async () => {
        try {
            if (isCoach) {
                const response = await api.get("/coach/clients");
                setConnections(response?.data?.items || []);
                return;
            }
            const response = await api.get("/user/coaches/status");
            if (response?.data?.connected && response?.data?.coach) {
                setConnections([response.data.coach]);
                return;
            }
            setConnections([]);
        } catch (error) {
            setConnections([]);
        }
    }, [isCoach]);

    const normalizedInitialTab = useMemo(() => {
        const allowedTabs = ["all", "unread", "connections", "friends"];
        return includes(allowedTabs, initialTab) ? initialTab : "all";
    }, [initialTab]);

    React.useEffect(() => {
        setActiveRoleTab(normalizedInitialTab);
    }, [normalizedInitialTab]);

    React.useEffect(() => {
        fetchFriendsList();
    }, [fetchFriendsList]);

    React.useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    const startNewChat = React.useCallback(async (targetUserId) => {
        if (!targetUserId || creatingRoomUserId === targetUserId) {
            return;
        }

        const existingRoom = find(
            contacts,
            (room) => !room.isGroup && room.otherParticipant?.id === targetUserId,
        );

        if (existingRoom?.id) {
            handleChatSelect(existingRoom.id);
            return;
        }

        setCreatingRoomUserId(targetUserId);
        try {
            const response = await api.post("/chat/rooms", { userId: targetUserId });
            const { fetchRooms } = useChatStore.getState();
            await fetchRooms();
            handleChatSelect(response.data.roomId);
            toast.success("Chat boshlandi");
        } catch (error) {
            const message = error?.response?.data?.message;
            toast.error(Array.isArray(message) ? message.join(", ") : message || "Chatni boshlab bo'lmadi");
        } finally {
            setCreatingRoomUserId(null);
        }
    }, [contacts, creatingRoomUserId, handleChatSelect]);

    const messageSearchResults = useMemo(() => {
        return searchQuery.length > 1 ? searchGlobalMessages(searchQuery) : [];
    }, [searchQuery, searchGlobalMessages]);

    const friendIdSet = useMemo(
        () => new Set(map(friends, (friend) => friend.id).filter(Boolean)),
        [friends],
    );

    const connectionIdSet = useMemo(
        () => new Set(map(connections, (connection) => connection.id).filter(Boolean)),
        [connections],
    );

    const existingDirectRoomByFriendId = useMemo(() => {
        const map = new Map();
        contacts.forEach((room) => {
            if (!room?.isGroup && room?.otherParticipant?.id) {
                map.set(room.otherParticipant.id, room);
            }
        });
        return map;
    }, [contacts]);

    // Sorting and Filtering logic
    const tabFilteredChats = useMemo(() => {
        let list = filter(filteredChats, (chat) => !chat.isGroup);

        // 1. Filter by tab
        if (activeTab === "unread") {
            list = filter(list, c => getUnreadCount(c.chatId) > 0);
        } else if (activeTab === "connections") {
            list = filter(list, (chat) => connectionIdSet.has(chat.otherParticipant?.id));
        } else if (activeTab === "friends") {
            list = filter(list, (chat) => friendIdSet.has(chat.otherParticipant?.id));
        }

        // 1b. Filter by room type
        if (typeFilter) {
            list = filter(list, (chat) => chat.type === typeFilter);
        }

        // 2. Apply Custom Order if exists
        if (chatOrder) {
            list.sort((a, b) => {
                const idxA = chatOrder.indexOf(a.chatId);
                const idxB = chatOrder.indexOf(b.chatId);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });
        }

        // 3. Pinned Chats always on top (if not in custom order or override)
        list.sort((a, b) => {
            const isPinnedA = pinnedChats.includes(a.chatId);
            const isPinnedB = pinnedChats.includes(b.chatId);
            if (isPinnedA && !isPinnedB) return -1;
            if (!isPinnedA && isPinnedB) return 1;
            return 0;
        });

        return list;
    }, [filteredChats, activeTab, typeFilter, getUnreadCount, pinnedChats, chatOrder, friendIdSet, connectionIdSet]);

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const friendsWithoutChat = useMemo(() => {
        const base = filter(friends, (friend) => !existingDirectRoomByFriendId.has(friend.id));
        if (!normalizedSearch) {
            return base;
        }

        return filter(base, (friend) => {
            const searchable = map(
                [friend.name, friend.username, friend.email, friend.phone],
                (value) => String(value ?? "").toLowerCase(),
            ).join(" ");
            return searchable.includes(normalizedSearch);
        });
    }, [friends, existingDirectRoomByFriendId, normalizedSearch]);

    const defaultTabs = [
        { id: "all", label: "Barchasi", icon: MessageSquareIcon },
        { id: "unread", label: "O'qilmagan", icon: BellDotIcon },
        { id: "connections", label: isCoach ? "Mijozlar" : "Murabbiy", icon: Users2Icon },
        { id: "friends", label: "Do'stlar", icon: Users2Icon },
    ];

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = tabFilteredChats.findIndex(c => c.chatId === active.id);
            const newIndex = tabFilteredChats.findIndex(c => c.chatId === over.id);
            const newOrder = arrayMove(tabFilteredChats, oldIndex, newIndex).map(c => c.chatId);
            reorderChats(newOrder);
        }
    };

    return (
        <div className={cn(
            "w-full md:w-80 border-r flex flex-col bg-muted/30 shrink-0 h-full", 
            showMobileChat ? "hidden md:flex" : "flex"
        )}>
            {/* Header & Search */}
            <div className="p-3 md:p-4 border-b bg-background/50 backdrop-blur-sm space-y-3 md:space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <Button 
                            variant="ghost" size="icon" className="size-8 rounded-full"
                            onClick={() => navigate(isCoach ? "/coach" : "/user")}
                        >
                            <HomeIcon className="size-4" />
                        </Button>
                        <h2 className="text-lg md:text-xl font-bold">Chatlar</h2>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost" size="icon" 
                            className={cn("size-8 rounded-full transition-all", isEditMode ? "bg-primary text-primary-foreground" : "bg-primary/5 text-primary")}
                            onClick={() => setIsEditMode(!isEditMode)}
                        >
                            {isEditMode ? <CheckIcon className="size-4" /> : <PencilLineIcon className="size-4" />}
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                        className="w-full h-9 md:h-10 pl-9 pr-4 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                        placeholder="Qidirish..." 
                    />
                </div>

                {!searchQuery && (
                    <>
                        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                            {/* Default Tabs */}
                            {defaultTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveRoleTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] md:text-xs font-medium whitespace-nowrap transition-all",
                                        activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    <tab.icon className="size-3" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
                            {[
                                { value: "", label: "Barchasi" },
                                { value: "COACH_CLIENT", label: "💪 Coach" },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTypeFilter(opt.value)}
                                    className={cn(
                                        "px-2 py-1 rounded-full text-[9px] md:text-[10px] font-medium whitespace-nowrap transition-all border",
                                        typeFilter === opt.value
                                            ? "bg-primary/10 text-primary border-primary/30"
                                            : "border-transparent hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs font-medium">Yuklanmoqda...</p>
                    </div>
                ) : activeTab === "friends" ? (
                    <div className="py-2">
                        {isFriendsLoading ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-muted-foreground">
                                <Loader2Icon className="size-4 animate-spin" />
                                Do&apos;stlar yuklanmoqda...
                            </div>
                        ) : null}

                        {tabFilteredChats.length > 0 ? (
                            <>
                                <div className="px-4 py-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Do&apos;st chatlari
                                </div>
                                {tabFilteredChats.map((chat) => (
                                    <ContactItem
                                        key={chat.chatId}
                                        chat={chat}
                                        activeChat={activeChat}
                                        handleChatSelect={handleChatSelect}
                                        getUnreadCount={getUnreadCount}
                                        getLastMessageTime={getLastMessageTime}
                                        getLastMessagePreview={getLastMessagePreview}
                                        isPinned={includes(pinnedChats, chat.chatId)}
                                        onPin={() => togglePinChat(chat.chatId)}
                                        isEditMode={isEditMode}
                                    />
                                ))}
                            </>
                        ) : null}

                        {friendsWithoutChat.length > 0 ? (
                            <>
                                <div className="px-4 py-2 mt-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-t">
                                    Chat boshlash
                                </div>
                                {friendsWithoutChat.map((friend) => (
                                    <div
                                        key={friend.id}
                                        className="flex items-center gap-3 p-3 md:p-4 border-b hover:bg-muted/40 transition-colors"
                                    >
                                        <Avatar className="size-10 md:size-12 border-2 border-background shadow-sm">
                                            <AvatarImage src={friend.avatarUrl} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {take(filter(String(friend.name || "D").split(" "), Boolean), 2)
                                                    .map((part) => part[0]?.toUpperCase() || "")
                                                    .join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {friend.name || "Do'st"}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {friend.username
                                                    ? `@${friend.username}`
                                                    : friend.email || friend.phone || "Do'st"}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-xl"
                                            disabled={creatingRoomUserId === friend.id}
                                            onClick={() => startNewChat(friend.id)}
                                        >
                                            {creatingRoomUserId === friend.id ? (
                                                <Loader2Icon className="mr-1 size-4 animate-spin" />
                                            ) : (
                                                <MessageCircleIcon className="mr-1 size-4" />
                                            )}
                                            Yozish
                                        </Button>
                                    </div>
                                ))}
                            </>
                        ) : null}

                        {!isFriendsLoading &&
                        tabFilteredChats.length === 0 &&
                        friendsWithoutChat.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground space-y-2">
                                <Users2Icon className="size-8 mx-auto opacity-20" />
                                <p className="text-sm">Do&apos;stlar topilmadi</p>
                                <p className="text-xs opacity-70">
                                    Avval /user/friends sahifasida do&apos;st qo&apos;shing.
                                </p>
                            </div>
                        ) : null}
                    </div>
                ) : searchQuery ? (
                    <div className="py-2">
                        {tabFilteredChats.length > 0 && (
                            <div className="px-4 py-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Kontaktlar</div>
                        )}
                        {tabFilteredChats.map((chat) => (
                            <ContactItem 
                                key={chat.chatId} chat={chat} activeChat={activeChat} 
                                handleChatSelect={handleChatSelect} getUnreadCount={getUnreadCount}
                                getLastMessageTime={getLastMessageTime} getLastMessagePreview={getLastMessagePreview}
                                isPinned={includes(pinnedChats, chat.chatId)}
                                onPin={() => togglePinChat(chat.chatId)}
                                isEditMode={isEditMode}
                            />
                        ))}

                        {messageSearchResults.length > 0 && (
                            <div className="px-4 py-2 mt-4 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-t">Xabarlar</div>
                        )}
                        {messageSearchResults.map((res, i) => (
                            <button
                                key={`msg-res-${i}`}
                                onClick={() => handleChatSelect(res.chatId, res.msgId)}
                                className="w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 hover:bg-muted/50 transition-all text-left border-b"
                            >
                                <Avatar className="size-10">
                                    <AvatarImage src={res.avatar} />
                                    <AvatarFallback>{res.senderName?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-xs md:text-sm truncate">{res.senderName}</p>
                                        <span className="text-[8px] md:text-[9px] text-muted-foreground">{res.time}</span>
                                    </div>
                                    <p className="text-[10px] md:text-xs text-primary truncate mt-1 italic">"...{res.text}..."</p>
                                </div>
                            </button>
                        ))}

                        {tabFilteredChats.length === 0 && messageSearchResults.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                <SearchIcon className="size-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Hech narsa topilmadi</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext 
                            items={map(tabFilteredChats, c => c.chatId)}
                            strategy={verticalListSortingStrategy}
                        >
                            {bookmarks.length > 0 && activeTab === "all" && (
                                <div className="p-3 md:p-4 border-b bg-primary/5">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <BookmarkIcon className="size-3" />
                                        <span className="text-[9px] font-bold uppercase tracking-wider">Xatcho'plar</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {take(bookmarks, 2).map((b, i) => (
                                            <div key={i} className="text-[10px] p-2 rounded-lg bg-background border border-primary/10 truncate">
                                                <span className="font-bold mr-1">{b.senderName}:</span>
                                                <span className="opacity-70">{b.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tabFilteredChats.map((chat) => (
                                <SortableContactItem 
                                    key={chat.chatId} 
                                    chat={chat} 
                                    activeChat={activeChat} 
                                    handleChatSelect={handleChatSelect} 
                                    getUnreadCount={getUnreadCount}
                                    getLastMessageTime={getLastMessageTime} 
                                    getLastMessagePreview={getLastMessagePreview}
                                    isPinned={includes(pinnedChats, chat.chatId)}
                                    onPin={() => togglePinChat(chat.chatId)}
                                    isEditMode={isEditMode}
                                />
                            ))}
                            
                            {tabFilteredChats.length === 0 && (
                                <div className="p-10 text-center space-y-4">
                                    <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                                        <UserPlusIcon className="size-8 text-primary opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-muted-foreground font-medium text-sm">Chatlar hali yo'q</p>
                                        <p className="text-[10px] text-muted-foreground/60">Muloqotni boshlash uchun kontakt qidiring</p>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-xl font-bold"
                                        onClick={() => navigate(isCoach ? "/coach/clients" : "/user/friends")}
                                    >
                                        Kontakt qidirish
                                    </Button>
                                </div>
                            )}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
};

const ContactItem = ({ 
    chat, activeChat, handleChatSelect, getUnreadCount, 
    getLastMessageTime, getLastMessagePreview, isPinned, onPin, 
    sortableProps = {}, style = {}, isEditMode 
}) => (
    <div
        style={style}
        {...(!isEditMode ? {} : sortableProps)}
        onClick={() => !isEditMode && handleChatSelect(chat.chatId)}
        className={cn(
            "w-full flex items-center gap-2 md:gap-3 p-3 md:p-4 hover:bg-muted/50 transition-all text-left border-b relative group",
            activeChat === chat.chatId && "bg-primary/5 border-l-4 border-l-primary",
            isEditMode && "cursor-default"
        )}
    >
        {isEditMode && (
            <div className="shrink-0 text-muted-foreground/40 mr-1 animate-in fade-in slide-in-from-left-2">
                <GripVerticalIcon className="size-4" />
            </div>
        )}
        
        <div className="relative shrink-0">
            <Avatar className="size-10 md:size-12 border-2 border-background shadow-sm">
                <AvatarImage src={chat.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{chat.name?.[0]}</AvatarFallback>
            </Avatar>
            {chat.online && <div className="absolute -bottom-0.5 -right-0.5 size-2.5 md:size-3 rounded-full bg-green-500 border-2 border-background" />}
        </div>
        
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                    <p className="font-bold text-xs md:text-sm truncate">{chat.name}</p>
                    {isPinned && <PinIcon className="size-2.5 text-primary rotate-45" />}
                </div>
                <span className="text-[8px] md:text-[9px] text-muted-foreground">{getLastMessageTime(chat.chatId)}</span>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate mt-0.5">
                {getLastMessagePreview(chat.chatId) || chat.role}
            </p>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
            {getUnreadCount(chat.chatId) > 0 && (
                <Badge className="size-4 md:size-5 rounded-full p-0 flex items-center justify-center text-[8px] md:text-[10px] animate-pulse">
                    {getUnreadCount(chat.chatId)}
                </Badge>
            )}
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-6 md:size-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <MoreVerticalIcon className="size-3 md:size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onPin} className="text-xs">
                        <PinIcon className="size-3 mr-2" /> {isPinned ? "Unpin" : "Pin qilish"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
);

const SortableContactItem = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.chat.chatId, disabled: !props.isEditMode });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <ContactItem 
            {...props} 
            sortableProps={{ ref: setNodeRef, ...attributes, ...listeners }} 
            style={style} 
        />
    );
};

export default ChatSidebar;
