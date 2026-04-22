import React, { useState, useMemo } from "react";
import { filter, map, take, includes } from "lodash";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    SearchIcon,
    BookmarkIcon,
    HomeIcon,
    PinIcon,
    MoreVerticalIcon,
    GripVerticalIcon,
    PencilLineIcon,
    CheckIcon,
    UserPlusIcon,
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
    const [isEditMode, setIsEditMode] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const messageSearchResults = useMemo(() => {
        return searchQuery.length > 1 ? searchGlobalMessages(searchQuery) : [];
    }, [searchQuery, searchGlobalMessages]);

    // Sorting and Filtering logic
    const tabFilteredChats = useMemo(() => {
        const list = filter(filteredChats, (chat) => !chat.isGroup);

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
    }, [filteredChats, pinnedChats, chatOrder]);

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
            "w-full md:w-80 border-0 md:border-r flex flex-col bg-muted/30 shrink-0 h-full", 
            showMobileChat ? "hidden md:flex" : "flex"
        )}>
            {/* Header & Search */}
            <div className="sticky top-0 z-20 p-3 md:p-4 border-b bg-background/95 backdrop-blur-sm space-y-3 md:space-y-4">
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
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs font-medium">Yuklanmoqda...</p>
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
                            {bookmarks.length > 0 && (
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
