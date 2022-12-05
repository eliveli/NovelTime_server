import puppeteer from "puppeteer";
import weeklyRidi, { addOrUpdateNovelInDB, getNovelIdFromDB, getNovelUrls } from "../ridi";

jest.setTimeout(500000);

it("case to run a weekly scraper properly :", async () => {
  await weeklyRidi();
});

// it("test function getNovelUrls", async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
//   page.setDefaultTimeout(500000);
//   await page.goto("https://ridibooks.com/bestsellers/romance?adult_exclude=y&page=1");

//   await getNovelUrls(page);
// });
