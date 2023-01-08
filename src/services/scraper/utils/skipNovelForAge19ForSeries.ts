import puppeteer from "puppeteer";
import { ScraperType } from "./types";

function chooseSelector(currentNovelNo: number, scraperType: ScraperType) {
  if (scraperType === "new") {
    return `#content > div > ul > li:nth-child(${String(currentNovelNo)}) > div > h3 > em.ico.n19`;
  }
  return `#content > div > ul > li:nth-child(${String(
    currentNovelNo,
  )}) > div.comic_cont > h3 > em.ico.n19`;
}

export default async function skipNovelForAge19ForSeries(
  page: puppeteer.Page,
  currentNovelNo: number,
  scraperType: ScraperType,
) {
  const selector = chooseSelector(currentNovelNo, scraperType);

  const isForAge19 = await page.evaluate((slt: string) => {
    const iconForAge19 = document.querySelector(slt);
    return !!iconForAge19; // when the value is null return false
  }, selector);

  if (isForAge19) throw Error("skip this novel for age 19");
}
