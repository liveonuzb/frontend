import React from "react";
import { map } from "lodash";
import { useNavigate } from "react-router";
import { XIcon } from "lucide-react";
import { useProfileOverlay } from "@/modules/profile/hooks/use-profile-overlay";

/**
 * Keyboard Shortcuts provider — Ctrl+K for global search, ? for shortcuts help
 */

const shortcuts = [
    { keys: ["⌘", "K"], label: "Qidiruv", action: "search" },
    { keys: ["⌘", "D"], label: "Dashboard", action: "dashboard" },
    { keys: ["⌘", "N"], label: "Ovqatlanish", action: "nutrition" },
    { keys: ["⌘", "W"], label: "Mashg'ulotlar", action: "workouts" },
    { keys: ["⌘", "P"], label: "Profil", action: "profile" },
    { keys: ["?"], label: "Shortcutlar ko'rsatish", action: "help" },
];

export const KeyboardShortcutsProvider = ({ children }) => {
    const navigate = useNavigate();
    const [showHelp, setShowHelp] = React.useState(false);
    const { openProfile } = useProfileOverlay();

    React.useEffect(() => {
        const handler = (e) => {
            // Ctrl/Cmd + K -> Search
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                navigate("/user/search");
            }
            // Ctrl/Cmd + D -> Dashboard
            if ((e.metaKey || e.ctrlKey) && e.key === "d") {
                e.preventDefault();
                navigate("/user/dashboard");
            }
            // Ctrl/Cmd + N -> Nutrition
            if ((e.metaKey || e.ctrlKey) && e.key === "n") {
                e.preventDefault();
                navigate("/user/nutrition");
            }
            // Ctrl/Cmd + W -> Workouts
            if ((e.metaKey || e.ctrlKey) && e.key === "w") {
                e.preventDefault();
                navigate("/user/workouts");
            }
            // Ctrl/Cmd + P -> Profile
            if ((e.metaKey || e.ctrlKey) && e.key === "p") {
                e.preventDefault();
                openProfile();
            }
            // ? -> Show shortcuts
            if (e.key === "?" && !e.metaKey && !e.ctrlKey && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
                e.preventDefault();
                setShowHelp(prev => !prev);
            }
            // Escape -> Close help
            if (e.key === "Escape") {
                setShowHelp(false);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [navigate, openProfile]);

    return (
        <>
            {children}
            {showHelp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowHelp(false)}>
                    <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">⌨️ Klaviatura shortcutlari</h3>
                            <button onClick={() => setShowHelp(false)}><XIcon className="size-4" /></button>
                        </div>
                        <div className="space-y-2">
                            {map(shortcuts, (s) => (
                                <div key={s.action} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                    <span className="text-sm">{s.label}</span>
                                    <div className="flex gap-1">
                                        {map(s.keys, (k) => (
                                            <kbd key={k} className="px-2 py-0.5 bg-muted rounded text-xs font-mono border">{k}</kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default KeyboardShortcutsProvider;
