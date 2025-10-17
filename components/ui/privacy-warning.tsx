import { AlertTriangle, Info, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export interface PrivacyWarningProps {
  variant?: "default" | "info" | "warning"
  className?: string
  showDetails?: boolean
}

export function PrivacyWarning({
  variant = "warning",
  className,
  showDetails = false,
}: PrivacyWarningProps) {
  const icons = {
    default: Shield,
    info: Info,
    warning: AlertTriangle,
  }

  const Icon = icons[variant]

  return (
    <Alert variant={variant === "warning" ? "destructive" : "default"} className={cn(className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle>Beta - Centralized Proof Generation</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Proof generation is currently handled by our backend server. This means your private
          transaction data is temporarily processed server-side.
        </p>
        {showDetails && (
          <div className="mt-3 space-y-2 text-xs opacity-90">
            <p className="font-semibold">What this means:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Your transaction inputs are sent to the indexer for proof generation</li>
              <li>Expected proof generation time: 30-180 seconds</li>
              <li>The proof itself still guarantees transaction privacy on-chain</li>
            </ul>
            <p className="font-semibold mt-2">Coming soon:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Client-side proof generation for full privacy</li>
              <li>Faster proof generation with optimized circuits</li>
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

export interface ProofGenerationStatusProps {
  status: "idle" | "generating" | "success" | "error"
  progress?: number
  timeElapsed?: number
  estimatedTime?: number
  message?: string
  className?: string
}

export function ProofGenerationStatus({
  status,
  progress,
  timeElapsed,
  estimatedTime = 90000, // 90 seconds default
  message,
  className,
}: ProofGenerationStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case "generating":
        return "text-blue-500"
      case "success":
        return "text-green-500"
      case "error":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "generating":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        )
      case "success":
        return <Shield className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const progressPercent = progress ?? (timeElapsed ? Math.min((timeElapsed / estimatedTime) * 100, 99) : 0)

  return (
    <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className={cn("font-medium", getStatusColor())}>
          {status === "idle" && "Ready to generate proof"}
          {status === "generating" && "Generating ZK Proof..."}
          {status === "success" && "Proof Generated Successfully!"}
          {status === "error" && "Proof Generation Failed"}
        </span>
      </div>

      {status === "generating" && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              {timeElapsed !== undefined && `Elapsed: ${formatTime(timeElapsed)}`}
            </span>
            <span>{Math.round(progressPercent)}%</span>
            <span>Est: {formatTime(estimatedTime)}</span>
          </div>
        </div>
      )}

      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      )}

      {status === "generating" && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>⚡ Generating cryptographic proof on backend server...</p>
          <p className="mt-1">This ensures your transaction privacy on-chain.</p>
        </div>
      )}
    </div>
  )
}

