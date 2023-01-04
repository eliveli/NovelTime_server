import puppeteer from "puppeteer";
import { NovelPlatform, ScraperType } from "./types";

function getNovelListPage(
  scraperType: ScraperType,
  novelPlatform: NovelPlatform,
  urlParams?: {
    genreNo: number;
    currentPageNo?: number;
  },
) {
  if (scraperType === "new" && urlParams) {
    const { genreNo, currentPageNo } = urlParams;

    if (novelPlatform === "카카오페이지") {
      // 무한스크롤 / 최신순(등록일 순)
      return `https://page.kakao.com/menu/11/screen/37?subcategory_uid=${String(
        genreNo,
      )}&sort_opt=latest`;
    }

    if (novelPlatform === "네이버 시리즈" && currentPageNo) {
      // 페이지네이션 / 최신순, 완결작 포함 조회
      return `https://series.naver.com/novel/categoryProductList.series?categoryTypeCode=genre&genreCode=${String(
        genreNo,
      )}&orderTypeCode=new&is&isFinished=false&page=${String(currentPageNo)}`;
    }

    if (novelPlatform === "리디북스" && currentPageNo) {
      // 페이지네이션 + semi 스크롤(페이지 내리면서 dom load) / 최신순(최신화등록일), 성인 제외
      return `https://ridibooks.com/category/books/${String(
        genreNo,
      )}?order=recent&adult_exclude=y&page=${String(currentPageNo)}`;
    }
  }

  if (scraperType === "weekly") {
    if (novelPlatform === "카카오페이지") {
      return "https://page.kakao.com/menu/11/screen/16?subcategory_uid=0&ranking_type=weekly";
    }

    if (novelPlatform === "네이버 시리즈") {
      return "https://series.naver.com/novel/top100List.series?rankingTypeCode=WEEKLY&categoryCode=ALL";
    }

    // 리디의 경우 전체 장르 베스트 조회 불가
    //  아래는 로판 웹소설 / 성인 작품 제외됨
    if (novelPlatform === "리디북스") {
      return "https://ridibooks.com/category/bestsellers/6050?adult_exclude=y&page=1";
    }
    if (novelPlatform === "조아라") {
      return "https://www.joara.com/todaybest?best=weekly";
    }
  }
}

export default async function goToNovelListPage(
  page: puppeteer.Page,
  scraperType: ScraperType,
  novelPlatform: NovelPlatform,
  urlParams?: {
    genreNo: number;
    currentPageNo: number;
  },
) {
  const listPage = getNovelListPage(scraperType, novelPlatform, urlParams);
  if (!listPage) return;

  await page.goto(listPage, { waitUntil: "domcontentloaded" });
}
