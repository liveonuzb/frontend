/* eslint-disable react-hooks/set-state-in-effect */
import React from "react";
import { find, map } from "lodash";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
    UsersIcon,
    XIcon,
} from "lucide-react";
import { useChatStore, useAuthStore } from "@/store";
import { toast } from "sonner";
import { api } from "@/hooks/api/use-api.js";
import { getApiResponseData } from "@/lib/api-response.js";
import MessageContextMenu from "@/components/chat/message-context-menu";
import MediaUploadDialog from "@/components/chat/media-upload-dialog";
import ForwardDialog from "@/components/chat/forward-dialog";
import { cn } from "@/lib/utils";
import { getChatBasePath, getChatPath } from "@/lib/app-paths.js";

// New Components
import ChatHeader from "../../components/ChatHeader";
import MessageList from "../../components/MessageList";
import ChatInput from "../../components/ChatInput";
import ChatInfoSidebar from "../../components/ChatInfoSidebar";
import ChatActionShortcutDialog from "../../components/ChatActionShortcutDialog";
import LiveStreamOverlay from "../../components/LiveStreamOverlay";
import {
    buildChatAttachmentMetadata,
    validateChatAttachment,
} from "../../lib/chat-attachment-policy.js";
import { isChatFeatureEnabled } from "../../lib/chat-feature-flags.js";
import {
    useCoachClientDetail,
    useCoachClientNotes,
} from "@/hooks/app/use-coach";

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;
const COACH_SHORTCUT_PREFIX = "coach:";
const CHAT_MESSAGE_SHORTCUT_ACTIONS = new Set([
    "invoice",
    "payment_reminder",
    "session_booking",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateLabelForMsg(msg) {
    if (msg._date) return msg._date;
    const parsed = new Date(msg.createdAt || msg.timestamp || msg.time);
    if (Number.isNaN(parsed.getTime())) return "today";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messageDay = new Date(parsed);
    messageDay.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - messageDay.getTime()) / 86400000);

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";

    return new Intl.DateTimeFormat("uz-UZ", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(parsed);
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

const getActiveClientId = (activeEntity) =>
    activeEntity?.otherParticipant?.id ?? activeEntity?.clientId ?? null;

const getErrorMessage = (error, fallback) => {
    const message = error?.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    return message || fallback;
};

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
    const canUseReactions = isChatFeatureEnabled("reactions");
    const canUseBookmarks = isChatFeatureEnabled("bookmarks");
    const canUseMuteBlock = isChatFeatureEnabled("muteBlockControls");
    const canUseLiveActivity = isChatFeatureEnabled("liveActivity");

    const {
        contacts,
        messages,
        typingUsers,
        pinnedMessages,
        fetchMessages,
        sendMessage,
        addReaction,
        deleteMessage,
        forwardMessage,
        retryMessage,
        editMessage,
        setTyping,
        markAsRead,
        unpinMessage,
        pinMessage,
        toggleBookmark,
        sendBooking,
        getAISuggestions,
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
    const [shortcutDialog, setShortcutDialog] = React.useState({
        open: false,
        action: null,
        message: null,
    });

    const [chatSearchOpen, setChatSearchOpen] = React.useState(false);
    const [chatSearchQuery, setChatSearchQuery] = React.useState("");
    const [chatSearchIndex, setChatSearchIndex] = React.useState(0);

    const [showScrollBtn, setShowScrollBtn] = React.useState(false);
    const [isRecording, setIsRecording] = React.useState(false);
    const [stickerOpen, setStickerOpen] = React.useState(false);
    const [mediaFile, setMediaFile] = React.useState(null);
    const [mediaDialogOpen, setMediaDialogOpen] = React.useState(false);

    const [showInfoSidebar, setShowInfoSidebar] = React.useState(false);
    const [isBrowserOnline, setIsBrowserOnline] = React.useState(() =>
        typeof navigator === "undefined" ? true : navigator.onLine,
    );

    const messagesEndRef = React.useRef(null);
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

    React.useEffect(() => {
        const handleOnline = () => setIsBrowserOnline(true);
        const handleOffline = () => setIsBrowserOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const scrollToBottom = React.useCallback((behavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    React.useEffect(() => {
        if (!showScrollBtn) {
            scrollToBottom("smooth");
        }
    }, [messages, activeChat, typingUsers, showScrollBtn, scrollToBottom]);

    React.useEffect(() => {
        scrollToBottom("instant");
    }, [activeChat, scrollToBottom]);

    React.useEffect(() => {
        const sentinel = bottomSentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowScrollBtn(!entry.isIntersecting);
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
        setShortcutDialog({ open: false, action: null, message: null });
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
    const activeClientId = React.useMemo(
        () => getActiveClientId(activeEntity),
        [activeEntity],
    );
    const canUseCoachActions = isCoach && Boolean(activeChat) && Boolean(activeClientId);
    const {
        detail: coachClientDetail,
        createWeeklyCheckIn,
        createFeedback,
        createTask,
        isCreatingWeeklyCheckIn,
        isCreatingFeedback,
        isCreatingTask,
    } = useCoachClientDetail(activeClientId, canUseCoachActions);
    const { createNote, isCreatingNote } = useCoachClientNotes(
        activeClientId,
        canUseCoachActions,
    );
    const isShortcutSubmitting =
        isCreatingNote ||
        isCreatingWeeklyCheckIn ||
        isCreatingFeedback ||
        isCreatingTask;
    const coachClientPaymentSummary =
        coachClientDetail?.overview?.paymentSummary ??
        activeEntity?.paymentSummary ??
        activeEntity?.payment ??
        null;
    const coachClientName =
        coachClientDetail?.client?.name ??
        activeEntity?.name ??
        activeEntity?.otherParticipant?.name ??
        "";
    const isActiveChatMuted = React.useMemo(
        () => (canUseMuteBlock && activeChat ? isChatMuted(activeChat) : false),
        [activeChat, canUseMuteBlock, isChatMuted],
    );
    const isActiveChatBlocked = React.useMemo(
        () => (canUseMuteBlock && activeChat ? isChatBlocked(activeChat) : false),
        [activeChat, canUseMuteBlock, isChatBlocked],
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

    const handleSendMessage = React.useCallback(async (textArg = null, mediaUrl = null, type = "text") => {
        if (canUseMuteBlock && activeChat && isChatBlocked(activeChat)) {
            toast.error("Bu chat bloklangan. Xabar yuborish uchun blokni olib tashlang.");
            return;
        }

        const msgText = (typeof textArg === 'string' ? textArg : input).trim();
        if (!msgText && !mediaUrl) return;

        try {
            if (editingMsg) {
                await editMessage(activeChat, editingMsg.id, msgText);
                setInput("");
                setEditingMsg(null);
                return;
            }

            await sendMessage(activeChat, msgText, mediaUrl, type, null, replyingTo?.id);
            setInput("");
            setReplyingTo(null);
        } catch {
            // Store actions already show the user-facing error.
        }
    }, [input, activeChat, sendMessage, editMessage, canUseMuteBlock, isChatBlocked, replyingTo, editingMsg]);

    const handleFileSelect = React.useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const validation = validateChatAttachment(file);
        if (!validation.ok) {
            toast.error(validation.message);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        setMediaFile(file);
        setMediaDialogOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const handleMediaSend = React.useCallback(
        async (file, comment, fileType) => {
            if (canUseMuteBlock && activeChat && isChatBlocked(activeChat)) {
                toast.error("Bu chat bloklangan. Media yuborib bo'lmaydi.");
                return;
            }

            const toastId = toast.loading("Media yuklanmoqda...");
            
            try {
                const validation = validateChatAttachment(file);
                if (!validation.ok) {
                    toast.error(validation.message, { id: toastId });
                    return;
                }

                // 1. Upload file to storage
                const formData = new FormData();
                formData.append("file", file);
                
                const response = await api.post("/storage/chat-upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                const uploaded = getApiResponseData(response, response?.data);
                const mediaUrl = uploaded?.url;
                const mediaType = uploaded?.mediaType || fileType;

                if (!mediaUrl || !uploaded?.objectKey) {
                    throw new Error("Secure upload response invalid");
                }

                // 2. Send message with the returned URL
                const sentMessage = await sendMessage(
                    activeChat,
                    comment || (mediaType === "image" ? "📷 Rasm" : mediaType === "video" ? "🎥 Video" : mediaType === "audio" ? "🎙️ Audio" : "📎 Fayl"),
                    mediaUrl,
                    mediaType,
                    {
                        attachment: buildChatAttachmentMetadata(uploaded, file),
                    },
                );
                if (!sentMessage) {
                    throw new Error("Secure media message could not be sent");
                }
                
                toast.success("Yuborildi", { id: toastId });
                setMediaDialogOpen(false);
                setMediaFile(null);
            } catch (error) {
                console.error("Media upload failed", error);
                toast.error("Media yuklashda xatolik", { id: toastId });
            }
        },
        [activeChat, sendMessage, canUseMuteBlock, isChatBlocked]
    );

    const handleVoiceSend = React.useCallback(
        async (blob, duration) => {
            if (canUseMuteBlock && activeChat && isChatBlocked(activeChat)) {
                toast.error("Bu chat bloklangan. Ovozli xabar yuborib bo'lmaydi.");
                return;
            }

            const toastId = toast.loading("Ovozli xabar yuklanmoqda...");
            
            try {
                const voiceFile = new File([blob], "voice-note.webm", {
                    type: blob.type || "audio/webm",
                });
                const validation = validateChatAttachment(voiceFile);
                if (!validation.ok) {
                    toast.error(validation.message, { id: toastId });
                    return;
                }

                const formData = new FormData();
                formData.append("file", voiceFile);
                
                const response = await api.post("/storage/chat-upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                const uploaded = getApiResponseData(response, response?.data);
                const mediaUrl = uploaded?.url;

                if (!mediaUrl || !uploaded?.objectKey) {
                    throw new Error("Secure voice upload response invalid");
                }

                const sentMessage = await sendMessage(activeChat, "🎙️ Ovozli xabar", mediaUrl, "audio", {
                    duration,
                    attachment: buildChatAttachmentMetadata(uploaded, voiceFile),
                });
                if (!sentMessage) {
                    throw new Error("Secure voice message could not be sent");
                }
                setIsRecording(false);
                toast.success("Yuborildi", { id: toastId });
            } catch (error) {
                console.error("Voice upload failed", error);
                toast.error("Ovozli xabarni yuklashda xatolik", { id: toastId });
            }
        },
        [activeChat, sendMessage, canUseMuteBlock, isChatBlocked]
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
    }, [activeRole, navigate]);

    const handleDoubleClick = React.useCallback((msgId) => {
        if (!canUseReactions) return;
        setReactionMsgId((prev) => (prev === msgId ? null : msgId));
    }, [canUseReactions]);

    const handleReaction = React.useCallback(
        (msgId, emoji) => {
            if (!canUseReactions) return;
            addReaction(activeChat, msgId, emoji);
            setReactionMsgId(null);
        },
        [activeChat, addReaction, canUseReactions]
    );

    const handleContextMenu = React.useCallback((e, msg) => {
        e.preventDefault();
        const isSmallScreen = window.innerWidth < 640;
        const menuWidth = isSmallScreen ? window.innerWidth - 24 : 240;
        const menuHeight = isSmallScreen ? window.innerHeight * 0.7 : 360;
        setContextMenu({
            x: Math.max(12, Math.min(e.clientX, window.innerWidth - menuWidth - 12)),
            y: Math.max(12, Math.min(e.clientY, window.innerHeight - menuHeight - 12)),
            message: msg,
        });
    }, []);

    const handleRetryMessage = React.useCallback(
        (messageId) => {
            if (!activeChat || !messageId) return;
            retryMessage(activeChat, messageId);
        },
        [activeChat, retryMessage],
    );

    const handleContextMenuAction = React.useCallback(
        (action) => {
            if (!contextMenu?.message) return;
            const msg = contextMenu.message;
            if (action.startsWith(COACH_SHORTCUT_PREFIX)) {
                if (!canUseCoachActions) {
                    toast.error("Bu chat client action shortcutlari uchun ulanmagan.");
                    setContextMenu(null);
                    return;
                }

                setShortcutDialog({
                    open: true,
                    action: action.slice(COACH_SHORTCUT_PREFIX.length),
                    message: msg,
                });
                setContextMenu(null);
                return;
            }

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
                case "bookmark":
                    if (canUseBookmarks) toggleBookmark(activeChat, msg.id);
                    break;
                default: break;
            }
            setContextMenu(null);
        },
        [
            contextMenu,
            activeChat,
            pinnedMessages,
            pinMessage,
            unpinMessage,
            toggleBookmark,
            canUseBookmarks,
            canUseCoachActions,
        ]
    );

    const handleShortcutDialogOpenChange = React.useCallback((open) => {
        setShortcutDialog((current) => ({
            ...current,
            open,
            action: open ? current.action : null,
            message: open ? current.message : null,
        }));
    }, []);

    const handleShortcutSubmit = React.useCallback(
        async (action, payload) => {
            if (!activeClientId) {
                toast.error("Client topilmadi.");
                return;
            }

            if (
                CHAT_MESSAGE_SHORTCUT_ACTIONS.has(action) &&
                canUseMuteBlock &&
                activeChat &&
                isChatBlocked(activeChat)
            ) {
                toast.error("Bu chat bloklangan. Chatga shortcut yuborib bo'lmaydi.");
                return;
            }

            const sourceMessageId = shortcutDialog.message?.id;
            const metadata = {
                source: "coach_chat_shortcut",
                sourceMessageId,
                clientId: activeClientId,
            };

            try {
                if (action === "note") {
                    await createNote({
                        ...payload,
                        tags: [...(payload.tags ?? []), "chat-shortcut"].filter(Boolean),
                    });
                    toast.success("Note saqlandi");
                } else if (action === "task") {
                    await createTask({
                        ...payload,
                        description: [
                            payload.description,
                            sourceMessageId ? `Message: ${sourceMessageId}` : null,
                        ]
                            .filter(Boolean)
                            .join("\n\n"),
                    });
                    toast.success("Task yaratildi");
                } else if (action === "check_in") {
                    await createWeeklyCheckIn({
                        ...payload,
                        note: [
                            payload.note,
                            sourceMessageId ? `Message: ${sourceMessageId}` : null,
                        ]
                            .filter(Boolean)
                            .join("\n\n"),
                    });
                    toast.success("Check-in request yaratildi");
                } else if (action === "invoice") {
                    await sendMessage(activeChat, payload.text, null, "invoice", {
                        ...payload.metadata,
                        ...metadata,
                    });
                    toast.success("Invoice chatga yuborildi");
                } else if (action === "payment_reminder") {
                    await sendMessage(activeChat, payload.text, null, "text", {
                        type: "payment_reminder",
                        ...metadata,
                    });
                    toast.success("Payment reminder yuborildi");
                } else if (action === "meal_feedback" || action === "workout_feedback") {
                    await createFeedback({
                        ...payload,
                        title:
                            payload.title ||
                            (action === "meal_feedback"
                                ? "Nutrition feedback"
                                : "Workout feedback"),
                    });
                    toast.success("Feedback yaratildi");
                } else if (action === "session_booking") {
                    await sendBooking(
                        activeChat,
                        payload.title,
                        payload.date,
                        payload.slots,
                        payload.durationMinutes,
                        payload.note,
                    );
                    toast.success("Session booking yuborildi");
                }

                setShortcutDialog({ open: false, action: null, message: null });
            } catch (error) {
                toast.error(getErrorMessage(error, "Shortcut action bajarilmadi"));
            }
        },
        [
            activeChat,
            activeClientId,
            canUseMuteBlock,
            createFeedback,
            createNote,
            createTask,
            createWeeklyCheckIn,
            isChatBlocked,
            sendBooking,
            sendMessage,
            shortcutDialog.message,
        ],
    );

    const handleDelete = React.useCallback(async () => {
        if (deletingMsgId != null) {
            await deleteMessage(activeChat, deletingMsgId);
            setDeletingMsgId(null);
        }
    }, [activeChat, deletingMsgId, deleteMessage]);

    const handleDeleteCancel = React.useCallback(() => {
        setDeletingMsgId(null);
    }, []);

    const handleForward = React.useCallback(
        async (targetChatId) => {
            if (!forwardingMsg) return;
            try {
                await forwardMessage(activeChat, forwardingMsg.id, targetChatId);
                toast.success("Xabar yuborildi");
                setForwardDialogOpen(false);
                setForwardingMsg(null);
                navigate(getChatPath(activeRole, targetChatId));
            } catch {
                toast.error("Xabarni forward qilib bo'lmadi");
            }
        },
        [activeChat, activeRole, forwardingMsg, forwardMessage, navigate]
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
                    "flex-1 flex min-h-0 flex-col bg-background relative transition-all duration-300 w-full h-full overflow-hidden md:border-l",
                    showMobileChat ? "fixed inset-0 z-50 flex h-dvh md:relative md:inset-auto md:z-auto md:h-full" : "hidden md:flex",
                )}
            >
                {activeEntity ? (
                    <div className="relative flex h-full min-h-0 w-full flex-col">
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
                            onToggleMute={
                                canUseMuteBlock ? () => toggleMuteChat(activeChat) : undefined
                            }
                            onToggleBlock={
                                canUseMuteBlock ? () => toggleBlockChat(activeChat) : undefined
                            }
                            onStartLive={
                                canUseLiveActivity
                                    ? () =>
                                          activeLive
                                              ? endLive()
                                              : startLive(
                                                    activeChat,
                                                    isCoach ? "Siz (Coach)" : activeEntity.name,
                                                )
                                    : undefined
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
                            handleDelete={handleDelete}
                            handleDeleteCancel={handleDeleteCancel}
                            renderTextWithLinks={renderTextWithLinks}
                            activeChat={activeChat}
                            reactionMsgId={reactionMsgId}
                            deletingMsgId={deletingMsgId}
                            multiSelectMode={false}
                            messageRefs={messageRefs}
                            messagesEndRef={messagesEndRef}
                            bottomSentinelRef={bottomSentinelRef}
                            handleRetryMessage={handleRetryMessage}
                        />

                        {canUseMuteBlock && isActiveChatBlocked && (
                            <div className="border-t bg-destructive/5 px-3 py-2 text-xs text-muted-foreground md:px-6 md:py-3 md:text-sm">
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
                            sendBooking={sendBooking}
                            getAISuggestions={getAISuggestions}
                            chatMessages={chatMessages}
                            coachReplyContext={{
                                detail: coachClientDetail,
                                activeEntity,
                            }}
                            disabled={canUseMuteBlock && isActiveChatBlocked}
                            disabledReason="Bu suhbat bloklangan. Xabar yuborish vaqtincha o'chirilgan."
                            connectionState={isBrowserOnline ? "online" : "offline"}
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
                        isCoach={isCoach}
                    />
                </div>
            )}

            {canUseLiveActivity && activeLive && (
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
                    canUseCoachActions={canUseCoachActions}
                    onAction={handleContextMenuAction}
                    onClose={() => setContextMenu(null)}
                />
            )}
            <ChatActionShortcutDialog
                key={`${shortcutDialog.action || "empty"}-${shortcutDialog.message?.id || "none"}`}
                open={shortcutDialog.open}
                action={shortcutDialog.action}
                sourceMessage={shortcutDialog.message}
                clientName={coachClientName}
                paymentSummary={coachClientPaymentSummary}
                isSubmitting={isShortcutSubmitting}
                onOpenChange={handleShortcutDialogOpenChange}
                onSubmit={handleShortcutSubmit}
            />
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
