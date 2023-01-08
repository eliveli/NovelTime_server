import puppeteer from "puppeteer";
import addOrUpdateNovelInDB from "../../utils/addOrUpdateNovelInDB";
import { NovelPlatform } from "../../utils/types";

export default async function getNovelIDsFromDB(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  novelUrls: string[],
) {
  const novelIDs: string[] = [];

  while (novelUrls.length !== 0) {
    try {
      const novelId = await addOrUpdateNovelInDB(page, novelUrls[0], novelPlatform);

      if (!novelId) {
        throw Error("can't get this novel");
      }

      novelIDs.push(novelId);
    } catch (err: any) {
      console.log(err, `\n novelUrl: ${novelUrls[0]}`);
    }

    novelUrls.shift();
  }

  return novelIDs;
}
