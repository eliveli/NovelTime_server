import puppeteer from "puppeteer";
import { getDesc, goToDetailPage } from "../../utils/addOrUpdateNovelInDB";
import { genreFilter } from "../../utils/variables";
import newNovelScraper from "../scrapeNewNovels";
import setNovels from "../utils/setNovels";

// increase time set to prevent scraper from stopping in the middle
jest.setTimeout(60000000);

// 스크래퍼 실행이 지연/중단/실패할 때 //
// [상황]
//  - 목록페이지에서 url을 읽어올 때 page down을 해도
//    dom이 화면에 늦게 그려져 필요 element를 적시에 읽지 못함
//  - sometimes 로그인 화면에서 일부 글자가 빠진 채로 입력됨
//  - 진행이 도중에 멈춤. 다음 동작을 하지 않고 시간만 흐름
// [대처]
//  - 다른 프로세스(인터넷 브라우저, DBeaver 등) 종료
//    : 메모리 용량 줄이기 위함. (참고: 작업관리자-성능-메모리)
//  - 실행 중 인풋 넣지 않기(마우스, 키보드 등)
//    : 현재 작업을 방해할 수 있음
//  - <중요> 해당 플랫폼에서 설렉터 변경 여부 확인, 코드의 설렉터 변경 <중요>

//
// [상황]
//  - 스크래퍼 장시간 실행시키고 자리비울 때 컴퓨터가 절전 모드 진입, 스크래퍼 중단
// [대처]
//  - 자동절전모드 시간 조정 또는 해제

// it("test : getting desc:", async () => {
//   // const novelUrl = "series.naver.com/novel/detail.series?productNo=4130558";
//   const novelUrl = "page.kakao.com/content/60847452";
//   const novelPlatform = "카카오페이지";

//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   await goToDetailPage(page, novelUrl, novelPlatform);
//   const desc = await getDesc(page, novelPlatform);
//   console.log("desc : ", desc);
// });

it("run a new scraper for a certain amount of novels for series :", async () => {
  await newNovelScraper("네이버 시리즈", genreFilter.series.F);
  await newNovelScraper("네이버 시리즈", genreFilter.series.MF);
  await newNovelScraper("네이버 시리즈", genreFilter.series.RF);
  await newNovelScraper("네이버 시리즈", genreFilter.series.R);
  await newNovelScraper("네이버 시리즈", genreFilter.series.MA);
  await newNovelScraper("네이버 시리즈", genreFilter.series.Mystery);
  await newNovelScraper("네이버 시리즈", genreFilter.series.LN);
  await newNovelScraper("네이버 시리즈", genreFilter.series.BL);
});

// 리디 소설은 이전에 스크랩한 것 db에서 모두 삭제, 새로 스크랩
//  : 플랫폼에서 장르 번호 및 작품 번호가 모두 바뀜.
//    작품 번호가 작품 url에 포함되기에 새로 스크랩이 요구되었음
//    (사실 작품 번호도 함께 변경되었다고 단정짓기 어려움. 예전 스크래퍼에 결함이 있었을 가능성 때문)
// it("run a new scraper for a certain amount of novels for ridi:", async () => {
//   await newNovelScraper("리디북스", genreFilter.ridi.R, 1, false);
// });

// it("run a new scraper for a certain amount of novels for kakape :", async () => {
//   await newNovelScraper("카카오페이지", genreFilter.kakape.R, 36, false);
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
