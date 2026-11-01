#!/usr/bin/env python3
# A smoke test of opencode-ask in a real OpenCode TUI, with no model called.
#
# usage: python3 scripts/smoke.py [--opencode <binary>] [--keep]      (needs pyte: pip install pyte)
#
# OpenCode runs in a pseudo-terminal against throwaway folders, with the plugin from this checkout. The test opens the
# command palette, runs "Open side chat", and checks that the panel opens and closes, that the screen never shows a
# plugin error, and that OpenCode logs none.
import argparse, json, os, pty, re, select, shutil, subprocess, sys, tempfile, time

import pyte

parser = argparse.ArgumentParser()
parser.add_argument("--opencode", default=os.environ.get("OPENCODE_BIN") or os.path.expanduser("~/.opencode/bin/opencode"))
parser.add_argument("--keep", action="store_true")
args = parser.parse_args()
repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
home = tempfile.mkdtemp(prefix="opencode-ask-smoke-")
project = os.path.join(home, "project")
os.makedirs(project)
env = {k: v for k, v in os.environ.items() if not k.startswith(("XDG_", "OPENCODE_", "BUN_BE_BUN"))}
env.update(XDG_DATA_HOME=f"{home}/data", XDG_CONFIG_HOME=f"{home}/config", XDG_STATE_HOME=f"{home}/state", XDG_CACHE_HOME=f"{home}/cache",
           PWD=project, TERM="xterm-256color", COLUMNS="120", LINES="40", OPENCODE_CLI_CONFIG_CONTENT=json.dumps({"plugins": [repo]}))
ERRORS = ("explicit resource owner", "Plugin failed", "Invalid V2 TUI plugin", "crashed", "TypeError", "ReferenceError")

failed = False
def check(name, ok, detail=""):
    global failed
    print(f"  {'ok  ' if ok else 'FAIL'}  {name}{': ' + detail if detail else ''}", flush=True)
    failed = failed or not ok

version = subprocess.run([args.opencode, "--version"], env=env, capture_output=True, text=True).stdout.strip()
print(f"{version}, opencode-ask from {repo}", flush=True)
created = subprocess.run([args.opencode, "api", "--standalone", "session.create", "-d", json.dumps({"title": "smoke test"})],
                         cwd=project, env=env, capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=180)
session = json.loads(created.stdout)["data"]["id"]

pid, fd = pty.fork()
if pid == 0:
    os.chdir(project)
    os.execve(args.opencode, [args.opencode, "--standalone", "--session", session], env)
screen = pyte.Screen(120, 40)
stream = pyte.ByteStream(screen)
seen_errors = set()
def shown():
    text = "\n".join(line.rstrip() for line in screen.display)
    seen_errors.update(error for error in ERRORS if error in text)
    return text
def wait_for(predicate, seconds):
    end = time.time() + seconds
    while time.time() < end:
        if select.select([fd], [], [], 0.2)[0]:
            try:
                stream.feed(os.read(fd, 65536))
            except OSError:
                break
        if predicate(shown()):
            return True
    return False
def keys(text, delay=0.05):
    for ch in text:
        os.write(fd, ch.encode())
        time.sleep(delay)

try:
    check("the TUI starts with the plugin", wait_for(lambda text: "commands" in text, 90))
    os.write(fd, b"\x10")  # ctrl+p, the command palette
    wait_for(lambda text: False, 1.5)
    keys("side chat")
    check("Open side chat is in the command palette", wait_for(lambda text: "Open side chat" in text, 10))
    os.write(fd, b"\r")
    check("it opens the side chat panel", wait_for(lambda text: "Ask anything about this session" in text, 15))
    os.write(fd, b"\x1b")
    check("esc closes the panel", wait_for(lambda text: "Ask anything about this session" not in text, 10))
    check("the screen never showed an error", not seen_errors, ", ".join(sorted(seen_errors)))
finally:
    for _ in range(2):
        os.write(fd, b"\x03")
        wait_for(lambda text: False, 1)
    try:
        os.kill(pid, 9)
    except ProcessLookupError:
        pass

logs = os.path.join(home, "data", "opencode", "log")
problems = []
for name in sorted(os.listdir(logs)) if os.path.isdir(logs) else []:
    for line in open(os.path.join(logs, name), errors="replace"):
        if re.search(r"level=(ERROR|WARN)", line) and re.search(r"plugin|opencode-ask|opentui", line, re.I):
            problems.append(line.strip()[:200])
check("OpenCode logged no plugin error", not problems, "; ".join(problems[:3]))

if failed:
    print(f"Failed. The run is kept in {home}")
    sys.exit(1)
print("All checks passed.")
if args.keep:
    print(f"The run is kept in {home}")
else:
    shutil.rmtree(home, ignore_errors=True)
