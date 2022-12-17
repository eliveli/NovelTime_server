import puppeteer from "puppeteer";
import { NovelPlatform } from "../../utils/types";

const weeklyNovelListPage = {
  kakape: "https://page.kakao.com/menu/11/screen/16?subcategory_uid=0&ranking_type=weekly",
  series: "",
  // 리디의 경우 전체 장르 베스트 조회 불가
  //  아래는 로판 웹소설 / 성인 작품 제외됨
  ridi: "https://ridibooks.com/category/bestsellers/6050?adult_exclude=y&page=1",
};

function getWeeklyNovelListPage(novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    return weeklyNovelListPage.kakape;
  }
  if (novelPlatform === "네이버 시리즈") {
    return weeklyNovelListPage.series;
  }
  if (novelPlatform === "리디북스") {
    return weeklyNovelListPage.ridi;
  }
}

export default async function goToWeeklyNovelListPage(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
) {
  const listPage = getWeeklyNovelListPage(novelPlatform);
  if (!listPage) return;

  await page.goto(listPage);
}
