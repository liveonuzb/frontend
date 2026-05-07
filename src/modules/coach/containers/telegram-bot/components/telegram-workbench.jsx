import React from "react";
import { get, toUpper, trim } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  MegaphoneIcon,
  RefreshCwIcon,
  SearchIcon,
  SendIcon,
  TagIcon,
  UserCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useCoachClients } from "@/modules/coach/lib/hooks/useCoachClients";
import {
  useCoachTelegramBroadcasts,
  useCoachTelegramHealth,
  useCoachTelegramMessages,
  useCoachTelegramSendMessage,
  useCoachTelegramTemplates,
  useCoachTelegramUserUpdate,
  useCoachTelegramUsers,
} from "@/modules/coach/lib/hooks/useCoachTelegram";
import { cn } from "@/lib/utils";

const DEFAULT_WORKBENCH_FILTERS = {
  users: { page: 1, limit: 100, sortBy: "lastActiveAt", sortDir: "desc" },
  messages: { page: 1, limit: 100, sortBy: "createdAt", sortDir: "desc" },
  clients: { page: 1, pageSize: 100, lifecycle: "active" },
};

const BROADCAST_SEGMENTS = [
  { value: "all", label: "Barcha userlar" },
  { value: "linked_clients", label: "Bog'langan mijozlar" },
  { value: "course_buyers", label: "Kurs xaridorlari" },
  { value: "overdue_payment", label: "Qarzdor mijozlar" },
];

function resolveListItems(response) {
  const candidates = [
    get(response, "data.data.items"),
    get(response, "data.items"),
    get(response, "data.data"),
    get(response, "data"),
    get(response, "items"),
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function resolvePayload(response) {
  return get(response, "data.data") || get(response, "data") || response || {};
}

function resolveMessageUserId(message) {
  return (
    get(message, "telegramUserId") ||
    get(message, "user.id") ||
    get(message, "userId") ||
    get(message, "linkedUserId") ||
    ""
  );
}

function getInitials(firstName, lastName, fallback = "?") {
  const value = `${get(firstName, "[0]", "")}${get(lastName, "[0]", "")}`;
  return toUpper(value) || toUpper(get(fallback, "[0]", "?"));
}

function getTelegramName(user) {
  const fullName = `${get(user, "firstName", "")} ${get(user, "lastName", "")}`
    .replace(/\s+/g, " ")
    .trim();

  return (
    fullName ||
    (get(user, "username") ? `@${get(user, "username")}` : "") ||
    get(user, "telegramId") ||
    "Telegram user"
  );
}

function getClientName(client) {
  const profile = get(client, "profile", {});
  const profileName = `${get(profile, "firstName", "")} ${get(
    profile,
    "lastName",
    "",
  )}`
    .replace(/\s+/g, " ")
    .trim();

  return (
    get(client, "name") ||
    profileName ||
    get(client, "email") ||
    get(client, "phone") ||
    "Mijoz"
  );
}

function getWorkbench(user) {
  return (
    get(user, "state.workbench") ||
    get(user, "state.telegramWorkbench") ||
    get(user, "workbench") ||
    {}
  );
}

function readUserTags(user, localMeta = {}) {
  if (Array.isArray(localMeta.tags)) return localMeta.tags;
  const tags = get(getWorkbench(user), "tags", []);
  return Array.isArray(tags) ? tags.filter(Boolean) : [];
}

function readUserNote(user, localMeta = {}) {
  if (Object.prototype.hasOwnProperty.call(localMeta, "note")) {
    return localMeta.note || "";
  }

  return get(getWorkbench(user), "note") || "";
}

function readLinkedUserId(user, localMeta = {}) {
  if (Object.prototype.hasOwnProperty.call(localMeta, "linkedUserId")) {
    return localMeta.linkedUserId || "";
  }

  return get(user, "linkedUserId") || "";
}

function readLinkedClientName(user, clients, localMeta = {}) {
  if (localMeta.linkedClientName) return localMeta.linkedClientName;

  const linkedUser = get(user, "linkedUser");
  if (linkedUser) return getClientName(linkedUser);

  const linkedUserId = readLinkedUserId(user, localMeta);
  const client = clients.find((item) => item.id === linkedUserId);
  return client ? getClientName(client) : "";
}

function formatTime(value) {
  if (!value) return "Yo'q";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Yo'q";

  return new Intl.DateTimeFormat("uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getTemplateText(template) {
  return (
    get(template, "translations.uz") ||
    get(template, "translations.en") ||
    get(template, "translations.ru") ||
    ""
  );
}

function normalizeTags(tags) {
  return Array.from(
    new Set(
      tags
        .map((tag) => trim(tag))
        .filter(Boolean)
        .map((tag) => tag.slice(0, 32)),
    ),
  ).slice(0, 12);
}

function buildConversations(users, messages) {
  const byId = new Map();

  users.forEach((user) => {
    if (!user?.id) return;
    byId.set(user.id, {
      id: user.id,
      user,
      messages: [],
      latestAt: user.lastActiveAt || user.updatedAt || user.createdAt || null,
    });
  });

  messages.forEach((message) => {
    const id = resolveMessageUserId(message);
    if (!id) return;

    const current =
      byId.get(id) ||
      {
        id,
        user: get(message, "user", { id }),
        messages: [],
        latestAt: null,
      };

    current.messages.push(message);
    byId.set(id, current);
  });

  return Array.from(byId.values())
    .map((conversation) => {
      const orderedMessages = [...conversation.messages].sort(
        (left, right) =>
          new Date(left.createdAt || 0).getTime() -
          new Date(right.createdAt || 0).getTime(),
      );
      const latest = orderedMessages[orderedMessages.length - 1] || null;
      const latestAt =
        latest?.createdAt ||
        conversation.latestAt ||
        conversation.user?.lastActiveAt ||
        null;
      const lastOutgoingAt = orderedMessages
        .filter((message) => isOutgoingMessage(message))
        .reduce((max, message) => {
          const timestamp = new Date(message.createdAt || 0).getTime();
          return Math.max(max, Number.isNaN(timestamp) ? 0 : timestamp);
        }, 0);
      const pendingIncomingCount = orderedMessages.filter((message) => {
        if (isOutgoingMessage(message)) return false;
        const timestamp = new Date(message.createdAt || 0).getTime();
        return !lastOutgoingAt || timestamp > lastOutgoingAt;
      }).length;

      return {
        ...conversation,
        messages: orderedMessages,
        latest,
        latestAt,
        pendingIncomingCount,
        failedCount: orderedMessages.filter(
          (message) => get(message, "deliveryStatus") === "FAILED",
        ).length,
        needsReply: Boolean(latest && !isOutgoingMessage(latest)),
      };
    })
    .sort(
      (left, right) =>
        new Date(right.latestAt || 0).getTime() -
        new Date(left.latestAt || 0).getTime(),
    );
}

function isOutgoingMessage(message) {
  return String(get(message, "direction", "")).toUpperCase() === "OUTGOING";
}

export function TelegramWorkbenchTab({ apiBase }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [selectedConversationId, setSelectedConversationId] =
    React.useState("");
  const [replyText, setReplyText] = React.useState("");
  const [broadcastText, setBroadcastText] = React.useState("");
  const [broadcastName, setBroadcastName] = React.useState("");
  const [broadcastSegment, setBroadcastSegment] = React.useState("all");
  const [broadcastActiveDays, setBroadcastActiveDays] = React.useState("30");
  const [includeMuted, setIncludeMuted] = React.useState(false);
  const [campaignResult, setCampaignResult] = React.useState(null);
  const [tagInputs, setTagInputs] = React.useState({});
  const [noteDrafts, setNoteDrafts] = React.useState({});
  const [localUserMeta, setLocalUserMeta] = React.useState({});

  const usersQueryKey = React.useMemo(
    () => [apiBase, "workbench", "users"],
    [apiBase],
  );
  const messagesQueryKey = React.useMemo(
    () => [apiBase, "workbench", "messages"],
    [apiBase],
  );
  const broadcastsQueryKey = React.useMemo(
    () => [apiBase, "workbench", "broadcasts"],
    [apiBase],
  );

  const usersQuery = useCoachTelegramUsers(
    apiBase,
    DEFAULT_WORKBENCH_FILTERS.users,
    { queryKey: usersQueryKey },
  );
  const messagesQuery = useCoachTelegramMessages(
    apiBase,
    DEFAULT_WORKBENCH_FILTERS.messages,
    { queryKey: messagesQueryKey },
  );
  const templatesQuery = useCoachTelegramTemplates(apiBase, {
    queryKey: [apiBase, "workbench", "templates"],
  });
  const healthQuery = useCoachTelegramHealth(apiBase, {
    queryKey: [apiBase, "workbench", "health"],
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });
  const broadcastsQuery = useCoachTelegramBroadcasts(apiBase, {
    queryKey: broadcastsQueryKey,
  });
  const clientsQuery = useCoachClients(DEFAULT_WORKBENCH_FILTERS.clients, {
    queryKey: ["coach", "clients", "telegram-workbench"],
  });

  const replyMutation = useCoachTelegramSendMessage();
  const broadcastMutation = useCoachTelegramSendMessage();
  const userUpdateMutation = useCoachTelegramUserUpdate(usersQueryKey);

  const users = React.useMemo(
    () => resolveListItems(usersQuery.data),
    [usersQuery.data],
  );
  const messages = React.useMemo(
    () => resolveListItems(messagesQuery.data),
    [messagesQuery.data],
  );
  const templates = React.useMemo(
    () => get(resolvePayload(templatesQuery.data), "items", []),
    [templatesQuery.data],
  );
  const clients = React.useMemo(
    () => resolveListItems(clientsQuery.data),
    [clientsQuery.data],
  );
  const broadcasts = React.useMemo(
    () => resolveListItems(broadcastsQuery.data),
    [broadcastsQuery.data],
  );
  const health = resolvePayload(healthQuery.data);
  const conversations = React.useMemo(
    () => buildConversations(users, messages),
    [users, messages],
  );

  const filteredConversations = React.useMemo(() => {
    const q = trim(search).toLowerCase();
    if (!q) return conversations;

    return conversations.filter((conversation) => {
      const localMeta = localUserMeta[conversation.user?.id] || {};
      const haystack = [
        getTelegramName(conversation.user),
        get(conversation, "user.username", ""),
        get(conversation, "user.phone", ""),
        ...readUserTags(conversation.user, localMeta),
        get(conversation, "latest.content", ""),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [conversations, localUserMeta, search]);

  const activeConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ||
    filteredConversations[0] ||
    conversations[0] ||
    null;
  const activeUser = activeConversation?.user || null;
  const activeLocalMeta = activeUser ? localUserMeta[activeUser.id] || {} : {};
  const activeTags = activeUser
    ? readUserTags(activeUser, activeLocalMeta)
    : [];
  const activeNote = activeUser ? readUserNote(activeUser, activeLocalMeta) : "";
  const activeNoteDraft = activeUser
    ? noteDrafts[activeUser.id] ?? activeNote
    : "";

  const refreshWorkbench = () => {
    void usersQuery.refetch();
    void messagesQuery.refetch();
    void healthQuery.refetch();
    void broadcastsQuery.refetch();
  };

  const persistUserWorkbench = React.useCallback(
    (user, attributes, optimistic, successMessage) => {
      if (!user?.id) return;

      setLocalUserMeta((previous) => ({
        ...previous,
        [user.id]: {
          ...(previous[user.id] || {}),
          ...optimistic,
        },
      }));

      userUpdateMutation.mutate(
        {
          url: `${apiBase}/users/${user.id}/workbench`,
          attributes,
        },
        {
          onSuccess: async (response) => {
            const updated = resolvePayload(response);
            setLocalUserMeta((previous) => ({
              ...previous,
              [user.id]: {
                ...(previous[user.id] || {}),
                linkedUserId: get(updated, "linkedUserId", optimistic.linkedUserId),
                linkedUser: get(updated, "linkedUser", optimistic.linkedUser),
                note: readUserNote(updated, optimistic),
                tags: readUserTags(updated, optimistic),
              },
            }));
            await queryClient.invalidateQueries({ queryKey: usersQueryKey });
            toast.success(successMessage);
          },
          onError: () => {
            toast.error("Telegram profil saqlanmadi");
          },
        },
      );
    },
    [apiBase, queryClient, userUpdateMutation, usersQueryKey],
  );

  const handleAddTag = () => {
    if (!activeUser) return;
    const nextTag = trim(tagInputs[activeUser.id] || "");
    if (!nextTag) return;

    const nextTags = normalizeTags([...activeTags, nextTag]);
    setTagInputs((previous) => ({ ...previous, [activeUser.id]: "" }));
    persistUserWorkbench(
      activeUser,
      { tags: nextTags },
      { tags: nextTags },
      "Teg saqlandi",
    );
  };

  const handleRemoveTag = (tag) => {
    if (!activeUser) return;
    const nextTags = activeTags.filter((item) => item !== tag);
    persistUserWorkbench(
      activeUser,
      { tags: nextTags },
      { tags: nextTags },
      "Teg yangilandi",
    );
  };

  const handleSaveNote = () => {
    if (!activeUser) return;
    persistUserWorkbench(
      activeUser,
      { note: activeNoteDraft },
      { note: activeNoteDraft },
      "Note saqlandi",
    );
  };

  const handleAssignClient = (clientId) => {
    if (!activeUser) return;

    const client = clients.find((item) => item.id === clientId);
    persistUserWorkbench(
      activeUser,
      { linkedUserId: clientId || null },
      {
        linkedUserId: clientId || "",
        linkedUser: client || null,
        linkedClientName: client ? getClientName(client) : "",
      },
      clientId ? "Mijoz bog'landi" : "Mijoz bog'lanishi olib tashlandi",
    );
  };

  const handleSendReply = () => {
    if (!activeUser) return;
    const message = trim(replyText);
    if (!message) {
      toast.error("Javob matnini kiriting");
      return;
    }

    replyMutation.mutate(
      {
        url: `${apiBase}/send-message`,
        attributes: { telegramUserId: activeUser.id, message },
      },
      {
        onSuccess: async () => {
          setReplyText("");
          await queryClient.invalidateQueries({ queryKey: messagesQueryKey });
          toast.success("Javob yuborildi");
        },
        onError: () => toast.error("Javob yuborilmadi"),
      },
    );
  };

  const handleSendBroadcast = () => {
    const message = trim(broadcastText);
    if (!message) {
      toast.error("Broadcast matnini kiriting");
      return;
    }

    const activeWithinDays = Number(broadcastActiveDays);

    broadcastMutation.mutate(
      {
        url: `${apiBase}/send-message`,
        attributes: {
          message,
          broadcast: {
            segment: broadcastSegment,
            includeMuted,
            activeWithinDays:
              Number.isFinite(activeWithinDays) && activeWithinDays > 0
                ? activeWithinDays
                : undefined,
          },
        },
      },
      {
        onSuccess: async (response) => {
          const payload = resolvePayload(response);
          setCampaignResult({
            name: trim(broadcastName) || "Broadcast",
            jobId: get(payload, "jobId"),
            sent: get(payload, "sent", 0),
            failed: get(payload, "failed", 0),
            suppressed: get(payload, "suppressed", 0),
            total: get(payload, "total", 0),
          });
          setBroadcastText("");
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: broadcastsQueryKey }),
            queryClient.invalidateQueries({ queryKey: messagesQueryKey }),
          ]);
          toast.success("Broadcast yuborildi");
        },
        onError: () => toast.error("Broadcast yuborilmadi"),
      },
    );
  };

  const isLoading = usersQuery.isLoading || messagesQuery.isLoading;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-background">
      <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight">
              Telegram inbox
            </h3>
            <Badge variant="outline" className="rounded-full">
              {conversations.length} suhbat
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Oxirgi 100 xabar va 100 user bo'yicha ish oynasi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HealthPill health={health} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={refreshWorkbench}
            disabled={
              usersQuery.isFetching ||
              messagesQuery.isFetching ||
              healthQuery.isFetching
            }
          >
            {usersQuery.isFetching ||
            messagesQuery.isFetching ||
            healthQuery.isFetching ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 size-4" />
            )}
            Yangilash
          </Button>
        </div>
      </div>

      <div className="grid min-h-[680px] lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <aside className="border-b border-border/70 lg:border-b-0 lg:border-r">
          <div className="border-b border-border/70 p-3">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Suhbat, teg, telefon..."
                className="h-9 rounded-xl pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Inbox yuklanmoqda
            </div>
          ) : (
            <ScrollArea className="h-[580px]">
              <div className="p-2">
                {filteredConversations.length ? (
                  filteredConversations.map((conversation) => (
                    <ConversationListItem
                      key={conversation.id}
                      conversation={conversation}
                      selected={conversation.id === activeConversation?.id}
                      tags={readUserTags(
                        conversation.user,
                        localUserMeta[conversation.user?.id] || {},
                      )}
                      onSelect={() => setSelectedConversationId(conversation.id)}
                    />
                  ))
                ) : (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Suhbat topilmadi
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </aside>

        <main className="flex min-h-[680px] flex-col">
          <ThreadHeader
            conversation={activeConversation}
            linkedClientName={
              activeUser
                ? readLinkedClientName(activeUser, clients, activeLocalMeta)
                : ""
            }
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 px-4 py-4">
              {activeConversation?.messages.length ? (
                activeConversation.messages.map((message) => (
                  <ThreadMessage key={message.id} message={message} />
                ))
              ) : (
                <div className="flex min-h-[320px] items-center justify-center text-center text-sm text-muted-foreground">
                  Bu suhbatda hali xabar yo'q
                </div>
              )}
            </div>
          </ScrollArea>

          <ReplyComposer
            disabled={!activeUser}
            isPending={replyMutation.isPending}
            templates={templates}
            value={replyText}
            onChange={setReplyText}
            onSend={handleSendReply}
          />
        </main>

        <aside className="border-t border-border/70 bg-muted/10 lg:border-l lg:border-t-0">
          <ScrollArea className="h-[680px]">
            <div className="space-y-4 p-4">
              <ProfilePanel
                user={activeUser}
                clients={clients}
                localMeta={activeLocalMeta}
                tags={activeTags}
                tagInput={activeUser ? tagInputs[activeUser.id] || "" : ""}
                noteDraft={activeNoteDraft}
                updatePending={userUpdateMutation.isPending}
                onTagInputChange={(value) => {
                  if (!activeUser) return;
                  setTagInputs((previous) => ({
                    ...previous,
                    [activeUser.id]: value,
                  }));
                }}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                onAssignClient={handleAssignClient}
                onNoteChange={(value) => {
                  if (!activeUser) return;
                  setNoteDrafts((previous) => ({
                    ...previous,
                    [activeUser.id]: value,
                  }));
                }}
                onSaveNote={handleSaveNote}
              />
              <WebhookHealthPanel health={health} isFetching={healthQuery.isFetching} />
              <BroadcastPanel
                name={broadcastName}
                onNameChange={setBroadcastName}
                text={broadcastText}
                onTextChange={setBroadcastText}
                segment={broadcastSegment}
                onSegmentChange={setBroadcastSegment}
                activeDays={broadcastActiveDays}
                onActiveDaysChange={setBroadcastActiveDays}
                includeMuted={includeMuted}
                onIncludeMutedChange={setIncludeMuted}
                templates={templates}
                broadcasts={broadcasts}
                result={campaignResult}
                isPending={broadcastMutation.isPending}
                onSend={handleSendBroadcast}
              />
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}

function HealthPill({ health }) {
  const ok = get(health, "managerRegistered") && get(health, "telegramReachable");

  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
        ok
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
          : "border-amber-500/20 bg-amber-500/10 text-amber-700",
      )}
    >
      {ok ? (
        <CheckCircle2Icon className="size-4" />
      ) : (
        <ActivityIcon className="size-4" />
      )}
      Webhook {ok ? "sog'lom" : "tekshiruvda"}
    </span>
  );
}

function ConversationListItem({ conversation, selected, tags, onSelect }) {
  const user = conversation.user || {};
  const latestText =
    get(conversation, "latest.content") ||
    (get(conversation, "latest.messageType")
      ? `[${get(conversation, "latest.messageType")}]`
      : "Xabar yo'q");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl px-3 py-3 text-left transition-colors",
        selected ? "bg-primary/10 text-foreground" : "hover:bg-muted/70",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={get(user, "photoUrl")} />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(user.firstName, user.lastName, user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">
              {getTelegramName(user)}
            </p>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatShortTime(conversation.latestAt)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {latestText}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {conversation.needsReply ? (
              <Badge className="h-5 rounded-full bg-amber-500/10 px-2 text-[10px] text-amber-700 hover:bg-amber-500/10">
                Javob kerak
              </Badge>
            ) : null}
            {conversation.failedCount ? (
              <Badge variant="destructive" className="h-5 rounded-full px-2 text-[10px]">
                Failed {conversation.failedCount}
              </Badge>
            ) : null}
            {tags.slice(0, 2).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="h-5 rounded-full px-2 text-[10px]"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function ThreadHeader({ conversation, linkedClientName }) {
  const user = conversation?.user || null;

  return (
    <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
      {user ? (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={get(user, "photoUrl")} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.firstName, user.lastName, user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{getTelegramName(user)}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {get(user, "username") ? `@${get(user, "username")} · ` : ""}
              {linkedClientName || "Mijoz bog'lanmagan"}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Suhbat tanlanmagan</p>
      )}

      <div className="flex items-center gap-2">
        {conversation?.pendingIncomingCount ? (
          <Badge className="rounded-full bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
            {conversation.pendingIncomingCount} incoming
          </Badge>
        ) : null}
        {conversation?.messages.length ? (
          <Badge variant="outline" className="rounded-full">
            {conversation.messages.length} xabar
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function ThreadMessage({ message }) {
  const outgoing = isOutgoingMessage(message);
  const status = get(message, "deliveryStatus");

  return (
    <div className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-6",
          outgoing
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted",
        )}
      >
        <p className="whitespace-pre-wrap break-words">
          {get(message, "content") || `[${get(message, "messageType", "text")}]`}
        </p>
        <div
          className={cn(
            "mt-2 flex flex-wrap items-center gap-1.5 text-[10px]",
            outgoing ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {status ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5",
                status === "FAILED"
                  ? "bg-destructive/15 text-destructive"
                  : outgoing
                    ? "bg-white/15"
                    : "bg-background",
              )}
            >
              {status}
            </span>
          ) : null}
          <span>{formatShortTime(get(message, "createdAt"))}</span>
          {get(message, "source") ? <span>{get(message, "source")}</span> : null}
        </div>
      </div>
    </div>
  );
}

function ReplyComposer({
  disabled,
  isPending,
  templates,
  value,
  onChange,
  onSend,
}) {
  return (
    <div className="border-t border-border/70 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Reply
        </p>
        <select
          className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
          value=""
          disabled={disabled || !templates.length}
          onChange={(event) => {
            const template = templates.find(
              (item) => item.key === event.target.value,
            );
            if (template) onChange(getTemplateText(template));
          }}
        >
          <option value="" disabled>
            Template tanlash
          </option>
          {templates.map((template) => (
            <option key={template.key} value={template.key}>
              {template.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Javob matni..."
          rows={3}
          disabled={disabled}
          className="min-h-[84px] rounded-xl"
        />
        <Button
          type="button"
          className="h-auto w-11 shrink-0 rounded-xl p-0"
          onClick={onSend}
          disabled={disabled || isPending || !trim(value)}
          title="Javob yuborish"
        >
          {isPending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SendIcon className="size-4" />
          )}
          <span className="sr-only">Javob yuborish</span>
        </Button>
      </div>
    </div>
  );
}

function ProfilePanel({
  user,
  clients,
  localMeta,
  tags,
  tagInput,
  noteDraft,
  updatePending,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onAssignClient,
  onNoteChange,
  onSaveNote,
}) {
  if (!user) {
    return (
      <section className="rounded-xl border border-border/70 bg-background p-4 text-sm text-muted-foreground">
        Profil tanlanmagan
      </section>
    );
  }

  const linkedUserId = readLinkedUserId(user, localMeta);
  const linkedClientName = readLinkedClientName(user, clients, localMeta);

  return (
    <section className="rounded-xl border border-border/70 bg-background p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarImage src={get(user, "photoUrl")} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(user.firstName, user.lastName, user.username)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{getTelegramName(user)}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {get(user, "username") ? `@${get(user, "username")}` : get(user, "telegramId")}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <ProfileMeta label="Til" value={toUpper(get(user, "languageCode", "uz"))} />
        <ProfileMeta
          label="Oxirgi faollik"
          value={formatShortTime(get(user, "lastActiveAt")) || "Yo'q"}
        />
        <ProfileMeta label="Telefon" value={get(user, "phone") || "Yo'q"} />
        <ProfileMeta
          label="Status"
          value={
            get(user, "isBlocked")
              ? "Blocked"
              : get(user, "isMuted")
                ? "Muted"
                : get(user, "consentStatus") || "Active"
          }
        />
      </div>

      <div className="mt-4 space-y-2">
        <label
          className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"
          htmlFor="telegram-client-assignment"
        >
          <UserCheckIcon className="size-3.5" />
          Mijozga bog'lash
        </label>
        <select
          id="telegram-client-assignment"
          className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
          value={linkedUserId}
          onChange={(event) => onAssignClient(event.target.value)}
          disabled={updatePending}
        >
          <option value="">Mijoz tanlanmagan</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {getClientName(client)}
            </option>
          ))}
        </select>
        {linkedClientName ? (
          <p className="text-xs text-muted-foreground">
            Ulangan: {linkedClientName}
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <TagIcon className="size-3.5" />
          Teglar
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.length ? (
            tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-full border border-border px-2 py-1 text-xs hover:bg-muted"
                onClick={() => onRemoveTag(tag)}
              >
                {tag} x
              </button>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Teg yo'q</span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(event) => onTagInputChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onAddTag()}
            placeholder="lead, vip..."
            className="h-9 rounded-xl"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={onAddTag}
            disabled={updatePending || !trim(tagInput)}
          >
            Qo'shish
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label
          className="text-xs font-semibold uppercase text-muted-foreground"
          htmlFor="telegram-profile-note"
        >
          Profil note
        </label>
        <Textarea
          id="telegram-profile-note"
          value={noteDraft}
          onChange={(event) => onNoteChange(event.target.value)}
          rows={3}
          className="rounded-xl"
          placeholder="Mijoz haqida qisqa izoh..."
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-xl"
          onClick={onSaveNote}
          disabled={updatePending}
        >
          {updatePending ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : null}
          Note saqlash
        </Button>
      </div>
    </section>
  );
}

function ProfileMeta({ label, value }) {
  return (
    <div className="rounded-lg border border-border/70 px-2 py-2">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}

function WebhookHealthPanel({ health, isFetching }) {
  const webhookInfo = get(health, "webhookInfo", {});

  return (
    <section className="rounded-xl border border-border/70 bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ActivityIcon className="size-4 text-primary" />
          <p className="text-sm font-semibold">Webhook health</p>
        </div>
        {isFetching ? (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <HealthRow
          label="Runtime"
          value={get(health, "managerRegistered") ? "Registered" : "Offline"}
          ok={get(health, "managerRegistered")}
        />
        <HealthRow
          label="Telegram API"
          value={get(health, "telegramReachable") ? "Ulandi" : "Xatolik"}
          ok={get(health, "telegramReachable")}
        />
        <HealthRow
          label="Queue"
          value={String(get(webhookInfo, "pendingUpdateCount", 0))}
          ok={get(webhookInfo, "pendingUpdateCount", 0) === 0}
        />
        <HealthRow
          label="Oxirgi xabar"
          value={formatTime(get(health, "lastMessageAt"))}
          ok
        />
      </div>
    </section>
  );
}

function HealthRow({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "truncate text-right text-xs font-semibold",
          ok ? "text-emerald-700" : "text-amber-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function BroadcastPanel({
  name,
  onNameChange,
  text,
  onTextChange,
  segment,
  onSegmentChange,
  activeDays,
  onActiveDaysChange,
  includeMuted,
  onIncludeMutedChange,
  templates,
  broadcasts,
  result,
  isPending,
  onSend,
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-background p-4">
      <div className="flex items-center gap-2">
        <MegaphoneIcon className="size-4 text-primary" />
        <p className="text-sm font-semibold">Broadcast builder</p>
      </div>

      <div className="mt-3 space-y-3">
        <Input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Campaign nomi"
          className="h-9 rounded-xl"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            className="h-9 rounded-xl border border-input bg-background px-2 text-sm"
            value={segment}
            onChange={(event) => onSegmentChange(event.target.value)}
          >
            {BROADCAST_SEGMENTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min="1"
            value={activeDays}
            onChange={(event) => onActiveDaysChange(event.target.value)}
            className="h-9 rounded-xl"
            aria-label="Faol kunlar"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-border"
            checked={includeMuted}
            onChange={(event) => onIncludeMutedChange(event.target.checked)}
          />
          Muted userlarga ham yuborish
        </label>
        <select
          className="h-9 w-full rounded-xl border border-input bg-background px-2 text-sm"
          value=""
          disabled={!templates.length}
          onChange={(event) => {
            const template = templates.find(
              (item) => item.key === event.target.value,
            );
            if (template) onTextChange(getTemplateText(template));
          }}
        >
          <option value="" disabled>
            Template tanlash
          </option>
          {templates.map((template) => (
            <option key={template.key} value={template.key}>
              {template.label}
            </option>
          ))}
        </select>
        <Textarea
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          rows={5}
          className="rounded-xl"
          placeholder="Broadcast matni..."
        />
        <Button
          type="button"
          className="w-full rounded-xl"
          onClick={onSend}
          disabled={isPending || !trim(text)}
        >
          {isPending ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <SendIcon className="mr-2 size-4" />
          )}
          Broadcast yuborish
        </Button>
      </div>

      {result ? (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800">
          <p className="font-semibold">{result.name}</p>
          <p className="mt-1">
            Sent {result.sent}/{result.total}, failed {result.failed},
            suppressed {result.suppressed}
          </p>
          {result.jobId ? <p className="mt-1 font-mono">Job: {result.jobId}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <ClockIcon className="size-3.5" />
          Campaign status
        </div>
        {broadcasts.slice(0, 3).map((job) => (
          <div
            key={job.id}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {get(job, "text", "").slice(0, 38) || "Broadcast"}
              </span>
              <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                {job.status}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {job.sentCount || 0}/{job.totalCount || 0} sent ·{" "}
              {formatShortTime(job.createdAt)}
            </p>
          </div>
        ))}
        {!broadcasts.length ? (
          <p className="text-xs text-muted-foreground">Campaign tarixi yo'q</p>
        ) : null}
      </div>
    </section>
  );
}
