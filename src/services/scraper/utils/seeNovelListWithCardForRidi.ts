import puppeteer from "puppeteer";

// 소설 목록 카드형으로 보기
//  -> 페이지 별 모든 소설을 가능한 한 작은 화면에 보이기
//    -> PageDown 누르는 횟수 줄이기 && 줄어든 횟수만큼 다루기 쉽게 하기
export default async function seeNovelListWithCardForRidi(page: puppeteer.Page) {
  await page.waitForSelector(
    "#__next > main > div > section > div > ul > div > button:nth-child(2)",
  ); // this is necessary
  await page.click("#__next > main > div > section > div > ul > div > button:nth-child(2)");
}
