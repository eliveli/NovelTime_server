import puppeteer from "puppeteer";
import { NovelPlatform } from "./types";

export default async function getNovelUrl(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  novelElement: puppeteer.ElementHandle<Element>,
) {
  const partialNovelUrl = (await page.evaluate(
    (element) => element.getAttribute("href"),
    novelElement,
  )) as string;

  if (novelPlatform === "카카오페이지") {
    return `page.kakao.com${partialNovelUrl}`;
  }

  if (novelPlatform === "네이버 시리즈") {
    return `series.naver.com${partialNovelUrl}`;
  }

  if (novelPlatform === "리디북스") {
    const partialNovelUrlCut = partialNovelUrl.slice(0, partialNovelUrl.indexOf("?")); // url : "?" 부터 문자 제외
    return `ridibooks.com${partialNovelUrlCut}`;
  }
}
