import puppeteer, { ElementHandle } from "puppeteer";
import dotenv from "dotenv";
import getCurrentTime from "../utils/getCurrentTime";
import db from "../../utils/db";
import addOrUpdateNovelInDB from "../utils/addOrUpdateNovelInDB";

dotenv.config();

// 각 플랫폼에서 주간베스트 소설 20개 씩 가져오기

const novelPlatform = "리디북스";

// 로판 웹소설(장르불문 스크랩 불가) / 성인 작품 제외됨
const novelListUrl = "https://ridibooks.com/category/bestsellers/6050?adult_exclude=y&page=1";

async function login(page: puppeteer.Page) {
  // login for passing 15 age limitation

  const loginBtn = (await page.waitForSelector(
    "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li:nth-child(2) > a",
  )) as ElementHandle<HTMLAnchorElement>; // wait object load

  // loginBtn null error handling
  if (!loginBtn) {
    throw new Error("login 버튼 null 에러");
  }

  await page.click(
    "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li:nth-child(2) > a",
  ); // click and go to the login page in a current tab/window

  let ridiID: string;
  let ridiPW: string;

  // handle undefined env variable
  if (process.env.RIDI_ID) {
    ridiID = process.env.RIDI_ID;
  } else {
    throw new Error("RIDI_ID env was not set");
  }
  if (process.env.RIDI_PW) {
    ridiPW = process.env.RIDI_PW;
  } else {
    throw new Error("RIDI_PW env was not set");
  }

  await page.waitForSelector("#__next > div > section > div > form > input.fig-w58liu.e1yjg41i0", {
    timeout: 50000,
  });

  await page.type("#__next > div > section > div > form > input.fig-w58liu.e1yjg41i0", ridiID, {
    delay: 100,
  });

  await page.waitForSelector("#__next > div > section > div > form > input.fig-7he7ta.e1yjg41i0");

  await page.type("#__next > div > section > div > form > input.fig-7he7ta.e1yjg41i0", ridiPW, {
    delay: 100,
  });

  await page.click("#__next > div > section > div > form > div > input"); // 로그인상태유지

  await page.click("#__next > div > section > div > form > button"); // click login button
}

async function waitForProfileIconAfterLogin(page: puppeteer.Page) {
  await page.waitForSelector(
    "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li > a > span",
  );
}

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
    // 꼭 하기!!!
    // new scraper에 아래 함수를 사용할 때는 novelID 변수에 받지 않기
    const novelID = await addOrUpdateNovelInDB(page, novelUrls[0], "리디북스");

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

const minimalArgs = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
];

export default async function weeklyRidi() {
  const browser = await puppeteer.launch({
    headless: false, // 브라우저 화면 열려면 false
    args: minimalArgs,
  });

  const page = await browser.newPage();

  page.setDefaultTimeout(500000); // set timeout globally

  await page.goto(novelListUrl);

  await login(page);

  await waitForProfileIconAfterLogin(page);

  const novelUrls = await getNovelUrls(page);

  const novelIDs = await getNovelIDsFromDB(page, novelUrls);

  // update new weekly novels to weeklyNovel table
  await addWeeklyNovels(novelIDs);

  await browser.close();

  return novelIDs;
}
