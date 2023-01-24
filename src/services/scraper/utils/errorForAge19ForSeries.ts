import { NovelPlatform } from "./types";

// sometimes function login for naver series doesn't work
// so I don't deal with the case when trying to scrape novels for age 19 for series
export default function errorForAge19ForSeries(
  novelPlatform: NovelPlatform,
  isSkipForAge19?: false,
) {
  if (novelPlatform === "네이버 시리즈" && isSkipForAge19 === false) {
    console.error("네이버 시리즈 19세 작품은 스크랩 안 함 : 커스텀 로그인 함수 종종 작동 안 함");
    throw Error("네이버 시리즈 19세 작품은 스크랩 안 함");
  }
}
