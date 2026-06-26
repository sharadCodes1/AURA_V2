"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createMacro, deleteMacro, fetchMacros } from "@/lib/services";
import type { ActionPayload, ActionType, Macro } from "@/types";

const ACTION_TYPES: ActionType[] = [
  "open_app",
  "close_app",
  "type_text",
  "click",
  "scroll",
  "system_control",
];

interface StepDraft {
  action: ActionType;
  target: string;
}

export default function MacrosPage() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [trigger, setTrigger] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([{ action: "open_app", target: "" }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    fetchMacros().then(setMacros).catch(() => setError("Could not load macros."));
  }

  useEffect(load, []);

  function updateStep(i: number, patch: Partial<StepDraft>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, { action: "open_app", target: "" }]);
  }

  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!trigger.trim()) {
      setError("Trigger phrase is required.");
      return;
    }
    const actions: ActionPayload[] = steps
      .filter((s) => s.target.trim() || s.action === "scroll")
      .map((s) => ({
        schema_version: 1,
        action: s.action,
        target: s.target.trim(),
        params: {},
        confidence: 1,
        spoken_response: "",
      }));
    setSaving(true);
    try {
      await createMacro({ trigger_phrase: trigger.trim(), actions });
      setTrigger("");
      setSteps([{ action: "open_app", target: "" }]);
      load();
    } catch {
      setError("Could not save macro (is the trigger phrase already used?).");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    await deleteMacro(id);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Macros</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Chain several actions under one phrase — say it to run them all.
      </p>

      <form onSubmit={save} className="card p-5 mb-8">
        <div className="mb-4 max-w-sm">
          <Input
            label="Trigger phrase"
            name="trigger"
            placeholder="e.g. work mode"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
          />
        </div>

        <span className="label">Steps</span>
        <div className="flex flex-col gap-2 mt-2 mb-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-zinc-600 w-4 tabular-nums">{i + 1}</span>
              <select
                value={step.action}
                onChange={(e) => updateStep(i, { action: e.target.value as ActionType })}
                className="field !w-44 font-mono"
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <input
                value={step.target}
                onChange={(e) => updateStep(i, { target: e.target.value })}
                placeholder="target (e.g. chrome)"
                className="field flex-1"
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="text-zinc-600 hover:text-red-400 px-2 text-lg leading-none"
                aria-label="Remove step"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={addStep}>
            + Add step
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save macro"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </form>

      <h2 className="text-sm font-medium text-zinc-400 mb-3">Your macros</h2>
      {macros.length === 0 ? (
        <p className="text-zinc-600 text-sm py-6 text-center border border-dashed border-line rounded-xl">
          No macros yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {macros.map((m) => (
            <li key={m.id} className="card px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-medium">{m.trigger_phrase}</span>
                <div className="text-xs text-zinc-500 mt-1 font-mono truncate">
                  {m.actions.map((a) => `${a.action}${a.target ? `:${a.target}` : ""}`).join(" → ")}
                </div>
              </div>
              <button
                onClick={() => remove(m.id)}
                className="text-zinc-500 hover:text-red-400 text-sm shrink-0"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
