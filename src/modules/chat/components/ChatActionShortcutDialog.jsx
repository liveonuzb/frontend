import React from "react";
import { trim } from "lodash";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ACTION_COPY = {
    note: {
        title: "Note yaratish",
        description: "Tanlangan chat xabaridan private coach note saqlanadi.",
        submit: "Note saqlash",
    },
    task: {
        title: "Task yaratish",
        description: "Tanlangan xabar asosida clientga bajariladigan task qo'shing.",
        submit: "Task yaratish",
    },
    check_in: {
        title: "Check-in request",
        description: "Clientdan progress update so'rash uchun check-in request yuboring.",
        submit: "Check-in yaratish",
    },
    invoice: {
        title: "Invoice yaratish",
        description: "Chatga payment request widgeti yuboriladi.",
        submit: "Invoice yuborish",
    },
    payment_reminder: {
        title: "Payment reminder",
        description: "Payment statusiga mos eslatma xabari yuboring.",
        submit: "Reminder yuborish",
    },
    meal_feedback: {
        title: "Meal feedback",
        description: "Meal yoki nutrition bo'yicha client-facing feedback yozing.",
        submit: "Feedback yaratish",
    },
    workout_feedback: {
        title: "Workout feedback",
        description: "Workout yoki progress bo'yicha client-facing feedback yozing.",
        submit: "Feedback yaratish",
    },
    session_booking: {
        title: "Session booking",
        description: "Chatga session booking slotlarini yuboring.",
        submit: "Booking yuborish",
    },
};

const TASK_TYPES = [
    { value: "CUSTOM", label: "Custom" },
    { value: "WATER", label: "Water" },
    { value: "STEPS", label: "Steps" },
    { value: "MEALS", label: "Meals" },
    { value: "WORKOUT", label: "Workout" },
];

const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
};

const truncate = (value, max = 260) => {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 3)}...`;
};

const getMessageText = (message) =>
    truncate(
        message?.text ||
            message?.metadata?.description ||
            message?.metadata?.title ||
            message?.type ||
            "Chat xabari",
    );

const formatMoney = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return "";
    return `${Math.round(number).toLocaleString("uz-UZ")} so'm`;
};

const getPaymentAmount = (paymentSummary) =>
    paymentSummary?.amountDue ??
    paymentSummary?.outstandingAmount ??
    paymentSummary?.amount ??
    paymentSummary?.agreedAmount ??
    "";

const getInitialValues = ({ action, sourceMessage, clientName, paymentSummary }) => {
    const messageText = getMessageText(sourceMessage);
    const quote = `Chat xabari: "${messageText}"`;
    const tomorrow = addDays(1);
    const paymentAmount = getPaymentAmount(paymentSummary);
    const paymentDueDate =
        paymentSummary?.dueDate || paymentSummary?.nextDueDate || paymentSummary?.expectedAt || "";
    const paymentLabel = formatMoney(paymentAmount);

    return {
        noteTitle: "Chatdan note",
        noteContent: `${quote}\n\nKontekst: ${clientName || "Client"}`,
        noteTags: "chat, follow-up",
        taskType: "CUSTOM",
        taskTitle: messageText.slice(0, 120) || "Client follow-up",
        taskDescription: quote,
        dueDate: tomorrow,
        checkInTitle: "Haftalik check-in",
        checkInNote: quote,
        invoiceAmount: paymentAmount ? String(paymentAmount) : "",
        invoiceDescription: paymentSummary?.label || `${clientName || "Client"} uchun coach to'lovi`,
        invoiceDueDate: paymentDueDate ? String(paymentDueDate).slice(0, 10) : tomorrow,
        reminderText: [
            `Assalomu alaykum${clientName ? `, ${clientName}` : ""}.`,
            paymentLabel ? `To'lov bo'yicha eslatma: ${paymentLabel}.` : "To'lov bo'yicha eslatma.",
            paymentDueDate ? `Muddat: ${String(paymentDueDate).slice(0, 10)}.` : "",
            "Savol bo'lsa shu chatga yozing.",
        ]
            .filter(Boolean)
            .join(" "),
        feedbackTitle:
            action === "meal_feedback"
                ? "Nutrition feedback"
                : "Workout feedback",
        feedbackMessage: quote,
        bookingTitle: "Coach sessiyasi",
        bookingDate: tomorrow,
        bookingSlots: "10:00, 14:00",
        bookingDuration: "60",
        bookingNote: quote,
    };
};

const parseTags = (value) =>
    String(value || "")
        .split(",")
        .map((item) => trim(item))
        .filter(Boolean)
        .slice(0, 12);

const parseSlots = (value) =>
    String(value || "")
        .split(/[,\n ]+/)
        .map((item) => trim(item))
        .filter(Boolean)
        .slice(0, 8);

const parseAmount = (value) => Number(String(value || "").replace(/[^\d.]/g, ""));

const Field = ({ id, label, children }) => (
    <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        {children}
    </div>
);

export default function ChatActionShortcutDialog({
    open,
    action,
    sourceMessage,
    clientName,
    paymentSummary,
    onOpenChange,
    onSubmit,
    isSubmitting = false,
}) {
    const [values, setValues] = React.useState(() =>
        getInitialValues({ action, sourceMessage, clientName, paymentSummary }),
    );

    const updateValue = (key) => (event) => {
        setValues((current) => ({ ...current, [key]: event.target.value }));
    };

    const buildPayload = () => {
        if (action === "note") {
            const content = trim(values.noteContent);
            if (!content) {
                toast.error("Note matni bo'sh bo'lmasligi kerak.");
                return null;
            }
            return {
                title: trim(values.noteTitle) || undefined,
                content,
                tags: parseTags(values.noteTags),
            };
        }

        if (action === "task") {
            const title = trim(values.taskTitle);
            if (title.length < 2) {
                toast.error("Task nomi kamida 2 ta belgidan iborat bo'lishi kerak.");
                return null;
            }
            return {
                type: values.taskType,
                title,
                description: trim(values.taskDescription) || undefined,
                dueDate: values.dueDate || undefined,
            };
        }

        if (action === "check_in") {
            const title = trim(values.checkInTitle);
            if (title && title.length < 3) {
                toast.error("Check-in nomi kamida 3 ta belgidan iborat bo'lishi kerak.");
                return null;
            }
            return {
                title: title || undefined,
                note: trim(values.checkInNote) || undefined,
                dueDate: values.dueDate || undefined,
            };
        }

        if (action === "invoice") {
            const amount = parseAmount(values.invoiceAmount);
            const description = trim(values.invoiceDescription);
            if (!Number.isFinite(amount) || amount <= 0) {
                toast.error("Invoice summasini to'g'ri kiriting.");
                return null;
            }
            if (!description) {
                toast.error("Invoice tavsifi bo'sh bo'lmasligi kerak.");
                return null;
            }
            return {
                text: `Invoice: ${description}`,
                metadata: {
                    amount: Math.round(amount),
                    description,
                    dueDate: values.invoiceDueDate || undefined,
                    status: "pending",
                },
            };
        }

        if (action === "payment_reminder") {
            const text = trim(values.reminderText);
            if (text.length < 3) {
                toast.error("Reminder xabari kamida 3 ta belgidan iborat bo'lishi kerak.");
                return null;
            }
            return { text };
        }

        if (action === "meal_feedback" || action === "workout_feedback") {
            const message = trim(values.feedbackMessage);
            if (message.length < 3) {
                toast.error("Feedback matni kamida 3 ta belgidan iborat bo'lishi kerak.");
                return null;
            }
            return {
                type: action === "meal_feedback" ? "NUTRITION" : "PROGRESS",
                title: trim(values.feedbackTitle) || undefined,
                message,
                contextDate: new Date().toISOString(),
            };
        }

        if (action === "session_booking") {
            const title = trim(values.bookingTitle);
            const slots = parseSlots(values.bookingSlots);
            const durationMinutes = Number(values.bookingDuration);
            if (!title) {
                toast.error("Booking mavzusini kiriting.");
                return null;
            }
            if (!values.bookingDate) {
                toast.error("Booking sanasini kiriting.");
                return null;
            }
            if (slots.length === 0) {
                toast.error("Kamida bitta booking slot kiriting.");
                return null;
            }
            return {
                title,
                date: values.bookingDate,
                slots,
                durationMinutes:
                    Number.isFinite(durationMinutes) && durationMinutes >= 15
                        ? durationMinutes
                        : 60,
                note: trim(values.bookingNote) || undefined,
            };
        }

        return null;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const payload = buildPayload();
        if (!payload) return;
        await onSubmit(action, payload);
    };

    const copy = ACTION_COPY[action] || ACTION_COPY.note;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bottom-0 left-0 top-auto max-h-[88svh] translate-x-0 translate-y-0 overflow-y-auto overscroll-contain rounded-t-2xl border-x-0 border-b-0 p-4 sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-6">
                <DialogHeader className="pr-8 text-left">
                    <DialogTitle>{copy.title}</DialogTitle>
                    <DialogDescription>{copy.description}</DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {sourceMessage ? (
                        <div className="break-words rounded-xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground [overflow-wrap:anywhere]">
                            {getMessageText(sourceMessage)}
                        </div>
                    ) : null}

                    {action === "note" && (
                        <>
                            <Field id="chat-action-note-title" label="Sarlavha">
                                <Input
                                    id="chat-action-note-title"
                                    value={values.noteTitle}
                                    onChange={updateValue("noteTitle")}
                                />
                            </Field>
                            <Field id="chat-action-note-content" label="Note">
                                <Textarea
                                    id="chat-action-note-content"
                                    value={values.noteContent}
                                    onChange={updateValue("noteContent")}
                                    rows={7}
                                />
                            </Field>
                            <Field id="chat-action-note-tags" label="Taglar">
                                <Input
                                    id="chat-action-note-tags"
                                    value={values.noteTags}
                                    onChange={updateValue("noteTags")}
                                    placeholder="chat, payment, risk"
                                />
                            </Field>
                        </>
                    )}

                    {action === "task" && (
                        <>
                            <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr]">
                                <Field id="chat-action-task-type" label="Turi">
                                    <select
                                        id="chat-action-task-type"
                                        className="h-9 w-full rounded-2xl border bg-background px-3 text-sm"
                                        value={values.taskType}
                                        onChange={updateValue("taskType")}
                                    >
                                        {TASK_TYPES.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                <Field id="chat-action-task-title" label="Task nomi">
                                    <Input
                                        id="chat-action-task-title"
                                        value={values.taskTitle}
                                        onChange={updateValue("taskTitle")}
                                    />
                                </Field>
                            </div>
                            <Field id="chat-action-task-description" label="Tavsif">
                                <Textarea
                                    id="chat-action-task-description"
                                    value={values.taskDescription}
                                    onChange={updateValue("taskDescription")}
                                    rows={5}
                                />
                            </Field>
                            <Field id="chat-action-task-due" label="Due date">
                                <Input
                                    id="chat-action-task-due"
                                    type="date"
                                    value={values.dueDate}
                                    onChange={updateValue("dueDate")}
                                />
                            </Field>
                        </>
                    )}

                    {action === "check_in" && (
                        <>
                            <Field id="chat-action-checkin-title" label="Sarlavha">
                                <Input
                                    id="chat-action-checkin-title"
                                    value={values.checkInTitle}
                                    onChange={updateValue("checkInTitle")}
                                />
                            </Field>
                            <Field id="chat-action-checkin-note" label="Izoh">
                                <Textarea
                                    id="chat-action-checkin-note"
                                    value={values.checkInNote}
                                    onChange={updateValue("checkInNote")}
                                    rows={6}
                                />
                            </Field>
                            <Field id="chat-action-checkin-due" label="Due date">
                                <Input
                                    id="chat-action-checkin-due"
                                    type="date"
                                    value={values.dueDate}
                                    onChange={updateValue("dueDate")}
                                />
                            </Field>
                        </>
                    )}

                    {action === "invoice" && (
                        <>
                            <Field id="chat-action-invoice-amount" label="Summa">
                                <Input
                                    id="chat-action-invoice-amount"
                                    inputMode="numeric"
                                    value={values.invoiceAmount}
                                    onChange={updateValue("invoiceAmount")}
                                    placeholder="250000"
                                />
                            </Field>
                            <Field id="chat-action-invoice-description" label="Tavsif">
                                <Input
                                    id="chat-action-invoice-description"
                                    value={values.invoiceDescription}
                                    onChange={updateValue("invoiceDescription")}
                                />
                            </Field>
                            <Field id="chat-action-invoice-due" label="Due date">
                                <Input
                                    id="chat-action-invoice-due"
                                    type="date"
                                    value={values.invoiceDueDate}
                                    onChange={updateValue("invoiceDueDate")}
                                />
                            </Field>
                        </>
                    )}

                    {action === "payment_reminder" && (
                        <Field id="chat-action-payment-reminder" label="Xabar">
                            <Textarea
                                id="chat-action-payment-reminder"
                                value={values.reminderText}
                                onChange={updateValue("reminderText")}
                                rows={6}
                            />
                        </Field>
                    )}

                    {(action === "meal_feedback" || action === "workout_feedback") && (
                        <>
                            <Field id="chat-action-feedback-title" label="Sarlavha">
                                <Input
                                    id="chat-action-feedback-title"
                                    value={values.feedbackTitle}
                                    onChange={updateValue("feedbackTitle")}
                                />
                            </Field>
                            <Field id="chat-action-feedback-message" label="Feedback">
                                <Textarea
                                    id="chat-action-feedback-message"
                                    value={values.feedbackMessage}
                                    onChange={updateValue("feedbackMessage")}
                                    rows={7}
                                />
                            </Field>
                        </>
                    )}

                    {action === "session_booking" && (
                        <>
                            <Field id="chat-action-booking-title" label="Mavzu">
                                <Input
                                    id="chat-action-booking-title"
                                    value={values.bookingTitle}
                                    onChange={updateValue("bookingTitle")}
                                />
                            </Field>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Field id="chat-action-booking-date" label="Sana">
                                    <Input
                                        id="chat-action-booking-date"
                                        type="date"
                                        value={values.bookingDate}
                                        onChange={updateValue("bookingDate")}
                                    />
                                </Field>
                                <Field id="chat-action-booking-duration" label="Daqiqa">
                                    <Input
                                        id="chat-action-booking-duration"
                                        type="number"
                                        min="15"
                                        max="240"
                                        value={values.bookingDuration}
                                        onChange={updateValue("bookingDuration")}
                                    />
                                </Field>
                            </div>
                            <Field id="chat-action-booking-slots" label="Slotlar">
                                <Input
                                    id="chat-action-booking-slots"
                                    value={values.bookingSlots}
                                    onChange={updateValue("bookingSlots")}
                                    placeholder="10:00, 14:00"
                                />
                            </Field>
                            <Field id="chat-action-booking-note" label="Izoh">
                                <Textarea
                                    id="chat-action-booking-note"
                                    value={values.bookingNote}
                                    onChange={updateValue("bookingNote")}
                                    rows={4}
                                />
                            </Field>
                        </>
                    )}

                    <DialogFooter className="gap-2 border-t pt-3 sm:border-0 sm:pt-0">
                        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                            Bekor qilish
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                            {isSubmitting ? "Saqlanmoqda..." : copy.submit}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
