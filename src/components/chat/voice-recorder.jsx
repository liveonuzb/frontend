import * as React from "react";
import { times, forEach } from "lodash";
import { Button } from "@/components/ui/button";
import { XIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WAVEFORM_BAR_COUNT = 7;

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function VoiceRecorder({ onSend, onCancel }) {
    const [elapsed, setElapsed] = React.useState(0);
    const [isRecording, setIsRecording] = React.useState(false);
    const [error, setError] = React.useState(false);

    const mediaRecorderRef = React.useRef(null);
    const chunksRef = React.useRef([]);
    const timerRef = React.useRef(null);
    const streamRef = React.useRef(null);

    // Start recording on mount
    React.useEffect(() => {
        let cancelled = false;

        async function startRecording() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                if (cancelled) {
                    forEach(stream.getTracks(), (track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                chunksRef.current = [];

                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                        ? "audio/webm;codecs=opus"
                        : "audio/webm",
                });

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunksRef.current.push(e.data);
                    }
                };

                mediaRecorder.start(100);
                mediaRecorderRef.current = mediaRecorder;
                setIsRecording(true);

                timerRef.current = setInterval(() => {
                    setElapsed((prev) => prev + 1);
                }, 1000);
            } catch (err) {
                if (!cancelled) {
                    console.error("Microphone access error:", err);
                    setError(true);
                    toast.error("Mikrofonga ruxsat berilmadi", {
                        description: "Iltimos, brauzer sozlamalaridan mikrofon ruxsatini yoqing.",
                    });
                    onCancel?.();
                }
            }
        }

        startRecording();

        return () => {
            cancelled = true;
            clearInterval(timerRef.current);

            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }

            if (streamRef.current) {
                forEach(streamRef.current.getTracks(), (track) => track.stop());
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function stopAndCleanup() {
        clearInterval(timerRef.current);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            forEach(streamRef.current.getTracks(), (track) => track.stop());
        }

        setIsRecording(false);
    }

    function handleCancel() {
        stopAndCleanup();
        onCancel?.();
    }

    function handleSend() {
        if (!mediaRecorderRef.current) return;

        const recorder = mediaRecorderRef.current;

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
            onSend?.(blob, elapsed);
        };

        stopAndCleanup();
    }

    if (error) return null;

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2",
                "animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
            )}
        >
            {/* Recording indicator (pulsing red dot) */}
            <span className="relative flex size-3 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500" />
            </span>

            {/* Waveform bars */}
            <div className="flex items-center gap-[3px]">
                {times(WAVEFORM_BAR_COUNT, (i) => (
                    <span
                        key={i}
                        className="w-[3px] rounded-full bg-red-500/70"
                        style={{
                            animation: isRecording
                                ? `voice-bar 0.8s ease-in-out ${i * 0.1}s infinite alternate`
                                : "none",
                            height: isRecording ? undefined : "8px",
                        }}
                    />
                ))}
            </div>

            {/* Timer */}
            <span className="min-w-[3rem] text-center text-sm font-medium tabular-nums text-destructive">
                {formatTime(elapsed)}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Cancel */}
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleCancel}
                className="text-muted-foreground hover:text-destructive"
            >
                <XIcon className="size-4" />
            </Button>

            {/* Send */}
            <Button
                type="button"
                variant="default"
                size="icon-sm"
                onClick={handleSend}
                className="bg-primary"
            >
                <SendIcon className="size-4" />
            </Button>

            {/* Inline keyframes for waveform animation */}
            <style>{`
                @keyframes voice-bar {
                    0% {
                        height: 6px;
                    }
                    100% {
                        height: 20px;
                    }
                }
            `}</style>
        </div>
    );
}

export default VoiceRecorder;
