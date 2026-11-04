import React from "react";
import { clearSiteData } from "../../helpers/siteData";

interface Props {
  children: React.ReactNode;
  /** Center the message on an empty screen (used around the whole app). */
  fullPage?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * Shows an error card instead of a blank white page when something crashes
 * while rendering. The error text is displayed so the user can send a
 * screenshot, and "Réinitialiser" clears the site's data in this browser.
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Erreur d'affichage :", error, info.componentStack);
  }

  handleReset = async () => {
    await clearSiteData();
    window.location.replace(`${process.env.PUBLIC_URL}/login`);
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={this.props.fullPage ? "d-flex align-items-center min-vh-100 p-3" : "page-content"}>
        <div className={`card border-0 shadow-sm mx-auto w-100${this.props.fullPage ? "" : " mt-4"}`} style={{ maxWidth: 560 }}>
          <div className="card-body p-4 text-center">
            <i className="ri-error-warning-line text-danger" style={{ fontSize: 48 }}></i>
            <h5 className="mt-2">Une erreur est survenue</h5>
            <p className="text-muted">
              Cette page n'a pas pu s'afficher. Cliquez sur « Recharger ». Si le problème revient,
              cliquez sur « Réinitialiser » : les données du site enregistrées dans ce navigateur
              seront effacées et vous devrez vous reconnecter.
            </p>
            <pre
              className="text-start small bg-light text-danger p-2 rounded mb-3"
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {error.message || String(error)}
            </pre>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                Recharger
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={this.handleReset}>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
