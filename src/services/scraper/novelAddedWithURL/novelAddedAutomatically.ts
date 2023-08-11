import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { NovelPlatform } from "../utils/types";
import {
  addNewNovel,
  getSameNovelsAndSeveralInfo,
  updateNovelWithPlatform,
} from "../utils/addOrUpdateNovelInDB";

dotenv.config();

async function addOrUpdateNovelWithURL(
  page: puppeteer.Page,
  novelUrl: string,
  novelPlatform: NovelPlatform,
) {
  try {
    const sameNovelsAndInfo = await getSameNovelsAndSeveralInfo(page, novelUrl, novelPlatform);

    if (!sameNovelsAndInfo) throw Error("can't get this novel");

    const { sameNovelsInDB, severalNovelInfo } = sameNovelsAndInfo;

    // when the novel is not in db //
    //  add new novel to novelInfo table
    if (sameNovelsInDB.length === 0) {
      const novelId = await addNewNovel(page, severalNovelInfo, novelPlatform);
      return { novelId, novelTitle: severalNovelInfo.novelTitle };
    }

    // when novel is in db //
    //  update the novel with its platform and url
    const novelUrlAndTitle = { novelUrl, novelTitle: severalNovelInfo.novelTitle };
    const novelId = await updateNovelWithPlatform(novelUrlAndTitle, sameNovelsInDB, novelPlatform);
    return { novelId, novelTitle: severalNovelInfo.novelTitle };
  } catch (err: any) {
    console.log(err);
  }
}

// it works with user request
//  make sure what is the novel platform by using the novel url
//  and then add or update novel in DB
export default async function addNovelWithURL(inputUrl: string) {
  let novelPlatform: "카카오페이지" | "네이버 시리즈" | "리디북스" | "조아라";

  const kakaoURL = {
    directUrl: "page.kakao.com/home?seriesId=",
    indirectUrl: "link-page.kakao.com/goto_view?series_id=",
  };

  const seriesURL = {
    directUrl: "series.naver.com/novel/detail.series?productNo=",
    indirectUrl: "naver.me/",
  };

  const ridiURL = "ridibooks.com/books/";

  const joaraURL = "joara.com/";

  // find the novel platform
  if (inputUrl.includes(kakaoURL.directUrl) || inputUrl.includes(kakaoURL.indirectUrl)) {
    novelPlatform = "카카오페이지";
  } else if (inputUrl.includes(seriesURL.directUrl) || inputUrl.includes(seriesURL.indirectUrl)) {
    novelPlatform = "네이버 시리즈";
  } else if (inputUrl.includes(ridiURL)) {
    novelPlatform = "리디북스";
  } else if (inputUrl.includes(joaraURL)) {
    novelPlatform = "조아라";
  } else {
    throw Error("novel url is not matched with novel platform");
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  // login is not required as not trying to get a novel for adult

  const novelIdAndTitle = await addOrUpdateNovelWithURL(page, inputUrl, novelPlatform);

  await browser.close();

  return novelIdAndTitle;
}
