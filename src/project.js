const puppeteer = require('puppeteer');

async function run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setViewport({width: 1280, height: 1024});

    await page.goto('https://www.olx.pl/nieruchomosci/mieszkania/warszawa/', {waitUntil: 'domcontentloaded'});
    await page.click('.cookie-close');
    await page.screenshot({ path: '../screenshots/olx.png' });
    console.log('Screeanshot has been taken - ' + new Date());

    browser.close();
}

run();