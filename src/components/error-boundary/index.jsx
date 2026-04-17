import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, RotateCcwIcon, HomeIcon } from "lucide-react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md">
                        <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangleIcon className="size-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Xatolik yuz berdi</h2>
                        <p className="text-muted-foreground mb-6 text-sm">
                            Sahifada kutilmagan xatolik yuz berdi. Sahifani qayta yuklang yoki bosh sahifaga qayting.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
                                <RotateCcwIcon className="size-4 mr-1" /> Qayta urinish
                            </Button>
                            <Button onClick={() => window.location.href = "/user/dashboard"}>
                                <HomeIcon className="size-4 mr-1" /> Bosh sahifa
                            </Button>
                        </div>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="mt-6 p-3 rounded-lg bg-muted text-xs text-left overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
