import puppeteer from "puppeteer";
import weeklyRidi, {
  addOrUpdateNovelInDB,
  getNovelIdFromDB,
  getNovelUrls,
  searchForNovelsByTitleAndAuthor,
} from "../scrapeBestInRidi";

jest.setTimeout(500000);

it("test function searchForNovelsByTitleAndAuthor :", async () => {
  const novelTitle = "폭군의 흑화를";
  const novelAuthor = "한여온";
  const novel = await searchForNovelsByTitleAndAuthor(novelTitle, novelAuthor);
  console.log("novel:", novel);
});

// it("case to run a weekly scraper properly :", async () => {
//   await weeklyRidi();
// });

// it("test function getNovelUrls", async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
//   page.setDefaultTimeout(500000);
//   await page.goto("https://ridibooks.com/bestsellers/romance?adult_exclude=y&page=1");

//   await getNovelUrls(page);
// });
