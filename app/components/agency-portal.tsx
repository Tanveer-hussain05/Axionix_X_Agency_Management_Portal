"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { Bell, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, Command, Download, LifeBuoy, LogOut, Menu, Plus, Search, Settings, X, ArrowUpRightFromSquare } from "lucide-react";
import { auditLogs, contractors as initialContractors, defaultCommissionRules, payouts as initialPayouts, projects as initialProjects, type Contractor, type Payout, type Project, type ProjectStatus } from "../data/mock-data";
import { navItems, money, initials, sessionStorageKey, projectStorageKey, contractorStorageKey, nameFromEmail } from "../lib/agency";
import type { PageKey, UserRole, ModalKind } from "../lib/agency";
import { Modal } from "./ui";
import { LoginPage, UserPortal } from "./portals";
import { LoadingView, Dashboard } from "./dashboard";
import { ProjectsView, ContractorsView, PayoutsView, FinancialsView, RulesView, SettingsView } from "./views";
import { ProjectForm, ContractorForm, ProjectDetail, ContractorDetail, PayoutDetail } from "./records";

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
      <div className="brand"><Image src="/WhatsApp Image 2026-10-19 at 11.40.12 PM.jpeg" alt="Axionix X — Innovation In Every Pixel" width={376} height={100} className="brand-logo" priority /><button className="icon-button sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button></div>
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
