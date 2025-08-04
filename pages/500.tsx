import { AlertTriangle } from "lucide-react";
import { SystemPageLayout } from "@/components/system-page-layout";

export default function Custom500() {
    return (
        <SystemPageLayout
            title="500 - Server Error"
            icon={<AlertTriangle className="h-16 w-16" />}
            showHomeButton
            showSupportButton
        >
            <p className="text-muted-foreground text-lg mb-6">
                An unexpected server error occurred.
            </p>
            <p className="text-muted-foreground">
                Our team has been notified and is working to resolve the issue.
                Please try again later or contact our support team if the problem persists.
            </p>
        </SystemPageLayout>
    );
} 