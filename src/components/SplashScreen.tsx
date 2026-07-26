import { motion } from "framer-motion";

interface SplashScreenProps {
  status: "loading" | "error";
  errorMessage?: string | null;
  onRetry: () => void;
  onQuit: () => void;
}

// Shown while the DB connects, migrates, and seeds. Kept deliberately plain —
// wordmark + a status indicator, no logo animation — and themed from
// applyCachedThemeEarly() (see main.tsx), so it never flashes the wrong
// theme's colors before ThemeProvider takes over.
export function SplashScreen({ status, errorMessage, onRetry, onQuit }: SplashScreenProps) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35 }}
    >
      <span className="splash-wordmark">Sweep</span>

      {status === "loading" ? (
        reducedMotion ? (
          <p className="splash-status-text">Loading…</p>
        ) : (
          <span className="splash-spinner" aria-label="Loading" role="status" />
        )
      ) : (
        <div className="splash-error">
          <p className="splash-status-text splash-error-text">{errorMessage ?? "Something went wrong."}</p>
          <div className="splash-error-actions">
            <button type="button" className="btn-primary" onClick={onRetry}>
              Retry
            </button>
            <button type="button" onClick={onQuit}>
              Quit
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
