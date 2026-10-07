import './Loading.css';
 
// Usage: {loading ? <Loading /> : <YourContent />}
// Optional text: <Loading message="Loading your orders..." />
export function Loading({ message = 'Loading...' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true"></div>
      <span className="loading-text">{message}</span>
    </div>
  );
}
 
