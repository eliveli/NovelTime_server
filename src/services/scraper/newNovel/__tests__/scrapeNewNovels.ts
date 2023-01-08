import puppeteer from "puppeteer";
import { getDesc, goToDetailPage } from "../../utils/addOrUpdateNovelInDB";
import { genreFilter } from "../../utils/variables";
import newScraper from "../scrapeNewNovels";
import setNovels from "../utils/setNovels";

// increase time set to prevent scraper from stopping in the middle
jest.setTimeout(60000000);

// 스크래퍼 실행이 지연/중단/실패할 때 //
// [상황]
//  - 목록페이지에서 url을 읽어올 때 page down을 해도
//    dom이 화면에 늦게 그려져 필요 element를 적시에 읽지 못함
// [대처]
//  - 다른 프로세스(인터넷 브라우저, DBeaver 등) 종료
//    : 메모리 용량 줄이기 위함. (참고: 작업관리자-성능-메모리)
//  - 실행 중 인풋 넣지 않기(마우스, 키보드 등)
//    : 현재 작업을 방해할 수 있음
//  - <중요> 해당 플랫폼에서 설렉터 변경 여부 확인, 코드의 설렉터 변경 <중요>

// [상황]
//  - sometimes 로그인 화면에서 일부 글자가 빠진 채로 입력됨(특히 네이버 로그인)
// [대처]
//  - 네이버 로그인 스킵 & don't get novels for age 19

//
// [상황]
//  - 스크래퍼 장시간 실행시키고 자리비울 때 컴퓨터가 절전 모드 진입, 스크래퍼 중단
// [대처]
//  - 자동절전모드 시간 조정 또는 해제

it("test : getting desc for series :", async () => {
  // const novelUrl = "series.naver.com/novel/detail.series?productNo=4130558";
  const novelUrl = "series.naver.com/novel/detail.series?productNo=3175921";
  const novelPlatform = "네이버 시리즈";

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await goToDetailPage(page, novelUrl, novelPlatform);
  const desc = await getDesc(page, novelPlatform);
  console.log("desc for series : ", desc);
});

// it("run a new scraper for a certain amount of novels for series :", async () => {
//   // await newScraper("네이버 시리즈", genreFilter.series.F);
//   // await newScraper("네이버 시리즈", genreFilter.series.MF);
//   // await newScraper("네이버 시리즈", genreFilter.series.RF);

//   // 로맨스 9018/36066 까지 스크랩(19세작품 포함일때)
//   // 지금은 19세 작품 제외해서 url 가져옴. 시간 절약 기대
//   //   23251/36076 done (19세 작품 제외. 해당 코드 부분 테스트는 아직)
//   // await newScraper("네이버 시리즈", genreFilter.series.R);

//   await newScraper("네이버 시리즈", genreFilter.series.MA);
//   await newScraper("네이버 시리즈", genreFilter.series.Mystery);
//   await newScraper("네이버 시리즈", genreFilter.series.LN);
//   await newScraper("네이버 시리즈", genreFilter.series.BL);
// });

// 리디 소설은 이전에 스크랩한 것 db에서 모두 삭제, 새로 스크랩
//  : 플랫폼에서 장르 번호 및 작품 번호가 모두 바뀜.
//    작품 번호가 작품 url에 포함되기에 새로 스크랩이 요구되었음
//    (사실 작품 번호도 함께 변경되었다고 단정짓기 어려움. 예전 스크래퍼에 결함이 있었을 가능성 때문)
// it("run a new scraper for a certain amount of novels for ridi:", async () => {
//   await newScraper("리디북스", genreFilter.ridi.RF, 3);
// });

// it("run a new scraper for a certain amount of novels for kakape :", async () => {
//   await newScraper("카카오페이지", genreFilter.kakape.F, 3);
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
