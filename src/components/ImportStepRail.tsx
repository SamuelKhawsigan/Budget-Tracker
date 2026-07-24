import { Check } from "lucide-react";

export type ImportStep = 1 | 2 | 3;

interface ImportStepRailProps {
  currentStep: ImportStep;
  furthestStep: ImportStep;
  onStepClick: (step: ImportStep) => void;
}

const STEPS: { step: ImportStep; label: string }[] = [
  { step: 1, label: "Source" },
  { step: 2, label: "Map columns" },
  { step: 3, label: "Review & commit" },
];

// Always visible across all three steps so the whole flow stays legible;
// completed steps are clickable so state (picked file, mapping, review rows)
// is never lost by going back — the page keeps all of it regardless of which
// step is currently displayed.
export function ImportStepRail({ currentStep, furthestStep, onStepClick }: ImportStepRailProps) {
  return (
    <div className="import-step-rail">
      {STEPS.map(({ step, label }, i) => {
        const completed = step < furthestStep;
        const current = step === currentStep;
        const reachable = step <= furthestStep;
        return (
          <div key={step} className="import-step-rail-item">
            <button
              type="button"
              className={"import-step" + (current ? " current" : "") + (completed ? " completed" : "")}
              onClick={() => reachable && onStepClick(step)}
              disabled={!reachable}
            >
              <span className="import-step-marker">{completed ? <Check size={14} /> : step}</span>
              <span className="import-step-label">{label}</span>
            </button>
            {i < STEPS.length - 1 && <div className="import-step-connector" />}
          </div>
        );
      })}
    </div>
  );
}
