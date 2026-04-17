import { compact, join } from "lodash";
import { toast } from "sonner";

const useShare = () => {
    const share = async ({ title, text, url }) => {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return true;
            } catch {
                // User cancelled or error
                return false;
            }
        }

        // Fallback: copy to clipboard
        const shareText = join(compact([title, text, url]), "\n");
        try {
            await navigator.clipboard.writeText(shareText);
            toast.success("Clipboard ga nusxalandi!");
            return true;
        } catch {
            toast.error("Nusxalashda xatolik yuz berdi");
            return false;
        }
    };

    const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

    return { share, canNativeShare };
};

export default useShare;
