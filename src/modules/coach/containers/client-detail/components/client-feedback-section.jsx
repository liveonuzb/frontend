import {
  find,
  get,
  map,
  size,
  toUpper,
  trim,
} from "lodash";
import React from "react";
import {
  CheckCircleIcon,
  Loader2Icon,
  MessageSquareIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  { value: "GENERAL", label: "Umumiy" },
  { value: "NUTRITION", label: "Ovqatlanish" },
  { value: "PROGRESS", label: "Progress" },
  { value: "CHECKIN", label: "Check-in" },
];

const FEEDBACK_TEMPLATES = [
  {
    id: "great_progress",
    type: "PROGRESS",
    label: "Ajoyib progress",
    title: "Ajoyib natijalar!",
    message:
      "Zo'r natijalar ko'rsatyapsiz! Sizning mehnatlaringiz mevasini bermoqda. Shu yo'lda davom eting va maqsadingizga yaqinlashib borasiz.",
  },
  {
    id: "keep_going",
    type: "GENERAL",
    label: "Davom eting",
    title: "Davom eting!",
    message:
      "Yaxshi ish qilyapsiz! Har bir kichik qadam katta maqsadga olib boradi. Bugun ham o'zingiz uchun eng yaxshisini qiling.",
  },
  {
    id: "nutrition_reminder",
    type: "NUTRITION",
    label: "Ovqatlanish eslatma",
    title: "Ovqatlanish rejasiga e'tibor",
    message:
      "Ovqatlanish rejangizga ko'proq e'tibor bering. Protein miqdorini oshiring va suv ichishni unutmang. Maqsadga erishishda ovqatlanish 80% rol o'ynaydi.",
  },
  {
    id: "water_reminder",
    type: "NUTRITION",
    label: "Suv eslatma",
    title: "Suv ichishni unutmang",
    message:
      "Kundalik suv normasiga e'tibor bering. Kamida 2-3 litr suv iching. Bu metabolizmni tezlashtiradi va mashq samaradorligini oshiradi.",
  },
  {
    id: "workout_praise",
    type: "GENERAL",
    label: "Mashq tariflab",
    title: "Mashq natijasi zo'r!",
    message:
      "Mashqlarni muntazam bajarayotganingiz ajoyib! Kuch va chidamliligingiz oshmoqda. Keyingi bosqichga o'tishga tayyormiz.",
  },
  {
    id: "checkin_good",
    type: "CHECKIN",
    label: "Yaxshi check-in",
    title: "Haftalik natija",
    message:
      "Bu haftagi natijalaringiz yaxshi. Barcha ko'rsatkichlar to'g'ri yo'nalishda. Kelasi haftada ham shu tempni saqlab qoling.",
  },
  {
    id: "checkin_improve",
    type: "CHECKIN",
    label: "Yaxshilash kerak",
    title: "Yaxshilash yo'nalishlari",
    message:
      "Bu hafta ba'zi sohalarda yaxshilash kerak. Keling, birga strategiya tuzamiz va kelasi hafta yanada yaxshi natijaga erishamiz.",
  },
  {
    id: "rest_reminder",
    type: "GENERAL",
    label: "Dam olish eslatma",
    title: "Dam olish muhim",
    message:
      "Mushaklar mashq paytida emas, dam olish paytida o'sadi. Bugun yaxshilab dam oling, yetarlicha uxlang va tanangizga tiklanish uchun vaqt bering.",
  },
];

const TYPE_COLORS = {
  GENERAL: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  NUTRITION: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  CHECKIN: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const ClientFeedbackSection = ({
  feedback = [],
  createFeedback,
  isCreatingFeedback,
  clientName = "",
}) => {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [feedbackType, setFeedbackType] = React.useState("GENERAL");
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");

  const handleSelectTemplate = (template) => {
    setFeedbackType(template.type);
    setTitle(template.title);
    setMessage(template.message);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!trim(message) || trim(message).length < 3) {
      toast.error("Xabar kamida 3 ta belgidan iborat bo'lishi kerak");
      return;
    }
    try {
      await createFeedback({
        type: feedbackType,
        title: trim(title) || undefined,
        message: trim(message),
      });
      toast.success("Fikr-mulohaza yuborildi");
      setIsFormOpen(false);
      setTitle("");
      setMessage("");
      setFeedbackType("GENERAL");
    } catch (error) {
      const errMsg =
        get(error, "response.data.message") || "Fikr-mulohaza yuborib bo'lmadi";
      toast.error(Array.isArray(errMsg) ? errMsg.join(", ") : errMsg);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border-none bg-card/60 py-6 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="inline-flex items-center gap-2 text-base">
              <MessageSquareIcon className="size-4 text-primary" />
              Fikr-mulohaza
            </CardTitle>
            {!isFormOpen ? (
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => setIsFormOpen(true)}
              >
                <SendIcon className="mr-1.5 size-3.5" />
                Yangi fikr
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isFormOpen ? (
            <div className="space-y-4 rounded-2xl border border-primary/10 bg-primary/[0.02] p-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <SparklesIcon className="mr-1 inline size-3" />
                  Tayyor shablonlar
                </p>
                <div className="flex flex-wrap gap-2">
                  {map(FEEDBACK_TEMPLATES, (tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/40",
                        get(TYPE_COLORS, tpl.type, ""),
                      )}
                      onClick={() => handleSelectTemplate(tpl)}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Turi</Label>
                  <Select value={feedbackType} onValueChange={setFeedbackType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {map(FEEDBACK_TYPES, (ft) => (
                        <SelectItem key={ft.value} value={ft.value}>
                          {ft.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sarlavha (ixtiyoriy)</Label>
                  <input
                    type="text"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sarlavha kiriting..."
                    maxLength={120}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Xabar</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`${clientName || "Mijoz"}ga fikr-mulohaza yozing...`}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="rounded-xl"
                  onClick={handleSubmit}
                  disabled={isCreatingFeedback || trim(message).length < 3}
                >
                  {isCreatingFeedback ? (
                    <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <SendIcon className="mr-1.5 size-3.5" />
                  )}
                  Yuborish
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setIsFormOpen(false);
                    setTitle("");
                    setMessage("");
                    setFeedbackType("GENERAL");
                  }}
                  disabled={isCreatingFeedback}
                >
                  Bekor qilish
                </Button>
              </div>
            </div>
          ) : null}

          {size(feedback) === 0 && !isFormOpen ? (
            <div className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Hali fikr-mulohaza yuborilmagan
            </div>
          ) : (
            <div className="space-y-3">
              {map(feedback, (item) => {
                const typeLabel = get(
                  find(FEEDBACK_TYPES, (ft) => ft.value === toUpper(get(item, "type", ""))),
                  "label",
                  get(item, "type", "Umumiy"),
                );
                const typeColor = get(
                  TYPE_COLORS,
                  toUpper(get(item, "type", "")),
                  TYPE_COLORS.GENERAL,
                );
                return (
                  <div
                    key={get(item, "id")}
                    className="rounded-2xl border border-border/60 bg-muted/10 p-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {get(item, "title") ? (
                            <p className="text-sm font-bold">{get(item, "title")}</p>
                          ) : null}
                          <Badge
                            variant="outline"
                            className={cn("shrink-0 text-[10px]", typeColor)}
                          >
                            {typeLabel}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {get(item, "message")}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] font-medium text-muted-foreground/60">
                      {formatDate(get(item, "createdAt"))}
                      {get(item, "coach.name")
                        ? ` • ${get(item, "coach.name")}`
                        : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientFeedbackSection;
