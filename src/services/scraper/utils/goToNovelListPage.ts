import puppeteer from "puppeteer";
import { NovelPlatform, ScraperType } from "./types";

function getNovelListPage(
  scraperType: ScraperType,
  novelPlatform: NovelPlatform,
  urlParams: {
    genreNo?: number;
    currentPageNo?: number;
    isSkipForAge19?: false;
  },
) {
  const { genreNo, currentPageNo, isSkipForAge19 } = urlParams;

  if (scraperType === "new") {
    // 무한스크롤 / 최신순(등록일 순)
    if (novelPlatform === "카카오페이지" && genreNo) {
      return `https://page.kakao.com/menu/11/screen/37?subcategory_uid=${String(
        genreNo,
      )}&sort_opt=latest`;
    }

    // 페이지네이션 / 최신순, 완결작 포함 조회
    if (novelPlatform === "네이버 시리즈" && genreNo && currentPageNo) {
      return `https://series.naver.com/novel/categoryProductList.series?categoryTypeCode=genre&genreCode=${String(
        genreNo,
      )}&orderTypeCode=new&is&isFinished=false&page=${String(currentPageNo)}`;
    }

    // 페이지네이션 + semi 무한스크롤(페이지 내리면서 dom load) / 최신순(최신화등록일)
    if (novelPlatform === "리디북스" && genreNo && currentPageNo) {
      const adultExclude = isSkipForAge19 === false ? "n" : "y";
      // in url, adult_exclude = n (성인 포함) or y (성인 제외(기본값))

      return `https://ridibooks.com/category/books/${String(
        genreNo,
      )}?order=recent&adult_exclude=${adultExclude}&page=${String(currentPageNo)}`;
    }
  }

  if (scraperType === "weekly") {
    if (novelPlatform === "카카오페이지") {
      return "https://page.kakao.com/menu/11/screen/16?subcategory_uid=0&ranking_type=weekly";

      // for romance genre to test for age limitation
      // return "https://page.kakao.com/menu/11/screen/16?subcategory_uid=89&ranking_type=weekly";
    }

    if (novelPlatform === "네이버 시리즈") {
      return "https://series.naver.com/novel/top100List.series?rankingTypeCode=WEEKLY&categoryCode=ALL";
    }

    // 리디의 경우 전체 장르 베스트 조회 불가
    //  아래는 로판 웹소설
    if (novelPlatform === "리디북스") {
      const adultExclude = isSkipForAge19 === false ? "n" : "y";

      return `https://ridibooks.com/category/bestsellers/6050?adult_exclude=${adultExclude}&page=1`;
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
  urlParams: {
    genreNo?: number;
    currentPageNo?: number;
    isSkipForAge19?: false; // for ridi
  },
) {
  const listPage = getNovelListPage(scraperType, novelPlatform, urlParams);
  if (!listPage) return;

  await page.goto(listPage, { waitUntil: "domcontentloaded" });
}
