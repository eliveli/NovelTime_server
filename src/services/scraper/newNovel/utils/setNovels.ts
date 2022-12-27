import puppeteer from "puppeteer";
import addOrUpdateNovelInDB from "../../utils/addOrUpdateNovelInDB";
import { NovelPlatform } from "../../utils/types";

export default async function setNovels(
  page: puppeteer.Page,
  novelNoAndPageNo: {
    currentNovelNo: number;
    totalNovelNo: number;
    totalNovelNoOfEachGenre: number[]; // for ridi
    totalPageNo: number[] | number; // number[] for ridi, number for series
  },
  novelPlatform: NovelPlatform,
  novelUrls: string[],
) {
  const { currentNovelNo, totalNovelNo, totalNovelNoOfEachGenre, totalPageNo } = novelNoAndPageNo;

  let novelNo = currentNovelNo;

  // 작품 상세페이지 조회 반복
  while (totalNovelNo >= novelNo) {
    console.log(
      `currentNovelNo: ${novelNo}, totalNovelNo: ${totalNovelNo}, ${
        totalNovelNoOfEachGenre.length !== 0
          ? `totalNovelNoOfEachGenre: ${String(totalNovelNoOfEachGenre)}, `
          : ""
      } ${typeof totalPageNo === "number" ? "totalPageNo" : "totalPageNoOfEachGenre"}: ${String(
        totalPageNo,
      )}`,
    );

    try {
      // 스크랩할 소설 수 보다 읽어온 url 수가 작을 때
      if (!novelUrls[novelNo - 1]) {
        throw Error("읽을 url이 더 이상 없음");
      }

      const novelId = await addOrUpdateNovelInDB(page, novelUrls[novelNo - 1], novelPlatform);
      console.log("novelId: ", novelId);

      novelNo += 1; // 작품 번호 +1

      if (novelNo % 100 === 0) break; // 작품 100번째 마다 loop 탈출. for 시크릿창 여닫기
    } catch (err: any) {
      console.log(err, `\n 현재작품: ${novelNo}, 마지막작품: ${totalNovelNo}`);
      // 에러 발생 시 해당 작품은 통과. 시크릿창 여닫으며 다음 작품으로 넘어감
      novelNo += 1; // 작품 번호 +1

      if (err.message === "읽을 url이 더 이상 없음") {
        novelNo = totalNovelNo + 1; // 스크래퍼 종료 조건
      }
      break;
    }
  }

  return novelNo; // 시크릿창을 닫고 열면서 다음에 조회할 작품 번호 표시
}
