import puppeteer from "puppeteer";
import { genreFilter } from "../../utils/variables";
import newScraper from "../scrapeNewNovels";
import setNovels from "../utils/setNovels";

// increase time set to prevent scraper from stopping in the middle
jest.setTimeout(60000000);

// 스크래퍼 실행이 지연/중단/실패할 때 //
// [상황]
//  - 목록페이지에서 url을 읽어올 때 page down을 해도
//    dom이 화면에 늦게 그려져 필요 element를 적시에 읽지 못함
//  - 로그인 화면에서 일부 글자가 빠진 채로 입력됨
// [대처]
//  - 다른 프로세스(인터넷 브라우저, DBeaver 등) 종료
//    : 메모리 용량 줄이기 위함. (참고: 작업관리자-성능-메모리)
//  - 실행 중 인풋 넣지 않기(마우스, 키보드 등)
//    : 현재 작업을 방해할 수 있음
//  - <중요> 해당 플랫폼에서 설렉터 변경 여부 확인, 코드의 설렉터 변경 <중요>

it("run a new scraper for a certain amount of novels for series :", async () => {
  await newScraper("네이버 시리즈", genreFilter.series.F, 1);
});

// it("run a new scraper for a certain amount of novels for ridi:", async () => {
//   await newScraper("리디북스", genreFilter.ridi.F1, 1);
// });

// it("run a new scraper for a certain amount of novels for kakape :", async () => {
//   await newScraper("카카오페이지", genreFilter.kakape.RF, 1);
// });

// it("test setNovels :", async () => {
//   const novelNoAndPageNo = {
//     currentNovelNo: 1,
//     totalNovelNo: 2,
//     totalPageNo: 1,
//   };
//   const novelUrls = ["page.kakao.com/content/59090001", "page.kakao.com/content/59025358"];

//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
//   const novelNo = await setNovels(page, novelNoAndPageNo, "카카오페이지", novelUrls);
//   console.log("novelNo:", novelNo);

// 카카페 설렉터들이 다른 소설 페이지에서도 잘 적용되는지 확인 >> 1차 완료
// });
