import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

// Animates a displayed number from its previous value to `value` whenever it
// changes (mount included) — used for the mono figures on the budgets page so
// they count up/down instead of snapping.
export function useCountUp(value: number, duration = 0.5): number {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const controls = animate(prevRef.current, value, {
      duration,
      onUpdate: (v) => setDisplay(v),
    });
    prevRef.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}
