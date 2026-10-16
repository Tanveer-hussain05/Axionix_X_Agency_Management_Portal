"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign,
  Clock3, Command, Download, FileText, Filter, LayoutDashboard, LifeBuoy,
  LogOut, Menu, MoreHorizontal, Plus, Search, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, Users, Wallet, X, TrendingUp, ChartNoAxesCombined, UserRound, Pencil, Mail, LockKeyhole,
  ArrowUpRightFromSquare, Building2, CreditCard, CircleHelp, RotateCcw,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import {
  auditLogs, contractors as initialContractors, defaultCommissionRules, payouts as initialPayouts,
  projects as initialProjects, revenueSeries as monthlyRevenueData, type Contractor, type Payout, type Project,
  type ProjectStatus,
} from "./data/mock-data";

type PageKey = "Dashboard" | "Projects" | "Contractors" | "Payouts" | "Financials" | "Commission Rules" | "Settings";
type ModalKind = "project" | "contractor" | "override" | "payout" | null;
const navItems: { label: PageKey; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard }, { label: "Projects", icon: BriefcaseBusiness },
  { label: "Contractors", icon: Users }, { label: "Payouts", icon: Wallet },
  { label: "Financials", icon: ChartNoAxesCombined }, { label: "Commission Rules", icon: SlidersHorizontal },
];
const money = (value: number) => `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(value)}`;
const shortMoney = (value: number) => `PKR ${value >= 1000000 ? `${(value / 1000000).toFixed(2)}M` : `${(value / 1000).toFixed(0)}k`}`;
const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
const avatars = ["#dce9df", "#eee4d8", "#dce4ef", "#f0e0dd", "#e3e0ef"];
const revenueSeries = monthlyRevenueData;
const sessionStorageKey = "axionix-session";
const projectStorageKey = "axionix-projects";
const contractorStorageKey = "axionix-contractors";
const SMALL_PROJECT_THRESHOLD = 500000;
type UserRole = "admin" | "user";
const getBdRate = (projectValue: number, rules: typeof defaultCommissionRules) => projectValue <= SMALL_PROJECT_THRESHOLD ? rules.bdSmall : rules.bd;
const nameFromEmail = (email: string) => email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "User";

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Paid" || status === "Active" ? "positive" : status === "Delivered" ? "blue" : "pending";
  return <span className={`badge badge-${tone}`}><span className="badge-dot" />{status}</span>;
}

function Panel({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`panel ${className}`}>{children}</section>;
}

function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function Modal({ title, description, onClose, children, wide = false }: { title: string; description?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal-header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></header>
      {children}
    </section>
  </div>;
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><FileText size={20} /></span><strong>{title}</strong><p>{body}</p>{action}</div>;
}

export default function Home() {
  const [activePage, setActivePage] = useState<PageKey>("Dashboard");
  const [projects, setProjects] = useState(initialProjects);
  const [contractors, setContractors] = useState(initialContractors);
  const [payouts, setPayouts] = useState(initialPayouts);
  const [, setAuditHistory] = useState(auditLogs);
  const [rules, setRules] = useState(defaultCommissionRules);
  const [savedRules, setSavedRules] = useState(defaultCommissionRules);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [contractorFilter, setContractorFilter] = useState("All contractors");
  const [dateFilter, setDateFilter] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [modal, setModal] = useState<ModalKind>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [toast, setToast] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>("admin");
  const [ruleEditing, setRuleEditing] = useState(false);
  const [financialPeriod, setFinancialPeriod] = useState("Monthly");
  const [dateRange, setDateRange] = useState("Last 6 months");
  const [appearance, setAppearance] = useState("Light");
  const [notifications, setNotifications] = useState(true);
  const [profile, setProfile] = useState({ name: "Ayesha Khan", email: "ayesha@axionix.co" });
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideValue, setOverrideValue] = useState("50");
  const [overrideProject, setOverrideProject] = useState<Project | null>(null);

  useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 450); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProjects = window.localStorage.getItem(projectStorageKey);
      if (storedProjects) {
        try {
          const parsedProjects: unknown = JSON.parse(storedProjects);
          if (Array.isArray(parsedProjects)) setProjects(parsedProjects as Project[]);
          else window.localStorage.removeItem(projectStorageKey);
        } catch {
          window.localStorage.removeItem(projectStorageKey);
        }
      }
      const storedContractors = window.localStorage.getItem(contractorStorageKey);
      if (storedContractors) {
        try {
          const parsedContractors: unknown = JSON.parse(storedContractors);
          if (Array.isArray(parsedContractors)) setContractors(parsedContractors as Contractor[]);
          else window.localStorage.removeItem(contractorStorageKey);
        } catch {
          window.localStorage.removeItem(contractorStorageKey);
        }
      }
      const storedSession = window.localStorage.getItem(sessionStorageKey);
      if (storedSession) {
        try {
          const session: unknown = JSON.parse(storedSession);
          if (typeof session === "object" && session !== null && "email" in session && typeof session.email === "string" && session.email.includes("@")) {
            const email = session.email;
            const name = "name" in session && typeof session.name === "string" ? session.name : nameFromEmail(email);
            const sessionRole = "role" in session && session.role === "user" ? "user" : "admin";
            setProfile({ name, email });
            setRole(sessionRole);
            setAuthenticated(true);
          } else {
            window.localStorage.removeItem(sessionStorageKey);
          }
        } catch {
          window.localStorage.removeItem(sessionStorageKey);
        }
      }
      setAuthReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (authReady) window.localStorage.setItem(projectStorageKey, JSON.stringify(projects));
  }, [projects, authReady]);
  useEffect(() => {
    if (authReady) window.localStorage.setItem(contractorStorageKey, JSON.stringify(contractors));
  }, [contractors, authReady]);

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const search = query.toLowerCase();
    return (!search || `${project.client} ${project.title} ${project.id} ${project.profileOwner}`.toLowerCase().includes(search)) &&
      (statusFilter === "All statuses" || project.status === statusFilter) && (!dateFilter || project.deadline >= dateFilter);
  }), [projects, query, statusFilter, dateFilter]);
  const filteredContractors = useMemo(() => contractors.filter((contractor) => (!query || `${contractor.name} ${contractor.role} ${contractor.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase())) && (statusFilter === "All statuses" || contractor.status === statusFilter)), [contractors, query, statusFilter]);
  const filteredPayouts = useMemo(() => payouts.filter((payout) => {
    const client = projects.find((project) => project.id === payout.projectId)?.client ?? "";
    return (!query || `${payout.contractor} ${payout.id} ${client}`.toLowerCase().includes(query.toLowerCase())) &&
      (statusFilter === "All statuses" || payout.status === statusFilter) &&
      (contractorFilter === "All contractors" || payout.contractor === contractorFilter) && (!dateFilter || payout.date >= dateFilter);
  }), [payouts, query, statusFilter, contractorFilter, dateFilter, projects]);

  const notify = (message: string) => setToast(message);
  const clearFilters = () => { setQuery(""); setStatusFilter("All statuses"); setContractorFilter("All contractors"); setDateFilter(""); };
  const openProjectForm = (project: Project | null = null) => { setEditingProject(project); setModal("project"); };
  const openContractorForm = (contractor: Contractor | null = null) => { setEditingContractor(contractor); setModal("contractor"); };
  const saveProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Project = {
      id: editingProject?.id ?? `AX-${2409 + projects.length - initialProjects.length}`,
      client: String(form.get("client")), title: String(form.get("title")), value: Number(form.get("value")),
      bdSource: String(form.get("bdSource")), profileOwner: String(form.get("profileOwner")),
      execution: form.getAll("execution").map(String),
      executionOverride: editingProject?.executionOverride,
      deadline: String(form.get("deadline")), status: String(form.get("status")) as ProjectStatus,
    };
    setProjects((current) => editingProject ? current.map((project) => project.id === editingProject.id ? next : project) : [next, ...current]);
    setModal(null); notify(editingProject ? "Project updated" : "Project added");
  };
  const saveContractor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next: Contractor = {
      id: editingContractor?.id ?? `CT-${String(contractors.length + 1).padStart(3, "0")}`,
      name: String(form.get("name")), role: String(form.get("role")),
      skills: String(form.get("skills")).split(",").map((skill) => skill.trim()).filter(Boolean),
      status: String(form.get("status")) as Contractor["status"],
      ownership: String(form.get("ownership")).split(",").map((client) => client.trim()).filter(Boolean), contact: String(form.get("contact")),
    };
    setContractors((current) => editingContractor ? current.map((contractor) => contractor.id === editingContractor.id ? next : contractor) : [next, ...current]);
    setModal(null); notify(editingContractor ? "Contractor updated" : "Contractor added");
  };
  const updateProjectStatus = (project: Project, status: ProjectStatus) => {
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, status } : item));
    setSelectedProject({ ...project, status }); notify(`Project marked ${status.toLowerCase()}`);
  };
  const toggleContractor = (contractor: Contractor) => {
    if (contractor.status === "Active" && !window.confirm(`Deactivate ${contractor.name}? Historical payouts will be retained.`)) return;
    const status = contractor.status === "Active" ? "Inactive" : "Active";
    setContractors((current) => current.map((item) => item.id === contractor.id ? { ...item, status } : item));
    setSelectedContractor({ ...contractor, status }); notify(`${contractor.name} ${status.toLowerCase()}`);
  };
  const markPayoutPaid = (payout: Payout) => {
    setPayouts((current) => current.map((item) => item.id === payout.id ? { ...item, status: "Paid" } : item));
    setSelectedPayout({ ...payout, status: "Paid" }); notify("Payout marked paid");
  };
  const saveOverride = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!overrideReason.trim()) return;
    if (!overrideProject) return;
    const executionRate = Number(overrideValue);
    const updatedProject = { ...overrideProject, executionOverride: executionRate };
    setProjects((current) => current.map((project) => project.id === updatedProject.id ? updatedProject : project));
    setSelectedProject(updatedProject);
    const auditEntry = { changedBy: profile.name, what: `Execution split · ${overrideProject.id}`, previous: `${overrideProject.executionOverride ?? 100 - rules.company - rules.bd - rules.owner}%`, next: `${executionRate}%`, reason: overrideReason.trim(), date: "2026-09-30" };
    auditLogs.unshift(auditEntry);
    setAuditHistory([...auditLogs]);
    notify("Override recorded in audit history"); setModal(null); setOverrideReason("");
  };

  const title = activePage === "Dashboard" ? `Good morning, ${profile.name.split(" ")[0]}` : activePage;
  const subtitle = activePage === "Dashboard" ? "Here’s what’s happening across your agency today." : ({ Projects: "Track client work, delivery progress, and project economics.", Contractors: "Manage your team, relationships, and contractor profiles.", Payouts: "Review and manage contractor commission payouts.", Financials: "A clear view of revenue, costs, and retained earnings.", "Commission Rules": "Configure how project revenue is shared across your team.", Settings: "Manage your personal preferences and workspace experience." } as Record<string, string>)[activePage];

  const handleLogin = (event: FormEvent<HTMLFormElement>, selectedRole: UserRole): string | null => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    let contractor = selectedRole === "user" ? contractors.find((person) => person.contact.toLowerCase() === email) : undefined;
    if (selectedRole === "user" && !contractor) {
      const nextContractorNumber = contractors.reduce((highest, person) => Math.max(highest, Number(person.id.match(/^CT-(\d+)$/)?.[1] ?? 0)), 0) + 1;
      contractor = {
        id: `CT-${String(nextContractorNumber).padStart(3, "0")}`,
        name: String(form.get("name") ?? "").trim() || nameFromEmail(email),
        role: "Contractor",
        skills: [],
        status: "Active",
        ownership: [],
        contact: email,
      };
      setContractors((current) => current.some((person) => person.contact.toLowerCase() === email) ? current : [contractor!, ...current]);
    }
    const name = contractor?.name ?? nameFromEmail(email);
    window.localStorage.setItem(sessionStorageKey, JSON.stringify({ name, email, role: selectedRole }));
    setProfile({ name, email });
    setRole(selectedRole);
    setAuthenticated(true);
    return null;
  };

  const handleLogout = () => {
    window.localStorage.removeItem(sessionStorageKey);
    setAuthenticated(false);
    setMobileNav(false);
  };

  if (!authReady) return <div className="auth-loading" aria-label="Checking session" />;
  if (!authenticated) return <LoginPage onLogin={handleLogin} />;
  if (role === "user") return <UserPortal profile={profile} projects={projects.filter((project) => project.execution.includes(profile.name))} onLogout={handleLogout} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><span>A</span><span>X</span></div><div className="brand-name">axionix<span>agency operations</span></div><button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <div className="workspace-switch"><div className="workspace-avatar">AX</div><div><strong>Axionix Studio</strong><span>Agency workspace</span></div><ChevronDown size={15} /></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">
        {navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activePage === label ? "nav-active" : ""}`} onClick={() => { setActivePage(label); setMobileNav(false); clearFilters(); }}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{label === "Payouts" && <span className="nav-count">2</span>}</button>)}
      </nav>
      <div className="nav-caption nav-caption-bottom">PREFERENCES</div>
      <button className={`nav-item ${activePage === "Settings" ? "nav-active" : ""}`} onClick={() => { setActivePage("Settings"); setMobileNav(false); }}><Settings size={17} strokeWidth={1.8} /><span>Settings</span></button>
      <div className="sidebar-spacer" />
      <div className="help-card"><div className="help-icon"><LifeBuoy size={16} /></div><div><strong>Need a hand?</strong><span>Visit our help center</span></div><ArrowUpRightFromSquare size={14} /></div>
      <div className="profile-row"><div className="avatar avatar-admin">{initials(profile.name)}</div><div className="profile-copy"><strong>{profile.name}</strong><span>Administrator</span></div><button className="icon-button profile-more" aria-label="Log out" title="Log out" onClick={handleLogout}><LogOut size={16} /></button></div>
    </aside>
    {mobileNav && <button className="mobile-scrim" aria-label="Close navigation overlay" onClick={() => setMobileNav(false)} />}

    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{activePage}</strong></div></div>
        <div className="topbar-actions"><label className="global-search"><Search size={16} /><input aria-label="Search the current section" placeholder="Search anything..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd><Command size={11} /> K</kbd></label><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify("You’re all caught up") }><Bell size={18} /><i /></button><span className="topbar-divider" /><button className="topbar-user" onClick={() => setActivePage("Settings")}><span className="avatar avatar-admin">{initials(profile.name)}</span><ChevronDown size={14} /></button></div>
      </header>
      <div className="content-area">
        <div className="page-intro"><div><div className="date-kicker"><CalendarDays size={13} /> WEDNESDAY, SEPTEMBER 30, 2026</div><h1>{title}</h1><p>{subtitle}</p></div>{activePage === "Projects" && <button className="button button-primary" onClick={() => openProjectForm()}><Plus size={16} /> Add project</button>}{activePage === "Contractors" && <button className="button button-primary" onClick={() => openContractorForm()}><Plus size={16} /> Add contractor</button>}{activePage === "Financials" && <button className="button button-secondary" onClick={() => notify("Financial report exported") }><Download size={15} /> Export report</button>}</div>
        {loading ? <LoadingView /> : <>
          {activePage === "Dashboard" && <Dashboard projects={projects} payouts={payouts} rules={rules} onProject={(project) => setSelectedProject(project)} onPayout={(payout) => { setSelectedPayout(payout); setModal("payout"); }} onNavigate={setActivePage} />}
          {activePage === "Projects" && <ProjectsView projects={filteredProjects} query={query} setQuery={setQuery} mode={viewMode} setMode={setViewMode} status={statusFilter} setStatus={setStatusFilter} date={dateFilter} setDate={setDateFilter} clear={clearFilters} onSelect={setSelectedProject} />}
          {activePage === "Contractors" && <ContractorsView contractors={filteredContractors} allContractors={contractors} payouts={payouts} projects={projects} query={query} setQuery={setQuery} status={statusFilter} setStatus={setStatusFilter} onSelect={setSelectedContractor} onEdit={openContractorForm} onToggle={toggleContractor} clear={clearFilters} />}
          {activePage === "Payouts" && <PayoutsView payouts={filteredPayouts} projects={projects} contractors={contractors} query={query} setQuery={setQuery} status={statusFilter} setStatus={setStatusFilter} contractor={contractorFilter} setContractor={setContractorFilter} date={dateFilter} setDate={setDateFilter} clear={clearFilters} onSelect={(payout) => { setSelectedPayout(payout); setModal("payout"); }} />}
          {activePage === "Financials" && <FinancialsView period={financialPeriod} setPeriod={setFinancialPeriod} range={dateRange} setRange={setDateRange} projects={projects} payouts={payouts} />}
          {activePage === "Commission Rules" && <RulesView rules={rules} setRules={setRules} saved={savedRules} setSaved={setSavedRules} editing={ruleEditing} setEditing={setRuleEditing} notify={notify} />}
          {activePage === "Settings" && <SettingsView profile={profile} setProfile={setProfile} appearance={appearance} setAppearance={setAppearance} notifications={notifications} setNotifications={setNotifications} notify={notify} />}
        </>}
        <footer className="page-footer"><span>© 2026 Axionix Studio</span><span><span className="system-dot" /> All systems operational</span><button onClick={() => notify("Help center opened in a new workspace panel")}>Help center <ArrowUpRightFromSquare size={12} /></button></footer>
      </div>
    </main>

    {selectedProject && <ProjectDetail project={selectedProject} contractors={contractors} rules={rules} onClose={() => setSelectedProject(null)} onEdit={() => { setSelectedProject(null); openProjectForm(selectedProject); }} onStatus={updateProjectStatus} onOverride={() => { setOverrideProject(selectedProject); setOverrideValue(String(selectedProject.executionOverride ?? 100 - rules.company - rules.bd - rules.owner)); setSelectedProject(null); setModal("override"); }} />}
    {selectedContractor && <ContractorDetail contractor={selectedContractor} payouts={payouts} projects={projects} onClose={() => setSelectedContractor(null)} onEdit={() => { setSelectedContractor(null); openContractorForm(selectedContractor); }} onToggle={toggleContractor} onPayout={(payout) => { setSelectedContractor(null); setSelectedPayout(payout); setModal("payout"); }} />}
    {modal === "project" && <Modal title={editingProject ? "Edit project" : "Add project"} description="Project details and commission preview" onClose={() => setModal(null)} wide><ProjectForm project={editingProject} contractors={contractors} rules={rules} onSubmit={saveProject} onCancel={() => setModal(null)} /></Modal>}
    {modal === "contractor" && <Modal title={editingContractor ? "Edit contractor" : "Add contractor"} description="Contractor profile and client ownership" onClose={() => setModal(null)}><ContractorForm contractor={editingContractor} onSubmit={saveContractor} onCancel={() => setModal(null)} /></Modal>}
    {modal === "payout" && selectedPayout && <Modal title="Payout details" description={`Payout ${selectedPayout.id}`} onClose={() => setModal(null)}><PayoutDetail payout={selectedPayout} project={projects.find((project) => project.id === selectedPayout.projectId)} onMarkPaid={markPayoutPaid} onClose={() => setModal(null)} /></Modal>}
    {modal === "override" && overrideProject && <Modal title="Manual commission override" description={`Record an adjustment for ${overrideProject.id}`} onClose={() => setModal(null)}><form className="form-body" onSubmit={saveOverride}><div className="override-values"><div><span>Original execution split</span><strong>{money(Math.round(overrideProject.value * (overrideProject.executionOverride ?? 100 - rules.company - rules.bd - rules.owner) / 100))}</strong><small>{overrideProject.executionOverride ?? 100 - rules.company - rules.bd - rules.owner}% of project value</small></div><ChevronRight size={17} /><div><span>New execution split</span><strong>{money(Math.round(overrideProject.value * Number(overrideValue) / 100))}</strong><small><input className="inline-number" min="0" max="100" type="number" value={overrideValue} onChange={(event) => setOverrideValue(event.target.value)} aria-label="New execution commission percent" />% of project value</small></div></div><label className="field-label">Reason for change <span className="required">*</span><textarea required rows={3} value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Explain why this calculation is changing" /></label><div className="audit-meta"><span>Changed by <strong>{profile.name}</strong></span><span>Today · Sep 30, 2026</span></div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Cancel</button><button className="button button-primary"><Check size={15} /> Record override</button></div></form></Modal>}
    {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}<button aria-label="Dismiss notification" onClick={() => setToast("")}><X size={15} /></button></div>}
  </div>;
}

function LoginPage({ onLogin }: { onLogin: (event: FormEvent<HTMLFormElement>, role: UserRole) => string | null }) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [error, setError] = useState("");

  return <main className="auth-page">
    <section className="auth-brand-panel">
      <div className="auth-brand"><div className="brand-mark"><span>A</span><span>X</span></div><div className="brand-name">axionix<span>agency operations</span></div></div>
      <div className="auth-brand-copy"><span className="auth-kicker">AGENCY OPERATIONS</span><h1>Make good work run smoothly.</h1><p>One clear view of your projects, people, and financials, built for the way your agency works.</p></div>
      <div className="auth-summary"><div><strong>24</strong><span>active engagements</span></div><div><strong>PKR 4.28M</strong><span>revenue tracked</span></div><div><strong>98.4%</strong><span>on-time delivery</span></div></div>
      <div className="auth-brand-footer"><ShieldCheck size={15} /><span>Axionix Studio workspace</span><span className="auth-status-dot" /> All systems operational</div>
    </section>
    <section className="auth-form-panel">
      <form className="auth-form" onSubmit={(event) => setError(onLogin(event, selectedRole) ?? "")}>
        <span className="auth-form-kicker">YOUR WORKSPACE</span>
        <h2>Welcome back</h2>
        <p className="auth-form-description">Sign in to continue to your agency dashboard.</p>
        <div className="auth-role-switch" aria-label="Choose account type">
          <button type="button" className={selectedRole === "admin" ? "active" : ""} aria-pressed={selectedRole === "admin"} onClick={() => { setSelectedRole("admin"); setError(""); }}><ShieldCheck size={14} /> Admin</button>
          <button type="button" className={selectedRole === "user" ? "active" : ""} aria-pressed={selectedRole === "user"} onClick={() => { setSelectedRole("user"); setError(""); }}><BriefcaseBusiness size={14} /> Project user</button>
        </div>
        {selectedRole === "user" && <label className="auth-field"><span>Full name</span><span className="auth-input-wrap"><UserRound size={16} /><input name="name" autoComplete="name" placeholder="Your name" required /></span></label>}
        <label className="auth-field"><span>Email address</span><span className="auth-input-wrap"><Mail size={16} /><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></span></label>
        <label className="auth-field"><span>Password</span><span className="auth-input-wrap"><LockKeyhole size={16} /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></span></label>
        <button className="auth-submit" type="submit">Sign in <ArrowRight size={16} /></button>
        {error ? <p className="auth-error" role="alert">{error}</p> : <p className="auth-demo-note">{selectedRole === "admin" ? "Admin demo: any valid email and password." : "Project users are added to the admin Contractors list when they sign in."}</p>}
      </form>
      <footer className="auth-form-footer"><span>© 2026 Axionix Studio</span><span>Private workspace</span></footer>
    </section>
  </main>;
}

function UserPortal({ profile, projects, onLogout }: { profile: { name: string; email: string }; projects: Project[]; onLogout: () => void }) {
  const activeCount = projects.filter((project) => project.status === "Active").length;
  return <main className="user-portal">
    <header className="user-portal-header"><div className="brand"><div className="brand-mark"><span>A</span><span>X</span></div><div className="brand-name">axionix<span>project workspace</span></div></div><div className="user-portal-account"><span className="avatar avatar-admin">{initials(profile.name)}</span><span><strong>{profile.name}</strong><small>Project user</small></span><button className="button button-secondary button-small" onClick={onLogout}><LogOut size={14} /> Sign out</button></div></header>
    <div className="content-area user-portal-content"><div className="page-intro"><div><div className="date-kicker"><BriefcaseBusiness size={13} /> YOUR WORKSPACE</div><h1>My projects</h1><p>Projects assigned to you and their latest status.</p></div></div>
      <div className="mini-stat-grid user-project-stats"><MiniStat label="Assigned projects" value={String(projects.length).padStart(2, "0")} icon={<BriefcaseBusiness size={16} />} /><MiniStat label="Active projects" value={String(activeCount).padStart(2, "0")} icon={<Activity size={16} />} /><MiniStat label="Completed projects" value={String(projects.length - activeCount).padStart(2, "0")} icon={<CheckCircle2 size={16} />} /></div>
      <Panel className="user-project-panel"><div className="section-heading"><div><h2>Assigned to me</h2><p>{projects.length} projects</p></div></div>{projects.length ? <div className="user-project-list">{projects.map((project) => <article className="user-project-row" key={project.id}><span className={`client-logo logo-${project.id.slice(-1)}`}>{initials(project.client)}</span><div className="user-project-main"><strong>{project.title}</strong><span>{project.client} · {project.id}</span></div><div className="user-project-assignees"><small>ASSIGNED TEAM</small><span>{project.execution.join(", ")}</span></div><div className="user-project-deadline"><small>DEADLINE</small><span>{new Date(`${project.deadline}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div><StatusBadge status={project.status} /></article>)}</div> : <EmptyState title="No projects assigned yet" body="Your administrator's new project assignments will appear here." />}</Panel>
      <footer className="page-footer"><span>© 2026 Axionix Studio</span><span><span className="system-dot" /> Workspace up to date</span></footer>
    </div>
  </main>;
}

function LoadingView() {
  return <div className="loading-view" aria-label="Loading dashboard"><div className="skeleton-row">{[1, 2, 3, 4].map((item) => <div className="skeleton-card" key={item}><i /><i /><i /></div>)}</div><div className="skeleton-wide"><i /><i /><i /></div><div className="skeleton-row"><div className="skeleton-card" /><div className="skeleton-card" /></div></div>;
}

function Dashboard({ projects, payouts, rules, onProject, onPayout, onNavigate }: { projects: Project[]; payouts: Payout[]; rules: typeof defaultCommissionRules; onProject: (project: Project) => void; onPayout: (payout: Payout) => void; onNavigate: (page: PageKey) => void }) {
  const activeCount = projects.filter((project) => project.status === "Active").length;
  const pending = payouts.filter((payout) => payout.status === "Pending");
  const distributions = [{ name: "Execution", value: 100 - rules.company - rules.bd - rules.owner, color: "#537c61" }, { name: "Company", value: rules.company, color: "#bdcfc1" }, { name: "BD team", value: rules.bd, color: "#e5c8a6" }, { name: "Profile owner", value: rules.owner, color: "#d7dce2" }];
  return <div className="dashboard-grid">
    <div className="stat-grid">
      <StatCard label="Total revenue" value={shortMoney(4285000)} delta="12.8%" icon={<TrendingUp size={17} />} tint="mint" trend="up" foot="vs. previous month" />
      <StatCard label="Total payouts" value={shortMoney(2367000)} delta="8.2%" icon={<Wallet size={17} />} tint="sand" trend="up" foot="vs. previous month" />
      <StatCard label="Retained earnings" value={shortMoney(1918000)} delta="16.4%" icon={<CircleDollarSign size={17} />} tint="blue" trend="up" foot="vs. previous month" />
      <StatCard label="Active projects" value={String(activeCount).padStart(2, "0")} delta="2 new" icon={<BriefcaseBusiness size={17} />} tint="lilac" trend="neutral" foot="this month" />
    </div>
    <div className="chart-row">
      <Panel className="revenue-panel"><div className="panel-top"><div><div className="panel-eyebrow">PERFORMANCE</div><h2>Revenue vs payouts</h2><p>Financial performance over time</p></div><select className="compact-select" aria-label="Revenue chart period"><option>Last 6 months</option><option>Last 12 months</option><option>This year</option></select></div><div className="chart-legend"><span><i className="legend-revenue" />Revenue</span><span><i className="legend-payout" />Payouts</span><div className="chart-total"><strong>PKR 4.28M</strong><small>Gross revenue</small></div></div><div className="chart-wrap chart-main"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueSeries} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}><defs><linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60866a" stopOpacity={0.16} /><stop offset="95%" stopColor="#60866a" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0ec" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#929b94", fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#929b94", fontSize: 10 }} tickFormatter={(value) => `${value}k`} /><Tooltip formatter={(value) => [`PKR ${Number(value).toLocaleString()}k`, ""]} contentStyle={{ borderRadius: 8, border: "1px solid #e6e9e5", fontSize: 12 }} /><Area type="monotone" dataKey="revenue" stroke="#547a5d" strokeWidth={2.4} fill="url(#revFill)" /><Area type="monotone" dataKey="payouts" stroke="#c89a65" strokeWidth={2} fill="none" /></AreaChart></ResponsiveContainer></div></Panel>
      <Panel className="retained-panel"><div className="panel-top"><div><div className="panel-eyebrow">REVENUE MIX</div><h2>Where it goes</h2><p>Current commission split</p></div><button className="icon-button" aria-label="Open commission rules" onClick={() => onNavigate("Commission Rules")}><MoreHorizontal size={18} /></button></div><div className="donut-area"><div className="donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distributions} dataKey="value" innerRadius={57} outerRadius={76} paddingAngle={2} stroke="none">{distributions.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => [`${value}%`, "Share"]} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>100%</strong><span>of revenue</span></div></div></div><div className="distribution-list">{distributions.map((item) => <div key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div><button className="text-link distribution-link" onClick={() => onNavigate("Commission Rules")}>View commission rules <ChevronRight size={14} /></button></Panel>
    </div>
    <MonthlyRevenueChart />
    <div className="lower-grid"><Panel className="table-panel"><SectionHeading title="Recent projects" subtitle="Your latest client engagements" action={<button className="text-link" onClick={() => onNavigate("Projects")}>View all <ChevronRight size={14} /></button>} /><ProjectTable projects={projects.slice(0, 4)} compact onSelect={onProject} /></Panel><Panel className="table-panel payouts-panel"><SectionHeading title="Recent payouts" subtitle="Latest contractor settlements" action={<button className="text-link" onClick={() => onNavigate("Payouts")}>View all <ChevronRight size={14} /></button>} /><PayoutTable payouts={payouts.slice(0, 4)} onSelect={onPayout} compact /></Panel></div>
    <Panel className="status-panel"><div className="status-heading"><div><div className="panel-eyebrow">PROJECT HEALTH</div><h2>Project status</h2></div><button className="text-link" onClick={() => onNavigate("Projects")}>Manage projects <ChevronRight size={14} /></button></div><div className="status-summary">{(["Active", "Delivered", "Paid"] as const).map((status) => { const count = projects.filter((project) => project.status === status).length; return <button className="status-stat" key={status} onClick={() => { onNavigate("Projects"); }}><span><StatusBadge status={status} /></span><strong>{String(count).padStart(2, "0")}</strong><small>{status === "Active" ? "In progress" : status === "Paid" ? "Completed & paid" : "Awaiting payment"}</small><div className="status-bar"><i style={{ width: `${projects.length ? count / projects.length * 100 : 0}%` }} /></div></button>; })}</div><div className="pending-banner"><span className="pending-banner-icon"><Clock3 size={16} /></span><span><strong>{pending.length} payouts awaiting approval</strong><small>{money(pending.reduce((sum, payout) => sum + payout.amount, 0))} ready to be processed</small></span><button className="button button-small" onClick={() => onNavigate("Payouts")}>Review payouts <ChevronRight size={14} /></button></div></Panel>
  </div>;
}

function MonthlyRevenueChart() {
  return <Panel className="monthly-revenue-panel"><div className="panel-top"><div><div className="panel-eyebrow">MONTHLY REVENUE</div><h2>Revenue by month</h2><p>Gross project revenue · PKR thousands</p></div><span className="chart-total"><strong>PKR 1.42M</strong><small>September 2026</small></span></div><div className="chart-wrap monthly-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueSeries} margin={{ top: 8, right: 7, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0ec" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#929b94", fontSize: 10 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#929b94", fontSize: 9 }} tickFormatter={(value) => `${value}k`} /><Tooltip formatter={(value) => [`PKR ${Number(value).toLocaleString()}k`, "Revenue"]} /><Bar dataKey="revenue" fill="#75977a" radius={[4, 4, 0, 0]} maxBarSize={28} /></BarChart></ResponsiveContainer></div></Panel>;
}

function StatCard({ label, value, delta, icon, tint, trend, foot }: { label: string; value: string; delta: string; icon: ReactNode; tint: string; trend: "up" | "neutral"; foot: string }) {
  return <Panel className="stat-card"><div className={`stat-icon tint-${tint}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><div className="stat-foot"><span className={trend === "up" ? "trend-up" : "trend-neutral"}>{trend === "up" ? <ArrowUpRight size={13} /> : <Sparkles size={12} />}{delta}</span><span>{foot}</span></div><div className={`stat-spark spark-${tint}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div></Panel>;
}

function ProjectTable({ projects, onSelect, compact = false }: { projects: Project[]; onSelect: (project: Project) => void; compact?: boolean }) {
  if (!projects.length) return <EmptyState title="No projects found" body="Try adjusting your search or filters." />;
  return <div className="table-scroll"><table><thead><tr><th>PROJECT / CLIENT</th><th>PROJECT VALUE</th>{!compact && <><th>BD SOURCE</th><th>PROFILE OWNER</th><th>ASSIGNED TO</th><th>DEADLINE</th></>}<th>STATUS</th>{!compact && <><th>EST. PAYOUT</th><th /></>}</tr></thead><tbody>{projects.map((project) => <tr key={project.id} className="clickable-row" onClick={() => onSelect(project)}><td><div className="project-cell"><span className={`client-logo logo-${project.id.slice(-1)}`}>{initials(project.client)}</span><span><strong>{project.client}</strong><small>{project.id} · {project.title}</small></span></div></td><td className="amount-cell">{money(project.value)}</td>{!compact && <><td>{project.bdSource}</td><td>{project.profileOwner}</td><td><span className="assignment-names">{project.execution.join(", ") || "Unassigned"}</span></td><td>{new Date(`${project.deadline}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td></>}<td><StatusBadge status={project.status} /></td>{!compact && <><td>{money(Math.round(project.value * 0.55))}</td><td><button className="row-action" aria-label={`Open ${project.client}`}><MoreHorizontal size={17} /></button></td></>}</tr>)}</tbody></table></div>;
}

function PayoutTable({ payouts, projects = initialProjects, onSelect, compact = false }: { payouts: Payout[]; projects?: Project[]; onSelect: (payout: Payout) => void; compact?: boolean }) {
  if (!payouts.length) return <EmptyState title="No payouts found" body="Try adjusting your filters to see more payouts." />;
  return <div className="table-scroll"><table><thead><tr><th>CONTRACTOR</th><th>PROJECT / CLIENT</th><th>AMOUNT</th>{!compact && <><th>COMMISSION TYPE</th><th>DATE</th></>}<th>STATUS</th>{!compact && <th />}</tr></thead><tbody>{payouts.map((payout) => { const project = projects.find((item) => item.id === payout.projectId); return <tr key={payout.id} className="clickable-row" onClick={() => onSelect(payout)}><td><div className="person-cell"><span className="avatar" style={{ background: avatars[payout.contractor.length % avatars.length] }}>{initials(payout.contractor)}</span><span><strong>{payout.contractor}</strong><small>{payout.id}</small></span></div></td><td><strong className="cell-primary">{project?.client ?? "New client"}</strong><small className="cell-secondary">{payout.projectId}</small></td><td className="amount-cell">{money(payout.amount)}</td>{!compact && <><td>{payout.commission}</td><td>{new Date(`${payout.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td></>}<td><StatusBadge status={payout.status} /></td>{!compact && <td><button className="row-action" aria-label={`Open payout ${payout.id}`}><MoreHorizontal size={17} /></button></td>}</tr>; })}</tbody></table></div>;
}

function ProjectsView({ projects, query, setQuery, mode, setMode, status, setStatus, date, setDate, clear, onSelect }: { projects: Project[]; query: string; setQuery: (value: string) => void; mode: "table" | "grid"; setMode: (mode: "table" | "grid") => void; status: string; setStatus: (status: string) => void; date: string; setDate: (date: string) => void; clear: () => void; onSelect: (project: Project) => void }) {
  return <div className="page-stack"><Panel className="filter-panel"><div className="filter-left"><label className="filter-search"><Search size={15} /><input placeholder="Search projects..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search projects" /></label><label className="select-filter"><Filter size={14} /><select aria-label="Filter projects by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Active</option><option>Delivered</option><option>Paid</option></select></label><label className="date-filter"><CalendarDays size={14} /><input type="date" aria-label="Filter projects due after date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button className="text-link clear-link" onClick={clear}>Clear filters</button></div><div className="view-switch"><button className={mode === "table" ? "selected" : ""} onClick={() => setMode("table")} aria-label="Table view"><FileText size={15} /></button><button className={mode === "grid" ? "selected" : ""} onClick={() => setMode("grid")} aria-label="Grid view"><LayoutDashboard size={15} /></button></div></Panel>
    <Panel className="table-panel projects-table-panel"><div className="table-panel-heading"><div><strong>{projects.length} projects</strong><span> · Updated just now</span></div><button className="button button-secondary button-small" onClick={() => window.print()}><Download size={14} /> Export</button></div>{mode === "table" ? <ProjectTable projects={projects} onSelect={onSelect} /> : <div className="project-grid">{projects.map((project) => <button className="project-card" key={project.id} onClick={() => onSelect(project)}><div className="project-card-top"><span className={`client-logo logo-${project.id.slice(-1)}`}>{initials(project.client)}</span><StatusBadge status={project.status} /></div><small>{project.id}</small><strong>{project.client}</strong><span>{project.title}</span><div className="project-card-foot"><b>{money(project.value)}</b><span>Due {new Date(`${project.deadline}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span></div></button>)}</div>}</Panel>
    <div className="pagination"><span>Showing <strong>{projects.length ? 1 : 0}-{projects.length}</strong> of <strong>{projects.length}</strong> projects</span><div><button disabled aria-label="Previous page"><ChevronLeft size={16} /></button><button className="page-number">1</button><button disabled aria-label="Next page"><ChevronRight size={16} /></button></div></div>
  </div>;
}

function ContractorsView({ contractors, allContractors, payouts, projects, query, setQuery, status, setStatus, onSelect, onEdit, onToggle, clear }: { contractors: Contractor[]; allContractors: Contractor[]; payouts: Payout[]; projects: Project[]; query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; onSelect: (contractor: Contractor) => void; onEdit: (contractor: Contractor) => void; onToggle: (contractor: Contractor) => void; clear: () => void }) {
  const active = allContractors.filter((contractor) => contractor.status === "Active").length;
  const totalEarnings = (name: string) => payouts.filter((payout) => payout.contractor === name).reduce((sum, payout) => sum + payout.amount, 0);
  const countProjects = (contractor: Contractor) => projects.filter((project) => project.execution.includes(contractor.name) || project.profileOwner === contractor.name).length;
  return <div className="page-stack"><div className="mini-stat-grid"><MiniStat label="Total contractors" value={String(allContractors.length).padStart(2, "0")} icon={<Users size={16} />} /><MiniStat label="Active contractors" value={String(active).padStart(2, "0")} icon={<CheckCircle2 size={16} />} /><MiniStat label="Inactive contractors" value={String(allContractors.length - active).padStart(2, "0")} icon={<Clock3 size={16} />} /></div><Panel className="table-panel"><div className="toolbar"><div className="toolbar-search"><Search size={15} /><input placeholder="Search contractors..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search contractors" /></div><div className="toolbar-right"><label className="select-filter"><Filter size={14} /><select aria-label="Filter contractors by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Active</option><option>Inactive</option></select></label><button className="text-link" onClick={clear}>Clear</button></div></div><div className="table-scroll"><table><thead><tr><th>CONTRACTOR</th><th>ROLE</th><th>SKILLS / STACK</th><th>STATUS</th><th>PROFILE OWNERSHIP</th><th>TOTAL EARNINGS</th><th>PROJECTS</th><th /></tr></thead><tbody>{contractors.length ? contractors.map((contractor, index) => <tr key={contractor.id}><td><button className="person-cell person-button" onClick={() => onSelect(contractor)}><span className="avatar" style={{ background: avatars[index % avatars.length] }}>{initials(contractor.name)}</span><span><strong>{contractor.name}</strong><small>{contractor.id}</small></span></button></td><td>{contractor.role}</td><td><div className="skill-list">{contractor.skills.slice(0, 2).map((skill) => <span key={skill}>{skill}</span>)}{contractor.skills.length > 2 && <span>+{contractor.skills.length - 2}</span>}</div></td><td><StatusBadge status={contractor.status} /></td><td><span className="ownership-text">{contractor.ownership.slice(0, 2).join(", ")}{contractor.ownership.length > 2 ? ` +${contractor.ownership.length - 2}` : ""}</span></td><td className="amount-cell">{money(totalEarnings(contractor.name))}</td><td>{countProjects(contractor)}</td><td><div className="row-actions"><button className="row-action" aria-label={`Edit ${contractor.name}`} onClick={() => onEdit(contractor)}><Pencil size={15} /></button><button className="row-action" aria-label={`${contractor.status === "Active" ? "Deactivate" : "Activate"} ${contractor.name}`} onClick={() => onToggle(contractor)}><MoreHorizontal size={17} /></button></div></td></tr>) : <tr><td colSpan={8}><EmptyState title="No contractors found" body="Try another search or adjust the status filter." /></td></tr>}</tbody></table></div><div className="table-bottom"><span>Showing {contractors.length} of {allContractors.length} contractors</span><span>Historical payout records are always retained</span></div></Panel></div>;
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) { return <Panel className="mini-stat"><span className="mini-stat-icon">{icon}</span><span>{label}</span><strong>{value}</strong></Panel>; }

function PayoutsView({ payouts, projects, contractors, query, setQuery, status, setStatus, contractor, setContractor, date, setDate, clear, onSelect }: { payouts: Payout[]; projects: Project[]; contractors: Contractor[]; query: string; setQuery: (value: string) => void; status: string; setStatus: (value: string) => void; contractor: string; setContractor: (value: string) => void; date: string; setDate: (value: string) => void; clear: () => void; onSelect: (payout: Payout) => void }) {
  const sum = (state: string) => payouts.filter((payout) => state === "All" || payout.status === state).reduce((total, payout) => total + payout.amount, 0);
  return <div className="page-stack"><div className="mini-stat-grid"><MiniStat label="Total payouts" value={shortMoney(sum("All"))} icon={<Wallet size={16} />} /><MiniStat label="Pending payouts" value={shortMoney(sum("Pending"))} icon={<Clock3 size={16} />} /><MiniStat label="Paid payouts" value={shortMoney(sum("Paid"))} icon={<CheckCircle2 size={16} />} /></div><Panel className="table-panel"><div className="toolbar"><div className="toolbar-search"><Search size={15} /><input placeholder="Search contractor, project, or client..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search payouts" /></div><div className="toolbar-right"><label className="select-filter"><Filter size={14} /><select aria-label="Filter payouts by contractor" value={contractor} onChange={(event) => setContractor(event.target.value)}><option>All contractors</option>{contractors.map((person) => <option key={person.id}>{person.name}</option>)}</select></label><label className="select-filter"><select aria-label="Filter payouts by status" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Pending</option><option>Paid</option></select></label><label className="date-filter"><CalendarDays size={14} /><input type="date" aria-label="Filter payouts after date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button className="text-link" onClick={clear}>Clear</button></div></div><PayoutTable payouts={payouts} projects={projects} onSelect={onSelect} /><div className="table-bottom"><span>{payouts.length} payout records</span><span>Amounts shown in PKR</span></div></Panel></div>;
}

function FinancialsView({ period, setPeriod, range, setRange, projects, payouts }: { period: string; setPeriod: (value: string) => void; range: string; setRange: (value: string) => void; projects: Project[]; payouts: Payout[] }) {
  const revenue = projects.reduce((sum, project) => sum + project.value, 0);
  const payoutTotal = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const distribution = [{ name: "Execution", value: 55 }, { name: "Company", value: 30 }, { name: "BD team", value: 10 }, { name: "Profile owner", value: 5 }];
  const chartData = period === "Quarterly" ? [0, 3].map((start) => ({
    month: start === 0 ? "Q2" : "Q3",
    revenue: monthlyRevenueData.slice(start, start + 3).reduce((sum, item) => sum + item.revenue, 0),
    payouts: monthlyRevenueData.slice(start, start + 3).reduce((sum, item) => sum + item.payouts, 0),
    retained: monthlyRevenueData.slice(start, start + 3).reduce((sum, item) => sum + item.retained, 0),
  })) : monthlyRevenueData;
  const revenueSeries = chartData;
  return <div className="page-stack"><div className="financial-toolbar"><div className="segmented-control"><button className={period === "Monthly" ? "active" : ""} onClick={() => setPeriod("Monthly")}>Monthly</button><button className={period === "Quarterly" ? "active" : ""} onClick={() => setPeriod("Quarterly")}>Quarterly</button></div><label className="date-filter"><CalendarDays size={14} /><select aria-label="Financial date range" value={range} onChange={(event) => setRange(event.target.value)}><option>Last 6 months</option><option>Last 12 months</option><option>This year</option></select></label></div><div className="stat-grid"><StatCard label="Revenue" value={shortMoney(revenue)} delta="12.8%" icon={<TrendingUp size={17} />} tint="mint" trend="up" foot="vs. prior period" /><StatCard label="Contractor payouts" value={shortMoney(payoutTotal)} delta="8.2%" icon={<Wallet size={17} />} tint="sand" trend="up" foot="vs. prior period" /><StatCard label="Retained earnings" value={shortMoney(revenue - payoutTotal)} delta="16.4%" icon={<CircleDollarSign size={17} />} tint="blue" trend="up" foot="vs. prior period" /><StatCard label="Average project value" value={shortMoney(revenue / Math.max(projects.length, 1))} delta={`${projects.length} projects`} icon={<BriefcaseBusiness size={17} />} tint="lilac" trend="neutral" foot="in selected range" /></div><div className="chart-row financial-charts"><Panel className="revenue-panel"><div className="panel-top"><div><div className="panel-eyebrow">FINANCIAL OVERVIEW</div><h2>{period} revenue trend</h2><p>Revenue, payout, and retained earnings · {range.toLowerCase()}</p></div><button className="icon-button" aria-label="Export trend" onClick={() => window.print()}><Download size={16} /></button></div><div className="chart-legend"><span><i className="legend-revenue" />Revenue</span><span><i className="legend-payout" />Payouts</span><span><i className="legend-retained" />Retained</span></div><div className="chart-wrap chart-main"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueSeries} margin={{ top: 10, right: 5, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0ec" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#929b94", fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#929b94", fontSize: 10 }} tickFormatter={(value) => `${value}k`} /><Tooltip formatter={(value) => [`PKR ${Number(value).toLocaleString()}k`, ""]} /><Area type="monotone" dataKey="revenue" stroke="#547a5d" strokeWidth={2.2} fill="#dce8dc" fillOpacity={0.75} /><Area type="monotone" dataKey="payouts" stroke="#c89a65" strokeWidth={2} fill="none" /><Area type="monotone" dataKey="retained" stroke="#91a6b7" strokeWidth={1.8} fill="none" /></AreaChart></ResponsiveContainer></div></Panel><Panel className="distribution-panel"><div className="panel-top"><div><div className="panel-eyebrow">ALLOCATION</div><h2>Payout distribution</h2><p>Share of gross revenue</p></div></div><div className="horizontal-bars">{distribution.map((item, index) => <div key={item.name}><div><span>{item.name}</span><strong>{item.value}%</strong></div><i><b style={{ width: `${item.value * 1.5}%`, background: ["#537c61", "#bdcfc1", "#e5c8a6", "#d7dce2"][index] }} /></i></div>)}</div><p className="allocation-note">Commission allocation follows your current agency rules.</p></Panel></div><Panel className="table-panel"><SectionHeading title="Financial summary" subtitle="Monthly breakdown of agency performance" action={<span className="table-unit">All values in PKR</span>} /><div className="table-scroll"><table><thead><tr><th>PERIOD</th><th>PROJECTS</th><th>REVENUE</th><th>CONTRACTOR PAYOUTS</th><th>RETAINED EARNINGS</th><th>MARGIN</th></tr></thead><tbody>{revenueSeries.map((item) => <tr key={item.month}><td><strong>{item.month} 2026</strong></td><td>{Math.max(1, Math.round(item.revenue / 240))}</td><td className="amount-cell">PKR {item.revenue.toLocaleString()}k</td><td>PKR {item.payouts.toLocaleString()}k</td><td className="amount-cell">PKR {item.retained.toLocaleString()}k</td><td><span className="margin-label">{Math.round(item.retained / item.revenue * 100)}%</span></td></tr>)}</tbody></table></div></Panel></div>;
}

function RulesView({ rules, setRules, saved, setSaved, editing, setEditing, notify }: { rules: typeof defaultCommissionRules; setRules: (value: typeof defaultCommissionRules) => void; saved: typeof defaultCommissionRules; setSaved: (value: typeof defaultCommissionRules) => void; editing: boolean; setEditing: (value: boolean) => void; notify: (message: string) => void }) {
  const valid = rules.company + rules.bd + rules.owner <= 100 && rules.company + rules.bdSmall + rules.owner <= 100;
  const update = (key: keyof typeof defaultCommissionRules, value: number) => setRules({ ...rules, [key]: Math.max(0, Math.min(100, value)) });
  const save = () => { if (!valid) { notify("Commission percentages must total 100% or less"); return; } setSaved(rules); setEditing(false); notify("Commission rules saved locally"); };
  const cancel = () => { setRules(saved); setEditing(false); };
  const reset = () => { setRules(defaultCommissionRules); setSaved(defaultCommissionRules); setEditing(false); notify("Rules reset to default"); };
  return <div className="rules-layout"><div className="rules-main"><Panel className="rules-panel"><div className="rules-header"><div><div className="panel-eyebrow">DEFAULT COMMISSION STRUCTURE</div><h2>Commission allocation</h2><p>Rules apply to new projects. Existing payouts remain unchanged.</p></div><span className="rules-lock"><ShieldCheck size={14} /> Workspace defaults</span></div><div className="rule-list">{[
    { key: "company" as const, title: "Company retained", description: "Agency operating margin", icon: <Building2 size={17} />, color: "green", value: rules.company, suffix: "%" },
    { key: "bd" as const, title: "Business development", description: "Standard project acquisition commission", icon: <TrendingUp size={17} />, color: "amber", value: rules.bd, suffix: "%" },
    { key: "bdSmall" as const, title: "BD commission · small projects", description: "Applied when project value is ≤ PKR 500,000", icon: <Sparkles size={17} />, color: "blue", value: rules.bdSmall, suffix: "%" },
    { key: "owner" as const, title: "Profile owner", description: "Client relationship and account ownership", icon: <UserRound size={17} />, color: "slate", value: rules.owner, suffix: "%" },
  ].map((rule) => <div className="rule-row" key={rule.key}><span className={`rule-icon rule-${rule.color}`}>{rule.icon}</span><div className="rule-info"><strong>{rule.title}</strong><span>{rule.description}</span></div>{editing ? <label className="rule-input"><input type="number" min="0" max="100" value={rule.value} onChange={(event) => update(rule.key, Number(event.target.value))} aria-label={`${rule.title} percentage`} /><span>{rule.suffix}</span></label> : <strong className="rule-value">{rule.value}{rule.suffix}</strong>}</div>)}<div className="rule-row execution-rule"><span className="rule-icon rule-execution"><Users size={17} /></span><div className="rule-info"><strong>Execution team</strong><span>Distributed to assigned contractor(s), proportionally</span></div><div className="remaining-value"><strong>{100 - rules.company - rules.bd - rules.owner}%</strong><small>Remaining amount</small></div></div></div><div className="rules-footer"><span><i className="system-dot" /> {editing ? "Unsaved changes" : "Last updated Sep 12, 2026"}</span><div>{editing ? <><button className="button button-secondary" onClick={cancel}>Cancel</button><button className="button button-primary" onClick={save}><Check size={15} /> Save changes</button></> : <><button className="button button-secondary" onClick={reset}><RotateCcw size={14} /> Reset to default</button><button className="button button-primary" onClick={() => setEditing(true)}><Pencil size={14} /> Edit rules</button></>}</div></div></Panel><div className="info-callout"><span><CircleHelp size={17} /></span><div><strong>How the execution share works</strong><p>The execution team receives the remaining project value after company, BD, and profile ownership commissions are allocated. This amount is split evenly by default.</p></div></div></div><Panel className="rules-side"><span className="side-icon"><Activity size={17} /></span><h3>Current allocation</h3><p>Based on your active workspace rules</p><div className="allocation-visual"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ value: rules.company }, { value: rules.bd }, { value: rules.owner }, { value: Math.max(0, 100 - rules.company - rules.bd - rules.owner) }]} dataKey="value" innerRadius={52} outerRadius={68} paddingAngle={2} stroke="none">{["#537c61", "#e5c8a6", "#d7dce2", "#bdcfc1"].map((color) => <Cell key={color} fill={color} />)}</Pie></PieChart></ResponsiveContainer><div className="donut-center"><strong>{Math.max(0, 100 - rules.company - rules.bd - rules.owner)}%</strong><span>execution</span></div></div><div className="side-rule-list"><div><i style={{ background: "#537c61" }} />Company <strong>{rules.company}%</strong></div><div><i style={{ background: "#e5c8a6" }} />BD team <strong>{rules.bd}%</strong></div><div><i style={{ background: "#d7dce2" }} />Profile owner <strong>{rules.owner}%</strong></div><div><i style={{ background: "#bdcfc1" }} />Execution team <strong>{100 - rules.company - rules.bd - rules.owner}%</strong></div></div></Panel><Panel className="audit-panel"><SectionHeading title="Override audit history" subtitle="Manual changes are recorded for accountability" /><div className="table-scroll"><table><thead><tr><th>CHANGED BY</th><th>WHAT CHANGED</th><th>PREVIOUS</th><th>NEW VALUE</th><th>REASON</th><th>DATE</th></tr></thead><tbody>{auditLogs.map((log) => <tr key={`${log.what}-${log.date}`}><td><strong>{log.changedBy}</strong></td><td>{log.what}</td><td>{log.previous}</td><td><span className="margin-label">{log.next}</span></td><td>{log.reason}</td><td>{new Date(`${log.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td></tr>)}</tbody></table></div></Panel></div>;
}

function SettingsView({ profile, setProfile, appearance, setAppearance, notifications, setNotifications, notify }: { profile: { name: string; email: string }; setProfile: (value: { name: string; email: string }) => void; appearance: string; setAppearance: (value: string) => void; notifications: boolean; setNotifications: (value: boolean) => void; notify: (message: string) => void }) {
  return <div className="settings-layout"><aside className="settings-nav"><button className="settings-tab active"><UserRound size={16} /> Profile</button><button className="settings-tab" onClick={() => document.getElementById("appearance")?.scrollIntoView({ behavior: "smooth" })}><Sparkles size={16} /> Appearance</button><button className="settings-tab" onClick={() => document.getElementById("notifications")?.scrollIntoView({ behavior: "smooth" })}><Bell size={16} /> Notifications</button><button className="settings-tab" onClick={() => document.getElementById("role-info")?.scrollIntoView({ behavior: "smooth" })}><ShieldCheck size={16} /> Role information</button></aside><div className="settings-content"><Panel className="settings-panel"><SectionHeading title="Profile information" subtitle="Your account details and workspace identity" /><div className="settings-form"><div className="profile-photo-row"><span className="avatar avatar-large avatar-admin">{initials(profile.name)}</span><div><strong>{profile.name}</strong><span>Administrator</span></div><button className="button button-secondary button-small" onClick={() => notify("Profile photo upload is not configured in this frontend demo")}>Change photo</button></div><div className="field-grid"><label className="field-label">Full name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label className="field-label">Email address<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label></div><div className="settings-save"><span>Changes are held in this browser session.</span><button className="button button-primary" onClick={() => notify("Profile changes saved locally")}>Save changes</button></div></div></Panel><Panel className="settings-panel" id="appearance"><SectionHeading title="Appearance" subtitle="Choose the look that works best for you" /><div className="appearance-options">{["Light", "System"].map((option) => <button className={`appearance-option ${appearance === option ? "selected" : ""}`} key={option} onClick={() => setAppearance(option)}><span className={`appearance-preview ${option.toLowerCase()}`}><i /><i /><i /></span><strong>{option}</strong><span className="radio-mark" /></button>)}</div></Panel><Panel className="settings-panel" id="notifications"><SectionHeading title="Notifications" subtitle="Control which updates you receive" /><div className="setting-toggle-row"><div><strong>Workspace notifications</strong><span>Project updates, payout approvals, and important activity</span></div><button className={`toggle ${notifications ? "on" : ""}`} role="switch" aria-checked={notifications} aria-label="Toggle workspace notifications" onClick={() => setNotifications(!notifications)}><i /></button></div></Panel><Panel className="settings-panel" id="role-info"><SectionHeading title="Role information" subtitle="Your access within this workspace" /><div className="role-info"><span className="role-badge"><ShieldCheck size={14} /> Administrator</span><p>You have access to projects, contractors, payout records, financial reporting, and commission rule configuration.</p><span>Workspace <strong>Axionix Studio</strong></span></div></Panel></div></div>;
}

function ProjectForm({ project, contractors, rules, onSubmit, onCancel }: { project: Project | null; contractors: Contractor[]; rules: typeof defaultCommissionRules; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return <form className="form-body" onSubmit={onSubmit}>
    <div className="field-grid">
      <label className="field-label">Client name <span className="required">*</span><input name="client" required defaultValue={project?.client} placeholder="e.g. Northstar Labs" /></label>
      <label className="field-label">Project title <span className="required">*</span><input name="title" required defaultValue={project?.title} placeholder="e.g. Brand identity & website" /></label>
      <label className="field-label">Project value (PKR) <span className="required">*</span><input name="value" type="number" min="1" required defaultValue={project?.value} placeholder="250000" /></label>
      <label className="field-label">BD source<input name="bdSource" defaultValue={project?.bdSource} placeholder="Team member or referral" /></label>
      <label className="field-label">Profile owner<select name="profileOwner" defaultValue={project?.profileOwner ?? contractors.find((item) => item.role === "Profile Owner")?.name}>{contractors.filter((item) => item.status === "Active").map((person) => <option key={person.id}>{person.name}</option>)}</select></label>
      <label className="field-label">Deadline <span className="required">*</span><input name="deadline" type="date" required defaultValue={project?.deadline} /></label>
      <label className="field-label">Status<select name="status" defaultValue={project?.status ?? "Active"}><option>Active</option><option>Delivered</option><option>Paid</option></select></label>
    </div>
    <fieldset className="assignment-field"><legend>Assign project to</legend><div className="assignment-options">{contractors.filter((person) => person.status === "Active").map((person) => <label className="assignment-option" key={person.id}><input type="checkbox" name="execution" value={person.name} defaultChecked={project?.execution.includes(person.name)} /><span><strong>{person.name}</strong><small>{person.role}</small></span></label>)}</div></fieldset>
    <CommissionPreview value={project?.value ?? 0} rules={rules} />
    <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary"><Check size={15} />{project ? "Save project" : "Create project"}</button></div>
  </form>;
}

function CommissionPreview({ value, rules }: { value: number; rules: typeof defaultCommissionRules }) {
  const [currentValue, setCurrentValue] = useState(value);
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(".modal input[name='value']");
    if (!input) return;
    const syncValue = () => setCurrentValue(Number(input.value) || 0);
    input.addEventListener("input", syncValue);
    return () => input.removeEventListener("input", syncValue);
  }, []);
  const bdRate = getBdRate(currentValue, rules);
  const allocations = [{ label: "Company", rate: rules.company }, { label: "BD team", rate: bdRate }, { label: "Profile owner", rate: rules.owner }, { label: "Execution team", rate: 100 - rules.company - bdRate - rules.owner }];
  return <div className="commission-preview"><div className="preview-heading"><span><CircleDollarSign size={15} /> Commission breakdown</span><small>Based on current rules</small></div><div className="preview-grid">{allocations.map(({ label, rate }) => <div key={label}><span>{label}<b>{rate}%</b></span><strong>{money(Math.round(currentValue * rate / 100))}</strong></div>)}</div></div>;
}

function ContractorForm({ contractor, onSubmit, onCancel }: { contractor: Contractor | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  return <form className="form-body" onSubmit={onSubmit}><label className="field-label">Full name <span className="required">*</span><input name="name" required defaultValue={contractor?.name} placeholder="Contractor name" /></label><label className="field-label">Role <span className="required">*</span><input name="role" required defaultValue={contractor?.role} placeholder="e.g. Product Designer" /></label><label className="field-label">Skills / stack<input name="skills" defaultValue={contractor?.skills.join(", ")} placeholder="React, Figma, Webflow" /></label><label className="field-label">Contact email<input name="contact" type="email" defaultValue={contractor?.contact} placeholder="name@agency.co" /></label><label className="field-label">Client / profile ownership<input name="ownership" defaultValue={contractor?.ownership.join(", ")} placeholder="Client names separated by commas" /></label><label className="field-label">Status<select name="status" defaultValue={contractor?.status ?? "Active"}><option>Active</option><option>Inactive</option></select></label><p className="form-note"><ShieldCheck size={14} /> Deactivating a contractor will not remove their historical payout records.</p><div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-primary"><Check size={15} />{contractor ? "Save changes" : "Add contractor"}</button></div></form>;
}

function ProjectDetail({ project, contractors, rules, onClose, onEdit, onStatus, onOverride }: { project: Project; contractors: Contractor[]; rules: typeof defaultCommissionRules; onClose: () => void; onEdit: () => void; onStatus: (project: Project, status: ProjectStatus) => void; onOverride: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const bdRate = getBdRate(project.value, rules);
  const commissions = [{ label: "Company", value: rules.company, color: "#537c61" }, { label: "BD team", value: bdRate, color: "#e5c8a6" }, { label: "Profile owner", value: rules.owner, color: "#d7dce2" }, { label: "Execution team", value: project.executionOverride ?? 100 - rules.company - bdRate - rules.owner, color: "#bdcfc1" }];
  return <Modal title="Project details" description={`${project.id} · ${project.title}`} onClose={onClose} wide><div className="detail-body"><div className="detail-topline"><div className="detail-client"><span className={`client-logo logo-${project.id.slice(-1)}`}>{initials(project.client)}</span><div><h3>{project.client}</h3><span>{project.id} · Created Sep 08, 2026</span></div></div><div className="detail-actions"><StatusBadge status={project.status} /><button className="button button-secondary button-small" onClick={onEdit}><Pencil size={14} /> Edit project</button><div className="action-menu-wrap"><button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="More project actions"><MoreHorizontal size={18} /></button>{menuOpen && <div className="action-menu"><button onClick={onOverride}><SlidersHorizontal size={14} /> Manual override</button>{project.status === "Active" && <button onClick={() => onStatus(project, "Delivered")}><CheckCircle2 size={14} /> Mark as delivered</button>}{project.status !== "Paid" && <button onClick={() => onStatus(project, "Paid")}><CircleDollarSign size={14} /> Mark as paid</button>}</div>}</div></div></div><div className="detail-overview-grid"><div className="detail-facts"><div><span>Project value</span><strong>{money(project.value)}</strong></div><div><span>Deadline</span><strong>{new Date(`${project.deadline}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</strong></div><div><span>BD source</span><strong>{project.bdSource}</strong></div><div><span>Profile owner</span><strong>{project.profileOwner}</strong></div><div className="fact-span"><span>Execution team</span><div className="team-list">{project.execution.map((name) => <span key={name}><i className="avatar avatar-small" style={{ background: avatars[name.length % avatars.length] }}>{initials(name)}</i>{name}<small>{contractors.find((person) => person.name === name)?.role ?? "Contractor"}</small></span>)}</div></div></div><div className="commission-detail-card"><div className="panel-eyebrow">PROJECT COMMISSIONS</div><h3>Commission breakdown</h3><p>Calculated against total project value</p><div className="commission-stack">{commissions.map((item) => <i key={item.label} style={{ width: `${item.value}%`, background: item.color }} title={`${item.label}: ${item.value}%`} />)}</div><div className="commission-detail-list">{commissions.map((item) => <div key={item.label}><span><i style={{ background: item.color }} />{item.label}<small>{item.value}%</small></span><strong>{money(Math.round(project.value * item.value / 100))}</strong></div>)}</div><button className="text-link" onClick={onOverride}><Pencil size={13} /> Override calculation</button></div></div><div className="timeline-section"><h3>Status timeline</h3><div className="timeline"><div className="timeline-step complete"><span><Check size={12} /></span><div><strong>Project created</strong><small>Sep 08, 2026 · Project added to workspace</small></div></div><div className={`timeline-step ${project.status !== "Active" ? "complete" : "current"}`}><span>{project.status !== "Active" ? <Check size={12} /> : "2"}</span><div><strong>Work delivered</strong><small>{project.status !== "Active" ? "Sep 26, 2026 · Awaiting payout" : "In progress"}</small></div></div><div className={`timeline-step ${project.status === "Paid" ? "complete" : ""}`}><span>{project.status === "Paid" ? <Check size={12} /> : "3"}</span><div><strong>Payout complete</strong><small>{project.status === "Paid" ? "Commission paid to team" : "Pending project completion"}</small></div></div></div></div><div className="detail-bottom-actions"><button className="button button-secondary" onClick={onEdit}><Pencil size={14} /> Edit project</button>{project.status === "Active" && <button className="button button-secondary" onClick={() => onStatus(project, "Delivered")}><CheckCircle2 size={14} /> Mark as delivered</button>}{project.status !== "Paid" && <button className="button button-primary" onClick={() => onStatus(project, "Paid")}><CreditCard size={14} /> Mark as paid</button>}</div></div></Modal>;
}

function ContractorDetail({ contractor, payouts, projects, onClose, onEdit, onToggle, onPayout }: { contractor: Contractor; payouts: Payout[]; projects: Project[]; onClose: () => void; onEdit: () => void; onToggle: (contractor: Contractor) => void; onPayout: (payout: Payout) => void }) {
  const personPayouts = payouts.filter((payout) => payout.contractor === contractor.name);
  const total = personPayouts.reduce((sum, payout) => sum + payout.amount, 0);
  return <Modal title="Contractor profile" description={contractor.id} onClose={onClose} wide><div className="detail-body"><div className="contractor-profile-head"><span className="avatar avatar-xl" style={{ background: avatars[contractor.name.length % avatars.length] }}>{initials(contractor.name)}</span><div><h3>{contractor.name}</h3><p>{contractor.role} · {contractor.contact}</p><StatusBadge status={contractor.status} /></div><div className="detail-actions"><button className="button button-secondary button-small" onClick={onEdit}><Pencil size={14} /> Edit profile</button><button className="button button-secondary button-small" onClick={() => onToggle(contractor)}>{contractor.status === "Active" ? "Deactivate" : "Activate"}</button></div></div><div className="contractor-metrics"><div><span>Total earnings</span><strong>{money(total)}</strong></div><div><span>Assigned projects</span><strong>{projects.filter((project) => project.execution.includes(contractor.name) || project.profileOwner === contractor.name).length}</strong></div><div><span>Owned relationships</span><strong>{contractor.ownership.length}</strong></div></div><div className="contractor-tags"><div><span className="detail-label">SKILLS</span><div className="skill-list">{contractor.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div><div><span className="detail-label">CLIENT RELATIONSHIPS</span><div className="ownership-pills">{contractor.ownership.map((client) => <span key={client}><Building2 size={12} />{client}</span>)}</div></div></div><div className="ledger-heading"><div><h3>Payout history</h3><p>Historical contractor commission ledger</p></div><span className="table-unit">{personPayouts.length} records</span></div><div className="table-scroll"><table><thead><tr><th>PROJECT</th><th>CLIENT</th><th>PROJECT VALUE</th><th>COMMISSION</th><th>PAYOUT</th><th>DATE</th><th>STATUS</th></tr></thead><tbody>{personPayouts.map((payout) => { const project = projects.find((item) => item.id === payout.projectId); return <tr key={payout.id} className="clickable-row" onClick={() => onPayout(payout)}><td>{payout.projectId}</td><td>{project?.client}</td><td>{money(project?.value ?? 0)}</td><td>{payout.commission}</td><td className="amount-cell">{money(payout.amount)}</td><td>{new Date(`${payout.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td><td><StatusBadge status={payout.status} /></td></tr>; })}</tbody></table>{!personPayouts.length && <EmptyState title="No payout history yet" body="New payout records will appear here." />}</div></div></Modal>;
}

function PayoutDetail({ payout, project, onMarkPaid, onClose }: { payout: Payout; project?: Project; onMarkPaid: (payout: Payout) => void; onClose: () => void }) {
  return <div className="form-body"><div className="payout-amount-card"><span>CONTRACTOR PAYOUT</span><strong>{money(payout.amount)}</strong><div><StatusBadge status={payout.status} /><span>{payout.commission}</span></div></div><div className="payout-detail-list"><div><span>Payout reference</span><strong>{payout.id}</strong></div><div><span>Contractor</span><strong>{payout.contractor}</strong></div><div><span>Project</span><strong>{project?.title ?? payout.projectId}</strong></div><div><span>Client</span><strong>{project?.client ?? "New client"}</strong></div><div><span>Project value</span><strong>{money(project?.value ?? 0)}</strong></div><div><span>Date</span><strong>{new Date(`${payout.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</strong></div></div><div className="modal-actions">{payout.status === "Pending" && <button className="button button-primary" onClick={() => onMarkPaid(payout)}><Check size={15} /> Mark as paid</button>}<button className="button button-secondary" onClick={onClose}>Close</button></div></div>;
}