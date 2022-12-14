import puppeteer from "puppeteer";
import weeklySeries, {
  addOrUpdateNovelInDB,
  getNovelIdFromDB,
  getNovelUrls,
} from "../scrapeWeeklyInSeries";

jest.setTimeout(500000);

// it("case to run a weekly scraper properly :", async () => {
//   await weeklySeries();
// });

// it("case to run async function properly :", async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();

// const novelListUrl =
//   "https://series.naver.com/novel/top100List.series?rankingTypeCode=WEEKLY&categoryCode=ALL";
// await page.goto(novelListUrl);
// const novelUrls = await getNovelUrls(page);

//   const novelId = await getNovelIdFromDB(
//     page,
//     "series.naver.com/novel/detail.series?productNo=8126058",
//   );

//   console.log("novelId:", novelId);
// });
