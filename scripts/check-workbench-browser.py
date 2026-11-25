#!/usr/bin/env python3
# Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
"""Opt-in actual-browser workbench smoke test; synthetic only.
Requires Node.js, Python Playwright and Chromium. Run from any directory.
Set CHROMIUM_EXECUTABLE if using an installed system browser.
"""
import json
import os
from pathlib import Path
import subprocess
import tempfile
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
START = """import {createWorkbenchServer} from './apps/workbench/server.mjs';
const server=createWorkbenchServer();
server.listen(0,'127.0.0.1',()=>console.log(server.address().port));"""

def check(condition, message):
    if not condition:
        raise RuntimeError(message)

def run():
    # Bound startup via an HTTP-independent subprocess stdout wait.
    import queue
    import threading
    with subprocess.Popen(["node", "--input-type=module", "-e", START], cwd=ROOT,
                          stdout=subprocess.PIPE, text=True) as server:
        try:
            ready = queue.Queue()
            threading.Thread(target=lambda: ready.put(server.stdout.readline()), daemon=True).start()
            port = int(ready.get(timeout=15).strip())
            check(1 <= port <= 65535, "invalid server port")
            base = f"http://127.0.0.1:{port}"
            with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
                executable = os.environ.get("CHROMIUM_EXECUTABLE")
                browser = p.chromium.launch(**({"executable_path": executable} if executable else {}))
                try:
                    for width in (1280, 360):
                        context = browser.new_context(viewport={"width": width, "height": 900}, accept_downloads=True)
                        page = context.new_page()
                        errors, external = [], []
                        page.on("pageerror", lambda error: errors.append(str(error)))
                        def route(request_route):
                            if request_route.request.url.startswith(base + "/"):
                                request_route.continue_()
                            else:
                                external.append(request_route.request.url)
                                request_route.abort()
                        context.route("**/*", route)
                        page.goto(base + "/")
                        page.locator("#reviewed-example").click()
                        page.locator("#analyze").click()
                        expect(page.locator("#summary")).to_contain_text("Bloccato")
                        expect(page.locator("#operations tbody tr")).to_have_count(0)
                        for scenario, count in (("fusion", 4), ("division", 4), ("new_construction", 2)):
                            page.locator("#scenario").select_option(scenario)
                            page.locator("#load").click()
                            expect(page.locator("#status")).to_contain_text("Esempio sintetico caricato")
                            page.locator("#analyze").click()
                            expect(page.locator("#summary")).to_contain_text("Ipotesi di ricerca")
                            expect(page.locator("#operations tbody tr")).to_have_count(count)
                            with page.expect_download() as event:
                                page.locator("#download").click()
                            path = Path(tmp) / "report.json"
                            event.value.save_as(path)
                            report = json.loads(path.read_text(encoding="utf-8"))
                            check(report["state"] == "research_candidate" and report["operative"] is False and report["canExport"] is False, "bad report state")
                            check(len(report["operations"]) == count, "operation mismatch")
                            with page.expect_download() as event:
                                page.locator("#download-dossier").click()
                            dossier = Path(tmp) / "dossier.html"
                            event.value.save_as(dossier)
                            html = dossier.read_text(encoding="utf-8")
                            check(report["caseDigest"] in html and "NON UFFICIALE" in html, "dossier mismatch")
                            # Render downloaded bytes offline without bypassing file:// browser policy.
                            doc = context.new_page()
                            doc.set_content(html)
                            expect(doc.locator("h1")).to_contain_text("dossier diagnostico")
                            expect(doc.locator("table").first.locator("tbody tr")).to_have_count(count)
                            check(doc.locator("script,iframe,form").count() == 0, "active elements")
                            doc.close()
                            with page.expect_download() as event:
                                page.locator("#save-draft").click()
                            draft = Path(tmp) / "draft.json"
                            event.value.save_as(draft)
                            page.locator("#import-draft").set_input_files(draft)
                            expect(page.locator("#status")).to_contain_text("Bozza sintetica importata")
                            expect(page.locator("#download-dossier")).to_be_disabled()
                            page.locator("#analyze").click()
                            expect(page.locator("#summary")).to_contain_text("Ipotesi di ricerca")
                            expect(page.locator("#operations tbody tr")).to_have_count(count)
                        check(page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "horizontal page overflow")
                        check(not errors and not external, f"browser errors or external requests: {errors}, {external}")
                        context.close()
                        print(f"PASS workbench {width}px: blocked reviewed case, 3 diagnostic scenarios, JSON/HTML downloads, draft reimport")
                finally:
                    browser.close()
        finally:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait()

if __name__ == "__main__":
    run()
