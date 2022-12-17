import puppeteer from "puppeteer";
import { NovelPlatform } from "../../utils/types";

function getNewNovelListPage(
  novelPlatform: NovelPlatform,
  genreNo: string,
  currentPageNO?: number,
) {
  if (novelPlatform === "카카오페이지") {
    // 무한스크롤 / 최신순
    return `https://page.kakao.com/menu/11/screen/37?subcategory_uid=${genreNo}&sort_opt=latest`;
  }
  if (novelPlatform === "네이버 시리즈") {
    if (!currentPageNO) return;

    // 페이지네이션 / 최신순, 완결작 포함 조회
    return `https://series.naver.com/novel/categoryProductList.series?categoryTypeCode=genre&genreCode=${genreNo}&orderTypeCode=new&is&isFinished=false&page=${currentPageNO}`;
  }
  if (novelPlatform === "리디북스") {
    if (!currentPageNO) return;

    // 페이지네이션 / 최신순(최신화등록일), 성인 제외
    return `https://ridibooks.com/category/books/${genreNo}?order=recent&adult_exclude=y&page=${currentPageNO}`;
  }
}

export default async function goToNewNovelListPage(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNo: string,
  currentPageNO: number,
) {
  const listPage = getNewNovelListPage(novelPlatform, genreNo, currentPageNO);
  if (!listPage) return;

  await page.goto(listPage, { waitUntil: "networkidle0" });
}
