import puppeteer from "puppeteer";
import newScraper from "../scrapeNewNovels";
import setNovels from "../utils/setNovels";

// increase time set to prevent scraper from stopping in the middle
jest.setTimeout(60000000);

// 추후 하기 !!
// 아래 장르 필터 값을 string 에서 number로 바꾸고 이 값을 사용하는 다른 함수들 변경!!!!
// 그리고 나중에 utils 폴더에 분리
//
// 플랫폼 및 장르별 카테고리 넘버
const genreFilter = {
  // 카카페 로판, 판타지 : 최신순(첫화등록일)
  kakape: { RF: "117", F: "86" },
  // 시리즈 로판, 판타지 : 완결작 포함, 최신순(최신화등록일)
  series: { RF: "207", F: "202" },
  // 리디 로판, 판타지 : 최신순(최신화등록일) :로판 웹소설, 로판 e북 & 판타지웹소설 정통,퓨전 & 판타지e북 정통,퓨전,대체역사
  ridi: { RF: ["6050", "6000"], F1: ["1751", "1752"], F2: ["1711", "1712", "1715"] },
};

// 스크래퍼 실행 시 다른 작업(인터넷 브라우저, DBeaver 등) 다 종료한 상태에서 스크래퍼만 실행하기.
//  그렇지 않으면 메모리 용량 차지를 많이 해서(참고: 작업관리자-성능-메모리)
//   목록페이지에서 url을 읽어올 때 page down을 하더라도
//   dom 로드가 느려 element를 제때 읽어오지 못함

// it("run a new scraper for ridi :", async () => {
//   await newScraper("리디북스", genreFilter.ridi.F1);
// });

// it("run a new scraper for kakape :", async () => {
//   await newScraper("카카오페이지", genreFilter.kakape.RF);
// });
// 카카페 스크래퍼, url 읽어오는 함수 실행 중 에러페이지가 뜸
// "요청한 페이지를 읽어오지 못했습니다"

it("test setNovels :", async () => {
  const novelNoAndPageNo = {
    currentNovelNo: 1,
    totalNovelNo: 2,
    totalPageNo: 1,
  };
  const novelUrls = ["page.kakao.com/content/59090001", "page.kakao.com/content/59025358"];

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await setNovels(page, novelNoAndPageNo, "카카오페이지", novelUrls);
});
