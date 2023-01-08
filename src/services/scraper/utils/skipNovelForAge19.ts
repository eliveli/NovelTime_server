import puppeteer from "puppeteer";
import { NovelPlatform, ScraperType } from "./types";

function getSelector(
  currentNovelNo: number,
  novelPlatform: NovelPlatform,
  scraperType?: ScraperType,
) {
  if (novelPlatform === "네이버 시리즈") {
    if (scraperType === "new") {
      return `#content > div > ul > li:nth-child(${String(
        currentNovelNo,
      )}) > div > h3 > em.ico.n19`;
    }

    if (scraperType === "weekly") {
      return `#content > div > ul > li:nth-child(${String(
        currentNovelNo,
      )}) > div.comic_cont > h3 > em.ico.n19`;
    }
  }

  if (novelPlatform === "카카오페이지") {
    if (scraperType === "new") {
      return `#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div.flex.grow.flex-col > div > div.flex.grow.flex-col.py-10pxr.px-15pxr > div > div > div > div:nth-child(${String(
        currentNovelNo,
      )}) > div > a > div > div.relative > img`;
    }

    if (scraperType === "weekly") {
      return `#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div.flex.grow.flex-col > div > div.flex.w-full.grow.flex-col.py-5px > div:nth-child(1) > div > div > div:nth-child(${String(
        currentNovelNo,
      )}) > div > div > a > div > div.relative.overflow-hidden.rounded-3pxr.mr-16pxr.w-80pxr.shrink-0 > img`;
    }
  }

  if (novelPlatform === "리디북스") {
    if (scraperType === "new") {
      return `#__next > main > div > section > ul.fig-1o0lea8 > li:nth-child(${String(
        currentNovelNo,
      )}) > div > div.fig-5164tm > a > svg`;
    }

    if (scraperType === "weekly") {
      return `#__next > main > section > ul.fig-1o0lea8 > li:nth-child(${String(
        currentNovelNo,
      )}) > div > div.fig-7p4nhu > a > svg`;
    }
  }
}

async function skipOrNot(page: puppeteer.Page, selector: string) {
  const isForAge19 = await page.evaluate((slt: string) => {
    const imageForAge19 = document.querySelector(slt);
    return !!imageForAge19; // when the value is null return false
  }, selector);

  if (isForAge19) throw Error("skip this novel for age 19");
}

export default async function skipNovelForAge19(
  page: puppeteer.Page,
  currentNovelNo: number,
  novelPlatform: NovelPlatform,
  scraperType?: ScraperType,
) {
  // this is unnecessary when novelPlatform is "조아라"
  // - newScraper 사용X
  // - weeklyScraper 비로그인 시 19세 소설이 베스트 란에 나타나지 않음
  if (novelPlatform === "조아라") return;

  const selector = getSelector(currentNovelNo, novelPlatform, scraperType);
  if (!selector) throw Error("can't get selector before skipping or not novel for age 19");

  await skipOrNot(page, selector);
}
