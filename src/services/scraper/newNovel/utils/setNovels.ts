import puppeteer from "puppeteer";
import addOrUpdateNovelInDB from "../../utils/addOrUpdateNovelInDB";
import { NovelPlatform } from "../../utils/types";

function showNovelNoListForRidi(noList: number[]) {
  if (noList.length === 0) return "";
  return `totalNovelNoListForRidi: ${String(noList)}, `;
}

function showTotalPageNo(totalPageNo: number[] | number) {
  if (typeof totalPageNo === "object" && totalPageNo.length === 0) {
    return ""; // for kakape
  }
  if (typeof totalPageNo === "object") {
    return `totalPageNoOfEachGenre: ${String(totalPageNo)}`; // for ridi
  }
  return `totalPageNo: ${String(totalPageNo)}`; // for series
}

export default async function setNovels(
  page: puppeteer.Page,
  novelNoAndPageNo: {
    currentNovelNo: number;
    totalNovelNo: number;
    totalNovelNoListForRidi: number[]; // for ridi
    totalPageNo: number[] | number; // number[] for ridi, number for series
  },
  novelPlatform: NovelPlatform,
  novelUrls: string[],
) {
  const { totalNovelNo, totalNovelNoListForRidi, totalPageNo } = novelNoAndPageNo;
  let { currentNovelNo } = novelNoAndPageNo;

  // 작품 상세페이지 조회 반복
  while (currentNovelNo <= totalNovelNo) {
    console.log(
      `currentNovelNo: ${currentNovelNo}/${totalNovelNo} ${showNovelNoListForRidi(
        totalNovelNoListForRidi,
      )} ${showTotalPageNo(totalPageNo)}`,
    );

    try {
      const novelId = await addOrUpdateNovelInDB(
        page,
        novelUrls[currentNovelNo - 1],
        novelPlatform,
      );

      if (!novelId) throw Error("can't get this novel");

      console.log("novelId: ", novelId);
    } catch (err: any) {
      console.log(`${String(err)}\n novelUrl: ${novelUrls[currentNovelNo - 1]}`);
    }

    currentNovelNo += 1; // for 다음 작품 조회

    if (currentNovelNo % 500 === 0) break; // 작품 500번째 마다 loop 탈출. for 시크릿창 여닫기
  }

  return currentNovelNo; // for 시크릿창 닫고 열면서 다음에 조회할 작품 번호 표시
}
