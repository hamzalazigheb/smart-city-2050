import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  failed: boolean;
}

export class SceneErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('3D city failed to render', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-sm tracking-widest" style={{ color: '#00f0ff' }}>3D VIEW UNAVAILABLE</p>
        <p className="text-sm max-w-md" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Your browser or device could not start WebGL. You can still explore every district using the buttons and the sections below.
        </p>
      </div>
    );
  }
}
