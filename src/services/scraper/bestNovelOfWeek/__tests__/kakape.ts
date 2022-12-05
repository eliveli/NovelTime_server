import puppeteer from "puppeteer";
import weeklyKakape, { addOrUpdateNovelInDB } from "../kakape";

jest.setTimeout(500000);

it("case to run a weekly scraper properly :", async () => {
  await weeklyKakape();
});

// it(`test function addOrUpdateNovelInDB under various situations such as removing duplicates, excepting joara platform, etc
//  as changing row or column in db using DBeaver`, async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   page.setDefaultTimeout(500000);
//   await page.goto("https://page.kakao.com/content/53555298?tab_type=about");

//   const novelInfo = {
//     novelTitle: "폭군의 흑화를 막는 법",
//     novelAuthor: "한여온",
//     novelUrl: "page.kakao.com/content/53555298",
//   };
//   const novelId = await addOrUpdateNovelInDB(page, novelInfo);
//   console.log("novelId:", novelId);
// });
