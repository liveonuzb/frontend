import React from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { CameraIcon, XIcon, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const BarcodeScanner = ({ onScan, onClose, className }) => {
    const scannerId = React.useId().replace(/:/g, "");
    const html5QrCodeRef = React.useRef(null);
    const scanLockedRef = React.useRef(false);
    const [error, setError] = React.useState(null);
    const [starting, setStarting] = React.useState(true);

    React.useEffect(() => {
        const html5QrCode = new Html5Qrcode(scannerId, {
            formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODE_128,
            ],
        });
        html5QrCodeRef.current = html5QrCode;
        scanLockedRef.current = false;

        html5QrCode
            .start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 280, height: 150 },
                    aspectRatio: 1.5,
                },
                (decodedText) => {
                    if (scanLockedRef.current) return;
                    scanLockedRef.current = true;
                    html5QrCode
                        .stop()
                        .then(() => {
                            onScan(decodedText);
                        })
                        .catch(() => {});
                },
                () => {}
            )
            .then(() => setStarting(false))
            .catch(() => {
                setStarting(false);
                setError(
                    "Kamera ruxsati berilmadi. Iltimos, brauzer sozlamalarida kamera ruxsatini yoqing."
                );
            });

        return () => {
            html5QrCode
                .stop()
                .catch(() => {});
        };
    }, [onScan, scannerId]);

    return (
        <div className={cn("relative h-full min-h-[420px] bg-black text-white", className)}>
            {starting && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-center">
                        <LoaderIcon className="size-8 animate-spin text-white mx-auto mb-2" />
                        <p className="text-sm text-white/70">
                            Kamera yuklanmoqda...
                        </p>
                    </div>
                </div>
            )}
            {error ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center p-8 text-center bg-black">
                    <div>
                    <CameraIcon className="size-12 text-white/50 mx-auto mb-3" />
                    <p className="text-sm text-white/80 mb-4">{error}</p>
                    <Button variant="secondary" onClick={onClose}>
                        Yopish
                    </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div
                        id={scannerId}
                        className="absolute inset-0 overflow-hidden [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0,transparent_28%,rgba(0,0,0,0.54)_72%)]" />
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
                        <div className="relative w-full max-w-[340px] aspect-[1.55] rounded-3xl border border-white/55 shadow-[0_0_0_9999px_rgba(0,0,0,0.22)]">
                            <div className="absolute -left-1 -top-1 size-10 rounded-tl-3xl border-l-4 border-t-4 border-white" />
                            <div className="absolute -right-1 -top-1 size-10 rounded-tr-3xl border-r-4 border-t-4 border-white" />
                            <div className="absolute -bottom-1 -left-1 size-10 rounded-bl-3xl border-b-4 border-l-4 border-white" />
                            <div className="absolute -bottom-1 -right-1 size-10 rounded-br-3xl border-b-4 border-r-4 border-white" />
                            <div className="absolute left-6 right-6 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.75)]" />
                        </div>
                    </div>
                    <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)]">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">
                                Barcode
                            </p>
                            <p className="text-sm font-bold text-white">
                                Skanerlash davom etmoqda...
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="rounded-full bg-white/12 text-white hover:bg-white/20"
                            onClick={onClose}
                        >
                            <XIcon className="size-4" />
                        </Button>
                    </div>
                    <p className="absolute bottom-[max(env(safe-area-inset-bottom),1rem)] left-6 right-6 z-20 text-center text-xs font-semibold text-white/70">
                        Shtrix-kodni markerlangan joyga olib keling
                    </p>
                </>
            )}
        </div>
    );
};

export default BarcodeScanner;
