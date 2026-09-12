import React from 'react';
import { Loader2, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading operational telemetry...',
}) => {
  return (
    <div className="state-container">
      <Loader2 className="state-icon" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-700)' }} />
      <h4 className="state-title">Fetching Data</h4>
      <p className="state-desc">{message}</p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  action?: React.ReactNode;
}> = ({
  title = 'No Records Found',
  description = 'There are currently no items matching your filter or search criteria.',
  action,
}) => {
  return (
    <div className="state-container">
      <Inbox className="state-icon" />
      <h4 className="state-title">{title}</h4>
      <p className="state-desc">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({
  title = 'Failed to Load',
  message = 'Could not establish connection to the service. Please try again.',
  onRetry,
}) => {
  return (
    <div className="state-container" style={{ borderColor: 'var(--danger-100)' }}>
      <AlertTriangle className="state-icon" style={{ color: 'var(--danger-600)' }} />
      <h4 className="state-title" style={{ color: 'var(--danger-700)' }}>{title}</h4>
      <p className="state-desc">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Retry Connection
        </button>
      )}
    </div>
  );
};
