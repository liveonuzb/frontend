const runtimeFlags =
    globalThis.__APP_CONFIG__?.chatFeatureFlags ??
    globalThis.__APP_CONFIG__?.CHAT_FEATURE_FLAGS ??
    {};

const enabledByRuntime = (key) =>
    runtimeFlags[key] === true || runtimeFlags[key] === "true";

export const CHAT_FEATURE_FLAGS = Object.freeze({
    // Keep production UI honest: disabled features below still need backend
    // persistence, authorization, and audit behavior before they are exposed.
    reactions: enabledByRuntime("reactions"),
    bookmarks: enabledByRuntime("bookmarks"),
    localChatPinning: enabledByRuntime("localChatPinning"),
    chatListCustomization: enabledByRuntime("chatListCustomization"),
    muteBlockControls: enabledByRuntime("muteBlockControls"),
    liveActivity: enabledByRuntime("liveActivity"),
    storyViewer: enabledByRuntime("storyViewer"),
    wallpaper: enabledByRuntime("wallpaper"),
    widgetInteractions: enabledByRuntime("widgetInteractions"),
    selfDestructMessages: enabledByRuntime("selfDestructMessages"),
    chatMaintenance: enabledByRuntime("chatMaintenance"),
});

export const isChatFeatureEnabled = (key) => Boolean(CHAT_FEATURE_FLAGS[key]);
