import React, { useState, useCallback } from "react";
import { get, map, isEmpty, times, trim, toUpper, filter, size } from "lodash";
import { useTranslation } from "react-i18next";
import {
    Card, CardContent, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
    Drawer, DrawerContent, DrawerHeader, DrawerTitle,
    DrawerDescription, DrawerFooter as DrawerFoot
} from "@/components/ui/drawer";
import {
    UsersIcon, CopyIcon, SparklesIcon, CheckCircle2Icon,
    WalletIcon, GiftIcon, CreditCardIcon,
    QrCodeIcon, PencilIcon, XIcon, TrophyIcon,
    UserPlusIcon, ArrowDownIcon, LoaderIcon, HistoryIcon,
    ChevronDownIcon, AlertCircleIcon, ShareIcon,
    CrownIcon, MedalIcon, CheckIcon,
    ZapIcon, SendIcon
} from "lucide-react";
import { toast } from "sonner";
import { useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response";
import { useAuthStore } from "@/store";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MIN_WITHDRAWAL = 10000;
const XP_PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// QR mini renderer (decorative)
// ---------------------------------------------------------------------------
function MiniQR({ value }) {
    return (
        <div className="rounded-2xl bg-white p-4 shadow-inner inline-block">
            <div className="grid grid-cols-7 gap-[3px]" style={{ width: 126, height: 126 }}>
                {times(49, (i) => {
                    const isBlack = (i * 31 + value.length * 7 + i % 5) % 3 !== 0;
                    return (
                        <div key={i} className={`rounded-sm ${isBlack ? "bg-black" : "bg-white"}`} />
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// XP transaction type helpers
// ---------------------------------------------------------------------------
const XP_TYPE_CONFIG = {
    REFERRAL_REGISTRATION: { icon: UserPlusIcon, color: "text-emerald-600", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
    REFERRAL_SUBSCRIPTION: { icon: CreditCardIcon, color: "text-blue-600", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
    COACH_CLIENT_NEW: { icon: UsersIcon, color: "text-violet-600", bg: "bg-violet-500/10", ring: "ring-violet-500/20" },
    COACH_CLIENT_EXISTING: { icon: UsersIcon, color: "text-indigo-600", bg: "bg-indigo-500/10", ring: "ring-indigo-500/20" },
    WITHDRAWAL: { icon: ArrowDownIcon, color: "text-red-500", bg: "bg-red-500/10", ring: "ring-red-500/20" },
    ADMIN_GRANT: { icon: SparklesIcon, color: "text-amber-600", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
    CHALLENGE_REWARD: { icon: TrophyIcon, color: "text-amber-600", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
    XP_SPEND: { icon: WalletIcon, color: "text-orange-500", bg: "bg-orange-500/10", ring: "ring-orange-500/20" },
    OTHER: { icon: ZapIcon, color: "text-gray-500", bg: "bg-gray-500/10", ring: "ring-gray-500/20" },
};

function getXpTypeConfig(type) {
    return XP_TYPE_CONFIG[type] || XP_TYPE_CONFIG.OTHER;
}

function getXpTypeLabel(type, t) {
    const labels = {
        REFERRAL_REGISTRATION: t("profile.referral.xpTypeRegistration", "Referal ro'yxatdan o'tdi"),
        REFERRAL_SUBSCRIPTION: t("profile.referral.xpTypeSubscription", "Referal Pro sotib oldi"),
        COACH_CLIENT_NEW: t("profile.referral.xpTypeCoachClient", "Yangi shogird to'lovi"),
        COACH_CLIENT_EXISTING: t("profile.referral.xpTypeCoachClientExisting", "Shogird to'lovi"),
        WITHDRAWAL: t("profile.referral.xpTypeWithdrawal", "Yechib olish"),
        ADMIN_GRANT: t("profile.referral.xpTypeAdjustment", "Admin bonus"),
        CHALLENGE_REWARD: t("profile.referral.xpTypeBonus", "Challenge mukofoti"),
        XP_SPEND: t("profile.referral.xpTypeSpend", "XP sarflash"),
        OTHER: t("profile.referral.xpTypeOther", "Boshqa"),
    };
    return labels[type] || type;
}

// ---------------------------------------------------------------------------
// Withdrawal status config
// ---------------------------------------------------------------------------
const WITHDRAWAL_STATUS = {
    PENDING: { color: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", icon: LoaderIcon },
    APPROVED: { color: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", icon: CheckIcon },
    REJECTED: { color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", icon: XIcon },
    COMPLETED: { color: "bg-emerald-500", textColor: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", icon: CheckCircle2Icon },
};

function getWithdrawalStatus(status, t) {
    const config = WITHDRAWAL_STATUS[status] || WITHDRAWAL_STATUS.PENDING;
    const labels = {
        PENDING: t("profile.referral.statusPending", "Kutilmoqda"),
        APPROVED: t("profile.referral.statusApproved", "Tasdiqlandi"),
        REJECTED: t("profile.referral.statusRejected", "Rad etildi"),
        COMPLETED: t("profile.referral.statusCompleted", "Bajarildi"),
    };
    return { ...config, label: labels[status] || status };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatRelativeDate(dateStr, t) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const timeStr = date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

    if (diffDays === 0) return t("profile.referral.today", { time: timeStr, defaultValue: `Bugun, ${timeStr}` });
    if (diffDays === 1) return t("profile.referral.yesterday", { time: timeStr, defaultValue: `Kecha, ${timeStr}` });
    if (diffDays < 7) return `${diffDays} ${t("profile.referral.daysAgo", { defaultValue: "kun oldin" })}`;
    return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
}

function formatCardInput(value) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
}

function getInitials(name) {
    if (!name) return "?";
    const parts = name.split(" ");
    return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------
function PageSkeleton() {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            {/* Hero skeleton */}
            <Card className="overflow-hidden">
                <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-5">
                        <Skeleton className="size-12 rounded-2xl" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-44" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <div className="flex gap-2 mt-3">
                        <Skeleton className="h-10 w-20 rounded-xl" />
                        <Skeleton className="h-10 flex-1 rounded-xl" />
                    </div>
                </CardContent>
            </Card>
            {/* Balance skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {times(4, (i) => (
                    <Card key={i}>
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            {/* Lists skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {times(2, (i) => (
                    <Card key={i}>
                        <CardContent className="p-0">
                            <div className="p-4 border-b"><Skeleton className="h-4 w-32" /></div>
                            {times(3, (j) => (
                                <div key={j} className="flex items-center gap-3 p-4">
                                    <Skeleton className="size-9 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Withdrawal Dialog
// ---------------------------------------------------------------------------
function WithdrawalDialog({ open, onOpenChange, xpBalance, onSuccess }) {
    const { t } = useTranslation();
    const [amount, setAmount] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolder, setCardHolder] = useState("");

    const withdrawMutation = usePostQuery({
        queryKey: ["referral", "me"],
        listKey: ["referral", "withdrawals"],
    });

    const numericAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
    const isValidAmount = numericAmount >= MIN_WITHDRAWAL && numericAmount <= (xpBalance || 0);
    const rawCard = cardNumber.replace(/\D/g, "");
    const isValidCard = rawCard.length === 16;
    const canSubmit = isValidAmount && isValidCard && !withdrawMutation.isPending;

    const handleSubmit = () => {
        if (!canSubmit) return;
        withdrawMutation.mutate(
            {
                url: "/referral/me/withdraw",
                attributes: {
                    amount: numericAmount,
                    cardNumber: rawCard,
                    ...(trim(cardHolder) ? { cardHolder: trim(cardHolder) } : {}),
                },
            },
            {
                onSuccess: () => {
                    toast.success(t("profile.referral.withdrawRequested", "Yechib olish so'rovi yuborildi"));
                    setAmount(""); setCardNumber(""); setCardHolder("");
                    onOpenChange(false);
                    onSuccess?.();
                },
                onError: (err) => {
                    toast.error(get(err, "response.data.message") || t("profile.referral.withdrawError", "Xatolik yuz berdi"));
                },
            }
        );
    };

    const handleClose = (val) => {
        if (!withdrawMutation.isPending) {
            onOpenChange(val);
            if (!val) { setAmount(""); setCardNumber(""); setCardHolder(""); }
        }
    };

    return (
        <Drawer open={open} onOpenChange={handleClose}>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2">
                        <CreditCardIcon className="size-5 text-primary" />
                        {t("profile.referral.withdrawTitle", "XP yechib olish")}
                    </DrawerTitle>
                    <DrawerDescription>
                        {t("profile.referral.withdrawDesc", "XP balansdan kartangizga pul o'tkazing")}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="flex flex-col gap-4 px-4 pb-2">
                    {/* Balance banner */}
                    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border border-primary/15">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">{t("profile.referral.availableBalance", "Mavjud balans")}</p>
                            <p className="text-2xl font-black text-primary mt-0.5">{(xpBalance || 0).toLocaleString()} <span className="text-sm font-bold">XP</span></p>
                        </div>
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <WalletIcon className="size-6 text-primary" />
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">{t("profile.referral.amount", "Miqdor")} (XP)</label>
                        <Input
                            placeholder={`${MIN_WITHDRAWAL.toLocaleString()}+`}
                            value={amount}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                setAmount(raw ? parseInt(raw, 10).toLocaleString() : "");
                            }}
                            className="h-12 text-lg font-bold"
                        />
                        {amount && !isValidAmount && (
                            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                                <AlertCircleIcon className="size-3 shrink-0" />
                                {numericAmount < MIN_WITHDRAWAL
                                    ? t("profile.referral.minAmount", { min: MIN_WITHDRAWAL.toLocaleString(), defaultValue: `Minimal: ${MIN_WITHDRAWAL.toLocaleString()} XP` })
                                    : t("profile.referral.maxAmount", { defaultValue: "Balansdan oshib ketdi" })}
                            </p>
                        )}
                    </div>

                    {/* Conversion */}
                    {numericAmount > 0 && isValidAmount && (
                        <div className="flex items-center justify-center gap-3 text-sm rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                            <SparklesIcon className="size-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-700">
                                {numericAmount.toLocaleString()} XP = {numericAmount.toLocaleString()} UZS
                            </span>
                        </div>
                    )}

                    {/* Card number */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">{t("profile.referral.cardNumber", "Karta raqami")}</label>
                        <Input
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                            maxLength={19}
                            className="h-12 font-mono tracking-widest text-base"
                        />
                        {cardNumber && !isValidCard && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                                <AlertCircleIcon className="size-3 shrink-0" />
                                {t("profile.referral.invalidCard", "16 raqamli karta raqamini kiriting")}
                            </p>
                        )}
                    </div>

                    {/* Card holder */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">
                            {t("profile.referral.cardHolder", "Karta egasi")}{" "}
                            <span className="text-muted-foreground font-normal text-xs">({t("profile.referral.optional", "ixtiyoriy")})</span>
                        </label>
                        <Input
                            placeholder="ISM FAMILIYA"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            className="h-12 uppercase tracking-wide"
                        />
                    </div>
                </div>

                <DrawerFoot className="flex-row gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-12"
                        onClick={() => handleClose(false)}
                        disabled={withdrawMutation.isPending}
                    >
                        {t("profile.referral.cancel", "Bekor qilish")}
                    </Button>
                    <Button
                        className="flex-1 h-12 gap-2 font-semibold"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                    >
                        {withdrawMutation.isPending ? (
                            <LoaderIcon className="size-4 animate-spin" />
                        ) : (
                            <SendIcon className="size-4" />
                        )}
                        {t("profile.referral.submitWithdraw", "Yuborish")}
                    </Button>
                </DrawerFoot>
            </DrawerContent>
        </Drawer>
    );
}

// ---------------------------------------------------------------------------
// QR Drawer
// ---------------------------------------------------------------------------
function QRDrawer({ open, onOpenChange, referralCode, onCopyLink }) {
    const { t } = useTranslation();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader className="items-center text-center">
                    <DialogTitle>{t("profile.referral.qrTitle", "QR kod")}</DialogTitle>
                    <DialogDescription>{t("profile.referral.qrDesc", "Skanerlang va qo'shiling")}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-2">
                    <MiniQR value={referralCode} />
                    <div className="bg-muted/60 rounded-xl px-5 py-2.5 font-mono font-black tracking-[0.2em] text-sm text-center border w-full">
                        {referralCode}
                    </div>
                </div>
                <DialogFooter>
                    <Button className="w-full h-11 gap-2 font-semibold" onClick={onCopyLink}>
                        <CopyIcon className="size-4" /> {t("profile.referral.copyLink", "Havolani nusxalash")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// Leaderboard rank badge
// ---------------------------------------------------------------------------
function RankBadge({ rank }) {
    if (rank === 1) return (
        <div className="size-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm shadow-amber-400/30">
            <CrownIcon className="size-4 text-white" />
        </div>
    );
    if (rank === 2) return (
        <div className="size-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-sm">
            <MedalIcon className="size-4 text-white" />
        </div>
    );
    if (rank === 3) return (
        <div className="size-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center shadow-sm">
            <MedalIcon className="size-4 text-white" />
        </div>
    );
    return (
        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-black text-muted-foreground">
            {rank}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Referral status helpers
// ---------------------------------------------------------------------------
function getReferralStatusConfig(status) {
    if (status === "ACTIVE") return { label: "Faol", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" };
    if (status === "REGISTERED") return { label: "Ro'yxatdan o'tdi", className: "bg-blue-500/10 text-blue-700 border-blue-500/20" };
    if (status === "INACTIVE") return { label: "Nofaol", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" };
    return { label: status, className: "bg-muted text-muted-foreground" };
}

// ---------------------------------------------------------------------------
// Shared dashboard component
// ---------------------------------------------------------------------------
export const ReferralDashboard = ({ variant = "tab" }) => {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);

    // UI state
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [editingCode, setEditingCode] = useState(false);
    const [codeInput, setCodeInput] = useState("");
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [showWithdrawals, setShowWithdrawals] = useState(false);
    const [xpOffset, setXpOffset] = useState(0);

    // -----------------------------------------------------------------------
    // API queries
    // -----------------------------------------------------------------------
    const { data: profileData, isLoading: profileLoading } = useGetQuery({
        url: "/referral/me",
        queryProps: { queryKey: ["referral", "me"] },
    });
    const profile = getApiResponseData(profileData, {});

    const { data: referralsData, isLoading: referralsLoading } = useGetQuery({
        url: "/referral/me/referrals",
        params: { limit: 10, offset: 0 },
        queryProps: { queryKey: ["referral", "me", "referrals"] },
    });
    const referralsPayload = getApiResponseData(referralsData, {});
    const referrals = get(referralsPayload, "referrals", []);

    const { data: xpData, isLoading: xpLoading } = useGetQuery({
        url: "/referral/me/xp-history",
        params: { limit: XP_PAGE_SIZE, offset: xpOffset },
        queryProps: { queryKey: ["referral", "me", "xp-history", xpOffset] },
    });
    const xpPayload = getApiResponseData(xpData, {});
    const xpTotal = get(xpPayload, "total", 0);

    const [allXpTransactions, setAllXpTransactions] = useState([]);
    React.useEffect(() => {
        const transactions = get(xpPayload, "transactions", []);
        if (!isEmpty(transactions)) {
            setAllXpTransactions((prev) => {
                if (xpOffset === 0) return transactions;
                const existingIds = new Set(map(prev, "id"));
                const newItems = filter(transactions, (tx) => !existingIds.has(tx.id));
                return [...prev, ...newItems];
            });
        }
    }, [xpPayload, xpOffset]);
    const hasMoreXp = size(allXpTransactions) < xpTotal;

    const { data: leaderboardData, isLoading: leaderboardLoading } = useGetQuery({
        url: "/referral/leaderboard",
        queryProps: { queryKey: ["referral", "leaderboard"] },
    });
    const leaderboard = getApiResponseData(leaderboardData, []);

    const { data: withdrawalsData, isLoading: withdrawalsLoading } = useGetQuery({
        url: "/referral/me/withdrawals",
        queryProps: { queryKey: ["referral", "withdrawals"] },
    });
    const withdrawals = getApiResponseData(withdrawalsData, []);

    const updateCodeMutation = usePatchQuery({ queryKey: ["referral", "me"] });

    // -----------------------------------------------------------------------
    // Derived
    // -----------------------------------------------------------------------
    const referralCode = get(profile, "referralCode", "");
    const referralLink =
        get(profile, "referralLink", "") ||
        (referralCode
            ? `https://liveon.uz/join?ref=${encodeURIComponent(referralCode)}`
            : "");
    const xpBalance = get(profile, "xpBalance", 0);
    const totalXpEarned = get(profile, "totalXpEarned", 0);
    const totalReferrals = get(profile, "totalReferrals", 0);
    const activeReferrals = get(profile, "activeReferrals", 0);
    const currentUserId = get(user, "id");
    const withdrawProgress = Math.min((xpBalance / MIN_WITHDRAWAL) * 100, 100);

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------
    const handleCopyCode = useCallback(() => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast.success(t("profile.referral.codeCopied"));
        setTimeout(() => setCopied(false), 2000);
    }, [referralCode, t]);

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(referralLink);
        toast.success(t("profile.referral.linkCopied"));
    }, [referralLink, t]);

    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: "LiveOn", text: t("profile.referral.shareText", "LiveOn ilovasiga qo'shiling!"), url: referralLink });
            } catch { /* user cancelled */ }
        } else {
            handleCopyLink();
        }
    }, [referralLink, handleCopyLink, t]);

    const handleSaveCode = useCallback(() => {
        const trimmed = toUpper(trim(codeInput));
        if (trimmed.length < 4) {
            toast.error(t("profile.referral.codeMinLength"));
            return;
        }
        updateCodeMutation.mutate(
            { url: "/referral/me/code", attributes: { code: trimmed } },
            {
                onSuccess: () => { setEditingCode(false); toast.success(t("profile.referral.codeUpdated")); },
                onError: (err) => { toast.error(get(err, "response.data.message") || t("profile.referral.codeUpdateError", "Kodni o'zgartirib bo'lmadi")); },
            }
        );
    }, [codeInput, updateCodeMutation, t]);

    // -----------------------------------------------------------------------
    // Loading
    // -----------------------------------------------------------------------
    if (profileLoading) return <PageSkeleton />;

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    const containerClass = variant === "page"
        ? "flex flex-col gap-5 max-w-3xl mx-auto w-full"
        : "flex flex-col gap-5";

    return (
        <div className={containerClass}>
            {/* Dialogs */}
            <QRDrawer open={showQR} onOpenChange={setShowQR} referralCode={referralCode} onCopyLink={handleCopyLink} />
            <WithdrawalDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} xpBalance={xpBalance} />

            {/* ============================================================= */}
            {/* HERO: Referral Code Card                                       */}
            {/* ============================================================= */}
            <Card className="overflow-hidden relative border-primary/15">
                {/* Decorative blobs */}
                <div className="absolute -right-16 -top-16 size-48 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 size-32 bg-primary/10 blur-2xl rounded-full pointer-events-none" />

                <CardContent className="p-5 sm:p-6 relative">
                    {/* Header */}
                    <div className="flex items-center gap-3.5 mb-5">
                        <div className="size-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                            <SparklesIcon className="size-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold tracking-tight">{t("profile.referral.title")}</h2>
                            <p className="text-sm text-muted-foreground mt-0.5">{t("profile.referral.subtitle")}</p>
                        </div>
                    </div>

                    {/* Referral code */}
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
                        {t("profile.referral.yourCode")}
                    </label>

                    {editingCode ? (
                        <div className="flex gap-2">
                            <Input
                                autoFocus
                                value={codeInput}
                                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                                maxLength={20}
                                className="font-mono text-base font-bold tracking-widest h-12 border-primary/40 flex-1"
                                placeholder={t("profile.referral.enterNewCode")}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveCode()}
                            />
                            <Button className="h-12 px-5" onClick={handleSaveCode} disabled={updateCodeMutation.isPending}>
                                {updateCodeMutation.isPending ? <LoaderIcon className="size-4 animate-spin" /> : t("profile.general.save")}
                            </Button>
                            <Button variant="ghost" className="h-12 px-3" onClick={() => setEditingCode(false)} disabled={updateCodeMutation.isPending}>
                                <XIcon className="size-4" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="relative group">
                                <div className="flex items-center h-12 rounded-xl bg-muted/50 border px-4 font-mono text-base font-bold tracking-[0.15em] select-all">
                                    {referralCode}
                                </div>
                                <div className="absolute right-1.5 top-1.5 flex gap-0.5">
                                    <Button size="icon" variant="ghost" className="size-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => { setCodeInput(referralCode); setEditingCode(true); }}>
                                        <PencilIcon className="size-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="size-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={handleCopyCode}>
                                        {copied ? <CheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-2 mt-3">
                                <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg" onClick={() => setShowQR(true)}>
                                    <QrCodeIcon className="size-3.5" /> QR
                                </Button>
                                <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg flex-1" onClick={handleCopyLink}>
                                    <CopyIcon className="size-3.5" /> {t("profile.referral.copyLink")}
                                </Button>
                                <Button size="sm" className="h-9 gap-1.5 rounded-lg" onClick={handleShare}>
                                    <ShareIcon className="size-3.5" /> {t("profile.referral.share", "Ulashish")}
                                </Button>
                            </div>

                            {referralLink && (
                                <div className="mt-3">
                                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                        {t("profile.referral.yourLink", "Referral link")}
                                    </label>
                                    <div className="rounded-xl border bg-muted/30 px-4 py-3">
                                        <p className="select-all break-all text-xs font-medium text-muted-foreground">
                                            {referralLink}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ============================================================= */}
            {/* HOW IT WORKS                                                    */}
            {/* ============================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { step: "1", icon: ShareIcon, title: t("profile.referral.step1Title"), desc: t("profile.referral.step1Desc"), color: "primary" },
                    { step: "2", icon: UsersIcon, title: t("profile.referral.step2Title"), desc: t("profile.referral.step2Desc", { xp: "1,000 XP" }), color: "blue-600" },
                    { step: "3", icon: GiftIcon, title: t("profile.referral.step3Title"), desc: t("profile.referral.step3Desc", { xp: "10%" }), color: "emerald-600" },
                ].map((item) => (
                    <Card key={item.step} className="group hover:shadow-md transition-all hover:border-primary/20">
                        <CardContent className="p-4 flex items-start gap-3">
                            <div className={`size-9 rounded-xl bg-${item.color}/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <item.icon className={`size-4.5 text-${item.color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold">{item.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ============================================================= */}
            {/* BALANCE + STATS                                                */}
            {/* ============================================================= */}
            <Card className="overflow-hidden border-primary/10">
                <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-primary/8 via-primary/4 to-transparent p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <WalletIcon className="size-3.5" /> {t("profile.referral.yourBalance")}
                                </p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-4xl sm:text-5xl font-black text-primary tabular-nums">{xpBalance.toLocaleString()}</span>
                                    <span className="text-base font-bold text-primary/60">XP</span>
                                </div>
                                {totalXpEarned > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        {t("profile.referral.totalEarned", { xp: totalXpEarned.toLocaleString(), defaultValue: `Jami ishlab topilgan: ${totalXpEarned.toLocaleString()} XP` })}
                                    </p>
                                )}
                            </div>
                            <Button
                                className="h-11 px-6 gap-2 font-semibold shadow-md shadow-primary/15 sm:self-end"
                                onClick={() => setWithdrawOpen(true)}
                                disabled={xpBalance < MIN_WITHDRAWAL}
                            >
                                <CreditCardIcon className="size-4" />
                                {t("profile.referral.withdraw")}
                            </Button>
                        </div>

                        {/* Progress to minimum withdrawal */}
                        {xpBalance < MIN_WITHDRAWAL && (
                            <div className="mt-4 space-y-1.5">
                                <div className="flex justify-between text-[11px] text-muted-foreground">
                                    <span>{t("profile.referral.untilWithdraw", { defaultValue: "Yechib olishgacha" })}</span>
                                    <span className="font-medium">{xpBalance.toLocaleString()} / {MIN_WITHDRAWAL.toLocaleString()} XP</span>
                                </div>
                                <Progress value={withdrawProgress} className="h-2" />
                            </div>
                        )}
                    </div>
                    <Separator />
                    {/* Stats row */}
                    <div className="grid grid-cols-3 divide-x">
                        <div className="p-4 text-center">
                            <p className="text-2xl font-bold">{totalReferrals}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{t("profile.referral.totalReferrals")}</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-2xl font-bold text-primary">{activeReferrals}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{t("profile.referral.activeReferrals")}</p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-2xl font-bold">{size(withdrawals)}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{t("profile.referral.withdrawals", "Yechimlar")}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ============================================================= */}
            {/* LEADERBOARD + RECENT REFERRALS                                 */}
            {/* ============================================================= */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Leaderboard */}
                <Card>
                    <CardHeader className="py-3.5 px-4 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <TrophyIcon className="size-4 text-amber-500" />
                            {t("profile.referral.leaderboard")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {leaderboardLoading ? (
                            <div className="divide-y">
                                {times(5, (i) => (
                                    <div key={i} className="flex items-center gap-3 p-3.5">
                                        <Skeleton className="size-8 rounded-full" />
                                        <Skeleton className="size-8 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3.5 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                        <Skeleton className="h-5 w-14 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : isEmpty(leaderboard) ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
                                    <TrophyIcon className="size-7 text-amber-500/40" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">{t("profile.referral.noLeaderboard", "Hali ma'lumot yo'q")}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">{t("profile.referral.beFirst", "Birinchi bo'ling!")}</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {map(leaderboard, (item) => {
                                    const isMe = item.userId === currentUserId;
                                    return (
                                        <div
                                            key={item.rank}
                                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${isMe ? "bg-primary/5" : "hover:bg-muted/40"}`}
                                        >
                                            <RankBadge rank={item.rank} />
                                            <Avatar className="size-8">
                                                <AvatarImage src={item.avatar} />
                                                <AvatarFallback className="text-[10px] font-bold">{getInitials(item.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-sm truncate ${isMe ? "text-primary" : ""}`}>
                                                    {item.name}
                                                    {isMe && <span className="text-[10px] font-normal text-primary/60 ml-1">({t("profile.referral.me")})</span>}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {item.referralCount} {t("profile.referral.people", "ta odam")}
                                                </p>
                                            </div>
                                            <Badge variant="secondary" className="font-bold text-[11px] shrink-0">
                                                {get(item, "totalXpEarned", 0).toLocaleString()} XP
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Referrals */}
                <Card>
                    <CardHeader className="py-3.5 px-4 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <UserPlusIcon className="size-4 text-primary" />
                            {t("profile.referral.recentReferrals")}
                            {!isEmpty(referrals) && (
                                <Badge variant="secondary" className="text-[10px] ml-auto">{size(referrals)}</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {referralsLoading ? (
                            <div className="divide-y">
                                {times(3, (i) => (
                                    <div key={i} className="flex items-center gap-3 p-3.5">
                                        <Skeleton className="size-9 rounded-full" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3.5 w-28" />
                                            <Skeleton className="h-3 w-36" />
                                        </div>
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : isEmpty(referrals) ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                                    <UsersIcon className="size-7 text-primary/40" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">{t("profile.referral.noReferrals", "Hali referallar yo'q")}</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">{t("profile.referral.shareToStart", "Havolani ulashing va XP yig'ing")}</p>
                                <Button variant="outline" size="sm" className="mt-3 gap-1.5 h-8" onClick={handleShare}>
                                    <ShareIcon className="size-3" /> {t("profile.referral.share", "Ulashish")}
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {map(referrals, (item) => {
                                    const statusCfg = getReferralStatusConfig(item.status);
                                    return (
                                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                                            <Avatar className="size-9">
                                                <AvatarImage src={get(item, "referee.avatar")} />
                                                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                                    {getInitials(get(item, "referee.name"))}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">{get(item, "referee.name", "---")}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[11px] text-muted-foreground">{formatRelativeDate(item.createdAt, t)}</span>
                                                    <span className="size-0.5 rounded-full bg-border" />
                                                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 h-4 font-medium border ${statusCfg.className}`}>
                                                        {t(`profile.referral.status_${item.status}`, statusCfg.label)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold tabular-nums shrink-0 ${get(item, "xpEarned", 0) > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                                                +{get(item, "xpEarned", 0).toLocaleString()} XP
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ============================================================= */}
            {/* XP HISTORY                                                     */}
            {/* ============================================================= */}
            <Card>
                <CardHeader className="py-3.5 px-4 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <HistoryIcon className="size-4 text-muted-foreground" />
                        {t("profile.referral.xpHistory", "XP tarixi")}
                        {xpTotal > 0 && (
                            <Badge variant="secondary" className="text-[10px] ml-auto font-normal">
                                {size(allXpTransactions)} / {xpTotal}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {xpLoading && xpOffset === 0 ? (
                        <div className="divide-y">
                            {times(4, (i) => (
                                <div key={i} className="flex items-center gap-3 p-3.5">
                                    <Skeleton className="size-10 rounded-xl" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-5 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : isEmpty(allXpTransactions) ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                                <HistoryIcon className="size-7 text-muted-foreground/30" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">{t("profile.referral.noXpHistory", "XP tranzaksiyalar yo'q")}</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">{t("profile.referral.earnToSee", "XP yig'ishni boshlang")}</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {map(allXpTransactions, (tx) => {
                                const config = getXpTypeConfig(tx.type);
                                const IconComp = config.icon;
                                const isPositive = tx.amount > 0;
                                return (
                                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ring-1 ${config.ring}`}>
                                            <IconComp className={`size-4.5 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{getXpTypeLabel(tx.type, t)}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[11px] text-muted-foreground">{formatRelativeDate(tx.createdAt, t)}</span>
                                                {tx.note && (
                                                    <>
                                                        <span className="size-0.5 rounded-full bg-border" />
                                                        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{tx.note}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0 ml-2">
                                            <span className={`font-bold text-sm tabular-nums ${isPositive ? "text-emerald-600" : "text-red-500"}`}>
                                                {isPositive ? "+" : ""}{tx.amount.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground tabular-nums">
                                                {get(tx, "balance", 0).toLocaleString()} XP
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
                {hasMoreXp && (
                    <CardFooter className="p-0 border-t">
                        <Button
                            variant="ghost"
                            className="w-full h-10 text-xs text-muted-foreground gap-1.5 hover:text-foreground rounded-none"
                            onClick={() => setXpOffset((prev) => prev + XP_PAGE_SIZE)}
                            disabled={xpLoading}
                        >
                            {xpLoading ? (
                                <LoaderIcon className="size-3 animate-spin" />
                            ) : (
                                <>
                                    {t("profile.referral.loadMore", "Ko'proq yuklash")}
                                    <ChevronDownIcon className="size-3" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                )}
            </Card>

            {/* ============================================================= */}
            {/* WITHDRAWALS HISTORY                                            */}
            {/* ============================================================= */}
            <Card>
                <button
                    type="button"
                    className="w-full flex items-center gap-2 py-3.5 px-4 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setShowWithdrawals((prev) => !prev)}
                >
                    <WalletIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm font-semibold flex-1">
                        {t("profile.referral.withdrawalsHistory", "Yechib olishlar tarixi")}
                    </span>
                    {!isEmpty(withdrawals) && (
                        <Badge variant="secondary" className="text-[10px]">{size(withdrawals)}</Badge>
                    )}
                    <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform duration-200 ${showWithdrawals ? "rotate-180" : ""}`} />
                </button>

                {showWithdrawals && (
                    <>
                        <Separator />
                        <CardContent className="p-0">
                            {withdrawalsLoading ? (
                                <div className="divide-y">
                                    {times(2, (i) => (
                                        <div key={i} className="flex items-center gap-3 p-3.5">
                                            <Skeleton className="size-10 rounded-xl" />
                                            <div className="flex-1 space-y-1.5">
                                                <Skeleton className="h-3.5 w-28" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                            <Skeleton className="h-5 w-20" />
                                        </div>
                                    ))}
                                </div>
                            ) : isEmpty(withdrawals) ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                                        <WalletIcon className="size-7 text-muted-foreground/30" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">{t("profile.referral.noWithdrawals", "Yechib olishlar yo'q")}</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {map(withdrawals, (w) => {
                                        const sc = getWithdrawalStatus(w.status, t);
                                        const StatusIcon = sc.icon;
                                        return (
                                            <div key={w.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                                                <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${sc.bgColor} border ${sc.borderColor}`}>
                                                    <StatusIcon className={`size-4 ${sc.textColor}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm">{get(w, "amount", 0).toLocaleString()} XP</p>
                                                        <div className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${sc.bgColor} ${sc.textColor}`}>
                                                            <span className={`size-1.5 rounded-full ${sc.color}`} />
                                                            {sc.label}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[11px] text-muted-foreground">{formatRelativeDate(w.createdAt, t)}</span>
                                                        {w.cardNumber && (
                                                            <>
                                                                <span className="size-0.5 rounded-full bg-border" />
                                                                <span className="text-[11px] text-muted-foreground font-mono">**** {w.cardNumber.slice(-4)}</span>
                                                            </>
                                                        )}
                                                        {w.adminNote && (
                                                            <>
                                                                <span className="size-0.5 rounded-full bg-border" />
                                                                <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">{w.adminNote}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {w.amountUzs > 0 && (
                                                    <span className="text-sm font-semibold text-muted-foreground tabular-nums shrink-0">
                                                        {w.amountUzs.toLocaleString()} <span className="text-[10px]">UZS</span>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
};

export default ReferralDashboard;
