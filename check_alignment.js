const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const urls = [
    'http://localhost:3000/menu.html',
    'http://localhost:3000/about.html',
    'http://localhost:3000/contact.html',
    'http://localhost:3000/franchise.html'
  ];
  
  for (const url of urls) {
    await page.goto(url);
    const result = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const header = document.querySelector('.header');
      return {
        h1Top: h1 ? h1.getBoundingClientRect().top : null,
        headerHeight: header ? header.getBoundingClientRect().height : null
      };
    });
    console.log(`${url.split('/').pop()}: h1Top=${result.h1Top}px, headerHeight=${result.headerHeight}px`);
  }
  
  await browser.close();
})();
