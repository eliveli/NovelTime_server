import puppeteer from "puppeteer";
import seeNovelListWithCardForRidi from "../../utils/seeNovelListWithCardForRidi";
import { NovelPlatform } from "../../utils/types";

async function loadElementsForRidi(page: puppeteer.Page) {
  await seeNovelListWithCardForRidi(page);

  // wait for loading first novel element
  await page.waitForSelector(
    "#__next > main > div > section > ul.fig-1o0lea8 > li:nth-child(1) > div > div.fig-7p4nhu > a",
  );

  // load novel elements as scrolling down
  for (let i = 1; i < 7; i += 1) {
    await page.keyboard.press("PageDown", { delay: 300 });
  }
}

export default async function getNovelUrls(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  let bestNo = 1;
  const novelUrls = [];

  while (bestNo < 21) {
    if (novelPlatform === "카카오페이지") {
      const novelElement = await page.waitForSelector(
        `#__next > div > div.css-gqvt86-PcLayout > div.css-58idf7-Menu > div.css-1dqbyyp-Home > div > div > div.css-1k8yz4-StaticLandingRanking > div > div > div > div:nth-child(${bestNo}) > div > div > a`,
      );
      const partialNovelUrl: string = await page.evaluate(
        (element) => element.getAttribute("href"),
        novelElement,
      );
      const novelUrl = `page.kakao.com${partialNovelUrl}`;

      novelUrls.push(novelUrl);
    }

    if (novelPlatform === "네이버 시리즈") {
      const novelElement = await page.waitForSelector(
        `#content > div > ul > li:nth-child(${bestNo}) > a`,
      );
      const partialNovelUrl: string = await page.evaluate(
        (element) => element.getAttribute("href"),
        novelElement,
      );

      const novelUrl = `series.naver.com${partialNovelUrl}`;

      novelUrls.push(novelUrl);
    }

    if (novelPlatform === "리디북스") {
      if (bestNo === 1) {
        await loadElementsForRidi(page);
      }

      const novelElement = await page.waitForSelector(
        `#__next > main > div > section > ul.fig-1o0lea8 > li:nth-child(${bestNo}) > div > div.fig-7p4nhu > a`,
      );

      const partialNovelUrl: string = await page.evaluate(
        (element) => element.getAttribute("href"),
        novelElement,
      );

      const partialNovelUrlCut = partialNovelUrl.slice(0, partialNovelUrl.indexOf("?"));
      const novelUrl = `ridibooks.com${partialNovelUrlCut}`;

      novelUrls.push(novelUrl);
    }

    bestNo += 1;
  }

  return novelUrls;
}
