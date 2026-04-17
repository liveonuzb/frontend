import React from "react";
import { Button } from "@/components/ui/button";
import {
    PhoneIcon,
    PhoneOffIcon,
    MicIcon,
    MicOffIcon,
    VideoIcon,
    VideoOffIcon,
    Volume2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ChatCallOverlay = ({ 
    activeEntity, 
    onEnd, 
    callType = "audio" // audio or video
}) => {
    const [status, setStatus] = React.useState("incoming"); // incoming, calling, active
    const [isMuted, setIsMuted] = React.useState(false);
    const [timer, setTimer] = React.useState(0);

    React.useEffect(() => {
        let interval;
        if (status === "active") {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const formatTime = (s) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 text-white flex flex-col items-center justify-between py-20 px-6 animate-in fade-in duration-500">
            {/* Caller Info */}
            <div className="text-center space-y-4">
                <div className="size-32 rounded-full overflow-hidden bg-primary/20 mx-auto border-4 border-white/10 ring-8 ring-white/5 animate-pulse">
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                        {activeEntity.avatar}
                    </div>
                </div>
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold">{activeEntity.name}</h2>
                    <p className="text-primary text-sm font-medium tracking-widest uppercase">
                        {status === "incoming" ? "Kirish qo'ng'irog'i..." : 
                         status === "calling" ? "Bog'lanmoqda..." : 
                         formatTime(timer)}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="w-full max-w-sm space-y-12">
                {status === "incoming" ? (
                    <div className="flex justify-around items-center">
                        <div className="text-center space-y-2">
                            <Button 
                                onClick={onEnd}
                                variant="destructive" size="icon" className="size-16 rounded-full shadow-2xl hover:scale-110 transition-transform"
                            >
                                <PhoneOffIcon className="size-8" />
                            </Button>
                            <p className="text-xs opacity-60">Rad etish</p>
                        </div>
                        <div className="text-center space-y-2">
                            <Button 
                                onClick={() => setStatus("active")}
                                className="size-16 rounded-full bg-green-500 hover:bg-green-600 shadow-2xl hover:scale-110 transition-transform"
                            >
                                <PhoneIcon className="size-8" />
                            </Button>
                            <p className="text-xs opacity-60">Javob berish</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-4 gap-4">
                            <CallControlButton 
                                icon={isMuted ? MicOffIcon : MicIcon} 
                                label={isMuted ? "Yoqish" : "Mute"} 
                                active={isMuted} 
                                onClick={() => setIsMuted(!isMuted)} 
                            />
                            <CallControlButton icon={Volume2Icon} label="Speaker" />
                            <CallControlButton icon={VideoIcon} label="Video" />
                            <CallControlButton icon={UsersIcon} label="Add" />
                        </div>
                        <div className="flex justify-center">
                            <Button 
                                onClick={onEnd}
                                variant="destructive" size="icon" className="size-16 rounded-full shadow-2xl hover:scale-110 transition-transform"
                            >
                                <PhoneOffIcon className="size-8" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const CallControlButton = ({ icon: Icon, label, active, onClick }) => (
    <div className="text-center space-y-2">
        <button 
            onClick={onClick}
            className={cn(
                "size-12 rounded-full flex items-center justify-center mx-auto transition-all",
                active ? "bg-white text-black" : "bg-white/10 hover:bg-white/20 text-white"
            )}
        >
            <Icon className="size-5" />
        </button>
        <p className="text-[10px] opacity-60">{label}</p>
    </div>
);

// We need UsersIcon from lucide-react here
import { UsersIcon } from "lucide-react";

export default ChatCallOverlay;
