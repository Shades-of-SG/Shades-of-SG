import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

/**
 * A pure, stateless component for displaying generation job status.
 * Expects exactly one of the four ENUM states from the database.
 */
export default function GenerationStatusBadge({ status, errorMessage, className = '' }) {
  if (status === 'QUEUED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 ${className}`}
      >
        <Clock className="w-3.5 h-3.5" /> Ready
      </span>
    )
  }

  if (status === 'PROCESSING') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
      </span>
    )
  }

  if (status === 'COMPLETED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
      </span>
    )
  }

  if (status === 'FAILED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5" /> Failed: {errorMessage}
      </span>
    )
  }

  return null
}
