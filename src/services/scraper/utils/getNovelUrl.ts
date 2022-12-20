import puppeteer from "puppeteer";
import seeNovelListWithCardForRidi from "./seeNovelListWithCardForRidi";
import { NovelPlatform, ScraperType } from "./types";

// it will be changed after changing the function
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

function getNovelSelector(scraperType: ScraperType, novelPlatform: NovelPlatform, novelNO: number) {
  if (novelPlatform === "카카오페이지") {
    if (scraperType === "new") {
      return `#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div.flex.grow.flex-col > div > div.flex.grow.flex-col.py-10pxr.px-15pxr > div > div > div > div:nth-child(${novelNO}) > div > a`;
    }
    if (scraperType === "weekly") {
      return `#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div.flex.grow.flex-col > div > div.flex.w-full.grow.flex-col.py-5px > div > div > div > div:nth-child(${novelNO}) > div > div > a`;
    }
  }

  if (novelPlatform === "네이버 시리즈") {
    return `#content > div > ul > li:nth-child(${novelNO}) > a`;
  }

  if (novelPlatform === "리디북스") {
    if (scraperType === "new") {
      return `#__next > main > div > section > ul > li:nth-child(${novelNO}) > div > div > div > h3 > a`;
    }
    if (scraperType === "weekly") {
      return `#__next > main > section > ul.fig-1o0lea8 > li:nth-child(${novelNO}) > div > div.fig-7p4nhu > a`;
    }
  }
}

export default async function getNovelUrl(
  page: puppeteer.Page,
  scraperType: ScraperType,
  novelPlatform: NovelPlatform,
  novelNO: number,
) {
  const novelSelector = getNovelSelector(scraperType, novelPlatform, novelNO);
  if (!novelSelector) return;

  // it will be changed after changing the loadElementsForRidi function
  if (novelPlatform === "리디북스" && scraperType === "weekly") {
    if (novelNO === 1) {
      await loadElementsForRidi(page);
    }
  }

  const novelElement = await page.waitForSelector(novelSelector);
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
