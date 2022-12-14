import { scrapeRidi } from "../scrapeNewInRidi";

// increase time set to prevent scraper from stopping in the middle
jest.setTimeout(60000000);

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
it("case to run a weekly scraper properly :", async () => {
  await scrapeRidi(genreFilter.ridi.F1);
});
