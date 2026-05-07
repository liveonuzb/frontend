import React, { useState } from "react";
import { times, filter, map, round } from "lodash";
import { cn } from "@/lib/utils";
import {
    Check,
    CheckCheck,
    PlayIcon,
    PauseIcon,
    Trash2Icon,
    XIcon,
    LanguagesIcon,
    TypeIcon,
    PlayCircleIcon,
    PlusIcon as PlusIconLucide,
    CalendarIcon,
    CreditCardIcon,
    BadgeCheckIcon,
    TimerIcon,
    FlameIcon,
    CheckSquareIcon,
    FileIcon,
    DownloadIcon,
    AlertCircleIcon,
    RefreshCwIcon,
    LoaderCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChatStore, useAuthStore } from "@/store";
import { useNavigate } from "react-router";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { isChatFeatureEnabled } from "@/modules/chat/lib/chat-feature-flags.js";
import {
    formatChatAttachmentSize,
    getChatAttachmentMetadata,
    isChatAttachmentExpired,
} from "@/modules/chat/lib/chat-attachment-policy.js";
import { downloadSessionCalendarInvite } from "@/components/coach-sessions/session-utils.js";

function formatVoiceDuration(seconds) {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

const contentWrapClass = "min-w-0 break-words [overflow-wrap:anywhere]";

const VideoNotePlayer = ({ mediaUrl, isMe }) => (
    <div className={cn(
        "size-40 md:size-48 rounded-full overflow-hidden border-4 relative group cursor-pointer shadow-xl",
        isMe ? "border-primary/30" : "border-background"
    )}>
        <video src={mediaUrl} className="w-full h-full object-cover" loop muted autoPlay playsInline />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <PlayCircleIcon className="size-10 md:size-12 text-white/80 group-hover:scale-110 transition-transform" />
        </div>
    </div>
);

const AttachmentSecurityMeta = ({ msg, isMe }) => {
    const attachment = getChatAttachmentMetadata(msg);
    if (!attachment) return null;

    return (
        <div className={cn("flex min-w-0 flex-wrap items-center gap-1.5 text-[9px]", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
            {attachment.scanStatus === "passed" && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[8px] font-semibold">
                    <BadgeCheckIcon className="mr-1 size-2.5" />
                    Tekshirildi
                </Badge>
            )}
            <span className="min-w-0 max-w-full truncate">
                {attachment.fileName || "Attachment"}
                {attachment.size ? ` • ${formatChatAttachmentSize(attachment.size)}` : ""}
            </span>
        </div>
    );
};

const ImageAttachment = ({ msg, isMe, renderTextWithLinks, onOpen, onRefresh }) => (
    <div className="space-y-2">
        <div className="rounded-lg overflow-hidden border bg-muted/20">
            <img
                loading="lazy"
                src={msg.mediaUrl}
                alt={getChatAttachmentMetadata(msg)?.fileName || "Chat media"}
                className="max-w-full max-h-60 md:max-h-80 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onOpen(msg)}
                onError={() => onRefresh(msg)}
            />
        </div>
        <AttachmentSecurityMeta msg={msg} isMe={isMe} />
        {msg.text && msg.text !== "📷 Rasm" && <p className={cn("leading-relaxed whitespace-pre-wrap", contentWrapClass)}>{renderTextWithLinks(msg.text, isMe)}</p>}
    </div>
);

const VideoAttachment = ({ msg, isMe, renderTextWithLinks, onRefresh }) => (
    <div className="space-y-2">
        <div className="rounded-lg overflow-hidden border bg-black">
            <video
                src={msg.mediaUrl}
                controls
                playsInline
                className="max-w-full max-h-60 md:max-h-80 object-contain"
                onError={() => onRefresh(msg)}
            />
        </div>
        <AttachmentSecurityMeta msg={msg} isMe={isMe} />
        {msg.text && msg.text !== "🎥 Video" && <p className={cn("leading-relaxed whitespace-pre-wrap", contentWrapClass)}>{renderTextWithLinks(msg.text, isMe)}</p>}
    </div>
);

const FileAttachment = ({ msg, isMe, renderTextWithLinks, onOpen }) => {
    const attachment = getChatAttachmentMetadata(msg);

    return (
        <div className="space-y-2">
            <button
                type="button"
                onClick={() => onOpen(msg)}
                className={cn(
                    "flex w-full min-w-0 items-center gap-3 p-3 rounded-xl border text-left transition-all",
                    isMe ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-muted/50 border-border hover:bg-muted",
                )}
            >
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{attachment?.fileName || "Fayl"}</p>
                    <p className="text-[10px] opacity-60">
                        {attachment?.size ? formatChatAttachmentSize(attachment.size) : "Ko'rish uchun bosing"}
                    </p>
                </div>
                <DownloadIcon className="size-4 shrink-0 opacity-70" />
            </button>
            <AttachmentSecurityMeta msg={msg} isMe={isMe} />
            {msg.text && msg.text !== "📎 Fayl" && <p className={cn("leading-relaxed whitespace-pre-wrap", contentWrapClass)}>{renderTextWithLinks(msg.text, isMe)}</p>}
        </div>
    );
};

const InteractiveTask = ({
    metadata,
    msgId,
    activeChat,
    isMe,
    onComplete,
    canInteract,
}) => {
    const { updateTaskProgress } = useChatStore();
    const percentage = round((metadata.current / metadata.goal) * 100);
    const handleProgress = () => {
        updateTaskProgress(activeChat, msgId, 1);
        if (metadata.current + 1 >= metadata.goal) onComplete();
    };
    return (
        <div className="w-[18rem] max-w-full min-w-0 space-y-2 py-1 md:space-y-3">
            <div className="flex items-start justify-between gap-2 font-bold text-xs md:text-sm">
                <div className="flex min-w-0 items-start gap-2">
                    <span className="shrink-0 text-sm md:text-base">🎯</span>
                    <span className={contentWrapClass}>{metadata.title}</span>
                </div>
                {metadata.completed && <Badge className="h-4 shrink-0 bg-green-500 text-[7px] md:text-[8px]">Bajarildi</Badge>}
            </div>
            <div className="space-y-1">
                <div className="flex flex-wrap justify-between gap-1 text-[9px] opacity-70 md:text-[10px]"><span>Progress: {metadata.current} / {metadata.goal} {metadata.unit}</span><span>{percentage}%</span></div>
                <Progress value={percentage} className="h-1 md:h-1.5" />
            </div>
            {canInteract && !isMe && !metadata.completed && <Button size="sm" className="min-h-8 w-full text-[10px] font-bold md:text-xs" onClick={handleProgress}><PlusIconLucide className="mr-1 size-3" /> Bajardim</Button>}
        </div>
    );
};

const BookingWidget = ({ metadata, activeChat, isMe }) => {
    const { selectBookingSlot, cancelBooking, completeBooking } = useChatStore();
    const { activeRole } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const isCancelled = metadata?.status === "cancelled";
    const isCompleted = metadata?.status === "completed";
    const isScheduled = metadata?.status === "scheduled";
    const isCoach = activeRole === "COACH";
    const canSelectSlot = !isCoach && !isMe && !isCancelled && !isCompleted;
    const canCancel = Boolean(metadata?.bookingId) && !isCancelled && !isCompleted;
    const canComplete = isCoach && isScheduled;
    const canExportCalendar = Boolean(metadata?.selectedSlot || metadata?.startsAt);
    const startLabel = (() => {
        if (metadata?.startsAt) {
            const parsed = new Date(metadata.startsAt);
            if (!Number.isNaN(parsed.getTime())) {
                return new Intl.DateTimeFormat("uz-UZ", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                }).format(parsed);
            }
        }
        return [metadata?.date, metadata?.selectedSlot].filter(Boolean).join(" ");
    })();

    const handleSelectSlot = async (slotTime) => {
        if (!metadata?.bookingId) {
            toast.error("Booking ID topilmadi");
            return;
        }

        try {
            setIsSubmitting(true);
            await selectBookingSlot(activeChat, metadata.bookingId, slotTime);
            toast.success("Vaqt muvaffaqiyatli band qilindi");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!metadata?.bookingId) {
            toast.error("Booking ID topilmadi");
            return;
        }

        try {
            setIsSubmitting(true);
            await cancelBooking(activeChat, metadata.bookingId, cancelReason.trim());
            toast.success("Booking bekor qilindi");
            setIsCancelOpen(false);
            setCancelReason("");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async () => {
        if (!metadata?.bookingId) {
            toast.error("Booking ID topilmadi");
            return;
        }

        try {
            setIsSubmitting(true);
            await completeBooking(activeChat, metadata.bookingId);
            toast.success("Booking tugatildi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-[19rem] max-w-full min-w-0 space-y-2 py-1 md:space-y-3">
            <div className="flex items-start gap-2 font-bold text-xs md:text-sm"><CalendarIcon className="mt-0.5 size-3.5 shrink-0 text-primary md:size-4" /><span className={contentWrapClass}>{metadata.title}</span></div>
            <div className="rounded-lg border bg-background/60 px-2 py-1.5 text-[10px] md:text-xs text-muted-foreground">
                <div className={contentWrapClass}>{startLabel || metadata?.date || "Sana belgilanmagan"}</div>
                <div className={contentWrapClass}>{metadata?.durationMinutes || 60} daqiqa{metadata?.timezone ? ` • ${metadata.timezone}` : ""}</div>
            </div>
            {isCancelled ? (
                <div className="p-2 md:p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold text-rose-500">Bekor qilindi</p>
                    <p className={cn("mt-1 text-[10px] text-muted-foreground md:text-xs", contentWrapClass)}>
                        {metadata.cancellationReason || "Sabab ko'rsatilmagan"}
                    </p>
                </div>
            ) : isCompleted ? (
                <div className="p-2 md:p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold text-green-600">Tugallandi</p>
                    <p className={cn("text-base font-black md:text-lg", contentWrapClass)}>{metadata.selectedSlot || metadata.date}</p>
                </div>
            ) : metadata.selectedSlot ? (
                <div className="p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                    <p className="text-[8px] md:text-[10px] uppercase tracking-wider font-bold text-primary">{isScheduled ? "Band qilindi" : "Tanlangan vaqt"}</p>
                    <p className={cn("text-base font-black md:text-lg", contentWrapClass)}>{metadata.selectedSlot}</p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-1.5 md:gap-2">
                    {(metadata.slots || []).map((slot, i) => (
                        <button key={i} disabled={!canSelectSlot || isSubmitting || !metadata?.bookingId} onClick={() => handleSelectSlot(slot.time)} className="min-h-9 rounded-lg border bg-background p-1.5 text-[10px] font-medium transition-all hover:border-primary hover:text-primary disabled:opacity-50 md:p-2 md:text-xs">{slot.time}</button>
                    ))}
                </div>
            )}
            {isCancelOpen ? (
                <div className="space-y-2 rounded-lg border bg-background/70 p-2">
                    <input
                        value={cancelReason}
                        onChange={(event) => setCancelReason(event.target.value)}
                        className="h-9 w-full rounded-md border bg-background px-2 text-[11px] outline-none"
                        placeholder="Bekor qilish sababi"
                    />
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => setIsCancelOpen(false)}>
                            Qaytish
                        </Button>
                        <Button size="sm" className="h-8 text-[10px]" onClick={handleCancel} disabled={isSubmitting}>
                            Tasdiqlash
                        </Button>
                    </div>
                </div>
            ) : null}
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[repeat(auto-fit,minmax(6rem,1fr))]">
                {canExportCalendar ? (
                    <Button size="sm" variant="outline" className="h-8 px-2 text-[10px]" onClick={() => downloadSessionCalendarInvite(metadata)}>
                        <DownloadIcon className="mr-1 size-3" />
                        Calendar
                    </Button>
                ) : null}
                {canComplete ? (
                    <Button size="sm" className="h-8 px-2 text-[10px]" onClick={handleComplete} disabled={isSubmitting}>
                        <BadgeCheckIcon className="mr-1 size-3" />
                        Tugatish
                    </Button>
                ) : null}
                {canCancel ? (
                    <Button size="sm" variant="outline" className="h-8 px-2 text-[10px]" onClick={() => setIsCancelOpen(true)} disabled={isSubmitting}>
                        <XIcon className="mr-1 size-3" />
                        Bekor
                    </Button>
                ) : null}
            </div>
        </div>
    );
};

const HabitTrackerWidget = ({ metadata, msgId, activeChat, isMe, canInteract }) => {
    const { updateHabitStatus } = useChatStore();

    // Calculate progress
    const completed = filter(metadata.habits, h => h.checked).length;
    const total = metadata.habits.length;
    const progress = round((completed / total) * 100);

    return (
        <div className="w-[19rem] max-w-full min-w-0 space-y-3 py-1">
            <div className="flex items-start justify-between gap-2 font-bold text-xs md:text-sm">
                <div className="flex min-w-0 items-start gap-2">
                    <CheckSquareIcon className="mt-0.5 size-3.5 shrink-0 text-primary md:size-4" />
                    <span className={contentWrapClass}>{metadata.title}</span>
                </div>
                <Badge variant={progress === 100 ? "default" : "secondary"} className="h-4 shrink-0 text-[7px] md:text-[8px]">
                    {progress}%
                </Badge>
            </div>

            <div className="space-y-1.5">
                {metadata.habits.map((habit, idx) => (
                    <button
                        key={idx}
                        disabled={!canInteract || !isMe}
                        onClick={() => {
                            if (canInteract) updateHabitStatus(activeChat, msgId, idx);
                        }}
                        className={cn(
                            "flex min-w-0 items-center justify-between gap-2 w-full p-2 rounded-lg text-xs transition-all border",
                            habit.checked
                                ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
                                : cn(
                                    "bg-background border-border",
                                    canInteract && "hover:bg-muted/50"
                                )
                        )}
                    >
                        <span className={cn(contentWrapClass, habit.checked && "line-through opacity-70")}>{habit.label}</span>
                        <div className={cn(
                            "size-4 shrink-0 rounded flex items-center justify-center border transition-colors",
                            habit.checked ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30"
                        )}>
                            {habit.checked && <Check className="size-3" />}
                        </div>
                    </button>
                ))}
            </div>
            <Progress value={progress} className="h-1 md:h-1.5" />
        </div>
    );
};

const InvoiceWidget = ({
    metadata,
    msgId,
    activeChat,
    isMe,
    onPay,
    canInteract,
}) => {
    const { payInvoice } = useChatStore();
    return (
        <div className="w-[19rem] max-w-full min-w-0 space-y-3 py-1 md:space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 font-bold text-xs md:text-sm"><CreditCardIcon className="size-3.5 shrink-0 text-primary md:size-4" /><span className={contentWrapClass}>To'lov uchun hisob</span></div>
                {metadata.status === "paid" && <BadgeCheckIcon className="size-4 shrink-0 text-green-500 md:size-5" />}
            </div>
            <div className={cn("p-3 md:p-4 rounded-xl border text-center space-y-1", metadata.status === "paid" ? "bg-green-500/10 border-green-500/20" : "bg-primary/5 border-primary/10")}>
                <p className={cn("text-[10px] opacity-70 md:text-xs", contentWrapClass)}>{metadata.description}</p>
                <p className="text-xl font-black md:text-2xl">{parseInt(metadata.amount).toLocaleString()} <span className="text-sm">UZS</span></p>
            </div>
            {canInteract && !isMe && metadata.status === "pending" && (
                <Button
                    className="w-full h-9 md:h-10 text-xs md:text-sm font-bold shadow-lg"
                    onClick={() => {
                        if (payInvoice(activeChat, msgId)) onPay();
                    }}
                >
                    To'lash
                </Button>
            )}
        </div>
    );
};

const ChallengeSharedWidget = ({ metadata, onJoin }) => {
    return (
        <div className="w-[19rem] max-w-full min-w-0 space-y-3 py-1">
            <div className="flex items-center gap-2 font-bold text-xs md:text-sm text-primary">
                <FlameIcon className="size-4 shrink-0 animate-pulse" />
                <span className={contentWrapClass}>Yangi Musobaqa!</span>
            </div>
            <div className="p-3 rounded-xl border bg-muted/20 space-y-2">
                <h4 className={cn("text-sm font-black leading-tight md:text-base", contentWrapClass)}>{metadata.title}</h4>
                <p className="line-clamp-3 text-[10px] text-muted-foreground md:text-xs">
                    {metadata.description}
                </p>
            </div>
            <Button 
                size="sm" 
                className="w-full h-8 text-[11px] font-bold gap-2"
                onClick={onJoin}
            >
                <PlusIconLucide className="size-3.5" />
                Ishtirok etish
            </Button>
        </div>
    );
};

const VoiceMessagePlayer = ({ msg, activeChat, isMe }) => {
    const { transcribeVoice, refreshAttachmentUrl } = useChatStore();
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingAI, setLoadingLoadingAI] = useState(false);
    const audioRef = React.useRef(null);
    const animRef = React.useRef(null);
    const [randomHeights] = React.useState(() => times(12, () => (4 + Math.random() * 10) * 0.8));

    const togglePlay = async () => {
        try {
            let mediaUrl = msg.mediaUrl;
            if (isChatAttachmentExpired(msg)) {
                const refreshed = await refreshAttachmentUrl(activeChat, msg.id);
                mediaUrl = refreshed?.url || mediaUrl;
            }

            if (!audioRef.current || audioRef.current.src !== mediaUrl) {
                audioRef.current = new Audio(mediaUrl);
                audioRef.current.onended = () => { setPlaying(false); setProgress(0); };
            }
            if (playing) { audioRef.current.pause(); setPlaying(false); }
            else { audioRef.current.play(); setPlaying(true); const tick = () => { if (audioRef.current) { setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100); animRef.current = requestAnimationFrame(tick); } }; tick(); }
        } catch {
            setPlaying(false);
        }
    };

    const handleTranscribe = async () => {
        setLoadingLoadingAI(true);
        await transcribeVoice(activeChat, msg.id);
        setLoadingLoadingAI(false);
    };

    return (
        <div className="space-y-2">
            <div className="flex w-[16rem] max-w-full min-w-0 items-center gap-2">
                <button onClick={togglePlay} className={cn("size-7 md:size-8 rounded-full flex items-center justify-center shrink-0", isMe ? "bg-primary-foreground/20" : "bg-primary/10")}>
                    {playing ? <PauseIcon className="size-3 md:size-3.5" /> : <PlayIcon className="size-3 md:size-3.5" />}
                </button>
                <div className="flex h-4 min-w-0 flex-1 items-end gap-[1px] md:h-5 md:gap-[2px]">
                    {times(12, (i) => <span key={i} className={cn("w-[2px] rounded-full transition-all", (i / 12) * 100 <= progress ? (isMe ? "bg-primary-foreground" : "bg-primary") : (isMe ? "bg-primary-foreground/40" : "bg-muted-foreground/30"))} style={{ height: `${randomHeights[i]}px` }} />)}
                </div>
                <span className="shrink-0 text-[8px] opacity-70 md:text-[9px]">{formatVoiceDuration(msg.duration || msg.metadata?.duration)}</span>

                {!msg.transcription && !isMe && (
                    <button
                        onClick={handleTranscribe}
                        disabled={loadingAI}
                        className={cn("size-6 rounded-full flex items-center justify-center hover:bg-muted transition-colors ml-1", loadingAI && "animate-spin")}
                    >
                        <TypeIcon className="size-3 text-primary" />
                    </button>
                )}
            </div>

            {msg.transcription && (
                <div className={cn("text-[10px] italic border-l-2 pl-2 py-1 bg-black/5 rounded-r-lg", contentWrapClass, isMe ? "border-primary-foreground/40 text-primary-foreground/80" : "border-primary/40 text-muted-foreground")}>
                    "{msg.transcription}"
                </div>
            )}
        </div>
    );
};

const DeleteConfirmation = ({ onDelete, onCancel }) => (
    <div className="absolute z-20 right-0 top-full mt-1 min-w-[160px] md:min-w-[200px] rounded-xl border bg-popover p-1.5 md:p-2 shadow-lg animate-in fade-in zoom-in-95">
        <p className="text-[10px] md:text-xs text-muted-foreground px-2 py-1 mb-1">Xabarni o'chirish</p>
        <button className="flex w-full items-center gap-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-destructive hover:bg-destructive/10 transition-colors" onClick={onDelete}><Trash2Icon className="size-3 md:size-3.5" /> O'chirish</button>
        <button className="flex w-full items-center gap-2 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs text-muted-foreground hover:bg-muted transition-colors" onClick={onCancel}><XIcon className="size-2.5 md:size-3" /> Bekor qilish</button>
    </div>
);

const PollWidget = ({
    msg,
    activeChat,
    currentUserId,
    canInteract,
    votePoll,
}) => (
    <div className="w-[19rem] max-w-full min-w-0 space-y-2 py-1 md:space-y-3">
        <div className="mb-1.5 flex items-start gap-2 text-xs font-bold md:text-sm">
            <span className="shrink-0">📊</span>
            <span className={contentWrapClass}>{msg.metadata.question}</span>
        </div>
        {map(msg.metadata.options, (opt, i) => {
            const percent = round((opt.votes.length / (msg.metadata.totalVotes || 1)) * 100);
            return (
                <div key={i} className="space-y-1">
                    <button
                        disabled={!canInteract}
                        onClick={() => canInteract && votePoll(activeChat, msg.id, i, currentUserId)}
                        className={cn(
                            "flex min-h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border p-2 text-left text-[10px] disabled:cursor-default",
                            opt.votes.includes(currentUserId) ? "bg-primary/20 border-primary" : "bg-muted/20 border-transparent",
                            canInteract && "hover:border-primary/50",
                        )}
                    >
                        <span className={cn("flex-1", contentWrapClass)}>{opt.text}</span>
                        <span className="shrink-0 font-semibold">{percent}%</span>
                    </button>
                    <Progress value={percent} className="h-1" />
                </div>
            );
        })}
    </div>
);

const MessageDeliveryState = ({ msg, onRetry }) => {
    if (msg.status === "failed") {
        return (
            <button
                type="button"
                className="flex min-w-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-destructive transition-colors hover:bg-destructive/10 md:text-[10px]"
                onClick={(event) => {
                    event.stopPropagation();
                    onRetry?.(msg.id);
                }}
                title={msg.errorMessage || "Xabar yuborilmadi"}
            >
                <AlertCircleIcon className="size-2.5 shrink-0" />
                <span className="max-w-[8rem] truncate">Yuborilmadi</span>
                <RefreshCwIcon className="size-2.5 shrink-0" />
            </button>
        );
    }

    if (msg.status === "sending") {
        return (
            <span className="flex items-center gap-1 text-[9px] md:text-[10px]">
                <LoaderCircleIcon className="size-2.5 animate-spin" />
                Yuborilmoqda
            </span>
        );
    }

    if (msg.status === "sent") {
        return <Check className="size-2.5" aria-label="Yuborildi" />;
    }

    return <CheckCheck className={cn("size-2.5", msg.status === "read" && "text-blue-400")} aria-label="O'qildi" />;
};

const MessageList = ({
    messagesWithSeparators,
    searchHighlightIds,
    handleDoubleClick,
    handleContextMenu,
    handleReaction,
    handleDelete,
    handleDeleteCancel,
    renderTextWithLinks,
    activeChat,
    reactionMsgId,
    deletingMsgId,
    multiSelectMode,
    messageRefs,
    messagesEndRef,
    bottomSentinelRef,
    handleRetryMessage,
}) => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { votePoll, loadMoreMessages, messagesCursors, refreshAttachmentUrl } = useChatStore();
    const currentUserId = user?.id;
    const [showConfetti, setShowConfetti] = useState(false);
    const triggerCelebration = () => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 5000); };
    const canUseReactions = isChatFeatureEnabled("reactions");
    const canUseWidgetInteractions = isChatFeatureEnabled("widgetInteractions");
    const handleAttachmentRefresh = React.useCallback(
        async (msg) => {
            if (!getChatAttachmentMetadata(msg)?.objectKey) return null;
            try {
                return await refreshAttachmentUrl(activeChat, msg.id);
            } catch {
                return null;
            }
        },
        [activeChat, refreshAttachmentUrl],
    );
    const handleAttachmentOpen = React.useCallback(
        async (msg) => {
            let mediaUrl = msg.mediaUrl;
            if (isChatAttachmentExpired(msg)) {
                const refreshed = await handleAttachmentRefresh(msg);
                mediaUrl = refreshed?.url || mediaUrl;
            }

            if (mediaUrl) {
                window.open(mediaUrl, "_blank", "noopener,noreferrer");
            }
        },
        [handleAttachmentRefresh],
    );

    return (
        <div className="relative flex-1 space-y-1 overflow-y-auto p-3 pb-4 md:p-6 custom-scrollbar">
            {showConfetti && <Confetti numberOfPieces={150} recycle={false} gravity={0.3} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />}

            {messagesCursors[activeChat] && (
                <button
                    onClick={() => loadMoreMessages(activeChat)}
                    className="w-full text-center text-sm text-muted-foreground py-2 hover:text-foreground"
                >
                    Oldingi xabarlarni ko'rish
                </button>
            )}

            {messagesWithSeparators.map((item, index) => {
                if (item.type === "separator") return <div key={item.key} className="text-center my-3 md:my-4"><span className="text-[9px] md:text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full uppercase tracking-widest">{item.label === "today" ? "Bugun" : item.label === "yesterday" ? "Kecha" : item.label}</span></div>;
                const msg = item.msg;
                const isMe = msg.sender?.id === currentUserId || msg.from === "me";
                const prevMsg = index > 0 && messagesWithSeparators[index - 1].type === "message" ? messagesWithSeparators[index - 1].msg : null;
                const isSequence = prevMsg && (prevMsg.from === msg.from) && (new Date(msg.time).getTime() - new Date(prevMsg?.time).getTime() < 60000);

                return (
                    <div key={msg.id} ref={el => { if (el) messageRefs.current[msg.id] = el; }} className={cn("flex min-w-0 relative group py-0.5", isMe ? "justify-end" : "justify-start", searchHighlightIds.has(msg.id) && "bg-yellow-500/10", multiSelectMode && "pl-8")}>
                        <div className={cn("min-w-0 max-w-[92%] sm:max-w-[82%] md:max-w-[75%] px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm relative shadow-sm transition-all", isMe ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" : "bg-background border rounded-2xl rounded-tl-sm", isSequence && isMe && "rounded-tr-2xl mt-0.5", isSequence && !isMe && "rounded-tl-2xl mt-0.5", msg.type === "video_note" && "bg-transparent border-0 shadow-none p-0", msg.ttl && "border-orange-500/50 bg-gradient-to-br from-background to-orange-500/5")} onDoubleClick={() => handleDoubleClick(msg.id)} onContextMenu={e => handleContextMenu(e, msg)}>
                            {msg.ttl && <div className="absolute -top-2 -right-2 size-5 rounded-full bg-orange-500 flex items-center justify-center animate-bounce shadow-lg z-10"><TimerIcon className="size-3 text-white" /></div>}

                            {/* Reply Preview */}
                            {msg.replyTo && (
                                <button 
                                    onClick={() => {
                                        const el = messageRefs.current[msg.replyTo.id];
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                    className={cn(
                                        "mb-2 p-2 rounded-lg border-l-4 text-left block w-full transition-colors",
                                        isMe ? "bg-primary-foreground/10 border-primary-foreground/40 hover:bg-primary-foreground/20" : "bg-muted border-primary/40 hover:bg-muted/80"
                                    )}
                                >
                                    <p className={cn("text-[10px] font-black uppercase truncate", isMe ? "text-primary-foreground" : "text-primary")}>
                                        {msg.replyTo.senderName}
                                    </p>
                                    <p className={cn("line-clamp-2 text-[11px] opacity-80", contentWrapClass)}>{msg.replyTo.text}</p>
                                </button>
                            )}

                            {msg.type === "poll" ? <PollWidget msg={msg} activeChat={activeChat} currentUserId={currentUserId} canInteract={canUseWidgetInteractions} votePoll={votePoll} />
                                : msg.type === "task" ? <InteractiveTask metadata={msg.metadata} msgId={msg.id} activeChat={activeChat} isMe={isMe} onComplete={triggerCelebration} canInteract={canUseWidgetInteractions} />
                                    : msg.type === "habit_tracker" ? <HabitTrackerWidget metadata={msg.metadata} msgId={msg.id} activeChat={activeChat} isMe={isMe} canInteract={canUseWidgetInteractions} />
                                        : msg.type === "booking" ? <BookingWidget metadata={msg.metadata} activeChat={activeChat} isMe={isMe} />
                                            : msg.type === "invoice" ? <InvoiceWidget metadata={msg.metadata} msgId={msg.id} activeChat={activeChat} isMe={isMe} onPay={triggerCelebration} canInteract={canUseWidgetInteractions} />
                                                : msg.type === "shared_content" && msg.metadata.contentType === "challenge" ? (
                                                    <ChallengeSharedWidget 
                                                        metadata={msg.metadata} 
                                                        onJoin={() => navigate(`/challenges/${msg.metadata.contentId}`)} 
                                                    />
                                                )
                                                                                            : msg.type === "video_note" ? <VideoNotePlayer mediaUrl={msg.mediaUrl} isMe={isMe} />
                                                                                                : msg.type === "voice" || msg.type === "audio" ? <VoiceMessagePlayer msg={msg} activeChat={activeChat} isMe={isMe} />
                                                                                                    : msg.type === "video" ? (
                                                                                                        <VideoAttachment msg={msg} isMe={isMe} renderTextWithLinks={renderTextWithLinks} onRefresh={handleAttachmentRefresh} />
                                                                                                    )
                                                                                                    : msg.type === "image" ? (
                                                                                                        <ImageAttachment msg={msg} isMe={isMe} renderTextWithLinks={renderTextWithLinks} onOpen={handleAttachmentOpen} onRefresh={handleAttachmentRefresh} />
                                                                                                    )
                                                                                                    : msg.type === "file" ? (
                                                                                                        <FileAttachment msg={msg} isMe={isMe} renderTextWithLinks={renderTextWithLinks} onOpen={handleAttachmentOpen} />
                                                                                                    )
                                                                                                    : (
                                                                                                        <div className="min-w-0 space-y-1">                                                                <p className={cn("leading-relaxed whitespace-pre-wrap", contentWrapClass)}>{renderTextWithLinks(msg.text, isMe)}</p>
                                                                {msg.translation && (
                                                                    <div className={cn("text-[10px] border-t pt-1 mt-1 flex items-start gap-1.5", isMe ? "border-primary-foreground/20 text-primary-foreground/70" : "border-muted text-muted-foreground")}>
                                                                        <LanguagesIcon className="size-2.5 shrink-0 mt-0.5" />
                                                                        <span className={contentWrapClass}>{msg.translation}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                            <div className={cn("mt-1 flex min-w-0 items-center justify-end gap-1", msg.status === "failed" ? "opacity-100" : "opacity-60")}>
                                <span className="shrink-0 text-[9px] md:text-[10px]">{msg.time}</span>
                                {isMe && <MessageDeliveryState msg={msg} onRetry={handleRetryMessage} />}
                                {msg.ttl && <FlameIcon className="size-2.5 text-orange-500 animate-pulse ml-1" />}
                            </div>

                            {canUseReactions && reactionMsgId === msg.id && <div data-reaction-picker className={cn("absolute z-10 flex gap-1 bg-background border rounded-full px-1.5 py-1 shadow-lg -top-9", isMe ? "right-0" : "left-0")}>{["👍", "❤️", "🔥", "😂", "👏"].map(emoji => <button key={emoji} className="text-sm hover:scale-125 transition-transform" onClick={e => { e.stopPropagation(); handleReaction(msg.id, emoji); }}>{emoji}</button>)}</div>}
                            {deletingMsgId === msg.id && <DeleteConfirmation onDelete={handleDelete} onCancel={handleDeleteCancel} />}
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} /><div ref={bottomSentinelRef} className="h-1" />
        </div>
    );
};

export default MessageList;
