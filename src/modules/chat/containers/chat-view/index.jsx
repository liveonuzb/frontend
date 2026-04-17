import React from "react";
import { find, map, head } from "lodash";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
    UsersIcon,
    XIcon,
} from "lucide-react";
import { useChatStore, useAuthStore } from "@/store";
import { useCoachMealPlans, useCoachWorkoutPlans } from "@/hooks/app/use-coach";
import { toast } from "sonner";
import { api } from "@/hooks/api/use-api.js";
import MessageContextMenu from "@/components/chat/message-context-menu";
import MediaUploadDialog from "@/components/chat/media-upload-dialog";
import ForwardDialog from "@/components/chat/forward-dialog";
import { cn } from "@/lib/utils";
import { getChatBasePath } from "@/lib/app-paths.js";

// New Components
import ChatHeader from "../../components/ChatHeader";
import MessageList from "../../components/MessageList";
import ChatInput from "../../components/ChatInput";
import ChatInfoSidebar from "../../components/ChatInfoSidebar";
import ChatCallOverlay from "../../components/ChatCallOverlay";
import LiveStreamOverlay from "../../components/LiveStreamOverlay";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SIMULATED_REPLIES = [
    "Ajoyib! Davom eting!",
    "Yaxshi natija, men sizdan mamnunman!",
    "Suv ichishni unutmang -- kamida 2.5L",
    "Ertaga stretching ham qiling, mushaklar dam olishi kerak",
    "Oziq-ovqat rejasini kuzatib boring, makrolar muhim!",
    "Mashg'ulotdan keyin dam olish ham muhim",
    "Progressni kuzatib boring, har hafta yangilik bo'lishi kerak",
    "Motivatsiyani yo'qotmang, maqsadga yaqinlashyapsiz!",
];

const TYPING_DELAY = 1500;
const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

const WALLPAPERS = {
    default: "bg-muted/5",
    geometric: "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-no-repeat bg-cover bg-center opacity-20",
    fitness: "bg-[url('https://www.transparenttextures.com/patterns/binding-light.png')] bg-no-repeat bg-cover bg-center opacity-15",
    abstract: "bg-gradient-to-br from-primary/5 via-background to-secondary/5"
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateLabelForMsg(msg) {
    if (msg._date) return msg._date;
    return "today";
}

function renderTextWithLinks(text, isMe) {
    if (!text) return null;
    const parts = text.split(URL_REGEX);
    if (parts.length === 1) return text;
    return parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "underline break-all",
                        isMe ? "text-blue-200" : "text-blue-500"
                    )}
                >
                    {part}
                </a>
            );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
    });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const ChatView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { chatId: activeChat } = useParams();
    const [searchParams] = useSearchParams();
    const highlightMessageId = searchParams.get("msgId");
    const { activeRole } = useAuthStore();
    const isCoach = activeRole === "COACH";
    const { workoutPlans } = useCoachWorkoutPlans();
    const { mealPlans } = useCoachMealPlans();

    const {
        contacts,
        messages,
        typingUsers,
        readReceipts,
        pinnedMessages,
        fetchMessages,
        sendMessage,
        addReaction,
        deleteMessage,
        forwardMessage,
        editMessage,
        replyToMessage,
        setTyping,
        markAsRead,
        unpinMessage,
        pinMessage,
        toggleBookmark,
        sendSharedContent,
        sendPoll,
        sendTask,
        sendBooking,
        sendInvoice,
        getAISuggestions,
        activeWallpaper,
        customWallpaper,
        activeLive,
        startLive,
        endLive,
        toggleMuteChat,
        toggleBlockChat,
        isChatMuted,
        isChatBlocked,
        getPinnedMessages,
    } = useChatStore();

    const [input, setInput] = React.useState("");
    const [currentPinId, setCurrentPinId] = React.useState(null);
    const [reactionMsgId, setReactionMsgId] = React.useState(null);

    const [contextMenu, setContextMenu] = React.useState(null);
    const [replyingTo, setReplyingTo] = React.useState(null);
    const [editingMsg, setEditingMsg] = React.useState(null);
    const [deletingMsgId, setDeletingMsgId] = React.useState(null);
    const [forwardDialogOpen, setForwardDialogOpen] = React.useState(false);
    const [forwardingMsg, setForwardingMsg] = React.useState(null);

    const [chatSearchOpen, setChatSearchOpen] = React.useState(false);
    const [chatSearchQuery, setChatSearchQuery] = React.useState("");
    const [chatSearchIndex, setChatSearchIndex] = React.useState(0);

    const [showScrollBtn, setShowScrollBtn] = React.useState(false);
    const [newMsgCount, setNewMsgCount] = React.useState(0);
    const [isRecording, setIsRecording] = React.useState(false);
    const [stickerOpen, setStickerOpen] = React.useState(false);
    const [mediaFile, setMediaFile] = React.useState(null);
    const [mediaDialogOpen, setMediaDialogOpen] = React.useState(false);

    const [multiSelectMode, setMultiSelectMode] = React.useState(false);
    const [selectedMsgIds, setSelectedMsgIds] = React.useState(new Set());
    const [showInfoSidebar, setShowInfoSidebar] = React.useState(false);
    const [activeCall, setActiveCall] = React.useState(null);

    const messagesEndRef = React.useRef(null);
    const messagesContainerRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    const typingTimeoutRef = React.useRef(null);
    const reactionTimeoutRef = React.useRef(null);
    const longPressTimerRef = React.useRef(null);
    const messageRefs = React.useRef({});
    const bottomSentinelRef = React.useRef(null);
    const lastPrefillNonceRef = React.useRef(null);

    React.useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat);
            markAsRead(activeChat);
            setCurrentPinId(null); // Reset pin cycle
        }
    }, [activeChat, fetchMessages, markAsRead]);

    const scrollToBottom = React.useCallback((behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
        setNewMsgCount(0);
    }, []);

    React.useEffect(() => {
        if (!showScrollBtn) {
            scrollToBottom("smooth");
        } else {
            setNewMsgCount((prev) => prev + 1);
        }
    }, [messages, activeChat, typingUsers, showScrollBtn, scrollToBottom]);

    React.useEffect(() => {
        scrollToBottom("instant");
        setNewMsgCount(0);
    }, [activeChat, scrollToBottom]);

    React.useEffect(() => {
        const sentinel = bottomSentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowScrollBtn(!entry.isIntersecting);
                if (entry.isIntersecting) {
                    setNewMsgCount(0);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [activeChat]);

    React.useEffect(() => {
        const typingRef = typingTimeoutRef;
        const reactionRef = reactionTimeoutRef;
        const lpRef = longPressTimerRef;
        return () => {
            if (typingRef.current) clearTimeout(typingRef.current);
            if (reactionRef.current) clearTimeout(reactionRef.current);
            if (lpRef.current) clearTimeout(lpRef.current);
        };
    }, []);

    React.useEffect(() => {
        if (reactionMsgId === null) return;
        const handler = (e) => {
            if (!e.target.closest("[data-reaction-picker]")) {
                setReactionMsgId(null);
            }
        };
        document.addEventListener("click", handler, { capture: true });
        return () => document.removeEventListener("click", handler, { capture: true });
    }, [reactionMsgId]);

    React.useEffect(() => {
        setReplyingTo(null);
        setEditingMsg(null);
        setDeletingMsgId(null);
        setContextMenu(null);
        setMultiSelectMode(false);
        setSelectedMsgIds(new Set());
        setChatSearchOpen(false);
        setChatSearchQuery("");
        setStickerOpen(false);
        setIsRecording(false);
    }, [activeChat]);

    React.useEffect(() => {
        if (editingMsg) {
            setInput(editingMsg.text || "");
        }
    }, [editingMsg]);

    React.useEffect(() => {
        const prefillMessage = location.state?.prefillMessage;
        const prefillNonce = location.state?.prefillNonce;

        if (!activeChat || !prefillMessage || !prefillNonce) {
            return;
        }

        if (lastPrefillNonceRef.current === prefillNonce) {
            return;
        }

        lastPrefillNonceRef.current = prefillNonce;
        setInput(prefillMessage);
    }, [activeChat, location.state]);

    const allChats = React.useMemo(() => {
        return map(contacts, c => ({
            ...c,
            chatId: c.id,
        }));
    }, [contacts]);

    const activeEntity = React.useMemo(() => {
        return find(allChats, (c) => c.chatId === activeChat);
    }, [allChats, activeChat]);
    const isActiveChatMuted = React.useMemo(
        () => (activeChat ? isChatMuted(activeChat) : false),
        [activeChat, isChatMuted],
    );
    const isActiveChatBlocked = React.useMemo(
        () => (activeChat ? isChatBlocked(activeChat) : false),
        [activeChat, isChatBlocked],
    );

    const chatMessages = React.useMemo(() => {
        return messages[activeChat] || [];
    }, [messages, activeChat]);

    const chatSearchMatches = React.useMemo(() => {
        if (!chatSearchQuery.trim()) return [];
        const q = chatSearchQuery.toLowerCase();
        return chatMessages
            .map((msg, idx) => ({ msg, idx }))
            .filter(({ msg }) => msg.text && msg.text.toLowerCase().includes(q));
    }, [chatMessages, chatSearchQuery]);

    React.useEffect(() => {
        if (chatSearchMatches.length === 0) return;
        const match = chatSearchMatches[chatSearchIndex];
        if (!match) return;
        const el = messageRefs.current[match.msg.id];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [chatSearchIndex, chatSearchMatches]);

    const getLastSeenText = React.useCallback(
        (entity) => {
            if (!entity) return "";
            if (entity.isGroup) return `${entity.participantsCount || 0} a'zo`;
            return "Online"; // Simplified
        },
        []
    );

    const handleSendMessage = React.useCallback((textArg = null, mediaUrl = null, type = "text", ttl = null) => {
        if (activeChat && isChatBlocked(activeChat)) {
            toast.error("Bu chat bloklangan. Xabar yuborish uchun blokni olib tashlang.");
            return;
        }

        const msgText = (typeof textArg === 'string' ? textArg : input).trim();
        if (!msgText && !mediaUrl) return;

        sendMessage(activeChat, msgText, mediaUrl, type, null, replyingTo?.id);
        setInput("");
        setReplyingTo(null);
    }, [input, activeChat, sendMessage, isChatBlocked, replyingTo]);

    const shareContent = (type, item) => {
        sendSharedContent(activeChat, type, item.id, item.title, item.description || item.title);
        toast.success("Ulashildi");
    };

    const handleFileSelect = React.useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMediaFile(file);
        setMediaDialogOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const handleMediaSend = React.useCallback(
        async (file, comment, fileType) => {
            if (activeChat && isChatBlocked(activeChat)) {
                toast.error("Bu chat bloklangan. Media yuborib bo'lmaydi.");
                return;
            }

            const toastId = toast.loading("Media yuklanmoqda...");
            
            try {
                // 1. Upload file to storage
                const formData = new FormData();
                formData.append("file", file);
                
                const response = await api.post("/storage/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                
                const mediaUrl = response.data?.data?.url ?? response.data?.url;

                // 2. Send message with the returned URL
                sendMessage(activeChat, comment || (fileType === "image" ? "📷 Rasm" : "📎 Fayl"), mediaUrl, fileType);
                
                toast.success("Yuborildi", { id: toastId });
                setMediaDialogOpen(false);
                setMediaFile(null);
            } catch (error) {
                console.error("Media upload failed", error);
                toast.error("Media yuklashda xatolik", { id: toastId });
            }
        },
        [activeChat, sendMessage, isChatBlocked]
    );

    const handleVoiceSend = React.useCallback(
        async (blob, duration) => {
            const toastId = toast.loading("Ovozli xabar yuklanmoqda...");
            
            try {
                const formData = new FormData();
                formData.append("file", blob, "voice-note.webm");
                
                const response = await api.post("/storage/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                
                const mediaUrl = response.data?.data?.url ?? response.data?.url;

                sendMessage(activeChat, "🎙️ Ovozli xabar", mediaUrl, "voice", { duration });
                setIsRecording(false);
                toast.success("Yuborildi", { id: toastId });
            } catch (error) {
                console.error("Voice upload failed", error);
                toast.error("Ovozli xabarni yuklashda xatolik", { id: toastId });
            }
        },
        [activeChat, sendMessage]
    );

    const handleStickerSelect = React.useCallback(
        (emoji) => {
            sendMessage(activeChat, emoji, null, "sticker");
            setStickerOpen(false);
        },
        [activeChat, sendMessage]
    );

    const handleBackToList = React.useCallback(() => {
        navigate(getChatBasePath(activeRole));
    }, [navigate]);

    const handleDoubleClick = React.useCallback((msgId) => {
        setReactionMsgId((prev) => (prev === msgId ? null : msgId));
    }, []);

    const handleReaction = React.useCallback(
        (msgId, emoji) => {
            addReaction(activeChat, msgId, emoji);
            setReactionMsgId(null);
        },
        [activeChat, addReaction]
    );

    const handleContextMenu = React.useCallback((e, msg) => {
        e.preventDefault();
        setContextMenu({
            x: Math.min(e.clientX, window.innerWidth - 200),
            y: Math.min(e.clientY, window.innerHeight - 300),
            message: msg,
        });
    }, []);

    const handleContextMenuAction = React.useCallback(
        (action) => {
            if (!contextMenu?.message) return;
            const msg = contextMenu.message;
            switch (action) {
                case "copy":
                    navigator.clipboard.writeText(msg.text || "").then(() => toast.success("Nusxalandi"));
                    break;
                case "reply":
                    setReplyingTo(msg);
                    setEditingMsg(null);
                    break;
                case "edit":
                    setEditingMsg(msg);
                    setReplyingTo(null);
                    break;
                case "delete":
                    setDeletingMsgId(msg.id);
                    break;
                case "forward":
                    setForwardingMsg(msg);
                    setForwardDialogOpen(true);
                    break;
                case "pin": {
                    const currentPinned = pinnedMessages[activeChat];
                    if (currentPinned === msg.id) {
                        unpinMessage(activeChat);
                        toast.success("Pin olib tashlandi");
                    } else {
                        pinMessage(activeChat, msg.id);
                        toast.success("Xabar pin qilindi");
                    }
                    break;
                }
                case "select":
                    setMultiSelectMode(true);
                    setSelectedMsgIds(new Set([msg.id]));
                    break;
                case "bookmark":
                    toggleBookmark(activeChat, msg.id);
                    break;
                default: break;
            }
            setContextMenu(null);
        },
        [contextMenu, activeChat, pinnedMessages, pinMessage, unpinMessage, editMessage, toggleBookmark]
    );

    const handleDeleteForMe = React.useCallback(() => {
        if (deletingMsgId != null) {
            deleteMessage(activeChat, deletingMsgId, false);
            setDeletingMsgId(null);
        }
    }, [activeChat, deletingMsgId, deleteMessage]);

    const handleDeleteForAll = React.useCallback(() => {
        if (deletingMsgId != null) {
            deleteMessage(activeChat, deletingMsgId, true);
            setDeletingMsgId(null);
        }
    }, [activeChat, deletingMsgId, deleteMessage]);

    const handleDeleteCancel = React.useCallback(() => {
        setDeletingMsgId(null);
    }, []);

    const handleForward = React.useCallback(
        (targetChatId) => {
            if (!forwardingMsg) return;
            forwardMessage(activeChat, forwardingMsg.id, targetChatId);
            toast.success("Xabar yuborildi");
            setForwardDialogOpen(false);
            setForwardingMsg(null);
            setActiveChat(targetChatId);
            setShowMobileChat(true);
        },
        [activeChat, forwardingMsg, forwardMessage]
    );

    const handleChatSearchNext = React.useCallback(() => {
        setChatSearchIndex((prev) =>
            prev < chatSearchMatches.length - 1 ? prev + 1 : 0
        );
    }, [chatSearchMatches.length]);

    const handleChatSearchPrev = React.useCallback(() => {
        setChatSearchIndex((prev) =>
            prev > 0 ? prev - 1 : chatSearchMatches.length - 1
        );
    }, [chatSearchMatches.length]);

    const toggleMsgSelection = React.useCallback((msgId) => {
        setSelectedMsgIds((prev) => {
            const next = new Set(prev);
            if (next.has(msgId)) next.delete(msgId);
            else next.add(msgId);
            return next;
        });
    }, []);

    const handleMultiDelete = React.useCallback(() => {
        selectedMsgIds.forEach((id) => deleteMessage(activeChat, id, false));
        setMultiSelectMode(false);
        setSelectedMsgIds(new Set());
        toast.success(`${selectedMsgIds.size} ta xabar o'chirildi`);
    }, [activeChat, selectedMsgIds, deleteMessage]);

    const handleMultiForward = React.useCallback(() => {
        if (selectedMsgIds.size === 0) return;
        const firstId = head([...selectedMsgIds]);
        const msg = find(chatMessages, (m) => m.id === firstId);
        if (msg) {
            setForwardingMsg(msg);
            setForwardDialogOpen(true);
        }
        setMultiSelectMode(false);
        setSelectedMsgIds(new Set());
    }, [selectedMsgIds, chatMessages]);

    const exitMultiSelect = React.useCallback(() => {
        setMultiSelectMode(false);
        setSelectedMsgIds(new Set());
    }, []);

    const handleKeyDown = React.useCallback(
        (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
            if (e.key === "Escape") {
                if (editingMsg) {
                    setEditingMsg(null);
                    setInput("");
                } else if (replyingTo) {
                    setReplyingTo(null);
                }
            }
        },
        [handleSendMessage, editingMsg, replyingTo]
    );

    const messagesWithSeparators = React.useMemo(() => {
        const result = [];
        let lastDateLabel = null;

        for (let i = 0; i < chatMessages.length; i++) {
            const msg = chatMessages[i];
            const dateLabel = dateLabelForMsg(msg);

            if (dateLabel !== lastDateLabel) {
                result.push({ type: "separator", label: dateLabel, key: `sep-${dateLabel}-${i}` });
                lastDateLabel = dateLabel;
            }

            result.push({ type: "message", msg, key: msg.id });
        }

        return result;
    }, [chatMessages]);

    const searchHighlightIds = React.useMemo(() => {
        if (!chatSearchQuery.trim()) return new Set();
        return new Set(map(chatSearchMatches, (m) => m.msg.id));
    }, [chatSearchQuery, chatSearchMatches]);

    React.useEffect(() => {
        if (!highlightMessageId) return;
        const el = messageRefs.current[highlightMessageId];
        if (!el) return;

        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-primary", "bg-primary/10");
        const timer = setTimeout(() => {
            el.classList.remove("ring-2", "ring-primary", "bg-primary/10");
        }, 2000);

        return () => clearTimeout(timer);
    }, [highlightMessageId, chatMessages]);

    const showMobileChat = Boolean(activeChat);

    return (
        <>
            <div
                className={cn(
                    "flex-1 flex flex-col bg-background relative transition-all duration-300 w-full h-full overflow-hidden",
                    showMobileChat ? "flex fixed inset-0 z-40 md:relative" : "hidden md:flex",
                )}
            >
                <div
                    className={cn(
                        "absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-500",
                        activeWallpaper !== "custom" &&
                            (WALLPAPERS[activeWallpaper] || WALLPAPERS.default),
                    )}
                    style={
                        activeWallpaper === "custom"
                            ? { backgroundImage: `url(${customWallpaper})` }
                            : {}
                    }
                />
                {activeWallpaper === "custom" && (
                    <div className="absolute inset-0 bg-black/10 pointer-events-none z-0" />
                )}

                {activeEntity ? (
                    <div className="flex flex-col h-full w-full relative z-10">
                        <ChatHeader
                            activeEntity={activeEntity}
                            typingUsers={typingUsers}
                            activeChat={activeChat}
                            getLastSeenText={getLastSeenText}
                            handleBackToList={handleBackToList}
                            chatSearchOpen={chatSearchOpen}
                            setChatSearchOpen={setChatSearchOpen}
                            chatSearchQuery={chatSearchQuery}
                            setChatSearchQuery={setChatSearchQuery}
                            setChatSearchIndex={setChatSearchIndex}
                            chatSearchMatches={chatSearchMatches}
                            chatSearchIndex={chatSearchIndex}
                            handleChatSearchPrev={handleChatSearchPrev}
                            handleChatSearchNext={handleChatSearchNext}
                            isCoach={isCoach}
                            onToggleInfo={() => setShowInfoSidebar(!showInfoSidebar)}
                            isMuted={isActiveChatMuted}
                            isBlocked={isActiveChatBlocked}
                            onToggleMute={() => toggleMuteChat(activeChat)}
                            onToggleBlock={() => toggleBlockChat(activeChat)}
                            onAudioCall={() => setActiveCall({ type: "audio" })}
                            onVideoCall={() => setActiveCall({ type: "video" })}
                            onStartLive={() =>
                                activeLive
                                    ? endLive()
                                    : startLive(
                                          activeChat,
                                          isCoach ? "Siz (Coach)" : activeEntity.name,
                                      )
                            }
                        />

                        {getPinnedMessages(activeChat).length > 0 && (
                            <div className="border-b px-6 py-2 bg-primary/5 flex items-center justify-between animate-in slide-in-from-top duration-300 relative group/pin">
                                <button
                                    className="flex-1 flex items-center gap-3 text-left overflow-hidden"
                                    onClick={() => {
                                        const pins = getPinnedMessages(activeChat);
                                        const currentIdx =
                                            pins.findIndex((p) => p.id === currentPinId) || 0;
                                        const nextIdx = (currentIdx + 1) % pins.length;
                                        const nextPin = pins[nextIdx];
                                        setCurrentPinId(nextPin.id);

                                        const el = messageRefs.current[nextPin.id];
                                        if (el) {
                                            el.scrollIntoView({
                                                behavior: "smooth",
                                                block: "center",
                                            });
                                            el.classList.add(
                                                "ring-2",
                                                "ring-primary/50",
                                                "bg-primary/5",
                                            );
                                            setTimeout(
                                                () =>
                                                    el.classList.remove(
                                                        "ring-2",
                                                        "ring-primary/50",
                                                        "bg-primary/5",
                                                    ),
                                                2000,
                                            );
                                        }
                                    }}
                                >
                                    <div className="size-1 w-1 h-8 bg-primary rounded-full shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-black text-primary text-[10px] uppercase tracking-wider flex items-center gap-2">
                                            Pinned Message{" "}
                                            {getPinnedMessages(activeChat).length > 1 && (
                                                <span className="opacity-60">
                                                    ({getPinnedMessages(activeChat).length})
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs truncate opacity-80 font-medium">
                                            {find(getPinnedMessages(activeChat), (p) => p.id === currentPinId)?.text || getPinnedMessages(activeChat)[0]?.text}
                                        </p>
                                    </div>
                                </button>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 rounded-full opacity-0 group-hover/pin:opacity-100 transition-opacity"
                                        onClick={() =>
                                            unpinMessage(
                                                activeChat,
                                                currentPinId ||
                                                    getPinnedMessages(activeChat)[0]?.id,
                                            )
                                        }
                                    >
                                        <XIcon className="size-3" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <MessageList
                            messagesWithSeparators={messagesWithSeparators}
                            searchHighlightIds={searchHighlightIds}
                            handleDoubleClick={handleDoubleClick}
                            handleContextMenu={handleContextMenu}
                            handleReaction={handleReaction}
                            handleDeleteForMe={handleDeleteForMe}
                            handleDeleteForAll={handleDeleteForAll}
                            handleDeleteCancel={handleDeleteCancel}
                            renderTextWithLinks={renderTextWithLinks}
                            isCoach={isCoach}
                            activeChat={activeChat}
                            readReceipts={readReceipts}
                            reactionMsgId={reactionMsgId}
                            deletingMsgId={deletingMsgId}
                            multiSelectMode={multiSelectMode}
                            selectedMsgIds={selectedMsgIds}
                            toggleMsgSelection={toggleMsgSelection}
                            messageRefs={messageRefs}
                            messagesEndRef={messagesEndRef}
                            bottomSentinelRef={bottomSentinelRef}
                        />

                        {isActiveChatBlocked && (
                            <div className="border-b px-6 py-3 bg-destructive/5 text-sm text-muted-foreground">
                                Bu suhbat bloklangan. Xabar yuborish, media jo'natish va yangi
                                harakatlar vaqtincha o'chirilgan.
                            </div>
                        )}

                        <ChatInput
                            input={input}
                            setInput={setInput}
                            isRecording={isRecording}
                            setIsRecording={setIsRecording}
                            handleSendMessage={handleSendMessage}
                            handleVoiceSend={handleVoiceSend}
                            handleFileSelect={handleFileSelect}
                            fileInputRef={fileInputRef}
                            isCoach={isCoach}
                            shareContent={shareContent}
                            workoutPlans={workoutPlans}
                            mealPlans={mealPlans}
                            stickerOpen={stickerOpen}
                            setStickerOpen={setStickerOpen}
                            handleStickerSelect={handleStickerSelect}
                            setTyping={setTyping}
                            activeChat={activeChat}
                            handleKeyDown={handleKeyDown}
                            replyingTo={replyingTo}
                            setReplyingTo={setReplyingTo}
                            editingMsg={editingMsg}
                            setEditingMsg={setEditingMsg}
                            multiSelectMode={multiSelectMode}
                            exitMultiSelect={exitMultiSelect}
                            selectedMsgIds={selectedMsgIds}
                            handleMultiDelete={handleMultiDelete}
                            handleMultiForward={handleMultiForward}
                            sendPoll={sendPoll}
                            sendTask={sendTask}
                            sendBooking={sendBooking}
                            sendInvoice={sendInvoice}
                            getAISuggestions={getAISuggestions}
                            chatMessages={chatMessages}
                            disabled={isActiveChatBlocked}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5 animate-in fade-in duration-500">
                        <div className="size-24 rounded-full bg-primary/5 flex items-center justify-center mb-6 relative">
                            <UsersIcon className="size-12 text-primary opacity-20" />
                            <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/10 animate-[spin_10s_linear_infinite]" />
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">
                            Suhbatni boshlang
                        </h3>
                        <p className="text-sm opacity-60 max-w-[240px] text-center leading-relaxed">
                            Kontaktlardan birini tanlang va muloqotni professional darajada
                            davom ettiring
                        </p>
                    </div>
                )}
            </div>

            {showInfoSidebar && activeEntity && (
                <div className="fixed inset-0 z-50 md:relative md:inset-auto">
                    <div
                        className="absolute inset-0 bg-black/40 md:hidden"
                        onClick={() => setShowInfoSidebar(false)}
                    />
                    <ChatInfoSidebar
                        activeEntity={activeEntity}
                        onClose={() => setShowInfoSidebar(false)}
                        chatMessages={chatMessages}
                        lastSeenText={getLastSeenText(activeEntity)}
                    />
                </div>
            )}

            {activeCall && activeEntity && (
                <ChatCallOverlay
                    activeEntity={activeEntity}
                    callType={activeCall.type}
                    onEnd={() => setActiveCall(null)}
                />
            )}

            {activeLive && (
                <LiveStreamOverlay
                    activeLive={activeLive}
                    isHost={isCoach && activeLive.chatId === activeChat}
                    onEnd={() => endLive()}
                />
            )}

            {contextMenu && (
                <MessageContextMenu
                    position={{ x: contextMenu.x, y: contextMenu.y }}
                    message={contextMenu.message}
                    isMe={contextMenu.message.from === "me"}
                    onAction={handleContextMenuAction}
                    onClose={() => setContextMenu(null)}
                />
            )}
            <ForwardDialog
                open={forwardDialogOpen}
                onClose={() => setForwardDialogOpen(false)}
                onForward={handleForward}
                message={forwardingMsg}
            />
            <MediaUploadDialog
                open={mediaDialogOpen}
                file={mediaFile}
                onSend={handleMediaSend}
                onCancel={() => setMediaDialogOpen(false)}
            />
        </>
    );
};

export default ChatView;
