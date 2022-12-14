import puppeteer from "puppeteer";

type NovelPlatform = "카카오페이지" | "네이버 시리즈" | "리디북스";

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
      // without this I can't get novel urls more than 11
      if (bestNo === 12) {
        for (let i = 1; i < 9; i += 1) {
          await page.keyboard.press("PageDown");
        }
      }

      const novelElement = await page.waitForSelector(
        `#__next > main > div > section > ul.fig-1nfc3co > li:nth-child(${bestNo}) > div > div.fig-jc2buj > div > h3 > a`,
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
