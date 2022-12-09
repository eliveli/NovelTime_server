import puppeteer, { SerializableOrJSHandle } from "puppeteer";

import { setNovel } from "../../novels";
import db from "../../utils/db";
import removeLabelsFromTitle from "../bestNovelOfWeek/utils/removeLabelsFromTitle";
import getCurrentTime from "./getCurrentTime";

type NovelInfo = {
  novelTitle: string;
  novelAuthor: string;
  novelUrl: string;
};

type NovelPlatform = "카카오페이지" | "네이버 시리즈" | "리디북스";

type NewNovelPages = Array<{
  platform: string;
  url: string;
}>;

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

// 꼭 하기!!!
// 플랫폼 구분
// 아래는 리디용
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

export async function searchForNovelsByTitleAndAuthor(novelTitle: string, novelAuthor: string) {
  return (await db(
    `SELECT novelId, novelTitle, novelAuthor, novelPlatform, novelPlatform2, novelPlatform3, novelUrl, novelUrl2, novelUrl3 FROM novelInfo
    WHERE novelTitle LIKE (?) AND novelAuthor = (?)`,
    [`%${novelTitle}%`, novelAuthor],
    "all",
  )) as Array<NovelForChecking>;
}

async function addNewNovel(
  page: puppeteer.Page,
  novelInfo: NovelInfo,
  novelPlatform: NovelPlatform,
) {
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

function findSameNovelsFromTitlesWithLabels(
  existingNovelsInDB: NovelForChecking[],
  novelTitleWithoutLabels: string,
) {
  const sameNovelsInDB = [];
  // 찾은 소설을 조회하며 제목에서 라벨 떼고
  //  현재 플랫폼에서 읽어 온 소설 제목에서 라벨 뗀 것과 일치하는 지 확인
  //   일치할 경우 배열을 구성해 같은 소설의 정보로 취급
  for (const existingNovel of existingNovelsInDB) {
    const novelTitleWithoutLabelsInDB = removeLabelsFromTitle(existingNovel.novelTitle);

    if (novelTitleWithoutLabels === novelTitleWithoutLabelsInDB) {
      sameNovelsInDB.push(existingNovel);
    }
  }
  return sameNovelsInDB;
}

async function getSameNovelsAndSeveralInfo(page: puppeteer.Page, novelUrl: string) {
  await page.goto(`https://${novelUrl}`);

  const novelTitleFromPage = await getInfo(page, selectorsOfNovelPage.title);
  const novelTitleWithoutLabels = removeLabelsFromTitle(novelTitleFromPage);

  const novelAuthor = await getInfo(page, selectorsOfNovelPage.author);

  // 라벨 뗀 문구가 포함된 제목으로 소설 검색
  // get novels that have titles including text without labels in them
  const existingNovelsInDB = await searchForNovelsByTitleAndAuthor(
    novelTitleWithoutLabels,
    novelAuthor,
  );

  const sameNovelsInDB = findSameNovelsFromTitlesWithLabels(
    existingNovelsInDB,
    novelTitleWithoutLabels,
  );

  const severalNovelInfo = { novelTitle: novelTitleWithoutLabels, novelAuthor, novelUrl };
  return { sameNovelsInDB, severalNovelInfo };
}

async function updateNovel(
  novelId: string,
  newNovelPages: NewNovelPages,
  novelTitleWithoutLabels: string,
) {
  await db(
    "UPDATE novelInfo SET novelTitle = (?), novelPlatform = (?), novelUrl = (?), novelPlatform2 = (?), novelUrl2 = (?), novelPlatform3 = (?), novelUrl3 = (?) WHERE novelId = (?)",
    [
      novelTitleWithoutLabels,
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

async function makeNovelOne(
  novelIDs: Array<string>,
  newNovelPages: NewNovelPages,
  novelTitleWithoutLabels: string,
) {
  const novelIdForUpdate = novelIDs[0];
  await updateNovel(novelIdForUpdate, newNovelPages, novelTitleWithoutLabels);

  if (novelIDs.length > 1) {
    const novelIDsForDelete = novelIDs.slice(1, novelIDs.length);

    await deleteSameNovels(novelIDsForDelete);
  }

  return novelIdForUpdate;
}

async function updateNovelWithPlatform(
  severalNovelInfo: NovelInfo,
  novelsInDB: NovelForChecking[],
  novelPlatform: NovelPlatform,
) {
  const novelPlatforms: Array<string> = [];
  const novelUrls: Array<string> = [];

  // check novel rows that has same title and author
  // get platform info that is not empty
  for (const novelPlatformPage of novelsInDB) {
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

  // add the platform ridi if it is not in the table novelInfo of DB
  if (!novelPlatforms.includes(novelPlatform)) {
    newNovelPages.push({ platform: novelPlatform, url: severalNovelInfo.novelUrl });
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
  for (const novel of novelsInDB) {
    novelIDsWithSameNovel.push(novel.novelId);
  }
  //
  // make same novels one and set title without labels and return the novel id
  const novelId = await makeNovelOne(
    novelIDsWithSameNovel,
    newNovelPages,
    severalNovelInfo.novelTitle,
  );

  return novelId;
}

// check whether the novel is in novelInfo table or not
// and add a new novel or update a novel as changing its platform and url info
// finally get the novel id
export default async function addOrUpdateNovelInDB(
  page: puppeteer.Page,
  // 꼭 하기!!!!
  // novelUrl에 값을 넣을 때 scraper에 따라 다르게 : weekly best or new
  // new scraper에 사용할 때는 앞에 https 빼고 넣기. ridibooks.com${novelList[currentNovelNO - 1].url}
  novelUrl: string,
  novelPlatform: NovelPlatform,
) {
  const { sameNovelsInDB, severalNovelInfo } = await getSameNovelsAndSeveralInfo(page, novelUrl);

  // when the novel is not in db //
  //  add new novel to novelInfo table
  if (sameNovelsInDB.length === 0) {
    const novelId = await addNewNovel(page, severalNovelInfo, novelPlatform);
    return novelId;
  }

  // when novel is in db //
  //  update the novel with its platform and url
  const novelId = await updateNovelWithPlatform(severalNovelInfo, sameNovelsInDB, novelPlatform);
  return novelId;
}
