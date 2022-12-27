import puppeteer from "puppeteer";
import { genreFilter } from "../../utils/variables";
import newScraper from "../scrapeNewNovels";
import setNovels from "../utils/setNovels";

// increase time set to prevent scraper from stopping in the middle
jest.setTimeout(60000000);

// 추후 하기 !!
// 아래 장르 필터 값을 string 에서 number로 바꾸고 이 값을 사용하는 다른 함수들 변경!!!!
// 그리고 나중에 utils 폴더에 분리
//

// 스크래퍼 실행 시 다른 작업(인터넷 브라우저, DBeaver 등) 다 종료한 상태에서 스크래퍼만 실행하기.
//  그렇지 않으면 메모리 용량 차지를 많이 해서(참고: 작업관리자-성능-메모리)
//   목록페이지에서 url을 읽어올 때 page down을 하더라도
//   dom 로드가 느려 element를 제때 읽어오지 못함

// it("run a new scraper for ridi :", async () => {
//   await newScraper("리디북스", genreFilter.ridi.F1);
// });

// it("run a new scraper for a certain amount of novels for ridi:", async () => {
//   await newScraper("리디북스", genreFilter.ridi.F1, 1);
// });

it("run a new scraper for kakape :", async () => {
  await newScraper("카카오페이지", genreFilter.kakape.RF, 1);
});

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
