import puppeteer, { ElementHandle, SerializableOrJSHandle } from "puppeteer";
import dotenv from "dotenv";
import getCurrentTime from "../novel/getCurrentTime";
import db from "../../db";
import { setNovel } from "../../../novels";

dotenv.config();

// 각 플랫폼에서 주간베스트 소설 20개 씩 가져오기

const novelListUrl =
  "https://page.kakao.com/menu/11/screen/16?subcategory_uid=0&ranking_type=weekly";

async function login(page: puppeteer.Page) {
  // login for passing 15 age limitation
  const loginBtn = (await page.waitForSelector(
    "#__next > div > div.css-1uny17z-Sticky-PcLayoutHeader > div > div.css-uhicds-PcHeader > div.css-8qyfof-PcHeader > img.css-dqete9-Icon-PcHeader",
  )) as ElementHandle<HTMLDivElement>; // wait object load
  // loginBtn null error handling
  if (!loginBtn) {
    throw new Error("login 버튼 null 에러");
  }

  // declare promise for popup event
  //  eslint-disable-next-line no-promise-executor-return
  const newPagePromise = new Promise((x) => page.once("popup", x));

  await loginBtn.click(); // click, a new tab/window opens

  // declare new tab/window, now you can work with it
  const newPage = (await newPagePromise) as puppeteer.Page;

  let kakaoID: string;
  let kakaoPW: string;

  // handle undefined env variable
  if (process.env.KAKAO_ID) {
    kakaoID = process.env.KAKAO_ID;
  } else {
    throw new Error("KAKAO_ID env was not set");
  }
  if (process.env.KAKAO_PW) {
    kakaoPW = process.env.KAKAO_PW;
  } else {
    throw new Error("KAKAO_PW env was not set");
  }

  // sometimes it can not work (when playing video or running DBeaver)
  //  It seems to occur when there are many processes in my computer
  await newPage.waitForSelector("#input-loginKey", { timeout: 50000 });

  await newPage.type("#input-loginKey", kakaoID);

  await newPage.waitForSelector("#input-password");

  await newPage.type("#input-password", kakaoPW);

  await newPage.click(
    "#mainContent > div > div > form > div.set_login > div > label > span.ico_comm.ico_check",
  ); // click 로그인상태유지

  // click login button
  await newPage.click("#mainContent > div > div > form > div.confirm_btn > button.btn_g.highlight"); // submit
}

async function waitForProfileIconAfterLogin(page: puppeteer.Page) {
  await page.waitForSelector(
    "#__next > div > div.css-1uny17z-Sticky-PcLayoutHeader > div > div.css-uhicds-PcHeader > div.css-8qyfof-PcHeader > div",
  );
}

const selectorsOfNovelPage = {
  img: "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-4z4dsn-ContentMainPcContainer > div.css-6wrvoh-ContentMainPcContainer > div.css-dwn26i > div > div.css-0 > div.css-1p0xvye-ContentOverviewThumbnail > div > div > img",
  title:
    "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-4z4dsn-ContentMainPcContainer > div.css-6wrvoh-ContentMainPcContainer > div.css-dwn26i > div > div.css-0 > div.css-6vpm3i-ContentOverviewInfo > span",
  desc: "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-1m11tvk-ContentMainPcContainer > div.css-1hq49jx-ContentDetailTabContainer > div.css-t3lp6q-ContentTitleSection-ContentDetailTabContainer > span",
  age: "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-1m11tvk-ContentMainPcContainer > div.css-1hq49jx-ContentDetailTabContainer > div.css-9rge6r > div:nth-child(1) > div.css-1luchs4-ContentDetailTabContainer > div:nth-child(3) > div",
  author:
    "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-1m11tvk-ContentMainPcContainer > div.css-1hq49jx-ContentDetailTabContainer > div.css-9rge6r > div:nth-child(2) > div.css-1luchs4-ContentDetailTabContainer > div > div",
  genre:
    "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-4z4dsn-ContentMainPcContainer > div.css-6wrvoh-ContentMainPcContainer > div.css-dwn26i > div > div.css-0 > div.css-6vpm3i-ContentOverviewInfo > div.css-1ao35gu-ContentOverviewInfo > span:nth-child(9)",
  isEnd:
    "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-4z4dsn-ContentMainPcContainer > div.css-6wrvoh-ContentMainPcContainer > div.css-dwn26i > div > div.css-0 > div.css-6vpm3i-ContentOverviewInfo > div.css-484gjc-ContentOverviewInfo > div:nth-child(1) > span",
};

async function getNovelUrls(page: puppeteer.Page) {
  let bestNo = 1;
  const novelUrls = [];
  while (bestNo < 21) {
    const novelElement = await page.waitForSelector(
      `#__next > div > div.css-gqvt86-PcLayout > div.css-58idf7-Menu > div.css-1dqbyyp-Home > div > div > div.css-1k8yz4-StaticLandingRanking > div > div > div > div:nth-child(${bestNo}) > div > div > a`,
    );
    const partialNovelUrl: string = await page.evaluate(
      (element) => element.getAttribute("href"),
      novelElement,
    );

    const novelUrl = `page.kakao.com${partialNovelUrl}`;

    novelUrls.push(novelUrl);

    bestNo += 1;
  }
  return novelUrls;
}

async function getInfo(
  page: puppeteer.Page,
  selector: string,
  instruction: "attr" | "html" | undefined = undefined,
  attributeName = "",
) {
  const infoElement = await page.waitForSelector(selector);
  const info: string = await page.evaluate(
    (element, instr, attrName) => {
      if (instr === "attr") {
        return element.getAttribute(attrName);
      }

      if (instr === "html") {
        return element.innerHTML;
      }

      return element.innerText;
    },
    infoElement,
    instruction as SerializableOrJSHandle,
    attributeName as SerializableOrJSHandle,
  );
  return info;
}

//  -- check novel image in db and make sure that img is saved as small size in DB
//     to reduce time when downloading image
//     only send image as big size when it is needed especially when showing the full image
//       to do remove the following in the end of the img src when needed : "&filename=th3"
//

async function setGenre(page: puppeteer.Page, novelTitle: string) {
  if (novelTitle.includes("[BL]")) {
    return "BL";
  }
  return await getInfo(page, selectorsOfNovelPage.genre);
}

async function setIsEnd(page: puppeteer.Page) {
  const checkingEnd = await getInfo(page, selectorsOfNovelPage.isEnd);
  if (checkingEnd.includes("완결")) {
    return true;
  }
  return false;
}

type NovelForChecking = {
  novelId: string;
  novelTitle: string;
  novelAuthor: string;
  novelPlatform: string;
  novelPlatform2: string;
  novelPlatform3: string;
  novelUrl: string;
  novelUrl2: string;
  novelUrl3: string;
};

async function getSameNovelFromDB(novelTitle: string, novelAuthor: string) {
  return (await db(
    `SELECT novelId, novelTitle, novelAuthor, novelPlatform, novelPlatform2, novelPlatform3, novelUrl, novelUrl2, novelUrl3 FROM novelInfo
  WHERE novelTitle = (?) AND novelAuthor = (?)`,
    [novelTitle, novelAuthor],
    "all",
  )) as Array<NovelForChecking>;
}

type NovelInfo = {
  novelTitle: string;
  novelAuthor: string;
  novelUrl: string;
};

async function addNewNovel(page: puppeteer.Page, novelInfo: NovelInfo) {
  const novelId = getCurrentTime();
  const novelImg = await getInfo(page, selectorsOfNovelPage.img, "attr", "src");
  const novelDesc = await getInfo(page, selectorsOfNovelPage.desc, "html");
  const novelAge = await getInfo(page, selectorsOfNovelPage.age);
  const novelGenre = await setGenre(page, novelInfo.novelTitle);
  const novelIsEnd = await setIsEnd(page);
  const novelPlatform = "카카오페이지";
  const { novelAuthor, novelTitle, novelUrl } = novelInfo;

  const novel = {
    novelId,
    novelImg,
    novelTitle,
    novelDesc,
    novelAuthor,
    novelAge,
    novelGenre,
    novelIsEnd,
    novelPlatform,
    novelUrl,
  };

  await setNovel(novel);

  return novelId;
}

type NewNovelPages = Array<{
  platform: string;
  url: string;
}>;

async function updateNovel(novelId: string, newNovelPages: NewNovelPages) {
  await db(
    "UPDATE novelInfo SET novelPlatform = (?), novelUrl = (?), novelPlatform2 = (?), novelUrl2 = (?), novelPlatform3 = (?), novelUrl3 = (?) WHERE novelId = (?)",
    [
      newNovelPages[0].platform,
      newNovelPages[0].url,
      newNovelPages[1].platform,
      newNovelPages[1].url,
      newNovelPages[2].platform,
      newNovelPages[2].url,
      novelId,
    ],
  );
}

async function deleteSameNovel(novelId: string) {
  await db("DELETE FROM novelInfo WHERE novelId = (?)", [novelId]);
}
async function deleteSameNovels(novelIDs: Array<string>) {
  for (const novelId of novelIDs) {
    await deleteSameNovel(novelId);
  }
}

async function makeNovelOne(novelIDs: Array<string>, newNovelPages: NewNovelPages) {
  const novelIdForUpdate = novelIDs[0];

  await updateNovel(novelIdForUpdate, newNovelPages);

  if (novelIDs.length > 1) {
    const novelIDsForDelete = novelIDs.slice(1, novelIDs.length);

    await deleteSameNovels(novelIDsForDelete);
  }

  return novelIdForUpdate;
}

// check whether the novel is in novelInfo table or not
// and add a new novel or update a novel as changing its platform and url info
// finally get the novel id
export async function addOrUpdateNovelInDB(page: puppeteer.Page, novelInfo: NovelInfo) {
  const targetPlatform = "카카오페이지";
  const { novelAuthor, novelTitle, novelUrl } = novelInfo;

  const novelFromDB = await getSameNovelFromDB(novelTitle, novelAuthor);

  // when the novel is not in db //
  //  add new novel to novelInfo table
  if (novelFromDB.length === 0) {
    const novelId = await addNewNovel(page, novelInfo);
    return novelId;
  }

  // when novel is in db //
  // update the novel with its platform and url
  const novelPlatforms: Array<string> = [];
  const novelUrls: Array<string> = [];

  // check novel rows that has same title and author
  for (const novelPlatformPage of novelFromDB) {
    // get platform info that is not empty
    for (const { platform, url } of [
      { platform: novelPlatformPage.novelPlatform, url: novelPlatformPage.novelUrl },
      { platform: novelPlatformPage.novelPlatform2, url: novelPlatformPage.novelUrl2 },
      { platform: novelPlatformPage.novelPlatform3, url: novelPlatformPage.novelUrl3 },
    ]) {
      if (platform) {
        novelPlatforms.push(platform);
        novelUrls.push(url);
      }
    }
  }

  // remove duplicate platform info
  const newNovelPages = novelPlatforms
    .map((platform, index) => {
      if (novelPlatforms.indexOf(platform) === index) {
        return { platform, url: novelUrls[index] };
      }
      return undefined;
    })
    // remove undefined item from the array made by map function
    .filter((platform) => !!platform) as NewNovelPages;

  // add the platform kakao page if it is not in the table novelInfo of DB
  if (!novelPlatforms.includes(targetPlatform)) {
    newNovelPages.push({ platform: targetPlatform, url: novelUrl });
  }

  // remove JOARA platform of the novel info if platform is more than 3
  //  typically I won't consider 조아라 in this case because that is popular as free platform
  //   just consider novel platforms up to 3
  if (novelPlatforms.length > 3 && novelPlatforms.includes("조아라")) {
    for (const [index, value] of newNovelPages.entries()) {
      if (value?.platform === "조아라") {
        newNovelPages.splice(index, 1);
        break;
      }
    }
  }

  // make newNovelPages array had 3 platforms and urls including empty string
  //  to deal with db when updating novel
  for (let i = newNovelPages.length; i < 3; i += 1) {
    newNovelPages.push({ platform: "", url: "" });
  }

  // update one novel
  //  and remove other novel rows if there was more than one novel row in DB
  //
  // make an array of novelID with the same novel
  const novelIDsWithSameNovel: Array<string> = [];
  for (const novel of novelFromDB) {
    novelIDsWithSameNovel.push(novel.novelId);
  }
  //
  // make same novels one and return the novel id
  const novelId = await makeNovelOne(novelIDsWithSameNovel, newNovelPages);

  return novelId;
}

async function getNovelIdFromDB(page: puppeteer.Page, novelUrl: string) {
  await page.goto(`https://${novelUrl}?tab_type=about`);

  // they are necessary to check whether the novel is in DB
  const novelTitle = await getInfo(page, selectorsOfNovelPage.title);
  const novelAuthor = await getInfo(page, selectorsOfNovelPage.author);

  const novelInfo = { novelTitle, novelAuthor, novelUrl };

  // add the novel as new one or update novel in novelInfo table
  //  and get the novel id
  const novelId = await addOrUpdateNovelInDB(page, novelInfo);

  return novelId;
}

async function getNovelIDsFromDB(page: puppeteer.Page, novelUrls: string[]) {
  const novelIDs: string[] = [];

  while (novelUrls.length !== 0) {
    const novelID = await getNovelIdFromDB(page, novelUrls[0]);

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
  const novelPlatform = "카카오페이지";

  await db(
    "INSERT INTO weeklyNovel SET novelId = (?), novelRank = (?), novelPlatform = (?), scrapeDate = (?),  isLatest = 1",
    [novelId, novelRank, novelPlatform, scrapeDate],
  );
}

async function handlePreviousWeeklyNovels() {
  const novelPlatform = "카카오페이지";

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

export default async function weeklyKakape() {
  const browser = await puppeteer.launch({
    // headless: false, // 브라우저 화면 열려면 false
    args: minimalArgs,
  });

  const page = await browser.newPage();

  page.setDefaultTimeout(500000); // set timeout globally

  await page.goto(novelListUrl);
  // await page.goto(novelListUrl, { waitUntil: "load", timeout: 500000 });
  // set timeout specifically for navigational events such as page.waitForSelector

  await login(page);

  await waitForProfileIconAfterLogin(page);

  const novelUrls = await getNovelUrls(page);
  const novelIDs = await getNovelIDsFromDB(page, novelUrls);

  // update new weekly novels to weeklyNovel table
  await addWeeklyNovels(novelIDs);

  await browser.close();

  return novelIDs;
}
