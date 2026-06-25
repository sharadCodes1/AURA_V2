//! Native OS-control commands invoked from the frontend.
//!
//! The frontend calls `execute_action` with the fields of an AURA ActionPayload
//! (see docs/action-payload-contract.md). This dispatches to the right OS action.
//!
//! Keyboard/mouse use the cross-platform `enigo` crate; app launch and system
//! control shell out to platform tools (macOS `open`/`osascript` here).
//!
//! NOTE (macOS): simulating input and some system actions require granting the app
//! Accessibility permission (System Settings → Privacy & Security → Accessibility).

use std::process::Command;

use enigo::{Axis, Button, Direction, Enigo, Keyboard, Mouse, Settings};
use serde_json::Value;

fn new_enigo() -> Result<Enigo, String> {
    Enigo::new(&Settings::default()).map_err(|e| format!("input init failed: {e}"))
}

/// Single entry point: dispatch an ActionPayload to a concrete OS action.
#[tauri::command]
pub fn execute_action(action: String, target: String, params: Value) -> Result<String, String> {
    log::info!("execute_action action={action} target={target} params={params}");
    match action.as_str() {
        "open_app" => open_app(&target),
        "close_app" => close_app(&target),
        "type_text" => type_text(&target),
        "click" => click(),
        "scroll" => {
            let dir = params
                .get("direction")
                .and_then(Value::as_str)
                .unwrap_or(if target.is_empty() { "down" } else { &target });
            scroll(dir)
        }
        "system_control" => {
            let control = params.get("control").and_then(Value::as_str).unwrap_or(&target);
            let direction = params.get("direction").and_then(Value::as_str).unwrap_or("");
            system_control(control, direction)
        }
        // run_macro is expanded into individual steps by the frontend before calling here.
        other => Err(format!("Unsupported action: {other}")),
    }
}

fn open_app(name: &str) -> Result<String, String> {
    if name.is_empty() {
        return Err("no app name".into());
    }
    let status = match std::env::consts::OS {
        "macos" => Command::new("open").args(["-a", name]).status(),
        "windows" => Command::new("cmd").args(["/C", "start", "", name]).status(),
        _ => Command::new("xdg-open").arg(name).status(),
    };
    match status {
        Ok(s) if s.success() => Ok(format!("opened {name}")),
        Ok(s) => Err(format!("failed to open {name} (exit {s})")),
        Err(e) => Err(format!("failed to open {name}: {e}")),
    }
}

fn close_app(name: &str) -> Result<String, String> {
    if name.is_empty() {
        return Err("no app name".into());
    }
    let result = match std::env::consts::OS {
        "macos" => Command::new("osascript")
            .args(["-e", &format!("quit app \"{name}\"")])
            .status(),
        "windows" => Command::new("taskkill").args(["/IM", name, "/F"]).status(),
        _ => Command::new("pkill").arg(name).status(),
    };
    result
        .map(|_| format!("closed {name}"))
        .map_err(|e| format!("failed to close {name}: {e}"))
}

fn type_text(text: &str) -> Result<String, String> {
    let mut enigo = new_enigo()?;
    enigo.text(text).map_err(|e| format!("type failed: {e}"))?;
    Ok(format!("typed {} chars", text.len()))
}

fn click() -> Result<String, String> {
    let mut enigo = new_enigo()?;
    enigo
        .button(Button::Left, Direction::Click)
        .map_err(|e| format!("click failed: {e}"))?;
    Ok("clicked".into())
}

fn scroll(direction: &str) -> Result<String, String> {
    let mut enigo = new_enigo()?;
    let (axis, amount) = match direction {
        "up" => (Axis::Vertical, -5),
        "down" => (Axis::Vertical, 5),
        "left" => (Axis::Horizontal, -5),
        "right" => (Axis::Horizontal, 5),
        _ => (Axis::Vertical, 5),
    };
    enigo.scroll(amount, axis).map_err(|e| format!("scroll failed: {e}"))?;
    Ok(format!("scrolled {direction}"))
}

fn system_control(control: &str, direction: &str) -> Result<String, String> {
    // macOS implementations; other platforms return a clear "unsupported" error.
    if std::env::consts::OS != "macos" {
        return Err(format!("system_control '{control}' not implemented on this OS"));
    }

    let script: String = match control {
        "volume" => {
            let delta = if direction == "down" { "-10" } else { "+10" };
            format!("set volume output volume (output volume of (get volume settings) {delta})")
        }
        "mute" => "set volume output muted true".to_string(),
        "lock" => {
            return run_cmd("pmset", &["displaysleepnow"]).map(|_| "locked".into());
        }
        "sleep" => {
            return run_cmd("pmset", &["sleepnow"]).map(|_| "sleeping".into());
        }
        "screenshot" => {
            let path = format!(
                "{}/Desktop/aura_screenshot.png",
                std::env::var("HOME").unwrap_or_default()
            );
            return run_cmd("screencapture", &["-x", &path]).map(|_| "screenshot saved".into());
        }
        "shutdown" => "tell app \"System Events\" to shut down".to_string(),
        "restart" => "tell app \"System Events\" to restart".to_string(),
        "brightness" => {
            // key code 144 = brightness up, 145 = brightness down
            let code = if direction == "down" { "145" } else { "144" };
            format!("tell application \"System Events\" to key code {code}")
        }
        other => return Err(format!("unknown system control: {other}")),
    };

    run_cmd("osascript", &["-e", &script]).map(|_| format!("{control} {direction}").trim().to_string())
}

fn run_cmd(program: &str, args: &[&str]) -> Result<(), String> {
    Command::new(program)
        .args(args)
        .status()
        .map_err(|e| format!("{program} failed: {e}"))
        .and_then(|s| {
            if s.success() {
                Ok(())
            } else {
                Err(format!("{program} exited with {s}"))
            }
        })
}
