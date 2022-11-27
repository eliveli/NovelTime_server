import puppeteer, { ElementHandle, SerializableOrJSHandle } from "puppeteer";
import dotenv from "dotenv";
import getCurrentTime from "../novel/getCurrentTime";
import db from "../../db";
import { setNovel } from "../../../novels";

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

const selectorsOfNovelPage = {
  img: "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > div > img",

  title:
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div.info_title_wrap > h3",

  desc: "article.detail_box_module.detail_introduce_book #introduce_book > p",

  // 성인 작품 제외
  age: "#notice_component > ul > li",

  author:
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_writer > span > a",

  genre:
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > p",

  isEnd:
    "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_info_series_complete_wrap > span.metadata_item.not_complete",
};

export async function getNovelUrls(page: puppeteer.Page) {
  let bestNo = 1;
  const novelUrls = [];

  // without this I can't get novel urls more than 11
  for (let i = 1; i < 9; i += 1) {
    await page.keyboard.press("PageDown");
  }

  while (bestNo < 21) {
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

async function getDesc(page: puppeteer.Page) {
  const descElement = await page.waitForSelector(selectorsOfNovelPage.desc);

  const desc: string = await page.evaluate((element) => {
    // 첫 줄에 제목 + 로맨스 가이드 있을 때 그 부분 제외
    if (
      element.children[0].tagName === "SPAN" &&
      element.innerText.includes(">\n로맨스 가이드\n\n")
    ) {
      const idxForRemoving: number = element.innerText.indexOf(">\n로맨스 가이드\n\n");
      return element.innerText.slice(idxForRemoving + 11);
    }
    // 첫 줄 제목 제외
    if (
      element.children[0].tagName === "SPAN" &&
      (element.children.length === 1 || element.children[1].tagName !== "IMG")
    ) {
      const idxForRemoving: number = element.innerText.indexOf(">\n");
      return element.innerText.slice(idxForRemoving + 2);
    }
    // 첫 줄에 제목, 둘째 줄에 이미지, 셋째 넷째 비어있을 때 제외
    if (
      element.children[0].tagName === "SPAN" &&
      element.children[1].tagName === "IMG" &&
      element.children[2].tagName === "BR" &&
      element.children[3].tagName === "BR"
    ) {
      const idxForRemoving: number = element.innerText.indexOf(">\n\n\n");
      return element.innerText.slice(idxForRemoving + 4);
    }
  }, descElement);

  return desc;
}

async function getAge(page: puppeteer.Page) {
  const notification = await getInfo(page, selectorsOfNovelPage.age);

  if (notification.includes("15세")) return "15세 이용가";
  if (notification.includes("12세")) return "12세 이용가";
  return "전체 이용가";
}

async function getGenre(page: puppeteer.Page) {
  const genre = await getInfo(page, selectorsOfNovelPage.genre);
  if (genre.includes("로판")) return "로판";
  if (genre.includes("로맨스")) return "로맨스";
  if (genre.includes("무협")) return "무협";
  if (genre.includes("라이트노벨")) return "라이트노벨";
  if (genre.includes("BL")) return "BL";
  if (genre.includes("현대") || genre.includes("게임") || genre.includes("스포츠")) return "현판";
  if (genre.includes("판타지")) return "판타지";
  return "기타";
}

//  -- check novel image in db and make sure that img is saved as small size in DB
//     to reduce time when downloading image
//     only send image as big size when it is needed especially when showing the full image
//       to do remove the following in the end of the img src when needed : "&filename=th3"
//

async function getIsEnd(page: puppeteer.Page) {
  const isEnd = await page.evaluate((selectorOfIsEnd) => {
    const notEndElement = document.querySelector(selectorOfIsEnd);
    return notEndElement === null;
  }, selectorsOfNovelPage.isEnd);
  return isEnd;
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

async function searchForNovelsByTitleAndAuthor(novelTitle: string, novelAuthor: string) {
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
  const novelDesc = await getDesc(page);
  const novelAge = await getAge(page);
  const novelGenre = await getGenre(page);
  const novelIsEnd = await getIsEnd(page);
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

function removeStartLabels(novelTitle: string) {
  for (const label of [")", ") ", "]", "] "]) {
    const indexOfLabel = novelTitle.indexOf(label);
    if (indexOfLabel === -1) continue;
    if (indexOfLabel !== novelTitle.length - 1) {
      return novelTitle.slice(indexOfLabel + label.length, novelTitle.length - 1);
    }
  }
}
function removeEndLabels(novelTitle: string) {
  for (const label of ["(", " (", "[", " [", "외전", " 외전", "-외전", " -외전"]) {
    const indexOfLabel = novelTitle.indexOf(label);
    if (indexOfLabel === -1) continue;
    if (indexOfLabel !== 0) {
      return novelTitle.slice(0, indexOfLabel);
    }
  }
}
function removeLabelsFromTitle(novelTitle: string) {
  const titleWithoutEndLabels = removeEndLabels(novelTitle);
  if (titleWithoutEndLabels) return titleWithoutEndLabels;

  const titleWithoutStartLabels = removeStartLabels(novelTitle);
  if (titleWithoutStartLabels) return titleWithoutStartLabels;

  return novelTitle;
}
// check whether the novel is in novelInfo table or not
// and add a new novel or update a novel as changing its platform and url info
// finally get the novel id
export async function addOrUpdateNovelInDB(page: puppeteer.Page, novelInfo: NovelInfo) {
  const { novelAuthor, novelTitle, novelUrl } = novelInfo;

  const novelTitleWithoutLabels = removeLabelsFromTitle(novelTitle);

  const novelsFromDB = await searchForNovelsByTitleAndAuthor(novelTitleWithoutLabels, novelAuthor);

  // when the novel is not in db //
  //  add new novel to novelInfo table
  if (novelsFromDB.length === 0) {
    const novelId = await addNewNovel(page, novelInfo);
    return novelId;
  }

  // when novel is in db //
  // update the novel with its platform and url
  const novelPlatforms: Array<string> = [];
  const novelUrls: Array<string> = [];

  // check novel rows that has same title and author
  for (const novelPlatformPage of novelsFromDB) {
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

  // add the platform naver series if it is not in the table novelInfo of DB
  if (!novelPlatforms.includes(novelPlatform)) {
    newNovelPages.push({ platform: novelPlatform, url: novelUrl });
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
  for (const novel of novelsFromDB) {
    novelIDsWithSameNovel.push(novel.novelId);
  }
  //
  // make same novels one and return the novel id
  const novelId = await makeNovelOne(novelIDsWithSameNovel, newNovelPages);

  return novelId;
}

export async function getNovelIdFromDB(page: puppeteer.Page, novelUrl: string) {
  await page.goto(`https://${novelUrl}`);

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
