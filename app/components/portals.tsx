import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Activity, ArrowRight, BriefcaseBusiness, CheckCircle2, LogOut, ShieldCheck, UserRound, Mail, LockKeyhole } from "lucide-react";
import { type Project } from "../data/mock-data";
import { initials } from "../lib/agency";
import type { UserRole } from "../lib/agency";
import { StatusBadge, Panel, EmptyState, MiniStat } from "./ui";

export function LoginPage({ onLogin }: { onLogin: (event: FormEvent<HTMLFormElement>, role: UserRole) => string | null }) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [error, setError] = useState("");

  return <main className="auth-page">
    <section className="auth-brand-panel">
      <div className="auth-brand"><Image src="/WhatsApp Image 2026-10-19 at 11.40.12 PM.jpeg" alt="Axionix X — Innovation In Every Pixel" width={376} height={100} className="brand-logo" priority /></div>
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

export function UserPortal({ profile, projects, onLogout }: { profile: { name: string; email: string }; projects: Project[]; onLogout: () => void }) {
  const activeCount = projects.filter((project) => project.status === "Active").length;
  return <main className="user-portal">
    <header className="user-portal-header"><div className="brand"><Image src="/WhatsApp Image 2026-10-19 at 11.40.12 PM.jpeg" alt="Axionix X — Innovation In Every Pixel" width={376} height={100} className="brand-logo" priority /></div><div className="user-portal-account"><span className="avatar avatar-admin">{initials(profile.name)}</span><span><strong>{profile.name}</strong><small>Project user</small></span><button className="button button-secondary button-small" onClick={onLogout}><LogOut size={14} /> Sign out</button></div></header>
    <div className="content-area user-portal-content"><div className="page-intro"><div><div className="date-kicker"><BriefcaseBusiness size={13} /> YOUR WORKSPACE</div><h1>My projects</h1><p>Projects assigned to you and their latest status.</p></div></div>
      <div className="mini-stat-grid user-project-stats"><MiniStat label="Assigned projects" value={String(projects.length).padStart(2, "0")} icon={<BriefcaseBusiness size={16} />} /><MiniStat label="Active projects" value={String(activeCount).padStart(2, "0")} icon={<Activity size={16} />} /><MiniStat label="Completed projects" value={String(projects.length - activeCount).padStart(2, "0")} icon={<CheckCircle2 size={16} />} /></div>
      <Panel className="user-project-panel"><div className="section-heading"><div><h2>Assigned to me</h2><p>{projects.length} projects</p></div></div>{projects.length ? <div className="user-project-list">{projects.map((project) => <article className="user-project-row" key={project.id}><span className={`client-logo logo-${project.id.slice(-1)}`}>{initials(project.client)}</span><div className="user-project-main"><strong>{project.title}</strong><span>{project.client} · {project.id}</span></div><div className="user-project-assignees"><small>ASSIGNED TEAM</small><span>{project.execution.join(", ")}</span></div><div className="user-project-deadline"><small>DEADLINE</small><span>{new Date(`${project.deadline}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div><StatusBadge status={project.status} /></article>)}</div> : <EmptyState title="No projects assigned yet" body="Your administrator's new project assignments will appear here." />}</Panel>
      <footer className="page-footer"><span>© 2026 Axionix Studio</span><span><span className="system-dot" /> Workspace up to date</span></footer>
    </div>
  </main>;
}
