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

# [Codex] Keep actual native downloads mandatory; preparation is a separate UI action.
def download_dossier(page, scenario, width, errors, console_messages):
    page.locator("#download-dossier").click()
    expect(page.locator("#status")).to_contain_text("Dossier pronto")
    link = page.locator("#save-prepared-dossier")
    expect(link).to_be_visible()
    expect(link).to_have_attribute("download", "catasto-dossier-sintetico-non-ufficiale.html")
    try:
        with page.expect_download() as event:
            link.click()
        return event
    except Exception as exc:
        raise RuntimeError(f"dossier download failed: scenario={scenario}, viewport={width}, status={page.locator('#status').text_content()}, pageErrors={errors}, console={console_messages[-12:]}") from exc

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
                        errors, external, console_messages = [], [], []
                        page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
                        page.on("pageerror", lambda error: errors.append(str(error)))
                        def route(request_route):
                            if request_route.request.url.startswith(base + "/"):
                                request_route.continue_()
                            else:
                                external.append(request_route.request.url)
                                request_route.abort()
                        context.route("**/*", route)
                        page.goto(base + "/")
                        # [Codex] Source bytes stay in the browser, no API request or filename echo.
                        source_summary = page.get_by_text("Impronta locale dell’archivio di riferimento", exact=True)
                        source_summary.click()
                        source_requests = []
                        def record_source_request(req):
                            source_requests.append(req.url)
                        page.on("request", record_source_request)
                        source = b"SYNTHETIC-REFERENCE-ONLY"
                        page.locator("#docfa-source-file").set_input_files({"name":"synthetic-source.zip","mimeType":"application/zip","buffer":source})
                        expect(page.locator("#docfa-source-hash")).to_have_value(hashlib.sha256(source).hexdigest())
                        expect(page.locator("#docfa-source-status")).to_contain_text("Provenienza e vigenza non verificate")
                        page.locator("#docfa-source-file").set_input_files({"name":"empty.zip","mimeType":"application/zip","buffer":b""})
                        expect(page.locator("#docfa-source-status")).to_contain_text("Impronta non disponibile")
                        expect(page.locator("#docfa-source-hash")).to_have_value("")
                        page.locator("#docfa-source-file").set_input_files({"name":"other.zip","mimeType":"application/zip","buffer":b"OTHER"})
                        expect(page.locator("#docfa-source-hash")).to_have_value(hashlib.sha256(b"OTHER").hexdigest())
                        page.locator("#docfa-source-clear").click()
                        expect(page.locator("#docfa-source-hash")).to_have_value("")
                        check(not source_requests, "source fingerprint issued a request")
                        page.remove_listener("request", record_source_request)
                        source_summary.click()
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
                            event = download_dossier(page, scenario, width, errors, console_messages)
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
                            if not page.locator('#dxf-file').evaluate("(e) => e.closest('details').open"):
                                page.get_by_text('Carica contorni da DXF ASCII sintetico', exact=True).click()
                            with page.expect_download() as dxf_event:
                                page.locator('#dxf-example').click()
                            dxf = Path(tmp) / 'contorno-sintetico-mm.dxf'
                            dxf_event.value.save_as(dxf)
                            page.locator('#dxf-unit').select_option('mm')
                            page.locator('#dxf-file').set_input_files(dxf)
                            expect(page.locator('#dxf-status')).to_contain_text('8.000000 m²')
                            expect(page.locator('#geometry-count')).to_contain_text('0')
                            dxf.write_text('not a DXF', encoding='ascii')
                            page.locator('#dxf-file').set_input_files(dxf)
                            expect(page.locator('#dxf-status')).to_contain_text('DXF respinto')
                            page.locator('#geometry-measure').click()
                            expect(page.locator('#geometry-result')).to_contain_text('8.000000 m²')
                            expect(page.locator('#dxf-file')).to_be_disabled()
                            page.locator('#geometry-example').click()
                            page.locator('#geometry-measure').click()
                            expect(page.locator('#geometry-result')).to_contain_text('8.000000 m²')
                            expect(page.locator('#geometry-preview polygon')).to_have_count(1)
                            expect(page.locator('#geometry-preview')).to_contain_text('4000 × 3000 mm')
                            with page.expect_download() as cad_event:
                                page.locator('#cad-contour-download').click()
                            cad_file = Path(tmp) / 'cad-local-mm.dxf'
                            cad_event.value.save_as(cad_file)
                            cad_text = cad_file.read_text(encoding='ascii')
                            check('LWPOLYLINE' in cad_text and 'SYNTH_CONTOUR_MM' in cad_text and report['caseDigest'] not in cad_text, 'CAD contour missing or metadata leaked')
                            with page.expect_download() as event:
                                page.locator('#geometry-download').click()
                            annex = Path(tmp) / 'geometry.json'
                            event.value.save_as(annex)
                            measured = json.loads(annex.read_text(encoding='utf-8'))
                            check(measured['caseDigest'] == report['caseDigest'] and measured['areaMm2'] == '8000000', 'annex mismatch')
                            event = download_dossier(page, scenario, width, errors, console_messages)
                            event.value.save_as(dossier)
                            both = dossier.read_text(encoding="utf-8")
                            check("555.5551500" in both and "8.000000" in both and "14000" in both, "integrated dossier mismatch")
                            page.locator('#geometry-vertices').fill('[]')
                            expect(page.locator('#save-prepared-dossier')).to_be_hidden()
                            check(page.locator('#save-prepared-dossier').get_attribute('href') is None, 'stale dossier link retained')
                            expect(page.locator('#geometry-preview polygon')).to_have_count(0)
                            expect(page.locator('#geometry-download')).to_be_disabled()
                            expect(page.locator('#cad-contour-download')).to_be_disabled()
                            # Separate annexes: editing geometry does not change the case or the income declaration.
                            expect(page.locator('#income-download')).to_be_enabled()
                            expect(page.locator('#income-unit')).to_be_enabled()
                            page.locator('#geometry-measure').click()
                            expect(page.locator('#geometry-result')).to_contain_text('Contorno bloccato')
                            event = download_dossier(page, scenario, width, errors, console_messages)
                            event.value.save_as(dossier)
                            after_edit = dossier.read_text(encoding="utf-8")
                            check("555.5551500" in after_edit and "Nessuna misura corrente inclusa." in after_edit and "8.000000" not in after_edit, "stale geometry included")
                            if scenario == "division":
                                # One unit, two contours on a common declared plane.
                                page.locator('#geometry-multi-example').click()
                                page.locator('#geometry-measure').click()
                                expect(page.locator('#geometry-result')).to_contain_text('10.000000')
                                expect(page.locator('#geometry-preview polygon')).to_have_count(2)
                                event = download_dossier(page, scenario, width, errors, console_messages)
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
                                event = download_dossier(page, scenario, width, errors, console_messages)
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
                                event = download_dossier(page, scenario, width, errors, console_messages)
                                event.value.save_as(dossier)
                                check(dossier.read_text(encoding='utf-8') == multi_html, 'reopened dossier differs')
                                expect(page.locator('#floor-preview polygon')).to_have_count(2)
                                expect(page.locator('#placement-floor')).to_have_value('P0')
                                page.locator('#geometry-vertices').fill('[]')
                                expect(page.locator('#geometry-count')).to_contain_text('1')
                                expect(page.locator('#income-count')).to_contain_text('2')
                                event = download_dossier(page, scenario, width, errors, console_messages)
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
                                event = download_dossier(page, scenario, width, errors, console_messages)
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
                            with page.expect_download() as review_event:
                                page.locator("#manual-docfa-download").click()
                            worklist_file = Path(tmp) / "manual-review.json"
                            review_event.value.save_as(worklist_file)
                            worklist = json.loads(worklist_file.read_text(encoding="utf-8"))
                            check(worklist["officialValidation"] is False and worklist["officialExport"] is False, "worklist official flags")
                            check(all(c["state"] == "unverified" for c in worklist["checks"]), "worklist falsely verified")
                            check(len(worklist["rows"]) > 0, "worklist missing operations")
                            expect(page.locator("#manual-docfa-status")).to_contain_text("Verifiche ufficiali tutte aperte")
                            with page.expect_download() as sheet_event:
                                page.locator("#manual-docfa-worksheet").click()
                            sheet_file = Path(tmp) / "manual-comparison.html"
                            sheet_event.value.save_as(sheet_file)
                            sheet = sheet_file.read_text(encoding="utf-8")
                            check(worklist["caseDigest"] in sheet and sheet.count("NON VERIFICATO") == 6, "worksheet digest or checks")
                            check("Versione DOCFA" in sheet and "NON UFFICIALE" in sheet and "<script" not in sheet, "unsafe or incomplete worksheet")
                            register_summary = page.get_by_text("Registra riscontri manuali su prova sintetica", exact=True)
                            if not page.locator("#manual-docfa-register-template").is_visible():
                                register_summary.click()
                            with page.expect_download() as register_event:
                                page.locator("#manual-docfa-register-template").click()
                            template_file = Path(tmp) / "manual-register-template.json"
                            register_event.value.save_as(template_file)
                            register = json.loads(template_file.read_text(encoding="utf-8"))
                            check(len(register["observations"]) == 6 and all(o["state"] == "unrecorded" for o in register["observations"]), "manual register template")
                            register["environment"] = {"date":"2026-11-26","docfaVersion":"SYNTH-TEST","province":"SYNTH","archiveSha256":"a"*64,"specificationReference":"SYNTH-SPEC","localRunReference":"SYNTH-RUN"}
                            register["observations"][0].update(state="difference_declared", evidenceReference="SYNTH-EVIDENCE", note="Synthetic test only")
                            template_file.write_text(json.dumps(register), encoding="utf-8")
                            with page.expect_download() as record_event:
                                page.locator("#manual-docfa-register-file").set_input_files(str(template_file))
                            record_file = Path(tmp) / "manual-register-record.json"
                            record_event.value.save_as(record_file)
                            record = json.loads(record_file.read_text(encoding="utf-8"))
                            check(record["officialValidation"] is False and record["counts"]["difference_declared"] == 1 and record["counts"]["unrecorded"] == 5, "manual register falsely validated")
                            expect(page.locator("#manual-docfa-status")).to_contain_text("1 difformità dichiarate")
                            register["snapshotDigest"] = "0"*64
                            template_file.write_text(json.dumps(register), encoding="utf-8")
                            page.locator("#manual-docfa-register-file").set_input_files(str(template_file))
                            expect(page.locator("#manual-docfa-status")).to_contain_text("Pratica invariata")
                            if scenario == "fusion":
                                # [Codex] A real guided review, including server rejection and native download.
                                page.get_by_text("Compila i riscontri guidati in questa pagina", exact=True).click()
                                page.locator("#guided-review-open").click()
                                expect(page.locator("#guided-review-status")).to_contain_text("tutti i riscontri non registrati")
                                expect(page.locator("#guided-evidence-0")).to_be_disabled()
                                page.locator("#guided-state-0").select_option("difference_declared")
                                expect(page.locator("#guided-evidence-0")).to_be_enabled()
                                page.locator("#guided-review-save").click()
                                expect(page.locator("#guided-review-status")).to_contain_text("Registro non accettato")
                                expect(page.locator("#guided-review-save")).to_be_enabled()
                                page.get_by_text("Impronta locale dell’archivio di riferimento", exact=True).click()
                                page.locator("#docfa-source-file").set_input_files({"name":"synthetic.tar","mimeType":"application/octet-stream","buffer":b"SYNTH-GUIDED"})
                                expect(page.locator("#docfa-source-hash")).to_have_value(hashlib.sha256(b"SYNTH-GUIDED").hexdigest())
                                page.locator("#guided-review-copy-hash").click()
                                expect(page.locator("#guided-env-archiveSha256")).to_have_value(hashlib.sha256(b"SYNTH-GUIDED").hexdigest())
                                for key, value in {"date":"2026-11-27","docfaVersion":"SYNTH-TEST","province":"SYNTH","specificationReference":"SYNTH-SPEC","localRunReference":"SYNTH-RUN"}.items():
                                    page.locator("#guided-env-"+key).fill(value)
                                page.locator("#guided-evidence-0").fill("SYNTH-EVIDENCE")
                                page.locator("#guided-note-0").fill("Synthetic discrepancy only")
                                with page.expect_download() as guided_event:
                                    page.locator("#guided-review-save").click()
                                guided_path = Path(tmp) / "guided-review.json"
                                guided_event.value.save_as(guided_path)
                                guided = json.loads(guided_path.read_text(encoding="utf-8"))
                                check(guided["snapshotDigest"] == record["snapshotDigest"] and guided["counts"]["difference_declared"] == 1 and guided["counts"]["unrecorded"] == 5, "guided review snapshot/count mismatch")
                                check(all(guided[k] is False for k in ("officialValidation","officialExport","signature","submission")), "guided review falsely official")
                                check(guided["environment"]["archiveSha256"] == hashlib.sha256(b"SYNTH-GUIDED").hexdigest(), "guided archive fingerprint mismatch")
                                # [Codex] Resume a saved record only after complete canonical replay.
                                page.locator("#guided-review-open").click()
                                expect(page.locator("#guided-review-status")).to_contain_text("tutti i riscontri non registrati")
                                forged = json.loads(json.dumps(guided))
                                forged["officialValidation"] = True
                                forged_path = Path(tmp) / "forged-guided.json"
                                forged_path.write_text(json.dumps(forged), encoding="utf-8")
                                page.locator("#guided-review-import").set_input_files(forged_path)
                                expect(page.locator("#guided-review-status")).to_contain_text("Registro non riapribile")
                                expect(page.locator("#guided-state-0")).to_have_value("unrecorded")
                                page.locator("#guided-review-import").set_input_files(guided_path)
                                expect(page.locator("#guided-review-status")).to_contain_text("Registro riaperto e ricalcolato")
                                expect(page.locator("#guided-state-0")).to_have_value("difference_declared")
                                expect(page.locator("#guided-note-0")).to_have_value("Synthetic discrepancy only")
                                expect(page.locator("#guided-env-archiveSha256")).to_have_value(guided["environment"]["archiveSha256"])
                                with page.expect_download() as resumed_event:
                                    page.locator("#guided-review-save").click()
                                resumed_path = Path(tmp) / "resumed-review.json"
                                resumed_event.value.save_as(resumed_path)
                                check(json.loads(resumed_path.read_text(encoding="utf-8")) == guided, "reopened record differs from original")
                                page.locator("#guided-state-0").select_option("match_declared")
                                with page.expect_download() as revised_event:
                                    page.locator("#guided-review-save").click()
                                revised_path = Path(tmp) / "revised-review.json"
                                revised_event.value.save_as(revised_path)
                                revised = json.loads(revised_path.read_text(encoding="utf-8"))
                                check(revised["snapshotDigest"] == guided["snapshotDigest"] and revised["counts"]["match_declared"] == 1, "revised record mismatch")
                            # [Codex] Keep the real download gate; distinguish API failure from
                            # browser download failure and wait explicitly for the preceding import.
                            expect(page.locator("#manual-docfa-register-file")).to_be_enabled()
                            expect(page.locator("#download-archive")).to_be_enabled()
                            archive_http = None
                            try:
                                with page.expect_response(lambda response: response.url == base + "/api/archive" and response.request.method == "POST") as archive_response:
                                    page.locator("#download-archive").click()
                                archive_http = archive_response.value.status
                                check(archive_http == 200, f"archive API returned {archive_http}")
                                check(archive_response.value.headers.get("content-type", "").startswith("application/zip"), "archive response not ZIP")
                                expect(page.locator("#status")).to_contain_text("Archivio pronto")
                                expect(page.locator("#save-prepared-archive")).to_be_visible()
                                expect(page.locator("#save-prepared-archive")).to_have_attribute("download", "catasto-pratica-sintetica-non-ufficiale.zip")
                                with page.expect_download() as event:
                                    page.locator("#save-prepared-archive").click()
                                expect(page.locator("#status")).to_contain_text("Archivio richiesto")
                                expect(page.locator("#save-prepared-archive")).to_be_visible()
                            except Exception as exc:
                                raise RuntimeError(f"archive download failed: scenario={scenario}, viewport={width}, HTTP={archive_http}, status={page.locator('#status').text_content()}, review={page.locator('#manual-docfa-status').text_content()}, pageErrors={errors}, console={console_messages[-12:]}") from exc
                            archive = Path(tmp) / "diagnostic.zip"
                            event.value.save_as(archive)
                            # Real native retry must deliver identical bytes without another POST.
                            with page.expect_download() as retry_event:
                                page.locator("#save-prepared-archive").click()
                            retry_path = Path(tmp) / "retry.zip"
                            retry_event.value.save_as(retry_path)
                            check(retry_path.read_bytes() == archive.read_bytes(), "ZIP retry differs")
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
                            if scenario == "fusion":
                                page.locator("#income-unit").select_option(index=1)
                                page.locator("#income-consistency").fill("999")
                                expect(page.locator("#guided-review-status")).to_contain_text("Sessione modificata")
                                expect(page.locator("#guided-review-save")).to_be_disabled()
                                page.locator("#guided-review-import").set_input_files(guided_path)
                                expect(page.locator("#guided-review-import")).to_be_enabled()
                                expect(page.locator("#guided-review-save")).to_be_disabled()
                            page.locator("#import-session").set_input_files(archive)
                            expect(page.locator("#status")).to_contain_text("Archivio sintetico verificato e ripristinato")
                            expect(page.locator("#guided-review-fields")).to_be_hidden()
                            corrupt = Path(tmp) / "corrupt.zip"
                            corrupt.write_bytes(archive.read_bytes() + b"extra")
                            page.locator("#import-session").set_input_files(corrupt)
                            expect(page.locator("#status")).to_contain_text("nessun ripristino eseguito")
                            expect(page.locator("#download-dossier")).to_be_enabled()
                            event = download_dossier(page, scenario, width, errors, console_messages)
                            unchanged = Path(tmp) / "unchanged-dossier.html"
                            event.value.save_as(unchanged)
                            check(unchanged.read_bytes() == packed_html, "invalid ZIP changed current work")
                            page.locator("#import-session").set_input_files(extracted)
                            expect(page.locator("#status")).to_contain_text("Sessione sintetica ripristinata")
                            event = download_dossier(page, scenario, width, errors, console_messages)
                            replayed_dossier = Path(tmp) / "replayed-dossier.html"
                            event.value.save_as(replayed_dossier)
                            check(replayed_dossier.read_bytes() == packed_html, "archive session replay differs from bundled dossier")
                            if scenario == "fusion":
                                with page.expect_download() as retry:
                                    page.locator("#save-prepared-dossier").click()
                                dossier_retry = Path(tmp) / "dossier-retry.html"
                                retry.value.save_as(dossier_retry)
                                check(dossier_retry.read_bytes() == packed_html, "dossier retry differs")
                            # [Codex] Native draft link, real download and exact JSON, not a simulated click.
                            expected_draft = json.loads(page.locator("#case").input_value())
                            page.locator("#save-draft").click()
                            expect(page.locator("#status")).to_contain_text("Bozza pronta")
                            draft_link = page.locator("#save-prepared-draft")
                            expect(draft_link).to_be_visible()
                            expect(draft_link).to_have_attribute("download", "catasto-bozza-sintetica.json")
                            try:
                                with page.expect_download() as event:
                                    draft_link.click()
                            except Exception as exc:
                                raise RuntimeError(f"draft download failed: scenario={scenario}, viewport={width}, status={page.locator('#status').text_content()}, pageErrors={errors}, console={console_messages[-12:]}") from exc
                            draft = Path(tmp) / "draft.json"
                            event.value.save_as(draft)
                            check(json.loads(draft.read_text(encoding="utf-8")) == expected_draft, "draft download changed declarations")
                            if scenario == "fusion":
                                with page.expect_download() as retry:
                                    draft_link.click()
                                draft_retry = Path(tmp) / "draft-retry.json"
                                retry.value.save_as(draft_retry)
                                check(draft_retry.read_bytes() == draft.read_bytes(), "draft retry differs")
                            # Prepared bytes cannot survive a new elaboration or case replacement.
                            page.locator("#download-archive").click()
                            expect(page.locator("#save-prepared-archive")).to_be_visible()
                            expect(draft_link).to_be_hidden()
                            check(draft_link.get_attribute("href") is None, "stale draft link retained")
                            page.locator("#import-draft").set_input_files(draft)
                            expect(page.locator("#status")).to_contain_text("Bozza sintetica importata")
                            expect(page.locator("#download-dossier")).to_be_disabled()
                            expect(page.locator("#download-archive")).to_be_disabled()
                            expect(page.locator("#save-prepared-archive")).to_be_hidden()
                            check(page.locator("#save-prepared-archive").get_attribute("href") is None, "stale ZIP link retained")
                            expect(page.locator("#manual-docfa-download")).to_be_disabled()
                            expect(page.locator("#manual-docfa-worksheet")).to_be_disabled()
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
