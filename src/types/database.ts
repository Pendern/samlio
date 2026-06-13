// Mitt Sameie V5 — Multi-tenant datamodell
// Alle tabeller har tenant_id for dataisolasjon (RLS i Supabase)

export type UserRole = "styreleder" | "styremedlem" | "varamedlem" | "vaktmester" | "beboer" | "ekstern";

export type CaseStatus = "ny" | "under_behandling" | "vedtatt" | "avvist" | "utsatt" | "arkivert";
export type TaskStatus = "ny" | "pagar" | "ferdig";
export type MeetingType = "styremote" | "arsmote" | "ekstraordinart";
export type DecisionResult = "vedtatt" | "avvist" | "utsatt";
export type AiSuggestionStatus = "pending" | "accepted" | "rejected" | "deferred";
export type HmsControlFrequency = "monthly" | "quarterly" | "biannual" | "annual";
export type HmsDeviationSeverity = "lav" | "middels" | "hoy" | "kritisk";
export type MaintenanceCondition = "god" | "akseptabel" | "darlig" | "kritisk";

// ── Fase 0: Grunnmur ──────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  org_nr: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  year_built: number | null;
  num_units: number | null;
  building_type: string | null;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  tenant_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  tenant_id: string;
  unit_number: string;
  unit_type: string | null;
  size_sqm: number | null;
  floor: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitOwner {
  id: string;
  unit_id: string;
  profile_id: string;
  is_primary: boolean;
  moved_in_at: string | null;
  moved_out_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AiSuggestion {
  id: string;
  tenant_id: string;
  type: string;
  context_json: Record<string, unknown> | null;
  suggestion_text: string;
  status: AiSuggestionStatus;
  source_refs: string[] | null;
  model_used: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

// ── Fase 1: Styrearbeid ────────────────────────────────────────

export interface BoardCase {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: CaseStatus;
  created_by: string;
  assigned_to: string | null;
  meeting_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  tenant_id: string;
  filename: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  case_id: string | null;
  labels: string[] | null;
  uploaded_by: string;
  ai_summary: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  case_id: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Fase 2: Møter ──────────────────────────────────────────────

export interface BoardMeeting {
  id: string;
  tenant_id: string;
  meeting_type: MeetingType;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  video_link: string | null;
  agenda_items: string[] | null;
  ai_protocol_draft: string | null;
  signed_protocol_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BoardDecision {
  id: string;
  tenant_id: string;
  case_id: string;
  meeting_id: string;
  decision_text: string;
  result: DecisionResult;
  votes_for: number | null;
  votes_against: number | null;
  votes_abstain: number | null;
  created_at: string;
}

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  profile_id: string;
  status: "confirmed" | "declined" | "pending";
  proxy_for: string | null;
}

// ── Fase 3: HMS ────────────────────────────────────────────────

export interface HmsArea {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  area_type: string; // brann, el, lekeplass, garasje, uteområde, tak, rømningsvei
  risk_level: HmsDeviationSeverity;
  created_at: string;
}

export interface HmsControl {
  id: string;
  tenant_id: string;
  area_id: string;
  title: string;
  description: string | null;
  frequency: HmsControlFrequency;
  responsible_id: string | null;
  next_due_date: string;
  last_completed_at: string | null;
  created_at: string;
}

export interface HmsChecklist {
  id: string;
  control_id: string;
  items: HmsChecklistItem[];
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
}

export interface HmsChecklistItem {
  label: string;
  checked: boolean;
  note: string | null;
}

export interface HmsDeviation {
  id: string;
  tenant_id: string;
  area_id: string;
  title: string;
  description: string;
  severity: HmsDeviationSeverity;
  status: "open" | "in_progress" | "resolved";
  reported_by: string;
  assigned_to: string | null;
  due_date: string | null;
  resolved_at: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

// ── Fase 4: Vedlikehold ────────────────────────────────────────

export interface MaintenanceItem {
  id: string;
  tenant_id: string;
  building_part: string; // NS3451-inspirert
  description: string;
  condition: MaintenanceCondition;
  expected_lifetime_years: number | null;
  last_maintained_at: string | null;
  next_maintenance_at: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  notes: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
}
