import puppeteer from 'puppeteer';
import { OLXNotifier } from "./OLXNotifier";
import {checkInterval, filterUrls} from "../config/config.json";

(async () => {
    const browser = await puppeteer.launch();

    for (const filterUrl in filterUrls) {
        const olxNotifier = await OLXNotifier.build(browser, filterUrl);
        if (olxNotifier === undefined) {
            console.error('Cannot run');
            return -1;
        }
        setInterval(olxNotifier.examineAdvertisements, checkInterval * 60000);
    }
})();
