import React from "react";
import { Button } from "@/components/ui/button";
import { ShareIcon } from "lucide-react";
import useShare from "@/hooks/utils/use-share";

const ShareButton = ({ title, text, url, variant = "outline", size = "sm", className = "", children }) => {
    const { share } = useShare();

    return (
        <Button
            variant={variant}
            size={size}
            className={`gap-1.5 ${className}`}
            onClick={() => share({ title, text, url })}
        >
            <ShareIcon className="size-3.5" />
            {children || "Ulashish"}
        </Button>
    );
};

export default ShareButton;
