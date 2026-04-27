import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center">
          <p className="text-gray-500 text-lg mb-2">Something went wrong loading this page.</p>
          <p className="text-xs text-red-400 font-mono">{this.state.error.message}</p>
          <button
            className="mt-4 px-4 py-2 bg-teal text-white rounded-xl text-sm"
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
