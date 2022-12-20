import puppeteer from "puppeteer";
import addOrUpdateNovelInDB from "../../utils/addOrUpdateNovelInDB";
import { NovelPlatform } from "../../utils/types";

export default async function setNovels(
  page: puppeteer.Page,
  novelNoAndPageNo: {
    currentNovelNo: number;
    totalNovelNo: number;
    totalPageNo: number[] | number;
  },
  novelPlatform: NovelPlatform,
  currentNovelUrl: string,
) {
  const { currentNovelNo, totalNovelNo, totalPageNo } = novelNoAndPageNo;

  let novelNo = currentNovelNo;

  // 작품 상세페이지 조회 반복
  while (totalNovelNo >= novelNo) {
    console.log(
      `currentNovelNo: ${novelNo}, totalNovelNo: ${totalNovelNo}, totalPageNo: `,
      totalPageNo,
    );

    try {
      await addOrUpdateNovelInDB(page, currentNovelUrl, novelPlatform);

      novelNo += 1; // 작품 번호 +1

      if (novelNo % 100 === 0) break; // 작품 100번째 마다 loop 탈출. for 시크릿창 여닫기
    } catch (err) {
      console.log(err, `\n 현재작품: ${novelNo}, 마지막작품: ${totalNovelNo}`);
      // 에러 발생 시 해당 작품은 통과. 시크릿창 여닫으며 다음 작품으로 넘어감
      novelNo += 1; // 작품 번호 +1
      break;
    }
  }

  return novelNo; // 시크릿창을 닫고 열면서 다음에 조회할 작품 번호 표시
}
