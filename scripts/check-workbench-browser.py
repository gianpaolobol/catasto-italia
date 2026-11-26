#!/usr/bin/env python3
# Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
"""Opt-in actual-browser workbench smoke test; synthetic only.
Requires Node.js, Python Playwright and Chromium. Run from any directory.
Set CHROMIUM_EXECUTABLE if using an installed system browser.
"""
import json
import hashlib
import zipfile
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
                        expect(page.locator("#inventory tbody tr")).to_have_count(0)
                        expect(page.locator("#handoff-download")).to_be_disabled()
                        expect(page.locator('#income-unit')).to_be_disabled()
                        for scenario, count in (("fusion", 4), ("division", 4), ("new_construction", 2), ("internal_distribution", 2), ("destination_change", 3), ("enlargement", 3)):
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
                            for phase, excluded in (("before", "C"), ("after", "S")):
                                n = sum(len(o["identifiers"]) for o in report["operations"] if o["operation"] != excluded)
                                expect(page.locator(f'#inventory table[data-phase="{phase}"] tbody tr')).to_have_count(n)
                                check(page.locator(f'#inventory table[data-phase="{phase}"] tbody').text_content().count("other") >= 1, "unchanged unit missing")
                            if scenario == "enlargement":
                                check(report["candidate"]["counts"] == {"S": 1, "C": 1, "V": 0}, "enlargement counts")
                                check("Sagoma in mappa dichiarata invariata" in report["relation"], "missing map prerequisite")
                            exchange = page.locator('details').filter(has=page.get_by_text('Interscambio Building Core sintetico', exact=True))
                            if not exchange.evaluate('(e) => e.open'):
                                exchange.locator('summary').click()
                            for target in ('pianta-libera', 'mpe', 'ape-italia'):
                                page.locator('#handoff-target').select_option(target)
                                with page.expect_download() as event:
                                    page.locator('#handoff-download').click()
                                exchange_file = Path(tmp) / 'handoff.json'
                                event.value.save_as(exchange_file)
                                handoff = json.loads(exchange_file.read_text(encoding='utf-8'))
                                check(handoff['caseDigest'] == report['caseDigest'] and handoff['target'] == target, 'handoff mismatch')
                                check(all(v is False for v in handoff['assertions'].values()), 'unexpected approval')
                                check(handoff['operations'] == [{'unitId': o['unitId'], 'operation': o['operation']} for o in report['operations'] if o['operation'] in ('C', 'V')], 'handoff operations mismatch')
                            income = page.locator('details').filter(has=page.get_by_text('Classamento dichiarato e simulazione rendita', exact=True))
                            if not income.evaluate('(e) => e.open'):
                                income.locator('summary').click()
                            page.locator('#income-unit').select_option(index=1)
                            page.locator('#income-example').click()
                            page.locator('#income-lookup').click()
                            expect(page.locator('#income-source')).to_contain_text('Catalogo di prova v1')
                            expect(page.locator('#income-tariff')).to_have_value('123.4567')
                            page.locator('#income-calculate').click()
                            expect(page.locator('#income-result')).to_contain_text('555.5551500')
                            with page.expect_download() as event:
                                page.locator('#income-download').click()
                            income_file = Path(tmp) / 'income.json'
                            event.value.save_as(income_file)
                            worksheet = json.loads(income_file.read_text(encoding='utf-8'))
                            check(worksheet['caseDigest'] == report['caseDigest'] and worksheet['exactProductEur'] == '555.5551500', 'income mismatch')
                            check(worksheet['declared']['sourceId'] == 'synthetic-catalog-v1', 'catalog provenance missing')
                            check(worksheet['officialTariffVerified'] is False and worksheet['operative'] is False, 'unexpected income approval')
                            page.locator('#income-tariff').fill('0')
                            expect(page.locator('#income-download')).to_be_disabled()
                            page.locator('#income-calculate').click()
                            expect(page.locator('#income-result')).to_contain_text('Calcolo bloccato')
                            expect(page.locator('#income-download')).to_be_disabled()
                            page.locator('#income-example').click()
                            page.locator('#income-calculate').click()
                            expect(page.locator('#income-result')).to_contain_text('555.5551500')
                            expect(page.locator('#income-download')).to_be_enabled()
                            with page.expect_download() as event:
                                page.locator("#download-dossier").click()
                            dossier = Path(tmp) / "dossier.html"
                            event.value.save_as(dossier)
                            html = dossier.read_text(encoding="utf-8")
                            check(report["caseDigest"] in html and "NON UFFICIALE" in html, "dossier mismatch")
                            check("555.5551500" in html and "Nessuna misura corrente inclusa." in html, "income-only dossier mismatch")
                            # Render downloaded bytes offline without bypassing file:// browser policy.
                            doc = context.new_page()
                            doc.set_content(html)
                            expect(doc.locator("h1")).to_contain_text("dossier diagnostico")
                            expect(doc.locator("table").first.locator("tbody tr")).to_have_count(count)
                            expect(doc.get_by_role("heading", name="Inventario diagnostico ante e post")).to_have_count(1)
                            check(doc.locator("script,iframe,form").count() == 0, "active elements")
                            doc.close()
                            panel = page.locator('details').filter(has=page.get_by_text('Misura geometrica sintetica', exact=True))
                            if not panel.evaluate('(e) => e.open'):
                                panel.locator(':scope > summary').click()
                            page.locator('#geometry-unit').select_option(index=1)
                            page.locator('#geometry-example').click()
                            page.locator('#geometry-measure').click()
                            expect(page.locator('#geometry-result')).to_contain_text('8.000000 m²')
                            expect(page.locator('#geometry-preview polygon')).to_have_count(1)
                            expect(page.locator('#geometry-preview')).to_contain_text('4000 × 3000 mm')
                            with page.expect_download() as event:
                                page.locator('#geometry-download').click()
                            annex = Path(tmp) / 'geometry.json'
                            event.value.save_as(annex)
                            measured = json.loads(annex.read_text(encoding='utf-8'))
                            check(measured['caseDigest'] == report['caseDigest'] and measured['areaMm2'] == '8000000', 'annex mismatch')
                            with page.expect_download() as event:
                                page.locator("#download-dossier").click()
                            event.value.save_as(dossier)
                            both = dossier.read_text(encoding="utf-8")
                            check("555.5551500" in both and "8.000000" in both and "14000" in both, "integrated dossier mismatch")
                            page.locator('#geometry-vertices').fill('[]')
                            expect(page.locator('#geometry-preview polygon')).to_have_count(0)
                            expect(page.locator('#geometry-download')).to_be_disabled()
                            # Separate annexes: editing geometry does not change the case or the income declaration.
                            expect(page.locator('#income-download')).to_be_enabled()
                            expect(page.locator('#income-unit')).to_be_enabled()
                            page.locator('#geometry-measure').click()
                            expect(page.locator('#geometry-result')).to_contain_text('Contorno bloccato')
                            with page.expect_download() as event:
                                page.locator("#download-dossier").click()
                            event.value.save_as(dossier)
                            after_edit = dossier.read_text(encoding="utf-8")
                            check("555.5551500" in after_edit and "Nessuna misura corrente inclusa." in after_edit and "8.000000" not in after_edit, "stale geometry included")
                            if scenario == "division":
                                # One unit, two contours on a common declared plane.
                                page.locator('#geometry-multi-example').click()
                                page.locator('#geometry-measure').click()
                                expect(page.locator('#geometry-result')).to_contain_text('10.000000')
                                expect(page.locator('#geometry-preview polygon')).to_have_count(2)
                                with page.expect_download() as event:
                                    page.locator('#download-dossier').click()
                                event.value.save_as(dossier)
                                contour_html = dossier.read_text(encoding='utf-8')
                                check(contour_html.count('<polygon points=') == 2 and '10.000000' in contour_html, 'multi-contour dossier missing')
                                page.locator('#geometry-vertices').fill('[[[0,0],[4000,0],[4000,2000],[0,2000]],[[4000,0],[5000,0],[5000,1000],[4000,1000]]]')
                                page.locator('#geometry-measure').click()
                                expect(page.locator('#geometry-result')).to_contain_text('contours_not_disjoint')
                                expect(page.locator('#geometry-preview polygon')).to_have_count(0)
                                # [Codex] Restore first unit via explicit declared drawing scale.
                                page.get_by_text('Converti coordinate del disegno in millimetri', exact=True).click()
                                page.locator('#scale-example').click()
                                page.locator('#scale-convert').click()
                                expect(page.locator('#scale-status')).to_contain_text('Scala non verificata')
                                page.locator('#geometry-measure').click()
                                expect(page.locator('#geometry-result')).to_contain_text('8.000000')
                                page.locator('#scale-drawing').fill('3')
                                page.locator('#scale-mm').fill('1')
                                page.locator('#scale-convert').click()
                                expect(page.locator('#scale-status')).to_contain_text('non_integral_millimetres')
                                expect(page.locator('#geometry-result')).to_contain_text('8.000000')
                                # A failed conversion leaves the previously applied vertices unchanged.
                                # [Codex] Both local origins are explicit; never infer relative placement.
                                page.locator('#placement-floor').fill('P0')
                                page.locator('#placement-x').fill('0')
                                page.locator('#placement-y').fill('0')
                                page.locator('#geometry-measure').click()
                                expect(page.locator('#floor-preview polygon')).to_have_count(1)

                                page.locator('#geometry-unit').select_option(index=2)
                                page.locator('#geometry-vertices').fill('[[0,0],[2000,0],[2000,1000],[0,1000]]')
                                page.locator('#placement-floor').fill('P0')
                                page.locator('#placement-x').fill('4000')
                                page.locator('#placement-y').fill('0')
                                page.locator('#geometry-measure').click()
                                expect(page.locator('#geometry-count')).to_contain_text('2')
                                page.locator('#income-unit').select_option(index=2)
                                page.locator('#income-example').click()
                                page.locator('#income-consistency').fill('2')
                                page.locator('#income-tariff').fill('100')
                                page.locator('#income-calculate').click()
                                expect(page.locator('#income-result')).to_contain_text('200.0000000')
                                expect(page.locator('#income-count')).to_contain_text('2')
                                page.locator('#geometry-unit').select_option(index=1)
                                expect(page.locator('#geometry-result')).to_contain_text('8.000000')
                                page.locator('#income-unit').select_option(index=1)
                                expect(page.locator('#income-result')).to_contain_text('555.5551500')
                                with page.expect_download() as event:
                                    page.locator('#download-dossier').click()
                                event.value.save_as(dossier)
                                multi_html = dossier.read_text(encoding='utf-8')
                                check(all(v in multi_html for v in ('8.000000','2.000000','555.5551500','200.0000000','Copertura degli annessi')), 'multi-unit dossier missing values')
                                check(multi_html.count('<figure class="plan-preview">') == 2, 'multi-unit plan previews missing')
                                check('Schema diagnostico per piano' in multi_html and '6000 × 2000 mm' in multi_html, 'common plan missing')
                                expect(page.locator('#floor-preview polygon')).to_have_count(2)
                                expect(page.locator('#floor-preview')).to_contain_text('6000 × 2000 mm')
                                check('Conversione dichiarata, scala non verificata' in multi_html and 'Millimetri dichiarati manualmente' in multi_html and '<td>40</td><td>4000</td>' in multi_html, 'calibration provenance missing or overwritten')
                                expect(page.locator('#scale-status')).to_contain_text('Conversione dichiarata ripristinata')
                                with page.expect_download() as event:
                                    page.locator('#save-session').click()
                                session_file = Path(tmp) / 'session.json'
                                event.value.save_as(session_file)
                                portable = json.loads(session_file.read_text(encoding='utf-8'))
                                check(portable['kind'] == 'synthetic-practice-session' and len(portable['request']['geometry']) == 2, 'portable session missing units')
                                check([a['placement']['xMm'] for a in portable['request']['geometry']] == [0, 4000], 'placement declarations missing')
                                # Invalid file must not overwrite the current work.
                                bad_file = Path(tmp) / 'bad-session.json'
                                bad_file.write_text('{"version":"999"}', encoding='utf-8')
                                page.locator('#import-session').set_input_files(bad_file)
                                expect(page.locator('#status')).to_contain_text('Sessione non valida')
                                expect(page.locator('#geometry-count')).to_contain_text('2')
                                page.reload()
                                page.locator('#import-session').set_input_files(session_file)
                                expect(page.locator('#status')).to_contain_text('Sessione sintetica ripristinata')
                                expect(page.locator('#geometry-count')).to_contain_text('2')
                                expect(page.locator('#income-count')).to_contain_text('2')
                                page.get_by_text('Misura geometrica sintetica', exact=True).click()
                                page.get_by_text('Classamento dichiarato e simulazione rendita', exact=True).click()
                                page.get_by_text('Converti coordinate del disegno in millimetri', exact=True).click()
                                expect(page.locator('#scale-status')).to_contain_text('Conversione dichiarata ripristinata')
                                with page.expect_download() as event:
                                    page.locator('#download-dossier').click()
                                event.value.save_as(dossier)
                                check(dossier.read_text(encoding='utf-8') == multi_html, 'reopened dossier differs')
                                expect(page.locator('#floor-preview polygon')).to_have_count(2)
                                expect(page.locator('#placement-floor')).to_have_value('P0')
                                page.locator('#geometry-vertices').fill('[]')
                                expect(page.locator('#geometry-count')).to_contain_text('1')
                                expect(page.locator('#income-count')).to_contain_text('2')
                                with page.expect_download() as event:
                                    page.locator('#download-dossier').click()
                                event.value.save_as(dossier)
                                partial = dossier.read_text(encoding='utf-8')
                                check('8.000000' not in partial and '2.000000' in partial and '555.5551500' in partial, 'unit-scoped invalidation failed')
                                # Conserved units are context only and must be explicitly positioned.
                                page.locator('#geometry-unit').select_option(value='other')
                                page.locator('#geometry-vertices').fill('[[0,0],[1000,0],[1000,1000],[0,1000]]')
                                page.locator('#geometry-measure').click()
                                expect(page.locator('#geometry-count')).to_contain_text('1')
                                page.locator('#placement-floor').fill('P0')
                                page.locator('#placement-x').fill('6000')
                                page.locator('#placement-y').fill('0')
                                page.locator('#geometry-measure').click()
                                expect(page.locator('#geometry-count')).to_contain_text('2')
                                expect(page.locator('#floor-preview')).to_contain_text('other (conservata, solo contesto)')
                                expect(page.locator('#income-count')).to_contain_text('2')
                                with page.expect_download() as event:
                                    page.locator('#download-dossier').click()
                                event.value.save_as(dossier)
                                check('Conservata — contesto' in dossier.read_text(encoding='utf-8'), 'retained context missing in dossier')
                                page.get_by_text('Interscambio Building Core sintetico', exact=True).click()
                                page.locator('#handoff-target').select_option('pianta-libera')
                                with page.expect_download() as event:
                                    page.locator('#geometry-handoff-download').click()
                                geo_exchange = Path(tmp) / 'geometry-handoff.json'
                                event.value.save_as(geo_exchange)
                                geo_handoff = json.loads(geo_exchange.read_text(encoding='utf-8'))
                                check(geo_handoff['version'] == '0.2.0', 'geometry handoff version')
                                check({g['unitId']: g['state'] for g in geo_handoff['geometry']} == {'d1': 'missing', 'd2': 'measured'}, 'geometry handoff scope or coverage')
                                check(next(g for g in geo_handoff['geometry'] if g['unitId']=='d2')['placement']['xMm'] == 4000, 'geometry handoff placement')
                                # Add missing d1 in one import; repeated import must not overwrite.
                                with page.expect_download() as event:
                                    page.locator('#geometry-batch-template').click()
                                batch_file = Path(tmp) / 'geometry-batch.json'
                                event.value.save_as(batch_file)
                                batch = json.loads(batch_file.read_text(encoding='utf-8'))
                                check([g['unitId'] for g in batch['geometry']] == ['d1'], 'batch template coverage')
                                batch['geometry'][0]['vertices'] = [[0,0],[3000,0],[3000,2000],[0,2000]]
                                batch['geometry'][0]['placement'] = {'floor':'P0','xMm':0,'yMm':0}
                                batch_file.write_text(json.dumps(batch), encoding='utf-8')
                                page.locator('#geometry-batch-file').set_input_files(batch_file)
                                expect(page.locator('#geometry-batch-status')).to_contain_text('Import completato: 1')
                                expect(page.locator('#geometry-count')).to_contain_text('3')
                                expect(page.locator('#income-count')).to_contain_text('2')
                                page.locator('#geometry-batch-file').set_input_files(batch_file)
                                expect(page.locator('#geometry-batch-status')).to_contain_text('Import bloccato')
                                expect(page.locator('#geometry-count')).to_contain_text('3')
                            with page.expect_download() as event:
                                page.locator("#download-archive").click()
                            archive = Path(tmp) / "diagnostic.zip"
                            event.value.save_as(archive)
                            with zipfile.ZipFile(archive) as z:
                                check(z.testzip() is None and len(z.namelist()) == 8, "invalid diagnostic ZIP")
                                manifest = json.loads(z.read("manifest.json"))
                                check(manifest["official"] is False and manifest["signature"] is False, "archive safety flags")
                                for member in manifest["files"]:
                                    data = z.read(member["name"])
                                    check(len(data) == member["bytes"] and hashlib.sha256(data).hexdigest() == member["sha256"], "archive manifest mismatch")
                                check("NON UFFICIALE" in z.read("dossier-sintetico.html").decode("utf-8"), "archive disclaimer missing")
                                check(manifest["submission"] is False, "archive submission safety flag")
                                extracted = Path(tmp) / "extracted-session.json"
                                extracted.write_bytes(z.read("sessione-sintetica.json"))
                                packed_html = z.read("dossier-sintetico.html")
                            page.locator("#import-session").set_input_files(archive)
                            expect(page.locator("#status")).to_contain_text("Archivio sintetico verificato e ripristinato")
                            corrupt = Path(tmp) / "corrupt.zip"
                            corrupt.write_bytes(archive.read_bytes() + b"extra")
                            page.locator("#import-session").set_input_files(corrupt)
                            expect(page.locator("#status")).to_contain_text("nessun ripristino eseguito")
                            expect(page.locator("#download-dossier")).to_be_enabled()
                            with page.expect_download() as event:
                                page.locator("#download-dossier").click()
                            unchanged = Path(tmp) / "unchanged-dossier.html"
                            event.value.save_as(unchanged)
                            check(unchanged.read_bytes() == packed_html, "invalid ZIP changed current work")
                            page.locator("#import-session").set_input_files(extracted)
                            expect(page.locator("#status")).to_contain_text("Sessione sintetica ripristinata")
                            with page.expect_download() as event:
                                page.locator("#download-dossier").click()
                            replayed_dossier = Path(tmp) / "replayed-dossier.html"
                            event.value.save_as(replayed_dossier)
                            check(replayed_dossier.read_bytes() == packed_html, "archive session replay differs from bundled dossier")
                            with page.expect_download() as event:
                                page.locator("#save-draft").click()
                            draft = Path(tmp) / "draft.json"
                            event.value.save_as(draft)
                            page.locator("#import-draft").set_input_files(draft)
                            expect(page.locator("#status")).to_contain_text("Bozza sintetica importata")
                            expect(page.locator("#download-dossier")).to_be_disabled()
                            expect(page.locator("#download-archive")).to_be_disabled()
                            expect(page.locator("#handoff-download")).to_be_disabled()
                            expect(page.locator('#geometry-unit')).to_be_disabled()
                            expect(page.locator('#geometry-download')).to_be_disabled()
                            expect(page.locator('#income-unit')).to_be_disabled()
                            expect(page.locator('#income-download')).to_be_disabled()
                            expect(page.locator('#geometry-count')).to_contain_text('0')
                            expect(page.locator('#income-count')).to_contain_text('0')
                            page.locator("#analyze").click()
                            expect(page.locator("#summary")).to_contain_text("Ipotesi di ricerca")
                            expect(page.locator("#operations tbody tr")).to_have_count(count)
                        check(page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "horizontal page overflow")
                        check(not errors and not external, f"browser errors or external requests: {errors}, {external}")
                        context.close()
                        print(f"PASS workbench {width}px: blocked reviewed case, 6 diagnostic scenarios, JSON/HTML/ZIP downloads, independent geometry/income annexes, archive session and draft reimport")
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
