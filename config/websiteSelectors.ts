export const websiteSelectors = {
    nextPage: '[data-cy=page-link-next]',
    advertisements: 'table.offers:nth-child(2) > tr.wrap',
    advertisementLink: 'a.link',
    advertisementTitle: 'a strong',
    advertisementTimePublication: '.breadcrumb:nth-child(2)',
    olx: {
        advertisementDescription: 'div.clr.large',
        basicLocationOfFlat: '.show-map-link strong',
        closeCookie: '.cookie-close',
        rentCosts: "//th[contains(text(), 'Czynsz')]/following-sibling::td",
        price: '.price-label > strong',
    },
    otoDom: {
        advertisementDescription: 'section.section-description',
        locationOfFlat: 'header a',
        closeCookie: '.cookiesBarClose.icon-close',
        rentCosts: "//li[contains(text(), 'Czynsz')]/strong",
        price: "//header//ancestor::div[contains(text(), 'zł')]",
    },
};
