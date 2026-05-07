const PAYMENT_COPY = {
    overdue: "To'lov bo'yicha muloyim eslatma yuboring va qulay to'lov vaqtini so'rang.",
    due: "Yaqinlashayotgan to'lov sanasini eslatib, savoli bo'lsa yozishini so'rang.",
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const hasAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const countByStatus = (items = [], status) =>
    items.filter((item) => normalizeText(item.status) === status).length;

const getPaymentStatus = (context) =>
    normalizeText(
        context?.detail?.overview?.paymentSummary?.status ||
            context?.activeEntity?.paymentSummary?.status ||
            context?.activeEntity?.payment?.status,
    );

const getActivePlanName = (context, type) => {
    const overview = context?.detail?.overview ?? {};
    const templates = context?.detail?.assignedTemplates ?? [];
    if (type === "meal") {
        return (
            overview.activeMealPlan?.name ||
            overview.activeMealPlan?.title ||
            templates.find((item) => item.type === "MEAL")?.title ||
            null
        );
    }

    return (
        overview.activeWorkoutPlan?.name ||
        overview.activeWorkoutPlan?.title ||
        templates.find((item) => item.type === "WORKOUT")?.title ||
        null
    );
};

const sanitizeCoachReply = (text) =>
    text
        .replace(/\bdavolaydi\b/gi, "yordam berishi mumkin")
        .replace(/\bdiagnoz\b/gi, "holat")
        .replace(/\bgarantiya\b/gi, "reja")
        .replace(/\bkasallik\b/gi, "sog'liq holati");

const suggestion = (text, reason) => ({
    text: sanitizeCoachReply(text),
    reason,
});

export const buildGroundedCoachReplySuggestions = ({
    lastMessage,
    clientContext,
}) => {
    const text = normalizeText(lastMessage?.text);
    const clientName =
        clientContext?.detail?.client?.name ||
        clientContext?.activeEntity?.name ||
        clientContext?.activeEntity?.otherParticipant?.name ||
        "siz";
    const detail = clientContext?.detail ?? {};
    const tasks = detail.tasks ?? [];
    const checkIns = detail.weeklyCheckIns ?? [];
    const latestLog = detail.dailyLogs?.[0] ?? null;
    const paymentStatus = getPaymentStatus(clientContext);
    const mealPlan = getActivePlanName(clientContext, "meal");
    const workoutPlan = getActivePlanName(clientContext, "workout");
    const overdueTasks = countByStatus(tasks, "overdue");
    const pendingCheckIns = countByStatus(checkIns, "pending");
    const riskLevel = normalizeText(
        detail.summary?.risk?.level ||
            detail.overview?.risk?.level ||
            clientContext?.activeEntity?.risk?.level,
    );
    const suggestions = [];

    if (hasAny(text, ["ovqat", "qorn", "kaloriya", "nonushta", "tushlik"])) {
        suggestions.push(
            suggestion(
                mealPlan
                    ? `${clientName}, ${mealPlan} bo'yicha bugungi ovqatni yozib yuboring. Men porsiya va vaqt bo'yicha aniq feedback beraman.`
                    : `${clientName}, bugungi ovqat va taxminiy porsiyani yozib yuboring. Men keyingi qadamni shunga qarab moslayman.`,
                mealPlan
                    ? `Clientda active meal plan bor: ${mealPlan}`
                    : "Oxirgi xabar ovqat haqida, lekin active meal plan topilmadi",
            ),
        );
    }

    if (hasAny(text, ["mashq", "workout", "zal", "og'riq", "charchadim"])) {
        suggestions.push(
            suggestion(
                workoutPlan
                    ? `${clientName}, ${workoutPlan} ichidagi oxirgi mashqni qanday bajarganingizni yozing. Yuklama og'ir bo'lgan bo'lsa, bugun yengilroq variant tanlaymiz.`
                    : `${clientName}, bugungi mashqdan keyingi energiya va qiyin bo'lgan joyni yozing. Shunga qarab keyingi mashqni moslayman.`,
                workoutPlan
                    ? `Clientda active workout plan bor: ${workoutPlan}`
                    : "Oxirgi xabar mashq haqida, active workout plan topilmadi",
            ),
        );
    }

    if (paymentStatus && PAYMENT_COPY[paymentStatus]) {
        suggestions.push(
            suggestion(
                `${clientName}, eslatma: ${PAYMENT_COPY[paymentStatus]}`,
                `Payment status: ${paymentStatus}`,
            ),
        );
    }

    if (overdueTasks > 0) {
        suggestions.push(
            suggestion(
                `${clientName}, sizda ${overdueTasks} ta kechikkan task bor. Eng oson bittasidan boshlaymizmi? Qaysi biri to'sqinlik qilayotganini yozing.`,
                `Client tasklarida ${overdueTasks} ta overdue bor`,
            ),
        );
    }

    if (pendingCheckIns > 0) {
        suggestions.push(
            suggestion(
                `${clientName}, check-in javobingizni kutyapman. Vazn, energiya va adherence bo'yicha qisqa update yuborsangiz, rejani aniqroq moslayman.`,
                `Clientda ${pendingCheckIns} ta pending check-in bor`,
            ),
        );
    }

    if (riskLevel === "high") {
        suggestions.push(
            suggestion(
                `${clientName}, bugun holatingizni qisqa yozib bering: energiya, uyqu va reja bajarilishi. Men bosim qilmasdan keyingi eng real qadamni tanlayman.`,
                "Client risk darajasi high",
            ),
        );
    }

    if (latestLog && suggestions.length < 3) {
        suggestions.push(
            suggestion(
                `${clientName}, oxirgi trackingni ko'rdim. Bugun ham ovqat, suv va harakatni qisqa belgilab boring, kechqurun birga xulosa qilamiz.`,
                "Latest daily tracking mavjud",
            ),
        );
    }

    if (hasAny(text, ["rahmat", "tushundim", "ok", "xo'p"])) {
        suggestions.unshift(
            suggestion(
                "Zo'r. Bugungi eng muhim bitta qadamni bajaring, keyin menga qisqa update yuboring.",
                "Oxirgi xabar tasdiq yoki minnatdorchilik ohangida",
            ),
        );
    }

    if (suggestions.length === 0) {
        suggestions.push(
            suggestion(
                `${clientName}, tushunarli. Vaziyatni aniqroq ko'rishim uchun bugungi ovqat, mashq yoki energiya bo'yicha bitta qisqa detal yuboring.`,
                "Static keyword yetmadi, umumiy client contextdan ehtiyotkor draft",
            ),
        );
    }

    return suggestions.slice(0, 3);
};
