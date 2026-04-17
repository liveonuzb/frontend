import React from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { CameraIcon, XIcon, LoaderIcon } from "lucide-react";

const BarcodeScanner = ({ onScan, onClose }) => {
    const scannerRef = React.useRef(null);
    const html5QrCodeRef = React.useRef(null);
    const [error, setError] = React.useState(null);
    const [starting, setStarting] = React.useState(true);

    React.useEffect(() => {
        const scannerId = "barcode-scanner-container";
        const html5QrCode = new Html5Qrcode(scannerId);
        html5QrCodeRef.current = html5QrCode;

        html5QrCode
            .start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 280, height: 150 },
                    aspectRatio: 1.5,
                },
                (decodedText) => {
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
            .catch((err) => {
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
    }, [onScan]);

    return (
        <div className="relative">
            {starting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
                    <div className="text-center">
                        <LoaderIcon className="size-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Kamera yuklanmoqda...
                        </p>
                    </div>
                </div>
            )}
            {error ? (
                <div className="p-8 text-center">
                    <CameraIcon className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-destructive mb-4">{error}</p>
                    <Button variant="outline" onClick={onClose}>
                        Yopish
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div
                        id="barcode-scanner-container"
                        ref={scannerRef}
                        className="rounded-xl overflow-hidden"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                        Shtrix-kodni kamera oldiga qo'ying
                    </p>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={onClose}
                    >
                        <XIcon className="size-4 mr-1" />
                        Bekor qilish
                    </Button>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
