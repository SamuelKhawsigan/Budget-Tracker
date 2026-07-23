import {
  Baby,
  Banknote,
  Bike,
  Briefcase,
  Bus,
  Car,
  Coffee,
  Coins,
  CreditCard,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Lightbulb,
  Music,
  PawPrint,
  Pill,
  PiggyBank,
  Plane,
  Popcorn,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Train,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export interface CategoryIconDef {
  name: string;
  icon: LucideIcon;
  keywords: string[];
}

// A curated finance/life set (not the full Lucide catalog) — the picker stays
// small enough to browse, and the stored value is just the icon's name.
export const CATEGORY_ICONS: CategoryIconDef[] = [
  { name: "UtensilsCrossed", icon: UtensilsCrossed, keywords: ["food", "dining", "restaurant", "eat", "meal"] },
  { name: "Coffee", icon: Coffee, keywords: ["coffee", "cafe", "drink", "beverage"] },
  { name: "ShoppingCart", icon: ShoppingCart, keywords: ["groceries", "shopping", "cart", "supermarket"] },
  { name: "ShoppingBag", icon: ShoppingBag, keywords: ["shopping", "bag", "retail", "clothes"] },
  { name: "Car", icon: Car, keywords: ["car", "transport", "drive", "vehicle"] },
  { name: "Bus", icon: Bus, keywords: ["bus", "transport", "public transit"] },
  { name: "Train", icon: Train, keywords: ["train", "transport", "rail", "commute"] },
  { name: "Fuel", icon: Fuel, keywords: ["fuel", "gas", "petrol", "car"] },
  { name: "Bike", icon: Bike, keywords: ["bike", "bicycle", "cycling"] },
  { name: "Plane", icon: Plane, keywords: ["travel", "flight", "vacation", "trip"] },
  { name: "Home", icon: Home, keywords: ["home", "rent", "housing", "mortgage"] },
  { name: "Lightbulb", icon: Lightbulb, keywords: ["utilities", "electricity", "power", "bills"] },
  { name: "Wrench", icon: Wrench, keywords: ["maintenance", "repair", "tools"] },
  { name: "Zap", icon: Zap, keywords: ["electricity", "power", "energy", "bills"] },
  { name: "Wifi", icon: Wifi, keywords: ["internet", "wifi", "broadband"] },
  { name: "Smartphone", icon: Smartphone, keywords: ["phone", "mobile", "tech"] },
  { name: "HeartPulse", icon: HeartPulse, keywords: ["health", "medical", "fitness"] },
  { name: "Pill", icon: Pill, keywords: ["health", "medicine", "pharmacy"] },
  { name: "Dumbbell", icon: Dumbbell, keywords: ["fitness", "gym", "exercise", "health"] },
  { name: "Receipt", icon: Receipt, keywords: ["bills", "receipt", "invoice"] },
  { name: "Gift", icon: Gift, keywords: ["gift", "present", "celebration"] },
  { name: "Film", icon: Film, keywords: ["entertainment", "movie", "cinema"] },
  { name: "Music", icon: Music, keywords: ["entertainment", "music", "subscription"] },
  { name: "Gamepad2", icon: Gamepad2, keywords: ["entertainment", "games", "gaming"] },
  { name: "Popcorn", icon: Popcorn, keywords: ["entertainment", "movies", "snacks"] },
  { name: "PiggyBank", icon: PiggyBank, keywords: ["savings", "piggy bank"] },
  { name: "Wallet", icon: Wallet, keywords: ["wallet", "cash", "money"] },
  { name: "Banknote", icon: Banknote, keywords: ["cash", "money", "income"] },
  { name: "Coins", icon: Coins, keywords: ["income", "money", "coins"] },
  { name: "CreditCard", icon: CreditCard, keywords: ["credit card", "payment", "debt"] },
  { name: "Landmark", icon: Landmark, keywords: ["bank", "finance", "institution"] },
  { name: "TrendingUp", icon: TrendingUp, keywords: ["investment", "growth", "income"] },
  { name: "Briefcase", icon: Briefcase, keywords: ["work", "salary", "job", "income"] },
  { name: "GraduationCap", icon: GraduationCap, keywords: ["education", "school", "tuition"] },
  { name: "Baby", icon: Baby, keywords: ["childcare", "kids", "family"] },
  { name: "PawPrint", icon: PawPrint, keywords: ["pets", "animal", "vet"] },
  { name: "Shirt", icon: Shirt, keywords: ["clothing", "clothes", "apparel"] },
];

export function getCategoryIcon(name: string | null): LucideIcon | null {
  if (!name) return null;
  return CATEGORY_ICONS.find((i) => i.name === name)?.icon ?? null;
}
