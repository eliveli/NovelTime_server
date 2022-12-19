import puppeteer from "puppeteer";
import getNovelUrl from "../../utils/getNovelUrl";
import { NovelPlatform } from "../../utils/types";

export default async function getNovelUrls(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  let bestNo = 1;
  const novelUrls = [];

  while (bestNo < 21) {
    const novelUrl = await getNovelUrl(page, "weekly", novelPlatform, bestNo);

    if (!novelUrl) return;

    novelUrls.push(novelUrl);

    bestNo += 1;
  }

  return novelUrls;
}
