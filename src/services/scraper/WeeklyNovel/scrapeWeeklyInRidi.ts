import puppeteer from "puppeteer";
import getCurrentTime from "../utils/getCurrentTime";
import db from "../../utils/db";
import addOrUpdateNovelInDB from "../utils/addOrUpdateNovelInDB";
import minimalArgs from "../utils/minimalArgsToLaunch";
import login from "../utils/login";

// 각 플랫폼에서 주간베스트 소설 20개 씩 가져오기

const novelPlatform = "리디북스";

export async function getNovelUrls(page: puppeteer.Page) {
  let bestNo = 1;
  const novelUrls = [];

  while (bestNo < 21) {
    // without this I can't get novel urls more than 11
    if (bestNo === 12) {
      for (let i = 1; i < 9; i += 1) {
        await page.keyboard.press("PageDown");
      }
    }

    const novelElement = await page.waitForSelector(
      `#__next > main > div > section > ul.fig-1nfc3co > li:nth-child(${bestNo}) > div > div.fig-jc2buj > div > h3 > a`,
    );

    const partialNovelUrl: string = await page.evaluate(
      (element) => element.getAttribute("href"),
      novelElement,
    );

    const partialNovelUrlCut = partialNovelUrl.slice(0, partialNovelUrl.indexOf("?"));

    const novelUrl = `ridibooks.com${partialNovelUrlCut}`;

    novelUrls.push(novelUrl);
    bestNo += 1;
  }
  return novelUrls;
}

async function getNovelIDsFromDB(page: puppeteer.Page, novelUrls: string[]) {
  const novelIDs: string[] = [];

  while (novelUrls.length !== 0) {
    const novelID = await addOrUpdateNovelInDB(page, novelUrls[0], novelPlatform);

    if (!novelID) {
      novelUrls.shift();
      continue;
    }

    novelIDs.push(novelID);

    novelUrls.shift();
  }

  return novelIDs;
}

async function addWeeklyNovel(novelId: string, novelRank: number, scrapeDate: string) {
  await db(
    "INSERT INTO weeklyNovel SET novelId = (?), novelRank = (?), novelPlatform = (?), scrapeDate = (?),  isLatest = 1",
    [novelId, novelRank, novelPlatform, scrapeDate],
  );
}

async function handlePreviousWeeklyNovels() {
  await db("UPDATE weeklyNovel SET isLatest = 0 WHERE isLatest = 1 AND novelPlatform = (?)", [
    novelPlatform,
  ]);
}
async function addWeeklyNovels(novelIDs: Array<string>) {
  const scrapeDate = getCurrentTime();

  // make isLatest value 0 that means false of previous weekly novels
  await handlePreviousWeeklyNovels();

  for (const [index, novelId] of novelIDs.entries()) {
    await addWeeklyNovel(novelId, index + 1, scrapeDate);
  }

  // later I will get weekly novels from DB where isLatest is 1 and platform is 카카오페이지
}

export default async function weeklyRidi() {
  const browser = await puppeteer.launch({
    headless: false, // 브라우저 화면 열려면 false
    args: minimalArgs,
  });

  const page = await browser.newPage();

  page.setDefaultTimeout(500000); // set timeout globally

  await login(page, novelPlatform, "weekly");

  const novelUrls = await getNovelUrls(page);

  const novelIDs = await getNovelIDsFromDB(page, novelUrls);

  // update new weekly novels to weeklyNovel table
  await addWeeklyNovels(novelIDs);

  await browser.close();

  return novelIDs;
}
