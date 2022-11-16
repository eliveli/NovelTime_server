import puppeteer from "puppeteer";
import weeklyKakape, { checkNovelInDB } from "../kakape";

jest.setTimeout(500000);

// it("case to run a weekly scraper properly :", async () => {
//   await weeklyKakape();
// });

it("case to add a novel platform kakao page into a novel row that is already in DB with removing duplicate novel rows or updating novel platforms:", async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(500000);
  await page.goto("https://page.kakao.com/content/60524067?tab_type=about");

  const novelInfo = {
    novelTitle: "폭군의 흑화를 막는 법",
    novelAuthor: "한여온",
    novelUrl: "page.kakao.com/content/53555298",
  };
  const novelId = await checkNovelInDB(page, novelInfo);
  console.log("novelId:", novelId);
});
