import { getCategoryColor } from "../lib/theme";
import { getCategoryIcon } from "../lib/categoryIcons";
import { useTheme } from "../lib/ThemeContext";

interface CategoryIconProps {
  category: { id: number; color: string | null; icon: string | null };
  size?: number;
}

// Renders the category's chosen Lucide icon tinted with its color, or falls
// back to the plain color dot when no icon is set.
export function CategoryIcon({ category, size = 15 }: CategoryIconProps) {
  const { resolvedTheme } = useTheme();
  const color = getCategoryColor(resolvedTheme, category);
  const Icon = getCategoryIcon(category.icon);

  if (Icon) {
    return <Icon size={size} color={color} strokeWidth={2} className="category-icon-glyph" />;
  }

  const dotSize = Math.round(size * 0.6);
  return (
    <span
      className="category-swatch"
      style={{ backgroundColor: color, width: dotSize, height: dotSize }}
    />
  );
}
