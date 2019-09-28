import puppeteer from 'puppeteer';
import { OLXNotifier } from './OLXNotifier';
import inquirer from 'inquirer';

const appConfig = require('../config/config.json');

export const index = async () => {
    while (Boolean(appConfig.emailPassword) === false) {
        appConfig.emailPassword = await inquirer
            .prompt({
                type: 'password',
                name: 'emailPassword',
                message: 'Enter your email password: ',
            })
            .then(answer => answer.emailPassword);
    }

    const browser = await puppeteer.launch();

    for (const filterUrl of appConfig.filterUrls) {
        const olxNotifier = new OLXNotifier(browser, await browser.newPage(), filterUrl, appConfig);

        setInterval(olxNotifier.examineAdvertisements, appConfig.checkInterval * 60000);
    }
};

index();
