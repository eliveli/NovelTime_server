import puppeteer from "puppeteer";
import { goToDetailPage } from "../../utils/addOrUpdateNovelInDB";
import weeklyScraper from "../scrapeWeeklyNovels";

jest.setTimeout(500000);

// it("run a weekly scraper for kakape :", async () => {
//   await weeklyScraper("카카오페이지");
// });

// it("test function goToDetailPage for kakape", async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
//   page.setDefaultTimeout(500000);

//   const novelUrl = "page.kakao.com/content/53230180";

//   await goToDetailPage(page, novelUrl, "카카오페이지");

// });

// it("run a weekly scraper for ridi :", async () => {
//   await weeklyScraper("리디북스");
// });

// it("run a weekly scraper for series :", async () => {
//   await weeklyScraper("네이버 시리즈");
// });

it("run a weekly scraper for joara :", async () => {
  await weeklyScraper("조아라");
});

// const novelInfo = {
//   novelTitle: "폭군의 흑화를 막는 법",
//   novelAuthor: "한여온",
//   novelUrl: "page.kakao.com/content/53555298",
// };
