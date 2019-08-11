import puppeteer from 'puppeteer';
import { OLXNotifier } from "./OLXNotifier";
import {checkInterval} from "../config/config.json";

(async () => {
    const browser = await puppeteer.launch();

    const olxNotifier = await OLXNotifier.build(browser);
    if (olxNotifier === undefined) {
        console.error('Cannot run');
        return -1;
    }
    setInterval(olxNotifier.examineAdvertisements, checkInterval * 60000);
})();
