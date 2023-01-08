import puppeteer from "puppeteer";
import getNovelUrl from "../../utils/getNovelUrl";
import skipNovelForAge19 from "../../utils/skipNovelForAge19";
import { NovelPlatform } from "../../utils/types";
import { waitForNovel } from "../../utils/waitOrLoadNovel";

export default async function getNovelUrls(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  isSkipForAge19?: false,
) {
  let bestNo = 1;
  const novelUrls = [];

  // 소설 url 못 읽어올 경우 스킵, 총 20개 읽어옴
  //  : 플랫폼 상 순위는 20위 넘을 수 있음
  while (novelUrls.length !== 20) {
    try {
      const novelElement = await waitForNovel(page, novelPlatform, bestNo);
      if (!novelElement) {
        throw Error("can't load novel node");
      }

      // 19세 소설 스킵(기본) & 시리즈 항상 스킵
      if (novelPlatform === "네이버 시리즈" || isSkipForAge19 === undefined) {
        await skipNovelForAge19(page, bestNo, novelPlatform, "weekly");
      }

      const novelUrl = await getNovelUrl(page, novelPlatform, novelElement);
      if (!novelUrl) {
        throw Error("can't get url from the node");
      }

      novelUrls.push(novelUrl);
      console.log(`bestNo: ${bestNo} novelUrl: ${novelUrl}`);
    } catch (err: any) {
      console.log(err, "\n  현재 작품 노드 또는 url 읽기 실패");
    }

    bestNo += 1; // 다음 소설 읽으러 가기
  }

  return novelUrls;
}
