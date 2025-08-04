import { SystemPageLayout } from "@/components/system-page-layout";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

// Error messages for NextAuth errors
const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
    Configuration: {
        title: "Server Configuration Error",
        message: "There is a problem with the server configuration. Please contact the administrator."
    },
    AccessDenied: {
        title: "Access Denied",
        message: "You do not have permission to access this resource."
    },
    Verification: {
        title: "Verification Error",
        message: "The verification link may have expired or already been used."
    },
    Default: {
        title: "Authentication Error",
        message: "An error occurred during authentication. Please try again."
    }
};

export default function AuthError() {
    const router = useRouter();
    const [error, setError] = useState<{ title: string; message: string }>(ERROR_MESSAGES.Default);

    useEffect(() => {
        const { error: errorType } = router.query;

        if (errorType && typeof errorType === 'string') {
            const normalizedError = errorType.charAt(0).toUpperCase() + errorType.slice(1);
            setError(ERROR_MESSAGES[normalizedError] || ERROR_MESSAGES.Default);
        }
    }, [router.query]);

    return (
        <SystemPageLayout
            title={error.title}
            icon={<AlertTriangle className="h-16 w-16" />}
            showHomeButton
        >
            <p className="text-muted-foreground text-lg mb-6">
                {error.message}
            </p>
            <p className="text-muted-foreground">
                Please try again or contact support if the problem persists.
            </p>
        </SystemPageLayout>
    );
} 