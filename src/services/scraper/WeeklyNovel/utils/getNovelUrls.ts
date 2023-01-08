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

    // 코드는 작성했지만..
    // 사실 베스트 소설에는 19세 소설 없다고 봐도 무방함
    //  (카카페&시리즈는 from 전체장르, 리디는 성인제외 체크)

    // (아래 예외는 코드 작성 보류. 발생 가능성 및 우선순위 낮음)
    // 19세 소설 포함 여러 이유로 스킵한 소설이 많다면
    //   처음 로딩한 소설 순위를 벗어나 다음 순위 요청이 필요
    // . 시리즈 - 다음 페이지 이동 (리스트 url 변경)
    // . 카카페 - 페이지 다운 (end key)
    // . 리디 - 페이지 다운 (page down) & 다음 페이지 이동 (리스트 url 변경)
    //          (참고. 한 페이지에 소설 60개 게시)
    //        - but viewport height 최대값 설정으로 페이지 다운 불필요
  }

  return novelUrls;
}
