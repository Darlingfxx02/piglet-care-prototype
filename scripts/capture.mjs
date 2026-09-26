import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true});
for(const [name,width,height] of [['mobile',390,844],['tablet',768,1024],['desktop',1440,900]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 await page.goto('http://127.0.0.1:5173');await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`tests/screenshots/${name}-home.png`});
 await page.locator('.support-button:visible').click();await page.screenshot({path:`tests/screenshots/${name}-choose.png`});
 await page.getByRole('button',{name:'Обсудить выбранный заказ'}).click();
 await page.getByRole('button',{name:'Да, мне нужно встретить машину.',exact:true}).click();
 await page.getByText('Доставка №3205:').waitFor();
 await page.screenshot({path:`tests/screenshots/${name}-chat.png`});
 await page.getByRole('button',{name:'Завершить',exact:true}).click();await page.getByRole('button',{name:'Завершить и оценить'}).click();
 await page.getByRole('button',{name:'Оценка 3 из 5'}).click();
 await page.screenshot({path:`tests/screenshots/${name}-rating-low.png`});
 await page.getByRole('button',{name:'Оценка 5 из 5'}).click();await page.screenshot({path:`tests/screenshots/${name}-rating.png`});
 console.log(name, await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)})));
 await page.close();
}
await browser.close();
