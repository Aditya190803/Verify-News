import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  verificationRateLimiter,
  searchRateLimiter,
  authRateLimiter,
} from "@/lib/rateLimiter";

interface RateLimitStatus {
  type: "verification" | "search" | "auth";
  remaining: number;
  resetIn: number | null;
  isLimited: boolean;
}

interface RateLimitStatusProps {
  showDetails?: boolean;
}

export const RateLimitStatus = ({ showDetails = false }: RateLimitStatusProps) => {
  const [statuses, setStatuses] = useState<RateLimitStatus[]>([]);

  useEffect(() => {
    // Update rate limit status every second
    const interval = setInterval(() => {
      const verificationStatus = verificationRateLimiter.getStatus();
      const searchStatus = searchRateLimiter.getStatus();
      const authStatus = authRateLimiter.getStatus();

      setStatuses([
        {
          type: "verification",
          ...verificationStatus,
        },
        {
          type: "search",
          ...searchStatus,
        },
        {
          type: "auth",
          ...authStatus,
        },
      ]);
    }, 1000);

    // Also update immediately
    const verificationStatus = verificationRateLimiter.getStatus();
    const searchStatus = searchRateLimiter.getStatus();
    const authStatus = authRateLimiter.getStatus();

    setStatuses([
      {
        type: "verification",
        ...verificationStatus,
      },
      {
        type: "search",
        ...searchStatus,
      },
      {
        type: "auth",
        ...authStatus,
      },
    ]);

    return () => clearInterval(interval);
  }, []);

  // Check if any rate limit is active
  const anyLimited = statuses.some((s) => s.isLimited);
  const limitedStatus = statuses.find((s) => s.isLimited);

  if (anyLimited && limitedStatus) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-semibold">Rate Limit Active</div>
          <div className="text-sm mt-1">
            {limitedStatus.type === "verification" && "Too many verification requests"}
            {limitedStatus.type === "search" && "Too many search requests"}
            {limitedStatus.type === "auth" && "Too many login attempts"}
            {limitedStatus.resetIn && (
              <div>
                Reset in: {Math.ceil(limitedStatus.resetIn / 1000)} second
                {limitedStatus.resetIn >= 2000 ? "s" : ""}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show status indicator if any limit is close to exceeded
  const closeLimits = statuses.filter((s) => s.remaining <= 3 && s.remaining > 0);

  return (
    <>
      {closeLimits.length > 0 && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold">API Requests Remaining</div>
            <div className="text-sm mt-1 space-y-1">
              {closeLimits.map((status) => (
                <div key={status.type}>
                  {status.type === "verification" && "Verifications: "}
                  {status.type === "search" && "Searches: "}
                  {status.type === "auth" && "Login attempts: "}
                  <span className="font-mono font-bold">{status.remaining}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed status view for settings/dashboard */}
      {showDetails && (
        <div className="space-y-3">
          {statuses.map((status) => (
            <div key={status.type} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold capitalize">{status.type}</span>
                {status.isLimited ? (
                  <span className="text-red-600 text-sm font-medium">Limited</span>
                ) : (
                  <span className="text-green-600 text-sm font-medium">Available</span>
                )}
              </div>
              <div className="text-sm space-y-1">
                <div>Remaining: {status.remaining}</div>
                {status.resetIn && (
                  <div>Reset in: {Math.ceil(status.resetIn / 1000)}s</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default RateLimitStatus;
