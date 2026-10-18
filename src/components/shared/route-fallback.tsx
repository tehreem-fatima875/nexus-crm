export function RouteFallback() {
  return <div className="route-fallback" role="status" aria-busy="true"><span className="loading-dot" /><span>Loading workspace...</span></div>;
}