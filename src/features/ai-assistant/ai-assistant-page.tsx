"use client";

import { useMemo, useState } from "react";
import { Brain, Check, Clipboard, Mail, MessageSquareText, Sparkles, WandSparkles } from "lucide-react";
import { useDemoStore } from "@/components/shared/demo-provider";
import { Avatar, Badge, Card, SectionHeading } from "@/components/shared/ui";
import { leadCompanyName, ownerName } from "@/lib/format";

type Capability = "score" | "draft" | "summary";

const capabilities: { id: Capability; title: string; description: string; icon: typeof Brain }[] = [
  { id: "score", title: "Lead scoring", description: "Review explainable sample score factors and missing context.", icon: Brain },
  { id: "draft", title: "Follow-up drafting", description: "Write and copy your own message draft while AI is offline.", icon: Mail },
  { id: "summary", title: "Record summary", description: "Select a record and review what a future summary could use.", icon: MessageSquareText },
];

export function AiAssistantPage() {
  const { data } = useDemoStore();
  const [capability, setCapability] = useState<Capability>("score");
  const [selectedId, setSelectedId] = useState(data.leads[0]?.id ?? "");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("Professional and warm");
  const [draft, setDraft] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copyError, setCopyError] = useState("");
  const selectedLead = data.leads.find((lead) => lead.id === selectedId) ?? data.leads[0];
  const selectedCompany = useMemo(() => selectedLead ? data.companies.find((company) => company.id === selectedLead.companyId) : undefined, [data.companies, selectedLead]);
  const capabilityInfo = capabilities.find((item) => item.id === capability) ?? capabilities[0];

  async function copyDraft() {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopyMessage("Draft copied to clipboard.");
      setCopyError("");
    } catch {
      setCopyError("Clipboard access is unavailable in this browser. Select and copy the draft manually.");
      setCopyMessage("");
    }
  }

  return <div className="page-content"><div className="ai-page-heading"><div><p className="eyebrow">Intelligence</p><h1>AI assistant</h1><p className="page-description">A review workspace for planned AI capabilities. Nothing is generated or sent from this demo.</p></div><Badge tone="upcoming"><span className="status-dot" />Not connected</Badge></div>
    <div className="ai-notice" role="status"><Sparkles size={16} /><div><strong>AI is not connected yet</strong>This interface does not call an AI provider. Generation and summarisation require a future backend integration; no fake responses are shown.</div></div>
    <div className="ai-layout"><Card><SectionHeading title="Capabilities" detail="Choose a planned workflow" /><div className="capability-list" role="tablist" aria-label="AI capabilities">{capabilities.map(({ id, title, description, icon: Icon }) => <button className={`capability-button ${capability === id ? "active" : ""}`} role="tab" aria-selected={capability === id} key={id} onClick={() => { setCapability(id); setCopyMessage(""); setCopyError(""); }}><span className="capability-icon"><Icon size={15} /></span><span><strong>{title}</strong><small>{description}</small></span></button>)}</div><div className="backend-note"><strong>Planned integration boundary</strong><p>Connect a protected server action or API route when an approved provider and data policy are in place. Keep provider credentials server-side.</p></div></Card>
      <Card><SectionHeading title={capabilityInfo.title} detail={capabilityInfo.description} />
        <div className="ai-workspace">
          <div className="ai-input-panel"><label className="field-label" htmlFor="ai-record">Lead record</label><select id="ai-record" className="select-control" style={{ width: "100%" }} value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{data.leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {leadCompanyName(data, lead)}</option>)}</select>
            {selectedLead && <div className="ai-record-preview"><div className="table-person"><Avatar initials={selectedLead.name.split(" ").map((part) => part[0]).join("")} color="#dcefe1" /><span><strong>{selectedLead.name}</strong><small>{selectedCompany?.name}</small></span></div><div className="ai-record-facts"><span>Service <strong>{selectedLead.service}</strong></span><span>Status <strong>{selectedLead.status}</strong></span><span>Owner <strong>{ownerName(data, selectedLead.ownerId)}</strong></span><span>Budget <strong>{selectedLead.budget}</strong></span></div></div>}
            {capability === "draft" && <><label className="field-label" htmlFor="draft-tone" style={{ marginTop: 14 }}>Writing tone</label><select id="draft-tone" className="select-control" style={{ width: "100%" }} value={tone} onChange={(event) => setTone(event.target.value)}><option>Professional and warm</option><option>Concise and direct</option><option>Friendly and conversational</option></select></>}
            {capability !== "score" && <><label className="field-label" htmlFor="ai-context" style={{ marginTop: 14 }}>Additional context</label><textarea id="ai-context" className="input-control" rows={4} value={context} onChange={(event) => setContext(event.target.value)} placeholder="Add context you would want included in a future generation request." /><p className="field-hint">This context stays in the current page and is not submitted.</p></>}
            <button className="button button-primary ai-generate-button" disabled title="AI generation is unavailable until a provider is connected."><WandSparkles size={14} />Generation unavailable</button>
          </div>
          <div className="draft-panel">
            {capability === "score" && selectedLead ? <><h3>Explainable sample score</h3><div className="score-explanation"><div className="score-number"><strong>{selectedLead.score}</strong><span>/ 100 · static demo value</span></div><div className="score-track" style={{ width: "100%", marginTop: 7 }}><span style={{ width: `${selectedLead.score}%` }} /></div><div className="score-factors"><div className="score-factor"><span>Service requested</span><strong>Available</strong></div><div className="score-factor"><span>Company context</span><strong>{selectedCompany ? "Available" : "Missing"}</strong></div><div className="score-factor"><span>Budget detail</span><strong>{selectedLead.budget === "Not shared" ? "Missing" : "Available"}</strong></div><div className="score-factor"><span>Decision timeline</span><strong>Needs confirmation</strong></div></div></div><p className="field-hint">These labels explain demo record completeness only. The score is preloaded sample data, not generated by this interface.</p></>
              : capability === "draft" ? <><h3>Message draft</h3><p>Write your own draft here. AI-generated copy is unavailable until the provider is configured.</p><label className="field-label" htmlFor="ai-draft">Editable draft · {tone}</label><textarea id="ai-draft" value={draft} onChange={(event) => { setDraft(event.target.value); setCopyMessage(""); setCopyError(""); }} placeholder="Start a message draft..." /><button className="button" onClick={copyDraft} disabled={!draft.trim()}><Clipboard size={13} />Copy draft</button>{copyMessage && <p className="inline-success" role="status"><Check size={13} />{copyMessage}</p>}{copyError && <p className="form-error" role="alert">{copyError}</p>}</>
                : <><h3>Summary workspace</h3><p>No summary has been generated. The selected record details above are available for future review.</p><div className="summary-source-list"><span><Check size={12} />Lead requirements</span><span><Check size={12} />Relationship status</span><span><Check size={12} />Sample activity history</span></div><div className="summary-placeholder"><MessageSquareText size={17} /><span>Summary output will appear here after a protected AI service is connected.</span></div></>}
          </div>
        </div>
      </Card>
    </div>
  </div>;
}