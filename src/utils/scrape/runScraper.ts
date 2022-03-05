import { scrapeKakape, scrapeSeries, scrapeRidi } from "./scraper";
import { shareKakape, shareSeries, shareRidi, shareJoara } from "./sharer";

// 플랫폼 및 장르별 카테고리 넘버
const genreFilter = {
  // 카카페 로판, 판타지 : 최신순(첫화등록일)
  kakape: { RF: "117", F: "86" },
  // 시리즈 로판, 판타지 : 완결작 포함, 최신순(최신화등록일)
  series: { RF: "207", F: "202" },
  // 리디 로판, 판타지 : 최신순(최신화등록일) :로맨스e북 로판, 로맨스웹소설 로판 & 판타지e북 정통,퓨전,대체역사, 판타지웹소설 정통,퓨전
  ridi: { RF: ["1703", "1653"], F: ["1711", "1712", "1715", "1751", "1752"] },
};

// 스크랩: 완료: 시리즈 로판, 리디 로판, 리디 판타지
scrapeKakape(genreFilter.kakape.RF, 2884); // scrapeKakape(genreNO, currentOrder)
// scrapeKakape(genreFilter.kakape.F, 369); // scrapeKakape(genreNO, currentOrder)
// scrapeSeries(genreFilter.series.RF); // scrapeSeries(genreNO)
// scrapeRidi(genreFilter.ridi.F); // scrapeRidi(genreNOs)

// 공유하기
// shareRidi("https://ridibooks.com/books/1250067763"); // shareRidi(inputUrl)
// shareSeries(
//   "던전 브레이크의 원인이 되어 버렸다 [선공개]출처 : 시리즈 완전판http://naver.me/GG4CxHtp"
// ); // shareSeries(inputUrl)
// shareKakape(
//   "link-page.kakao.com/goto_view?series_id=58884103&referrer=utm_source%3Dsh_clip [카카오페이지 | 소설] 의무 결혼 "
// ); //shareKakape(inputUrl)
// shareJoara("https://www.joara.com/book/1601829");
