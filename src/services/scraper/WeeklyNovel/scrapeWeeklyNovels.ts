import puppeteer from "puppeteer";
import minimalArgs from "../utils/minimalArgsToLaunch";
import login from "../utils/login";
import getNovelUrls from "./utils/getNovelUrls";
import getNovelIDsFromDB from "./utils/getNovelIDsFromDB";
import addWeeklyNovels from "./utils/addWeeklyNovels";
import { NovelPlatform } from "../utils/types";

// 각 플랫폼에서 주간베스트 소설 20개 씩 가져오기
export default async function weeklyScraper(novelPlatform: NovelPlatform) {
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
  await addWeeklyNovels(novelIDs, novelPlatform);

  await browser.close();

  return novelIDs;
}
