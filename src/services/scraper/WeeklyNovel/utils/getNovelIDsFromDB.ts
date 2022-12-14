import puppeteer from "puppeteer";
import addOrUpdateNovelInDB from "../../utils/addOrUpdateNovelInDB";

type NovelPlatform = "카카오페이지" | "네이버 시리즈" | "리디북스";

export default async function getNovelIDsFromDB(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  novelUrls: string[],
) {
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
