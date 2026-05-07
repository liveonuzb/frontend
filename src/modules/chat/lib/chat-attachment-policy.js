export const CHAT_ATTACHMENT_POLICY_VERSION = "chat-attachment-v1";
export const CHAT_ATTACHMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

const MB = 1024 * 1024;

export const CHAT_ATTACHMENT_POLICIES = [
    {
        mediaType: "image",
        maxSizeBytes: 8 * MB,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        extensions: ["jpg", "jpeg", "png", "webp", "gif"],
        label: "JPEG, PNG, WebP, GIF",
    },
    {
        mediaType: "video",
        maxSizeBytes: 50 * MB,
        mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
        extensions: ["mp4", "webm", "mov"],
        label: "MP4, WebM, MOV",
    },
    {
        mediaType: "audio",
        maxSizeBytes: 25 * MB,
        mimeTypes: [
            "audio/mpeg",
            "audio/mp4",
            "audio/wav",
            "audio/x-wav",
            "audio/ogg",
            "audio/webm",
        ],
        extensions: ["mp3", "m4a", "wav", "ogg", "oga", "webm"],
        label: "MP3, M4A, WAV, OGG, WebM",
    },
    {
        mediaType: "file",
        maxSizeBytes: 20 * MB,
        mimeTypes: [
            "application/pdf",
            "text/plain",
            "text/csv",
            "application/msword",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        extensions: ["pdf", "txt", "csv", "doc", "docx", "xls", "xlsx"],
        label: "PDF, TXT, CSV, Word, Excel",
    },
];

const DANGEROUS_EXTENSIONS = new Set([
    "apk",
    "app",
    "bat",
    "bin",
    "bz2",
    "cmd",
    "com",
    "cpl",
    "csh",
    "dmg",
    "exe",
    "gz",
    "htm",
    "html",
    "ipa",
    "iso",
    "jar",
    "js",
    "jsx",
    "mjs",
    "msi",
    "php",
    "pkg",
    "pl",
    "ps1",
    "py",
    "rar",
    "rb",
    "scr",
    "sh",
    "svg",
    "tar",
    "tgz",
    "tsx",
    "wasm",
    "xz",
    "zip",
]);

export const CHAT_ATTACHMENT_ACCEPT = CHAT_ATTACHMENT_POLICIES
    .flatMap((policy) => policy.mimeTypes)
    .join(",");

export const formatChatAttachmentSize = (bytes) => {
    const size = Number(bytes || 0);
    if (size < 1024) return `${size} B`;
    if (size < MB) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / MB).toFixed(1)} MB`;
};

export const getChatAttachmentMetadata = (message) => {
    const attachment = message?.metadata?.attachment;
    return attachment && typeof attachment === "object" ? attachment : null;
};

export const isChatAttachmentExpired = (message, leewayMs = 60000) => {
    const expiresAt = getChatAttachmentMetadata(message)?.signedUrlExpiresAt;
    if (!expiresAt) return false;

    const parsed = new Date(expiresAt).getTime();
    return Number.isFinite(parsed) && parsed <= Date.now() + leewayMs;
};

export const buildChatAttachmentMetadata = (upload, file) => ({
    objectKey: upload.objectKey,
    fileName: upload.fileName || file.name,
    size: upload.size ?? file.size,
    mimeType: upload.mimeType || file.type,
    mediaType: upload.mediaType || upload.fileType || getPolicyForFile(file)?.mediaType || "file",
    scanStatus: upload.scanStatus || upload.security?.scanStatus || "passed",
    scanEngine: upload.security?.scanEngine || "sync-signature-policy",
    policyVersion:
        upload.security?.policyVersion ||
        upload.policyVersion ||
        CHAT_ATTACHMENT_POLICY_VERSION,
    signedUrlExpiresAt: upload.security?.signedUrlExpiresAt || upload.signedUrlExpiresAt,
});

export const validateChatAttachment = (file) => {
    if (!file) {
        return { ok: false, message: "Fayl tanlanmagan." };
    }

    const extension = getFileExtension(file.name);
    const policy = getPolicyForFile(file);

    if (extension && DANGEROUS_EXTENSIONS.has(extension)) {
        return { ok: false, message: "Bu fayl turi chat uchun ruxsat etilmagan." };
    }

    if (!policy) {
        return {
            ok: false,
            message: "Faqat rasm, video, audio, PDF, TXT, CSV, Word yoki Excel yuborish mumkin.",
        };
    }

    if (extension && !policy.extensions.includes(extension)) {
        return {
            ok: false,
            message: "Fayl kengaytmasi MIME turi bilan mos kelmadi.",
        };
    }

    if (file.size > policy.maxSizeBytes) {
        return {
            ok: false,
            message: `${policy.label} ${formatChatAttachmentSize(policy.maxSizeBytes)} dan kichik bo'lishi kerak.`,
        };
    }

    return { ok: true, policy, mediaType: policy.mediaType };
};

export const getPolicyForFile = (file) => {
    const mimeType = String(file?.type || "").toLowerCase();
    return CHAT_ATTACHMENT_POLICIES.find((policy) =>
        policy.mimeTypes.includes(mimeType),
    );
};

function getFileExtension(name) {
    const normalized = String(name || "").trim().toLowerCase();
    const fileName = normalized.split(/[\\/]/).pop() || "";
    if (!fileName.includes(".")) return "";
    return fileName.split(".").pop().replace(/[^a-z0-9]/g, "");
}
