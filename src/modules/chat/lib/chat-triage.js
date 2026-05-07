export const CHAT_TRIAGE_FILTERS = [
    { key: "all", label: "Hammasi" },
    { key: "unread", label: "Unread" },
    { key: "no_reply", label: "Javob kerak" },
    { key: "payment_overdue", label: "To'lov" },
    { key: "high_risk", label: "Risk" },
    { key: "check_in_due", label: "Check-in" },
    { key: "task_missed", label: "Task missed" },
    { key: "session_today", label: "Bugun session" },
    { key: "telegram_only", label: "Telegram" },
];

const TRIAGE_KEYS = CHAT_TRIAGE_FILTERS.map((item) => item.key).filter(
    (key) => key !== "all",
);

export const resolveChatTriageListPayload = (data) => {
    const candidates = [
        data?.data?.data?.items,
        data?.data?.items,
        data?.items,
        data?.data?.data,
        data?.data,
    ];

    return candidates.find(Array.isArray) ?? [];
};

export const getTodayKey = (now = new Date()) => {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const normalizeText = (value) => String(value ?? "").trim().toLowerCase();

const hasRiskTag = (client) =>
    (client?.tags ?? []).some((tag) => {
        const text = `${normalizeText(tag.id)} ${normalizeText(tag.label)} ${normalizeText(tag.name)}`;
        return text.includes("risk") || text.includes("xavf");
    });

const getClientForChat = (chat, clientsById) => {
    const candidateIds = [
        chat?.clientId,
        chat?.otherParticipant?.id,
        chat?.userId,
        chat?.id,
    ].filter(Boolean);

    return candidateIds.map((id) => clientsById.get(id)).find(Boolean) ?? null;
};

const getSessionClientId = (session) =>
    session?.clientId ?? session?.client?.id ?? session?.client?.userId ?? null;

const matchesTodaySession = (chat, client, sessionsByClientId, sessionsByRoomId) =>
    Boolean(
        sessionsByRoomId.get(chat?.chatId ?? chat?.id) ||
            sessionsByClientId.get(client?.id) ||
            sessionsByClientId.get(chat?.otherParticipant?.id),
    );

const isPaymentOverdue = (client) =>
    normalizeText(client?.paymentSummary?.status) === "overdue" ||
    normalizeText(client?.payment?.status) === "overdue";

const isHighRisk = (client) => {
    const riskLevel = normalizeText(client?.risk?.level ?? client?.riskLevel);
    const riskScore = Number(client?.risk?.score ?? client?.riskScore ?? 0);
    const lifecycle = normalizeText(client?.lifecycleStage);

    return (
        riskLevel === "high" ||
        riskScore >= 70 ||
        lifecycle.includes("risk") ||
        lifecycle.includes("churn") ||
        hasRiskTag(client) ||
        isPaymentOverdue(client)
    );
};

const isCheckInDue = (client) => {
    const nextAction = normalizeText(client?.nextAction?.type);
    const checkInStatus = normalizeText(
        client?.checkInStatus ?? client?.weeklyCheckInStatus,
    );

    return (
        Boolean(client?.checkInDue) ||
        Number(client?.pendingCheckIns ?? 0) > 0 ||
        nextAction.includes("check") ||
        checkInStatus === "pending" ||
        checkInStatus === "due"
    );
};

const isTaskMissed = (client) => {
    const nextAction = normalizeText(client?.nextAction?.type);

    return (
        Number(client?.overdueTasks ?? client?.missedTasks ?? 0) > 0 ||
        nextAction.includes("task") ||
        nextAction.includes("overdue")
    );
};

const isTelegramOnly = (chat, client) => {
    const sourceText = [
        chat?.source,
        chat?.channel,
        chat?.type,
        client?.contactMethod,
        client?.identifierValue,
        client?.telegramUsername,
        client?.telegramId,
    ]
        .map(normalizeText)
        .join(" ");

    return sourceText.includes("telegram") || sourceText.includes("@");
};

export const buildCoachChatTriage = ({
    chats = [],
    clients = [],
    sessions = [],
    currentUserId = null,
    getUnreadCount = () => 0,
} = {}) => {
    const clientsById = new Map(clients.map((client) => [client.id, client]));
    const sessionsByClientId = new Map();
    const sessionsByRoomId = new Map();

    sessions.forEach((session) => {
        const clientId = getSessionClientId(session);
        if (clientId) sessionsByClientId.set(clientId, session);
        if (session?.roomId) sessionsByRoomId.set(session.roomId, session);
    });

    const matchesByChatId = new Map();

    chats.forEach((chat) => {
        const chatId = chat.chatId ?? chat.id;
        const client = getClientForChat(chat, clientsById);
        const unreadCount = Number(getUnreadCount(chatId) ?? chat.unreadCount ?? 0);
        const lastSenderId = chat?.lastMessage?.senderId;
        const otherParticipantId = chat?.otherParticipant?.id;
        const matches = new Set();

        if (unreadCount > 0) matches.add("unread");
        if (
            lastSenderId &&
            lastSenderId !== currentUserId &&
            (!otherParticipantId || lastSenderId === otherParticipantId)
        ) {
            matches.add("no_reply");
        }
        if (isPaymentOverdue(client)) matches.add("payment_overdue");
        if (isHighRisk(client)) matches.add("high_risk");
        if (isCheckInDue(client)) matches.add("check_in_due");
        if (isTaskMissed(client)) matches.add("task_missed");
        if (matchesTodaySession(chat, client, sessionsByClientId, sessionsByRoomId)) {
            matches.add("session_today");
        }
        if (isTelegramOnly(chat, client)) matches.add("telegram_only");

        matchesByChatId.set(chatId, matches);
    });

    const counts = Object.fromEntries(TRIAGE_KEYS.map((key) => [key, 0]));
    matchesByChatId.forEach((matches) => {
        matches.forEach((key) => {
            counts[key] = (counts[key] ?? 0) + 1;
        });
    });

    return {
        matchesByChatId,
        items: CHAT_TRIAGE_FILTERS.map((item) => ({
            ...item,
            count: item.key === "all" ? chats.length : counts[item.key] ?? 0,
        })),
    };
};

export const filterChatsByTriage = (chats, activeFilter, matchesByChatId) => {
    if (!activeFilter || activeFilter === "all") return chats;

    return chats.filter((chat) =>
        matchesByChatId.get(chat.chatId ?? chat.id)?.has(activeFilter),
    );
};
