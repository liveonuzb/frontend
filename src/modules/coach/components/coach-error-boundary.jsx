import React from "react";
import CoachErrorState from "./coach-error-state";

class CoachErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CoachErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <CoachErrorState
          title="Sahifa yuklanmadi"
          description="Coach modulida kutilmagan xatolik yuz berdi. Qayta urinib ko'ring."
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}

export default CoachErrorBoundary;
