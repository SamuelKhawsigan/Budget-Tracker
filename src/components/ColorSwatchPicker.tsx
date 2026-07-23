import { categoryPalette } from "../lib/theme";

interface ColorSwatchPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// Replaces the native <input type="color"> (OS color picker, blue by
// default) with a palette-constrained set — never a saturated/blue default.
export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className="color-swatch-picker" role="radiogroup" aria-label="Category color">
      {categoryPalette.map((color) => (
        <button
          key={color}
          type="button"
          className={"color-swatch" + (value === color ? " selected" : "")}
          style={{ backgroundColor: color }}
          aria-label={color}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
