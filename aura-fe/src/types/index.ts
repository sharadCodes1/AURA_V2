// Shared types. ActionPayload MIRRORS aura-ai's app/schemas/action_payload.py —
// keep the two in sync (see docs/action-payload-contract.md).

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export type ActionType =
  | "open_app"
  | "close_app"
  | "type_text"
  | "click"
  | "scroll"
  | "system_control"
  | "run_macro"
  | "unknown";

export interface ActionPayload {
  schema_version: number;
  action: ActionType;
  target: string;
  params: Record<string, unknown>;
  confidence: number;
  spoken_response: string;
  steps?: ActionPayload[] | null;
}

export type CommandStatus = "success" | "failed" | "ambiguous";

export interface CommandLog {
  id: number;
  raw_transcript: string;
  resolved_intent: string;
  action_payload: ActionPayload;
  status: CommandStatus;
  created_at: string;
}

export interface Macro {
  id: number;
  trigger_phrase: string;
  actions: ActionPayload[];
  created_at: string;
}

// An entry in the live command feed on the dashboard.
export interface FeedItem {
  id: string;
  transcript: string;
  payload?: ActionPayload;
  status: "heard" | "executed" | "failed";
  at: number;
}
