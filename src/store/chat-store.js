import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { io } from "socket.io-client";
import { api } from "@/hooks/api/use-api.js";
import { config } from "@/config.js";
import useAuthStore from "./auth-store";
import { map, filter, find, findIndex, some, includes, reduce, join, toPairs } from "lodash";

const formatChatMessage = (message, currentUserId) => ({
    ...message,
    // Normalize type to lowercase so MessageList checks (e.g. "image", "voice") always match
    // regardless of whether the value came from Prisma enum (uppercase) or frontend (lowercase)
    type: message.type ? String(message.type).toLowerCase() : "text",
    from: message?.sender?.id === currentUserId ? "me" : "other",
    time: new Date(message.createdAt).toLocaleTimeString("uz", {
        hour: "2-digit",
        minute: "2-digit",
    }),
    status: message.isRead ? "read" : "sent",
});

const upsertRoomMessage = (currentMessages, nextMessage, currentUserId) => {
    const formattedMessage = formatChatMessage(nextMessage, currentUserId);
    const optimisticIdx =
        formattedMessage.from === "me"
            ? findIndex(
                  currentMessages,
                  (message) =>
                      String(message.id || "").startsWith("temp-") &&
                      message.text === formattedMessage.text,
              )
            : -1;
    const existingIdx = findIndex(currentMessages, (message) => message.id === formattedMessage.id);

    if (existingIdx !== -1) {
        const nextMessages = [...currentMessages];
        nextMessages[existingIdx] = {
            ...nextMessages[existingIdx],
            ...formattedMessage,
        };
        return nextMessages;
    }

    if (optimisticIdx !== -1) {
        const nextMessages = [...currentMessages];
        nextMessages[optimisticIdx] = {
            ...nextMessages[optimisticIdx],
            ...formattedMessage,
        };
        return nextMessages;
    }

    return [...currentMessages, formattedMessage];
};

const syncRoomLastMessage = (contacts, roomId, message, incrementUnread = false) =>
    map(contacts, (contact) =>
        contact.id === roomId
            ? {
                  ...contact,
                  lastMessage: {
                      text: message.text,
                      createdAt: message.createdAt,
                  },
                  unreadCount: incrementUnread
                      ? (contact.unreadCount || 0) + 1
                      : contact.unreadCount,
              }
            : contact,
    );

export const getChatSocketConnectionConfig = (baseURL) => {
    const normalizedBaseURL = String(baseURL || "").replace(/\/+$/, "");
    const apiPrefix = normalizedBaseURL.match(/(\/api\/v\d+)$/)?.[1] || "/api/v1";

    return {
        socketUrl: normalizedBaseURL.replace(/\/api\/v\d+$/, ""),
        socketPath: `${apiPrefix}/socket.io`,
    };
};

const useChatStore = create(
    persist(
        (set, get) => ({
            socket: null,
            contacts: [], // This will be our rooms
            groups: [],
            messages: {}, // roomId -> [messages]
            messagesCursors: {}, // roomId -> nextCursor
            typingUsers: {},
            readReceipts: {},
            pinnedMessages: {},
            lastSeen: {},
            bookmarks: [],
            activeLive: null,
            activeWallpaper: "default",
            customWallpaper: null,
            scheduledMessages: [],
            folders: [],
            pinnedChats: [],
            chatOrder: null,
            mutedChats: [],
            blockedChats: [],
            isLoading: false,
            library: [], // Added missing library
            activeRoomId: null,

            initSocket: () => {
                const { token } = useAuthStore.getState();
                if (!token || get().socket) return;

                const { socketUrl, socketPath } = getChatSocketConnectionConfig(config.baseURL);

                const socket = io(socketUrl, {
                    auth: { token },
                    path: socketPath,
                    transports: ["websocket", "polling"],
                });

                socket.on("connect", () => {
                    console.log("Chat socket connected ✅");
                });

                socket.on("connect_error", (err) => {
                    console.error("Socket connection error ❌", err);
                });

                socket.on("newMessage", (message) => {
                    const { roomId, text, sender } = message;
                    if (!roomId) {
                        console.warn("Received message without roomId", message);
                        return;
                    }

                    const myId = useAuthStore.getState().user?.id;
                    const isFromMe = sender.id === myId;
                    const isActiveRoom = roomId === get().activeRoomId;

                    set((state) => {
                        return {
                            messages: {
                                ...state.messages,
                                [roomId]: upsertRoomMessage(
                                    state.messages[roomId] || [],
                                    message,
                                    myId,
                                ),
                            },
                        };
                    });

                    // Update room last message in contacts; only increment unread when not from me and not currently viewing
                    set((state) => ({
                        contacts: syncRoomLastMessage(
                            state.contacts,
                            roomId,
                            message,
                            !isFromMe && !isActiveRoom,
                        ),
                    }));
                });

                socket.on("messageUpdated", (message) => {
                    const roomId = message?.roomId;
                    if (!roomId) return;

                    const myId = useAuthStore.getState().user?.id;
                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [roomId]: upsertRoomMessage(
                                state.messages[roomId] || [],
                                message,
                                myId,
                            ),
                        },
                        contacts: syncRoomLastMessage(
                            state.contacts,
                            roomId,
                            message,
                            false,
                        ),
                    }));
                });

                socket.on("messagesRead", ({ roomId }) => {
                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [roomId]: map(state.messages[roomId] || [], m =>
                                m.from === "me" ? { ...m, status: "read" } : m
                            )
                        }
                    }));
                });

                socket.on("messagePinned", ({ roomId, messageId }) => {
                    set((state) => {
                        const roomMsgs = state.messages[roomId] || [];
                        const msgToPin = find(roomMsgs, m => m.id === messageId);
                        if (!msgToPin) return state;

                        const currentPins = state.pinnedMessages[roomId] || [];
                        if (some(currentPins, p => p.id === messageId)) return state;

                        return {
                            pinnedMessages: {
                                ...state.pinnedMessages,
                                [roomId]: [msgToPin, ...currentPins],
                            },
                        };
                    });
                });

                socket.on("messageUnpinned", ({ roomId, messageId }) => {
                    set((state) => {
                        const currentPins = state.pinnedMessages[roomId] || [];
                        return {
                            pinnedMessages: {
                                ...state.pinnedMessages,
                                [roomId]: messageId ? filter(currentPins, p => p.id !== messageId) : [],
                            },
                        };
                    });
                });

                socket.on("userTyping", ({ roomId, userId, isTyping }) => {
                    if (userId === useAuthStore.getState().user?.id) return;
                    set((state) => ({
                        typingUsers: { ...state.typingUsers, [roomId]: isTyping },
                    }));
                });

                socket.on("roomCreated", () => {
                    get().fetchRooms();
                });

                set({ socket });
            },

            disconnectSocket: () => {
                const { socket } = get();
                if (socket) {
                    socket.disconnect();
                    set({ socket: null });
                }
            },

            fetchRooms: async () => {
                set({ isLoading: true });
                try {
                    const response = await api.get("/chat/rooms");
                    // Backend returns { data: rooms[], nextCursor }
                    // ResponseWrapperInterceptor wraps it as: { data: { data: rooms[], nextCursor }, meta: {...} }
                    const payload = response.data?.data ?? response.data ?? {};
                    const rawRooms = Array.isArray(payload)
                        ? payload
                        : (payload?.data ?? []);
                    const rooms = map(rawRooms, room => ({
                        ...room,
                        chatId: room.id, // Compatibility
                        unreadCount: room.unreadCount ?? 0,
                    }));

                    const pinnedMap = {};
                    rooms.forEach(r => {
                        pinnedMap[r.id] = r.pinnedMessages || [];
                    });

                    set({ contacts: rooms, pinnedMessages: { ...get().pinnedMessages, ...pinnedMap } });
                } catch (error) {
                    console.error("Failed to fetch rooms", error);
                } finally {
                    set({ isLoading: false });
                }
            },

            fetchMessages: async (chatId) => {
                if (!chatId) return;
                try {
                    const response = await api.get(`/chat/rooms/${chatId}/messages`);
                    const myId = useAuthStore.getState().user?.id;
                    // ResponseWrapperInterceptor: { data: { data: msgs[], nextCursor }, meta: {...} }
                    const payload = response.data?.data ?? response.data ?? {};
                    const rawMsgs = Array.isArray(payload) ? payload : (payload?.data ?? []);
                    const nextCursor = payload?.nextCursor ?? null;
                    const msgs = map(rawMsgs, (message) =>
                        formatChatMessage(message, myId),
                    );
                    set((state) => ({
                        messages: { ...state.messages, [chatId]: msgs },
                        messagesCursors: { ...state.messagesCursors, [chatId]: nextCursor },
                    }));

                    // Join room via socket
                    if (get().socket) {
                        get().socket.emit("joinRoom", { roomId: chatId });
                        get().markAsRead(chatId);
                    }
                } catch (error) {
                    console.error("Failed to fetch messages", error);
                }
            },

            loadMoreMessages: async (chatId) => {
                const cursor = get().messagesCursors[chatId];
                if (!cursor) return; // No more pages
                try {
                    const response = await api.get(`/chat/rooms/${chatId}/messages`, { params: { cursor } });
                    const myId = useAuthStore.getState().user?.id;
                    // ResponseWrapperInterceptor: { data: { data: msgs[], nextCursor }, meta: {...} }
                    const payload = response.data?.data ?? response.data ?? {};
                    const rawMsgs = Array.isArray(payload) ? payload : (payload?.data ?? []);
                    const nextCursor = payload?.nextCursor ?? null;
                    const olderMsgs = map(rawMsgs, (message) =>
                        formatChatMessage(message, myId),
                    );
                    set((state) => ({
                        messages: {
                            ...state.messages,
                            [chatId]: [...olderMsgs, ...(state.messages[chatId] ?? [])],
                        },
                        messagesCursors: { ...state.messagesCursors, [chatId]: nextCursor },
                    }));
                } catch (e) {
                    console.error('loadMoreMessages error', e);
                }
            },

            sendMessage: async (roomId, text, mediaUrl = null, type = "text", metadata = null, replyToId = null) => {
                const { socket } = get();
                const myId = useAuthStore.getState().user?.id;
                
                // Create optimistic message
                const optimisticMsg = {
                    id: `temp-${Date.now()}`,
                    roomId,
                    text,
                    type,
                    mediaUrl,
                    metadata: metadata || null,
                    replyToId,
                    sender: { id: myId },
                    from: "me",
                    time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }),
                    createdAt: new Date().toISOString(),
                    status: "sending"
                };

                // Add to local state immediately
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [roomId]: [...(state.messages[roomId] || []), optimisticMsg],
                    },
                }));

                const payload = { roomId, text, type, metadata, mediaUrl, replyToId };
                if (socket) {
                    socket.emit("sendMessage", payload);
                } else {
                    try {
                        // Filter out properties that the backend validation rejects
                        const { roomId: _, replyToId: __, ...httpPayload } = payload;
                        const response = await api.post(`/chat/rooms/${roomId}/messages`, httpPayload);
                        const message = response?.data;
                        if (message?.id) {
                            set((state) => ({
                                messages: {
                                    ...state.messages,
                                    [roomId]: upsertRoomMessage(
                                        state.messages[roomId] || [],
                                        message,
                                        myId,
                                    ),
                                },
                                contacts: syncRoomLastMessage(
                                    state.contacts,
                                    roomId,
                                    message,
                                    false,
                                ),
                            }));
                        }
                    } catch (error) {
                        toast.error("Xabar yuborishda xatolik");
                        // Remove optimistic message on error
                        set((state) => ({
                            messages: {
                                ...state.messages,
                                [roomId]: filter(state.messages[roomId] || [], m => m.id !== optimisticMsg.id),
                            },
                        }));
                    }
                }
            },

            setTyping: (roomId, isTyping) => {
                const { socket } = get();
                if (socket) {
                    socket.emit("typing", { roomId, isTyping });
                }
            },

            addReaction: (chatId, msgId, emoji) => {
                set((state) => {
                    const chatMsgs = [...(state.messages[chatId] || [])];
                    const idx = findIndex(chatMsgs, (m) => m.id === msgId);
                    if (idx === -1) return state;
                    const msg = chatMsgs[idx];
                    const hasReaction = includes(msg.reactions || [], emoji);
                    chatMsgs[idx] = {
                        ...msg,
                        reactions: hasReaction
                            ? filter(msg.reactions, (r) => r !== emoji)
                            : [...(msg.reactions || []), emoji],
                    };
                    return {
                        messages: { ...state.messages, [chatId]: chatMsgs },
                    };
                });
            },

            deleteMessage: (chatId, msgId, forEveryone = false) => {
                set((state) => {
                    const chatMsgs = [...(state.messages[chatId] || [])];
                    if (forEveryone) {
                        const idx = findIndex(chatMsgs, (m) => m.id === msgId);
                        if (idx === -1) return state;
                        chatMsgs[idx] = {
                            ...chatMsgs[idx],
                            deleted: true,
                            deletedForEveryone: true,
                            text: "",
                        };
                        return {
                            messages: { ...state.messages, [chatId]: chatMsgs },
                        };
                    }
                    return {
                        messages: {
                            ...state.messages,
                            [chatId]: filter(chatMsgs, (m) => m.id !== msgId),
                        },
                    };
                });
            },

            forwardMessage: (fromChatId, msgId, toChatId) => {
                const state = get();
                const chatMsgs = state.messages[fromChatId] || [];
                const original = find(chatMsgs, (m) => m.id === msgId);
                if (!original) return;

                const senderName = original.from === "me" ? "Siz" : (original.sender?.name || "Noma'lum");

                const forwarded = {
                    ...original,
                    id: `fwd-${Date.now()}`,
                    time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }),
                    forwardedFrom: senderName,
                    reactions: [],
                };

                set((s) => ({
                    messages: {
                        ...s.messages,
                        [toChatId]: [...(s.messages[toChatId] || []), forwarded],
                    },
                }));
            },

            editMessage: (chatId, msgId, newText) => {
                set((state) => {
                    const chatMsgs = [...(state.messages[chatId] || [])];
                    const idx = findIndex(chatMsgs, (m) => m.id === msgId);
                    if (idx === -1) return state;
                    chatMsgs[idx] = {
                        ...chatMsgs[idx],
                        text: newText,
                        editedAt: new Date().toISOString(),
                    };
                    return {
                        messages: { ...state.messages, [chatId]: chatMsgs },
                    };
                });
            },

            replyToMessage: (chatId, text, replyToMsg, mediaUrl = null) => {
                const msg = {
                    id: `reply-${Date.now()}`,
                    from: "me",
                    text,
                    time: new Date().toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" }),
                    reactions: [],
                    replyTo: {
                        id: replyToMsg.id,
                        text: replyToMsg.text,
                        from: replyToMsg.from,
                    },
                    ...(mediaUrl && { mediaUrl, type: "image" }),
                };
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [chatId]: [...(state.messages[chatId] || []), msg],
                    },
                }));
            },

            createGroup: (name, memberIds) => {
                const group = {
                    id: `g${Date.now()}`,
                    name,
                    avatar: "\u{1F465}",
                    members: memberIds,
                    isGroup: true,
                    chatId: `g${Date.now()}`
                };
                set((state) => ({
                    groups: [...state.groups, group],
                    contacts: [...state.contacts, group],
                    messages: { ...state.messages, [group.id]: [] },
                }));
                return group.id;
            },

            getPinnedMessage: (chatId) => {
                const state = get();
                const pins = state.pinnedMessages[chatId] || [];
                return pins[0] || null; // Latest pin
            },

            getPinnedMessages: (chatId) => {
                const state = get();
                return state.pinnedMessages[chatId] || [];
            },

            pinMessage: (chatId, msgId) => {
                const { socket } = get();
                if (socket) {
                    socket.emit("pinMessage", { roomId: chatId, messageId: msgId });
                }
                
                set((state) => {
                    const roomMsgs = state.messages[chatId] || [];
                    const msgToPin = find(roomMsgs, m => m.id === msgId);
                    if (!msgToPin) return state;

                    const currentPins = state.pinnedMessages[chatId] || [];
                    if (some(currentPins, p => p.id === msgId)) return state;

                    return {
                        pinnedMessages: {
                            ...state.pinnedMessages,
                            [chatId]: [msgToPin, ...currentPins],
                        },
                    };
                });
            },

            unpinMessage: (chatId, msgId = null) => {
                const { socket } = get();
                if (socket) {
                    socket.emit("unpinMessage", { roomId: chatId, messageId: msgId });
                }
                set((state) => {
                    const currentPins = state.pinnedMessages[chatId] || [];
                    return {
                        pinnedMessages: {
                            ...state.pinnedMessages,
                            [chatId]: msgId ? filter(currentPins, p => p.id !== msgId) : [],
                        },
                    };
                });
            },

            getAISuggestions: (lastMessage) => {
                if (!lastMessage) return [];
                const text = lastMessage.toLowerCase();
                if (text.includes("qornim ochdi") || text.includes("ovqat")) {
                    return ["Salat taklif qilish 🥗", "Suv ichishni eslatish 💧", "Rejani ko'rish 📋"];
                }
                if (text.includes("tayyorman") || text.includes("boshlaymiz")) {
                    return ["Video yuborish 🎥", "Omad tilash ✨", "Vazifa berish 🎯"];
                }
                if (text.includes("rahmat") || text.includes("tushundim")) {
                    return ["Arzimaydi 😊", "Davom etamiz 💪", "Savollar bormi? 🤔"];
                }
                return ["Yaxshi 👍", "Tushunarli 👌", "Keyingisi ➡️"];
            },

            sendSharedContent: (chatId, type, contentId, title, description) => {
                get().sendMessage(
                    chatId, 
                    `Shared ${type}: ${title}`, 
                    null, 
                    "shared_content", 
                    {
                        contentType: type,
                        contentId,
                        title,
                        description
                    }
                );
            },

            sendPoll: (chatId, question, options) => {
                get().sendMessage(
                    chatId, 
                    `So'rovnoma: ${question}`, 
                    null, 
                    "poll", 
                    {
                        question,
                        options: map(options, opt => ({ text: opt, votes: [] })),
                        totalVotes: 0
                    }
                );
            },

            votePoll: (chatId, msgId, optionIndex, userId) => {
                // Keep local update for immediate feedback, but should ideally be a socket event too
                set((state) => {
                    const chatMsgs = [...(state.messages[chatId] || [])];
                    const idx = findIndex(chatMsgs, m => m.id === msgId);
                    if (idx === -1 || chatMsgs[idx].type !== "poll") return state;

                    const msg = { ...chatMsgs[idx], metadata: { ...chatMsgs[idx].metadata } };
                    const options = [...msg.metadata.options];

                    options.forEach(opt => {
                        opt.votes = filter(opt.votes, v => v !== userId);
                    });

                    options[optionIndex].votes.push(userId);
                    msg.metadata.options = options;
                    msg.metadata.totalVotes = reduce(options, (acc, curr) => acc + curr.votes.length, 0);

                    chatMsgs[idx] = msg;
                    return { messages: { ...state.messages, [chatId]: chatMsgs } };
                });
            },

            sendTask: (chatId, title, goal, unit) => {
                get().sendMessage(
                    chatId,
                    `Vazifa: ${title}`,
                    null,
                    "task",
                    {
                        title,
                        goal,
                        unit,
                        current: 0,
                        completed: false
                    }
                );
            },

            updateTaskProgress: (chatId, msgId, increment) => {
                set((state) => {
                    const chatMsgs = [...(state.messages[chatId] || [])];
                    const idx = findIndex(chatMsgs, m => m.id === msgId);
                    if (idx === -1 || chatMsgs[idx].type !== "task") return state;

                    const msg = { ...chatMsgs[idx], metadata: { ...chatMsgs[idx].metadata } };
                    msg.metadata.current = Math.min(msg.metadata.goal, msg.metadata.current + increment);
                    if (msg.metadata.current >= msg.metadata.goal) {
                        msg.metadata.completed = true;
                    }

                    chatMsgs[idx] = msg;
                    return { messages: { ...state.messages, [chatId]: chatMsgs } };
                });
            },

            sendBooking: async (chatId, title, date, slots, durationMinutes = 60, note = null) => {
                const myId = useAuthStore.getState().user?.id;
                try {
                    const response = await api.post(`/chat/rooms/${chatId}/bookings`, {
                        title,
                        date,
                        slots,
                        durationMinutes,
                        note,
                    });
                    const message = response?.data?.message;
                    if (!get().socket && message?.id) {
                        set((state) => ({
                            messages: {
                                ...state.messages,
                                [chatId]: upsertRoomMessage(
                                    state.messages[chatId] || [],
                                    message,
                                    myId,
                                ),
                            },
                            contacts: syncRoomLastMessage(
                                state.contacts,
                                chatId,
                                message,
                                false,
                            ),
                        }));
                    }
                    return response?.data;
                } catch (error) {
                    const message =
                        error?.response?.data?.message || "Booking yuborishda xatolik";
                    toast.error(Array.isArray(message) ? join(message, ", ") : message);
                    throw error;
                }
            },

            selectBookingSlot: async (chatId, bookingId, slotTime) => {
                const myId = useAuthStore.getState().user?.id;
                try {
                    const response = await api.post(
                        `/chat/rooms/${chatId}/bookings/${bookingId}/select`,
                        { slotTime },
                    );
                    const message = response?.data?.message;
                    if ((!get().socket || !message?.id) && message?.id) {
                        set((state) => ({
                            messages: {
                                ...state.messages,
                                [chatId]: upsertRoomMessage(
                                    state.messages[chatId] || [],
                                    message,
                                    myId,
                                ),
                            },
                            contacts: syncRoomLastMessage(
                                state.contacts,
                                chatId,
                                message,
                                false,
                            ),
                        }));
                    }
                    return response?.data;
                } catch (error) {
                    const message =
                        error?.response?.data?.message || "Slotni band qilishda xatolik";
                    toast.error(Array.isArray(message) ? join(message, ", ") : message);
                    throw error;
                }
            },

            sendInvoice: (chatId, amount, description) => {
                get().sendMessage(
                    chatId,
                    `Invoice: ${description}`,
                    null,
                    "invoice",
                    {
                        amount,
                        description,
                        status: "pending"
                    }
                );
            },

            payInvoice: (chatId, msgId) => {
                set((state) => {
                    const chatMsgs = [...(state.messages[chatId] || [])];
                    const idx = findIndex(chatMsgs, m => m.id === msgId);
                    if (idx === -1 || chatMsgs[idx].type !== "invoice") return state;

                    const msg = { ...chatMsgs[idx], metadata: { ...chatMsgs[idx].metadata } };
                    msg.metadata.status = "paid";

                    chatMsgs[idx] = msg;
                    return { messages: { ...state.messages, [chatId]: chatMsgs } };
                });
                toast.success("To'lov muvaffaqiyatli amalga oshirildi!");
            },

            sendHabitTracker: (chatId, title, habits) => {
                get().sendMessage(
                    chatId,
                    `Odatlar: ${title}`,
                    null,
                    "habit_tracker",
                    {
                        title,
                        habits: map(habits, h => ({ label: h, checked: false })),
                    }
                );
            },

            updateHabitStatus: (chatId, msgId, habitIndex) => {
                set((state) => {
                    const chatMsgs = [...(state.messages[chatId] || [])];
                    const idx = findIndex(chatMsgs, m => m.id === msgId);
                    if (idx === -1 || chatMsgs[idx].type !== "habit_tracker") return state;

                    const msg = { ...chatMsgs[idx], metadata: { ...chatMsgs[idx].metadata } };
                    const habits = [...msg.metadata.habits];
                    habits[habitIndex] = { ...habits[habitIndex], checked: !habits[habitIndex].checked };
                    msg.metadata.habits = habits;

                    chatMsgs[idx] = msg;
                    return { messages: { ...state.messages, [chatId]: chatMsgs } };
                });
            },

            toggleBookmark: (chatId, msgId) => {
                const state = get();
                const chatMsgs = state.messages[chatId] || [];
                const msg = find(chatMsgs, m => m.id === msgId);
                if (!msg) return;

                const exists = find(state.bookmarks, b => b.msgId === msgId);
                if (exists) {
                    set({ bookmarks: filter(state.bookmarks, b => b.msgId !== msgId) });
                    toast.success("Xatcho'pdan olib tashlandi");
                } else {
                    set({
                        bookmarks: [...state.bookmarks, {
                            chatId,
                            msgId,
                            text: msg.text,
                            time: msg.time,
                            senderName: msg.from === "me" ? "Siz" : (find(state.contacts, c => c.id === chatId)?.name || "Noma'lum")
                        }]
                    });
                    toast.success("Xatcho'pga saqlandi");
                }
            },

            searchGlobalMessages: (query) => {
                if (!query.trim()) return [];
                const state = get();
                const results = [];
                const q = query.toLowerCase();

                toPairs(state.messages).forEach(([chatId, msgs]) => {
                    msgs.forEach(m => {
                        if (m.text && m.text.toLowerCase().includes(q)) {
                            const entity = find(state.contacts, c => c.id == chatId);
                            results.push({
                                chatId,
                                msgId: m.id,
                                text: m.text,
                                time: m.time,
                                senderName: entity?.name || "Noma'lum",
                                avatar: entity?.avatar || "👤"
                            });
                        }
                    });
                });
                return results;
            },

            // --- Simplified compatibility methods ---
            startLive: (chatId, hostName) => {
                set({ activeLive: { chatId, hostName, viewers: 1, startTime: Date.now() } });
                toast.success("Jonli efir boshlandi! 🎥");
            },

            endLive: () => set({ activeLive: null }),

            togglePinChat: (chatId) => {
                set((state) => {
                    const isPinned = includes(state.pinnedChats, chatId);
                    const newPinned = isPinned
                        ? filter(state.pinnedChats, id => id !== chatId)
                        : [chatId, ...state.pinnedChats];
                    return { pinnedChats: newPinned };
                });
            },

            toggleMuteChat: (chatId) => {
                set((state) => {
                    const isMuted = includes(state.mutedChats, chatId);
                    const mutedChats = isMuted
                        ? filter(state.mutedChats, (id) => id !== chatId)
                        : [...state.mutedChats, chatId];
                    return { mutedChats };
                });
            },

            toggleBlockChat: (chatId) => {
                set((state) => {
                    const isBlocked = includes(state.blockedChats, chatId);
                    const blockedChats = isBlocked
                        ? filter(state.blockedChats, (id) => id !== chatId)
                        : [...state.blockedChats, chatId];
                    return { blockedChats };
                });
            },

            isChatMuted: (chatId) => includes(get().mutedChats, chatId),
            isChatBlocked: (chatId) => includes(get().blockedChats, chatId),

            setWallpaper: (wallpaperName) => set({ activeWallpaper: wallpaperName }),
            setCustomWallpaper: (imageUrl) => set({ customWallpaper: imageUrl }),
            reorderChats: (orderedIds) => {
                const contacts = get().contacts;
                const reordered = orderedIds
                    .map(id => contacts.find(c => c.id === id))
                    .filter(Boolean);
                const remaining = contacts.filter(c => !orderedIds.includes(c.id));
                set({ contacts: [...reordered, ...remaining] });
            },

            // AI Features (keeping them as mock for now but could be connected)
            getChatSummary: (chatId) => "Ushbu suhbat tahlili hali tayyor emas.",
            getLiveActivity: (chatId) => null,

            markAsRead: (chatId) => {
                const { socket } = get();
                if (socket && chatId) {
                    socket.emit("markAsRead", { roomId: chatId });
                }
                set((state) => ({
                    activeRoomId: chatId,
                    readReceipts: {
                        ...state.readReceipts,
                        [chatId]: new Date().toISOString(),
                    },
                    contacts: map(state.contacts, c =>
                        c.id === chatId ? { ...c, unreadCount: 0 } : c
                    ),
                }));
            },

            getUnreadCount: (roomId) => {
                const contact = get().contacts.find(c => c.id === roomId);
                return contact?.unreadCount ?? 0;
            },
            
            stories: [],
            viewStory: (storyId) => {
                set((state) => ({
                    stories: map(state.stories, s => s.id === storyId ? { ...s, viewed: true } : s)
                }));
            },
            addStory: (userName, avatar, content, type = "image") => {
                const newStory = {
                    id: Date.now(),
                    userId: "me",
                    userName,
                    avatar,
                    content,
                    type,
                    timestamp: Date.now(),
                    viewed: false
                };
                set((state) => ({
                    stories: [newStory, ...state.stories]
                }));
                toast.success("Hikoya muvaffaqiyatli qo'shildi! ✨");
            },
        }),
        { 
            name: "chat-storage",
            partialize: (state) => ({
                pinnedChats: state.pinnedChats,
                mutedChats: state.mutedChats,
                blockedChats: state.blockedChats,
                activeWallpaper: state.activeWallpaper,
                customWallpaper: state.customWallpaper,
                bookmarks: state.bookmarks,
                folders: state.folders,
            }),
        }
    )
);

export default useChatStore;
