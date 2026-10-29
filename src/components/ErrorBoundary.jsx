import { Component } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { redact } from '../api/errors.js';

/** Catches render errors so the user never sees a white screen. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="card card-pad mx-auto my-10 flex max-w-md flex-col items-center py-10 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-warn/10 text-warn-ink">
          <TriangleAlert className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold">This screen hit a snag</h2>
        <p className="mt-1.5 text-sm text-muted">
          Something in the data looked unexpected. Your session is fine — try again or reload.
        </p>
        <p className="mt-3 max-w-full truncate font-mono text-[11px] text-subtle">{redact(this.state.error?.message)}</p>
        <div className="mt-6 flex gap-2">
          <button type="button" className="btn-ghost" onClick={this.reset}>
            Try again
          </button>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reload
          </button>
        </div>
      </div>
    );
  }
}
