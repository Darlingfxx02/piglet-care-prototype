import { test, expect, chromium, firefox, webkit } from '@playwright/test';
import { shots } from '../src/case/tour';
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  test(`camera keeps complete shell width in ${name}`, async () => {
    test.setTimeout(90000);
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1150 } });
      await page.goto('http://127.0.0.1:5173/case.html');
      await page.getByRole('button', { name: /Смотреть тур/ }).click();
      await page.getByRole('button', { name: 'Пауза', exact: true }).click();
      for (let i = 0; i <= 7; i++) {
        await expect(page.locator('.tour-notes h1')).toHaveText(shots[i].title);
        await expect(page.locator('.phone')).not.toHaveClass(/preparing/, { timeout: 15000 });
        await page.waitForTimeout(850);
        if (i < 7) { await page.mouse.move(1550, 700); await page.mouse.wheel(0, 100); }
      }
      for (const size of [{width:1600,height:1150},{width:1280,height:1000},{width:1920,height:1080}]) {
        await page.setViewportSize(size);
        await page.waitForTimeout(1100);
        const geometry = await page.locator('.phone').evaluate(el => {
          const phone=el.getBoundingClientRect(), column=el.parentElement!.getBoundingClientRect();
          return {left:phone.left,right:phone.right,columnLeft:column.left,columnRight:column.right,clip:getComputedStyle(el.parentElement!).clipPath};
        });
        expect(geometry.clip).toBe('none');
        expect(geometry.left).toBeGreaterThanOrEqual(geometry.columnLeft-1);
        expect(geometry.right).toBeLessThanOrEqual(geometry.columnRight+1);
      }
      await page.screenshot({path:`tests/case-evidence/camera-${name}.png`});
    } finally { await browser.close(); }
  });
}
