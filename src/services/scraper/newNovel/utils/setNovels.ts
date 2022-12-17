import puppeteer from "puppeteer";
import addOrUpdateNovelInDB from "../../utils/addOrUpdateNovelInDB";
import { NovelPlatform } from "../../utils/types";

export default async function setNovels(
  page: puppeteer.Page,
  novelNOandPageNO: {
    currentNovelNO: number;
    totalNovelNO: number;
    totalPageNO: number[] | number;
  },
  novelPlatform: NovelPlatform,
  currentNovelUrl: string,
) {
  const { currentNovelNO, totalNovelNO, totalPageNO } = novelNOandPageNO;

  let novelNO = currentNovelNO;

  // 작품 상세페이지 조회 반복
  while (totalNovelNO >= novelNO) {
    console.log(
      `currentNovelNO: ${novelNO}, totalNovelNO: ${totalNovelNO}, totalPageNO: `,
      totalPageNO,
    );

    try {
      let novelUrl = "";
      if (novelPlatform === "리디북스") {
        novelUrl = `ridibooks.com${currentNovelUrl}`;
      }
      if (novelPlatform === "네이버 시리즈") {
        novelUrl = `series.naver.com${currentNovelUrl}`;
      }
      if (!novelUrl) return novelNO;

      await addOrUpdateNovelInDB(page, novelUrl, novelPlatform);

      novelNO += 1; // 작품 번호 +1

      if (novelNO % 100 === 0) break; // 작품 100번째 마다 loop 탈출. for 시크릿창 여닫기
    } catch (err) {
      console.log(err, `\n 현재작품: ${novelNO}, 마지막작품: ${totalNovelNO}`);
      // 에러 발생 시 해당 작품은 통과. 시크릿창 여닫으며 다음 작품으로 넘어감
      novelNO += 1; // 작품 번호 +1
      break;
    }
  }

  return novelNO; // 시크릿창을 닫고 열면서 다음에 조회할 작품 번호 표시
}
