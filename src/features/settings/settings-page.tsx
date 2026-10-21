"use client";

import { useEffect, useState } from "react";
import { Bell, BriefcaseBusiness, Check, CircleUserRound, Eye, KeyRound, Save, Sparkles, UsersRound } from "lucide-react";
import { useDemoStore } from "@/components/shared/demo-provider";
import { Avatar, Badge, Card, PageTitle, SectionHeading } from "@/components/shared/ui";

type SettingsTab = "workspace" | "team" | "roles" | "notifications" | "display" | "ai";
type ToggleKey = "overdue" | "dealChanges" | "weeklyDigest" | "projectUpdates";

const tabs: { id: SettingsTab; label: string; icon: typeof Bell }[] = [
  { id: "workspace", label: "Workspace profile", icon: BriefcaseBusiness },
  { id: "team", label: "Team members", icon: UsersRound },
  { id: "roles", label: "Roles & access", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "display", label: "Display", icon: Eye },
  { id: "ai", label: "AI configuration", icon: Sparkles },
];

const roles = [
  { name: "Workspace owner", description: "Owns the workspace profile and coordinates team-wide settings." },
  { name: "Account manager", description: "Coordinates client relationships, follow-ups, and account context." },
  { name: "Sales lead", description: "Maintains lead qualification, deal stages, and pipeline reporting." },
  { name: "Delivery lead", description: "Coordinates active projects, milestones, and client delivery." },
];

function PreferenceToggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return <button className="switch" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />;
}

export function SettingsPage() {
  const { data } = useDemoStore();
  const [tab, setTab] = useState<SettingsTab>("workspace");
  const [workspaceName, setWorkspaceName] = useState("Northstar Agency");
  const [website, setWebsite] = useState("northstaragency.co");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [saved, setSaved] = useState(false);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({ ow1: "Workspace owner", ow2: "Account manager", ow3: "Sales lead", ow4: "Delivery lead" });
  const [preferences, setPreferences] = useState<Record<ToggleKey, boolean>>({ overdue: true, dealChanges: true, weeklyDigest: false, projectUpdates: true });
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [dateFormat, setDateFormat] = useState("Oct 18, 2026");

  useEffect(() => {
    document.documentElement.dataset.density = density;
    return () => { delete document.documentElement.dataset.density; };
  }, [density]);

  function saveWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return <div className="page-content"><PageTitle eyebrow="Workspace" title="Settings" description="Manage the demo workspace profile, preferences, and team overview. Settings are not backed by a server." />
    <div className="settings-layout"><nav className="settings-tabs" aria-label="Settings sections" role="tablist">{tabs.map(({ id, label, icon: Icon }) => <button className={tab === id ? "active" : ""} key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}><Icon size={14} />{label}</button>)}</nav>
      <div className="settings-section" role="tabpanel">
        {tab === "workspace" && <>
          <Card><SectionHeading title="Workspace profile" detail="Sample settings for this demo workspace." /><form className="settings-form" onSubmit={saveWorkspace}><div className="form-grid"><div className="form-field"><label className="field-label" htmlFor="workspace-name">Workspace name</label><input id="workspace-name" className="input-control" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} required /></div><div className="form-field"><label className="field-label" htmlFor="workspace-website">Website</label><input id="workspace-website" className="input-control" value={website} onChange={(event) => setWebsite(event.target.value)} /></div><div className="form-field"><label className="field-label" htmlFor="workspace-industry">Agency focus</label><input id="workspace-industry" className="input-control" value="Web development & digital marketing" readOnly /></div><div className="form-field"><label className="field-label" htmlFor="workspace-timezone">Timezone</label><select id="workspace-timezone" className="select-control" style={{ width: "100%" }} value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value="America/Los_Angeles">Pacific Time</option><option value="America/Denver">Mountain Time</option><option value="America/Chicago">Central Time</option><option value="America/New_York">Eastern Time</option><option value="UTC">UTC</option></select></div></div><div className="settings-save-row"><p className="field-hint">Edits are held in page state only and reset on refresh.</p><button className="button button-primary" type="submit"><Save size={13} />Save demo profile</button></div>{saved && <p className="inline-success" role="status"><Check size={13} />Demo workspace profile updated for this session.</p>}</form></Card>
          <Card><SectionHeading title="Current demo user" detail="Public demonstration identity; no sign-in required." /><div className="settings-user-card"><Avatar initials="MC" color="#c4e7d1" /><span><strong>Maya Chen</strong><small>Workspace owner · demonstration identity</small></span><Badge tone="upcoming">Demo only</Badge></div></Card>
        </>}
        {tab === "team" && <>
          <Card><SectionHeading title="Team directory" detail={`${data.owners.length} sample team members · no accounts are connected.`} /><div className="table-wrap"><table className="team-table"><thead><tr><th>Team member</th><th>Demo role</th><th>Record ownership</th></tr></thead><tbody>{data.owners.map((owner) => <tr key={owner.id}><td><span className="team-person"><Avatar initials={owner.initials} color={owner.color} /><span><strong>{owner.name}</strong><small>Sample team member</small></span></span></td><td><select className="select-control" value={memberRoles[owner.id] ?? "Account manager"} onChange={(event) => setMemberRoles((current) => ({ ...current, [owner.id]: event.target.value }))} aria-label={`Demo role for ${owner.name}`}>{roles.map((role) => <option key={role.name}>{role.name}</option>)}</select></td><td>{data.leads.filter((lead) => lead.ownerId === owner.id).length + data.deals.filter((deal) => deal.ownerId === owner.id).length} linked leads & deals</td></tr>)}</tbody></table></div><p className="field-hint">Role selections are local demo preferences. There are no sign-in accounts or permission checks.</p></Card>
          <Card><SectionHeading title="Team workspace" detail="Team data currently lives in the shared typed sample dataset." /><div className="settings-row"><span><strong>Team members</strong><p>{data.owners.length} demo owner records</p></span><Badge tone="upcoming">Sample data</Badge></div><div className="settings-row"><span><strong>Account ownership</strong><p>Leads, contacts, companies, deals, and projects reference these sample owners.</p></span><Badge tone="completed">Linked</Badge></div></Card>
        </>}
        {tab === "roles" && <>
          <Card><SectionHeading title="Role overview" detail="Descriptions for the planned workspace roles." />{roles.map((role) => <div className="role-row" key={role.name}><span className="role-icon"><CircleUserRound size={15} /></span><span><strong>{role.name}</strong><small>{role.description}</small></span><Badge>Informational</Badge></div>)}</Card>
          <div className="settings-boundary"><KeyRound size={15} /><span><strong>Public read-only demo</strong><small>CRM records shown here are sample data. Public create, update, and delete requests are disabled.</small></span></div>
        </>}
        {tab === "notifications" && <Card><SectionHeading title="Notification preferences" detail="These switches update the current page state only." />
          <div className="settings-row"><span><strong>Overdue follow-ups</strong><p>Show overdue activity reminders in the workspace header.</p></span><PreferenceToggle checked={preferences.overdue} label="Overdue follow-up notifications" onChange={(checked) => setPreferences((current) => ({ ...current, overdue: checked }))} /></div>
          <div className="settings-row"><span><strong>Deal stage changes</strong><p>Include pipeline movement in your activity summary.</p></span><PreferenceToggle checked={preferences.dealChanges} label="Deal stage change notifications" onChange={(checked) => setPreferences((current) => ({ ...current, dealChanges: checked }))} /></div>
          <div className="settings-row"><span><strong>Weekly digest</strong><p>Show a sample summary preference for Monday mornings.</p></span><PreferenceToggle checked={preferences.weeklyDigest} label="Weekly digest" onChange={(checked) => setPreferences((current) => ({ ...current, weeklyDigest: checked }))} /></div>
          <div className="settings-row"><span><strong>Project updates</strong><p>Include delivery and deadline reminders.</p></span><PreferenceToggle checked={preferences.projectUpdates} label="Project update notifications" onChange={(checked) => setPreferences((current) => ({ ...current, projectUpdates: checked }))} /></div>
          <p className="field-hint">No email, push, or background notifications are sent by this demo.</p></Card>}
        {tab === "display" && <>
          <Card><SectionHeading title="Display preferences" detail="The density option applies while this settings page is open." /><div className="settings-row"><span><strong>Interface density</strong><p>Choose how much space appears around CRM content.</p></span><div className="segmented-control" role="group" aria-label="Interface density"><button className={density === "comfortable" ? "active" : ""} aria-pressed={density === "comfortable"} onClick={() => setDensity("comfortable")}>Comfortable</button><button className={density === "compact" ? "active" : ""} aria-pressed={density === "compact"} onClick={() => setDensity("compact")}>Compact</button></div></div><div className="settings-row"><span><strong>Date format preview</strong><p>Sample preference; affects this preview only.</p></span><select className="select-control" value={dateFormat} onChange={(event) => setDateFormat(event.target.value)} aria-label="Date format"><option>Oct 18, 2026</option><option>18 Oct 2026</option><option>2026-10-18</option></select></div><div className="display-preview"><span><small>Preview</small><strong>Next client review</strong></span><span>{dateFormat} · {density}</span></div></Card>
          <Card><SectionHeading title="Accessibility" /><div className="settings-row"><span><strong>Reduced motion</strong><p>The interface respects your operating-system motion preference.</p></span><Badge tone="completed">System setting</Badge></div><div className="settings-row"><span><strong>Keyboard focus</strong><p>Visible focus rings are enabled for interactive controls.</p></span><Badge tone="completed">Enabled</Badge></div></Card>
        </>}
        {tab === "ai" && <>
          <Card><SectionHeading title="AI configuration" detail="Provider status for planned AI-assisted workflows." /><div className="ai-status-card"><span className="ai-status-icon"><Sparkles size={17} /></span><span><strong>No provider connected</strong><small>Lead scoring, message generation, and summarisation are not available.</small></span><Badge tone="overdue">Not configured</Badge></div><div className="settings-row"><span><strong>Provider credentials</strong><p>Would be stored securely on a future server integration.</p></span><Badge>Not set</Badge></div><div className="settings-row"><span><strong>Data handling policy</strong><p>Define record fields and consent requirements before enabling AI features.</p></span><Badge>Needs review</Badge></div><button className="button" disabled title="Configure AI after a server-side provider integration exists.">Provider setup unavailable</button></Card>
          <div className="settings-boundary"><Sparkles size={15} /><span><strong>Nothing is sent externally</strong><small>This demo does not call an AI provider or include generated responses.</small></span></div>
        </>}
      </div>
    </div>
  </div>;
}