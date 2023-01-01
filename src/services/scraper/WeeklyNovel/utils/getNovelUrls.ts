import puppeteer from "puppeteer";
import getNovelUrl from "../../utils/getNovelUrl";
import { NovelPlatform } from "../../utils/types";
import { waitForNovel } from "../../utils/waitOrLoadNovel";

export default async function getNovelUrls(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  let bestNo = 1;
  const novelUrls = [];

  while (bestNo < 21) {
    try {
      const novelElement = await waitForNovel(page, novelPlatform, bestNo);
      if (!novelElement) {
        throw Error("can't load novel node");
      }

      const novelUrl = await getNovelUrl(page, novelPlatform, novelElement);
      if (!novelUrl) {
        throw Error("can't get url from the node");
      }

      novelUrls.push(novelUrl);
    } catch (err: any) {
      console.log(err, "\n  현재 작품 노드 또는 url 읽기 실패");
      // -> 이로 인해 실제 읽어오는 소설 수는 20개가 안 될 수 있음
    }

    bestNo += 1; // 다음 소설 읽으러 가기
  }

  return novelUrls;
}
