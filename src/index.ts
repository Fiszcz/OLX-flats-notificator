import puppeteer from 'puppeteer';
import { OLXNotifier } from './OLXNotifier';
import inquirer from 'inquirer';

const appConfig = require('../config/config.json');

export const index = async () => {
    const browser = await puppeteer.launch();

    while (Boolean(appConfig.emailPassword) === false) {
        appConfig.emailPassword = await inquirer
            .prompt({
                type: 'password',
                name: 'emailPassword',
                message: 'Enter your email password: ',
            })
            .then(answer => answer.emailPassword);
    }

    for (const filterUrl of appConfig.filterUrls) {
        const olxNotifier = await OLXNotifier.build(browser, filterUrl, appConfig);
        if (olxNotifier === undefined) {
            console.error('Cannot run');
            return -1;
        }
        setInterval(olxNotifier.examineAdvertisements, appConfig.checkInterval * 60000);
    }
};

index();
