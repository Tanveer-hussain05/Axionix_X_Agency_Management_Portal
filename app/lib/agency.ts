import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  Wallet,
} from "lucide-react";
import {
  defaultCommissionRules,
  revenueSeries as monthlyRevenueData,
} from "../data/mock-data";

export type PageKey =
  | "Dashboard"
  | "Projects"
  | "Contractors"
  | "Payouts"
  | "Financials"
  | "Commission Rules"
  | "Settings";

export type UserRole = "admin" | "user";
export type ModalKind = "project" | "contractor" | "override" | "payout" | null;

export const navItems: { label: PageKey; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Projects", icon: BriefcaseBusiness },
  { label: "Contractors", icon: Users },
  { label: "Payouts", icon: Wallet },
  { label: "Financials", icon: ChartNoAxesCombined },
  { label: "Commission Rules", icon: SlidersHorizontal },
];

export const money = (value: number) =>
  `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value)}`;

export const shortMoney = (value: number) =>
  `PKR ${
    value >= 1000000
      ? `${(value / 1000000).toFixed(2)}M`
      : `${(value / 1000).toFixed(0)}k`
  }`;

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const avatars = ["#dce9df", "#eee4d8", "#dce4ef", "#f0e0dd", "#e3e0ef"];
export const revenueSeries = monthlyRevenueData;
export const sessionStorageKey = "axionix-session";
export const projectStorageKey = "axionix-projects";
export const contractorStorageKey = "axionix-contractors";
const SMALL_PROJECT_THRESHOLD = 500000;

export const getBdRate = (
  projectValue: number,
  rules: typeof defaultCommissionRules,
) =>
  projectValue <= SMALL_PROJECT_THRESHOLD ? rules.bdSmall : rules.bd;

export const nameFromEmail = (email: string) =>
  email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "User";
