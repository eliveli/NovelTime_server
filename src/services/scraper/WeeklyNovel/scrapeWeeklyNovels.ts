import puppeteer from "puppeteer";
import { minimalArgs } from "../utils/variables";
import login from "../utils/login";
import getNovelUrls from "./utils/getNovelUrls";
import getNovelIDsFromDB from "./utils/getNovelIDsFromDB";
import addWeeklyNovels from "./utils/addWeeklyNovels";
import { NovelPlatform } from "../utils/types";
import goToNovelListPage from "../utils/goToNovelListPage";

// 각 플랫폼에서 주간베스트 소설 20개 씩 가져오기
// . 19세 소설 스킵(기본)
//  : isSkipForAge19 false 설정 시 스킵 X
//  (예외 . 시리즈는 항상 스킵(로그인 함수 버그)
//        . 리디는 리스트 페이지 조회 시 성인 제외 체크.
//           필요 시 변경 in function goToNovelListPage )

// (유의 : 조아라는 먼저 비로그인 상태로 전체 장르에서 소설 urls 수집)
//                       로그인 시 선호장르 안에서 베스트 소설 게시되나 활용X)
export default async function weeklyScraper(novelPlatform: NovelPlatform, isSkipForAge19?: false) {
  const browser = await puppeteer.launch({
    headless: false, // 브라우저 화면 열려면 false
    args: [...minimalArgs, "--start-maximized"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1840, height: novelPlatform === "리디북스" ? 6300 : 970 });
  // 리디북스 viewport width & height 설정
  //  -> 한 번에 페이지 내 전체 소설 요청. 페이지 다운 X

  page.setDefaultTimeout(500000); // set timeout globally

  await goToNovelListPage(page, "weekly", novelPlatform, { isSkipForAge19 });

  const novelUrls = await getNovelUrls(page, novelPlatform, isSkipForAge19);

  if (!novelUrls) return;

  // sometimes login for naver series doesn't work
  // so I skip this process for series
  //   and even don't get novel urls for age 19 for series above
  if (novelPlatform !== "네이버 시리즈") {
    await login(page, novelPlatform); // 카카오 15세 작품 로그인 필요
  }

  const novelIDs = await getNovelIDsFromDB(page, novelPlatform, novelUrls);

  // update new weekly novels to weeklyNovel table
  await addWeeklyNovels(novelIDs, novelPlatform);

  await browser.close();

  return novelIDs;
}
