export type ProfileRole = "admin" | "staff" | "client";

export interface Profile {
  id: string;
  full_name: string;
  role: ProfileRole;
  email: string;
  /** When role is client, links this login to a row in `clients`. */
  client_id?: string | null;
  created_at?: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  demographics: Record<string, unknown>;
  created_at?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ServiceEntry {
  id: string;
  client_id: string;
  service_type_id: string | null;
  staff_id: string | null;
  service_date: string;
  duration_minutes: number | null;
  /** Admin-defined custom fields (JSON), when column exists */
  custom_fields?: Record<string, unknown> | null;
  notes: string | null;
  ai_summary: string | null;
  ai_action_items: string[];
  ai_mood_risk: string | null;
  source: "manual" | "voice";
  audio_transcript: string | null;
  service_types?: { name: string } | null;
  /** Resolved from profiles when available */
  staff_profile?: { full_name: string } | null;
}

export interface StructuredNote {
  summary: string;
  service_type: string;
  action_items: string[];
  mood_risk: string;
  follow_up_date: string | null;
  key_observations: string;
}

export interface ReportSection {
  title: string;
  content: string;
}

export interface FunderReport {
  title: string;
  sections: ReportSection[];
}

export interface Appointment {
  id: string;
  client_id: string;
  staff_id: string | null;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  notes: string | null;
}

export interface GeneratedReport {
  id: string;
  template_id: string | null;
  period_start: string;
  period_end: string;
  narrative: string;
  status: "draft" | "final";
  created_at?: string;
}
