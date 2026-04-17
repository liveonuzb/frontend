import React from "react";
import { cn } from "@/lib/utils";

/**
 * Enhanced page transition wrapper with stagger support for children
 * Modes: fade, slide-up, scale, slide-left
 */
const PageTransition = ({ children, className, mode = "slide-up", stagger = false }) => {
    const [visible, setVisible] = React.useState(false);
    const isMounted = React.useRef(true);

    React.useEffect(() => {
        isMounted.current = true;
        requestAnimationFrame(() => {
            if (isMounted.current) {
                setVisible(true);
            }
        });
        return () => {
            isMounted.current = false;
            setVisible(false);
        };
    }, []);

    const animClass = {
        "fade": visible ? "opacity-100" : "opacity-0",
        "slide-up": visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
        "scale": visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        "slide-left": visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
    }[mode] || (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3");

    return (
        <div className={cn(
            "transition-all duration-400 ease-out",
            animClass,
            stagger && "stagger-children",
            className
        )}>
            {children}
        </div>
    );
};

export default PageTransition;
