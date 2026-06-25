// Typed wrappers around the backend REST API.
import { api } from "@/lib/api";
import type { CommandLog, LoginResponse, Macro, User } from "@/types";
import type { LoginInput, RegisterInput } from "@/lib/validators";

export async function register(input: RegisterInput): Promise<User> {
  const { data } = await api.post<User>("/api/auth/register/", input);
  return data;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/auth/login/", input);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/api/auth/me/");
  return data;
}

export async function fetchCommands(): Promise<CommandLog[]> {
  const { data } = await api.get<CommandLog[]>("/api/commands/");
  return data;
}

export async function fetchMacros(): Promise<Macro[]> {
  const { data } = await api.get<Macro[]>("/api/macros/");
  return data;
}

export async function createMacro(payload: {
  trigger_phrase: string;
  actions: Macro["actions"];
}): Promise<Macro> {
  const { data } = await api.post<Macro>("/api/macros/", payload);
  return data;
}

export async function deleteMacro(id: number): Promise<void> {
  await api.delete(`/api/macros/${id}/`);
}
