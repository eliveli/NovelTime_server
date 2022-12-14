import puppeteer, { SerializableOrJSHandle } from "puppeteer";
import getCurrentTime from "../utils/getCurrentTime";
import db from "../../utils/db";
import { setNovel } from "../../novels";
import removeLabelsFromTitle from "../utils/removeLabelsFromTitle";
import minimalArgs from "../utils/minimalArgsToLaunch";
import login from "../utils/login";
import getNovelUrls from "./utils/getNovelUrls";
import getNovelIDsFromDB from "./utils/getNovelIDsFromDB";

// 각 플랫폼에서 주간베스트 소설 20개 씩 가져오기

const novelPlatform = "네이버 시리즈";

const selectorsOfNovelPage = {
  // use descendant selector (don't use ">" in front of "img")
  // because there can be different selector
  // such as "#container > div.aside.NE\\=a\\:nvi > span >  img"
  //    and  "#container > div.aside.NE\\=a\\:nvi >   a  > img"
  img: "#container > div.aside.NE\\=a\\:nvi   img",

  // need to remove a tag such as [독점]
  title: "#content > div.end_head > h2",

  desc: {
    parent: "#content > div.end_dsc",
    child1: "#content > div.end_dsc > div:nth-child(1)",
    child2: "#content > div.end_dsc > div:nth-child(2)",
  },

  age: "#content > ul.end_info.NE\\=a\\:nvi > li > ul > li:nth-child(5)",

  author: "#content > ul.end_info.NE\\=a\\:nvi > li > ul > li:nth-child(3) > a",

  genre: "#content > ul.end_info.NE\\=a\\:nvi > li > ul > li:nth-child(2) > span > a",

  isEnd: "#content > ul.end_info.NE\\=a\\:nvi > li > ul > li:nth-child(1) > span",
};

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
  const parentDescElement = await page.waitForSelector(selectorsOfNovelPage.desc.parent);
  const childrenLengthOfDesc = await page.evaluate(
    (element) => element.children.length,
    parentDescElement,
  );

  // if there is not a more button of desc
  if (childrenLengthOfDesc === 1) {
    return await getInfo(page, selectorsOfNovelPage.desc.child1, "html");
  }

  // if there is a more button of desc
  await page.waitForSelector(selectorsOfNovelPage.desc.child2);

  const descriptionWithOtherTag = await getInfo(page, selectorsOfNovelPage.desc.child2, "html");

  const startIndexOfOtherTag = descriptionWithOtherTag.indexOf("<span");

  const desc = descriptionWithOtherTag.slice(0, startIndexOfOtherTag);

  return desc;
}

//  -- check novel image in db and make sure that img is saved as small size in DB
//     to reduce time when downloading image
//     only send image as big size when it is needed especially when showing the full image
//       to do remove the following in the end of the img src when needed : "&filename=th3"
//

async function getIsEnd(page: puppeteer.Page) {
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
  const novelAge = await getInfo(page, selectorsOfNovelPage.age);
  const novelGenre = await getInfo(page, selectorsOfNovelPage.genre);
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

export default async function weeklySeries() {
  const browser = await puppeteer.launch({
    headless: false, // 브라우저 화면 열려면 false
    args: minimalArgs,
  });

  const page = await browser.newPage();

  page.setDefaultTimeout(500000); // set timeout globally

  await login(page, novelPlatform, "weekly");

  const novelUrls = await getNovelUrls(page, novelPlatform);

  if (!novelUrls) return;

  const novelIDs = await getNovelIDsFromDB(page, novelPlatform, novelUrls);

  // update new weekly novels to weeklyNovel table
  await addWeeklyNovels(novelIDs);

  await browser.close();

  return novelIDs;
}
