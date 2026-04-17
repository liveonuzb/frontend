import React from "react";
import { useParams } from "react-router";
import { get, isArray, join, map } from "lodash";
import { toast } from "sonner";
import {
  LoaderCircleIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import { useBreadcrumbStore } from "@/store";
import {
  useGetQuery,
  usePostQuery,
  useDeleteQuery,
} from "@/hooks/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getFullName = (user) => {
  const name = [get(user, "firstName"), get(user, "lastName")]
    .filter(Boolean)
    .join(" ");
  return name || get(user, "email", "-");
};

const Index = () => {
  const { id } = useParams();
  const { setBreadcrumbs } = useBreadcrumbStore();
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const familyQueryKey = ["admin", "premium-family", id];

  const { data: familyData, isLoading } = useGetQuery({
    url: `/admin/premium/families/${id}`,
    queryProps: { queryKey: familyQueryKey },
  });
  const family = get(familyData, "data.data") || get(familyData, "data");

  const owner = get(family, "owner", {});
  const ownerName = getFullName(owner);
  const members = get(family, "members", []);
  const subscription = get(family, "subscription", {});
  const planName =
    get(subscription, "plan.name") ||
    get(family, "planName") ||
    "-";
  const subscriptionStatus =
    get(subscription, "status") ||
    get(family, "subscriptionStatus");

  React.useEffect(() => {
    setBreadcrumbs([
      { url: "/admin", title: "Admin" },
      { url: "/admin/premium", title: "Premium" },
      { url: "/admin/premium/families", title: "Oilalar" },
      {
        url: `/admin/premium/families/${id}`,
        title: ownerName !== "-" ? ownerName : "Oila",
      },
    ]);
  }, [setBreadcrumbs, id, ownerName]);

  const { data: searchResults } = useGetQuery({
    url: "/admin/users",
    params: { q: searchQuery, pageSize: 5 },
    queryProps: {
      queryKey: ["admin", "users-search", searchQuery],
      enabled: searchQuery.length >= 2,
    },
  });
  const searchUsers = get(searchResults, "data.data", []);

  const addMemberMutation = usePostQuery({
    queryKey: familyQueryKey,
  });

  const removeMemberMutation = useDeleteQuery({
    queryKey: familyQueryKey,
  });

  const handleAddMember = React.useCallback(
    async (userId) => {
      try {
        await addMemberMutation.mutateAsync({
          url: `/admin/premium/families/${id}/members`,
          attributes: { userId },
        });
        toast.success("A'zo qo'shildi");
        setAddMemberOpen(false);
        setSearchQuery("");
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "A'zoni qo'shib bo'lmadi",
        );
      }
    },
    [addMemberMutation, id],
  );

  const handleRemoveMember = React.useCallback(
    async (memberId) => {
      if (!window.confirm("Bu a'zoni oiladan olib tashlashni tasdiqlaysizmi?"))
        return;

      try {
        await removeMemberMutation.mutateAsync({
          url: `/admin/premium/families/${id}/members/${memberId}`,
        });
        toast.success("A'zo olib tashlandi");
      } catch (error) {
        const message = get(error, "response.data.message");
        toast.error(
          isArray(message)
            ? join(message, ", ")
            : message || "A'zoni olib tashlab bo'lmadi",
        );
      }
    },
    [removeMemberMutation, id],
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <LoaderCircleIcon className="animate-spin" />
        Yuklanmoqda...
      </div>
    );
  }

  if (!family) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        Oila topilmadi.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Oila tafsilotlari</h1>

      {/* Owner Card */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Egasi
        </h2>
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            {get(owner, "avatarUrl") || get(owner, "avatar") ? (
              <AvatarImage
                src={get(owner, "avatarUrl") || get(owner, "avatar")}
                alt={ownerName}
              />
            ) : null}
            <AvatarFallback>{getInitials(ownerName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-medium">{ownerName}</p>
            {get(owner, "email") ? (
              <p className="truncate text-sm text-muted-foreground">
                {get(owner, "email")}
              </p>
            ) : null}
            {get(owner, "phone") ? (
              <p className="truncate text-sm text-muted-foreground">
                {get(owner, "phone")}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Obuna ma'lumotlari
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="text-sm font-medium">{planName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            {subscriptionStatus ? (
              <Badge
                variant="outline"
                className={
                  subscriptionStatus === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-500/10 text-slate-700 dark:text-slate-300"
                }
              >
                {subscriptionStatus === "ACTIVE" ? "Faol" : subscriptionStatus}
              </Badge>
            ) : (
              <p className="text-sm">-</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Boshlanish</p>
            <p className="text-sm">
              {formatDate(
                get(subscription, "startDate") || get(family, "startDate"),
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tugash</p>
            <p className="text-sm">
              {formatDate(
                get(subscription, "endDate") || get(family, "endDate"),
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            A'zolar ({members.length})
          </h2>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setAddMemberOpen(true)}
          >
            <PlusIcon className="size-4" />
            A'zo qo'shish
          </Button>
        </div>

        {members.length > 0 ? (
          <div className="divide-y divide-border/60">
            {map(members, (member) => {
              const user = get(member, "user") || member;
              const memberName = getFullName(user);
              const memberAvatar =
                get(user, "avatarUrl") || get(user, "avatar");
              const addedDate =
                get(member, "addedAt") || get(member, "createdAt");
              const memberId = get(member, "id") || get(user, "id");

              return (
                <div
                  key={memberId}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar className="size-9">
                    {memberAvatar ? (
                      <AvatarImage src={memberAvatar} alt={memberName} />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {getInitials(memberName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {memberName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {get(user, "email", "")}
                    </p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {formatDate(addedDate)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveMember(memberId)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
            Hozircha a'zo yo'q.
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog
        open={addMemberOpen}
        onOpenChange={(open) => {
          setAddMemberOpen(open);
          if (!open) setSearchQuery("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="size-5" />
              A'zo qo'shish
            </DialogTitle>
            <DialogDescription>
              Foydalanuvchini email yoki telefon raqami bo'yicha qidiring.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Email yoki telefon..."
                className="pl-9"
              />
            </div>

            {searchQuery.length >= 2 && searchUsers.length > 0 ? (
              <div className="flex flex-col gap-1 rounded-xl border border-border/60 p-2">
                {map(searchUsers, (user) => {
                  const userName = getFullName(user);
                  const userAvatar =
                    get(user, "avatarUrl") || get(user, "avatar");

                  return (
                    <button
                      key={get(user, "id")}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/40"
                      onClick={() => handleAddMember(get(user, "id"))}
                    >
                      <Avatar className="size-8">
                        {userAvatar ? (
                          <AvatarImage src={userAvatar} alt={userName} />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {userName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {get(user, "email", "")}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                Foydalanuvchi topilmadi
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
