# Copyright (c) 2026 Gian Paolo Franceschini. All rights reserved.
# Opt-in browser smoke test. Requires local Chromium and Python Playwright.
from pathlib import Path
import shutil
import subprocess
from playwright.sync_api import sync_playwright, expect


def main():
    if not __debug__:
        raise RuntimeError('Run without Python optimization (assertions required)')
    root = Path(__file__).resolve().parent.parent
    chromium = shutil.which('chromium') or shutil.which('chromium-browser')
    if not chromium:
        raise RuntimeError('Local Chromium executable required')
    html = subprocess.check_output(['node', str(root / 'scripts/synthetic-ocr-review.mjs')], timeout=15)
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=chromium, headless=True)
        try:
            print('Chromium', browser.version)
            for width in (1280, 360):
                context = browser.new_context(viewport={'width': width, 'height': 800}, offline=True, service_workers='block')
                try:
                    page = context.new_page()
                    external = []
                    page.on('request', lambda request: external.append(request.url) if request.url.startswith(('http:', 'https:')) else None)
                    # In-memory document only; file:// behavior is a separate test.
                    page.set_content(html.decode('utf-8'), wait_until='load')
                    expect(page.locator('ol li')).to_have_count(2)
                    expect(page.locator('#word-1 bdi')).to_have_text('0007')
                    expect(page.locator('#word-2 bdi')).to_have_text('<script>alert(1)</script>')
                    expect(page.locator('script, form, iframe')).to_have_count(0)
                    # Decode the image in the actual browser; sample every pixel.
                    pixels = page.locator('svg image').evaluate('''async el => {
                      const img = new Image(); img.src = el.getAttribute('href'); await img.decode();
                      const c = document.createElement('canvas'); c.width=img.width; c.height=img.height;
                      const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
                      const p=ctx.getImageData(0,0,c.width,c.height).data;
                      let mismatches=0;for(let i=0;i<p.length;i+=4){const v=(i/4)%256;
                        if(p[i]!==v||p[i+1]!==v||p[i+2]!==v||p[i+3]!==255)mismatches++;}
                      return [img.width,img.height,mismatches];
                    }''')
                    assert pixels == [320, 100, 0], pixels
                    page.keyboard.press('Tab')
                    expect(page.locator('svg a').first).to_be_focused()
                    page.locator('#area-1').click()
                    expect(page.locator('#word-1')).to_have_css('outline-style', 'solid')
                    page.locator('#word-1 a').click()
                    expect(page.locator('#area-1')).to_have_css('fill', 'rgb(237, 151, 0)')
                    link = page.locator('svg a').nth(1)
                    link.focus()
                    expect(link).to_be_focused()
                    page.keyboard.press('Enter')
                    expect(page.locator('#word-2')).to_have_css('outline-style', 'solid')
                    assert page.url.endswith('#word-2'), page.url
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal overflow'
                    assert not external, external
                    print(f'{width}px: DOM, escaped text, 32000 pixels, reciprocal links, keyboard, no horizontal overflow, no HTTP(S) requests: PASS')
                finally:
                    context.close()
        finally:
            browser.close()


if __name__ == '__main__':
    main()
