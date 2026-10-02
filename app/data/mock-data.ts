export type ProjectStatus = "Active" | "Delivered" | "Paid";
export type PayoutStatus = "Pending" | "Paid";

export type Project = {
  id: string;
  client: string;
  title: string;
  value: number;
  bdSource: string;
  profileOwner: string;
  execution: string[];
  executionOverride?: number;
  deadline: string;
  status: ProjectStatus;
};

export type Contractor = {
  id: string;
  name: string;
  role: string;
  skills: string[];
  status: "Active" | "Inactive";
  ownership: string[];
  contact: string;
};

export type Payout = {
  id: string;
  contractor: string;
  projectId: string;
  amount: number;
  commission: string;
  date: string;
  status: PayoutStatus;
};

export const projects: Project[] = [
  { id: "AX-2408", client: "Northstar Labs", title: "SaaS brand & web platform", value: 485000, bdSource: "Ayesha Khan", profileOwner: "Mariam Ali", execution: ["Usman Raza", "Zara Ahmed"], deadline: "2026-10-18", status: "Active" },
  { id: "AX-2407", client: "Atelier Form", title: "E-commerce redesign", value: 320000, bdSource: "Referral", profileOwner: "Mariam Ali", execution: ["Hamza Tariq"], deadline: "2026-10-06", status: "Active" },
  { id: "AX-2406", client: "Meridian Health", title: "Patient portal build", value: 760000, bdSource: "Bilal Shah", profileOwner: "Omar Farooq", execution: ["Usman Raza", "Hira Malik"], deadline: "2026-09-26", status: "Delivered" },
  { id: "AX-2405", client: "Fieldnote Co.", title: "Product launch campaign", value: 215000, bdSource: "Ayesha Khan", profileOwner: "Omar Farooq", execution: ["Zara Ahmed"], deadline: "2026-09-20", status: "Paid" },
  { id: "AX-2404", client: "Juniper & Stone", title: "Visual identity system", value: 180000, bdSource: "Inbound", profileOwner: "Mariam Ali", execution: ["Hamza Tariq", "Hira Malik"], deadline: "2026-09-12", status: "Paid" },
  { id: "AX-2403", client: "Orbit Finance", title: "Fintech mobile app", value: 540000, bdSource: "Bilal Shah", profileOwner: "Omar Farooq", execution: ["Usman Raza"], deadline: "2026-09-08", status: "Paid" },
];

export const contractors: Contractor[] = [
  { id: "CT-001", name: "Usman Raza", role: "Lead Developer", skills: ["React", "Node.js", "Next.js"], status: "Active", ownership: ["Northstar Labs", "Meridian Health"], contact: "usman@axionix.co" },
  { id: "CT-002", name: "Zara Ahmed", role: "Product Designer", skills: ["Figma", "UI/UX", "Webflow"], status: "Active", ownership: ["Fieldnote Co."], contact: "zara@axionix.co" },
  { id: "CT-003", name: "Hamza Tariq", role: "Brand Designer", skills: ["Branding", "Illustrator", "Figma"], status: "Active", ownership: ["Atelier Form", "Juniper & Stone"], contact: "hamza@axionix.co" },
  { id: "CT-004", name: "Hira Malik", role: "Frontend Developer", skills: ["React", "CSS", "TypeScript"], status: "Active", ownership: ["Meridian Health", "Juniper & Stone"], contact: "hira@axionix.co" },
  { id: "CT-005", name: "Mariam Ali", role: "Profile Owner", skills: ["Client relations", "Upwork"], status: "Active", ownership: ["Northstar Labs", "Atelier Form", "Juniper & Stone"], contact: "mariam@axionix.co" },
  { id: "CT-006", name: "Omar Farooq", role: "Profile Owner", skills: ["Client relations", "Fiverr"], status: "Inactive", ownership: ["Meridian Health", "Fieldnote Co.", "Orbit Finance"], contact: "omar@axionix.co" },
];

export const payouts: Payout[] = [
  { id: "PO-1082", contractor: "Usman Raza", projectId: "AX-2406", amount: 228000, commission: "Execution · 30%", date: "2026-09-28", status: "Pending" },
  { id: "PO-1081", contractor: "Hira Malik", projectId: "AX-2406", amount: 76000, commission: "Execution · 10%", date: "2026-09-28", status: "Pending" },
  { id: "PO-1080", contractor: "Zara Ahmed", projectId: "AX-2405", amount: 118250, commission: "Execution · 55%", date: "2026-09-20", status: "Paid" },
  { id: "PO-1079", contractor: "Hamza Tariq", projectId: "AX-2404", amount: 79200, commission: "Execution · 44%", date: "2026-09-14", status: "Paid" },
  { id: "PO-1078", contractor: "Usman Raza", projectId: "AX-2403", amount: 297000, commission: "Execution · 55%", date: "2026-09-10", status: "Paid" },
  { id: "PO-1077", contractor: "Mariam Ali", projectId: "AX-2405", amount: 10750, commission: "Profile owner · 5%", date: "2026-09-20", status: "Paid" },
  { id: "PO-1076", contractor: "Ayesha Khan", projectId: "AX-2405", amount: 10750, commission: "BD team · 5%", date: "2026-09-20", status: "Paid" },
];

export const revenueSeries = [
  { month: "Apr", revenue: 820, payouts: 476, retained: 344 },
  { month: "May", revenue: 960, payouts: 528, retained: 432 },
  { month: "Jun", revenue: 740, payouts: 407, retained: 333 },
  { month: "Jul", revenue: 1180, payouts: 649, retained: 531 },
  { month: "Aug", revenue: 1050, payouts: 578, retained: 472 },
  { month: "Sep", revenue: 1420, payouts: 781, retained: 639 },
];

export const defaultCommissionRules = { company: 30, bd: 5, bdSmall: 10, owner: 5 };

export const auditLogs = [
  { changedBy: "Ayesha Khan", what: "Execution split · AX-2398", previous: "55% / 45%", next: "50% / 50%", reason: "Equal contribution agreed with team", date: "2026-09-22" },
  { changedBy: "Ayesha Khan", what: "BD commission · AX-2371", previous: "5%", next: "10%", reason: "Project value under PKR 500k", date: "2026-09-18" },
];