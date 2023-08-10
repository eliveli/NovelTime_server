import db from "../utils/db";
import { NovelInDetail } from "../utils/types";

function calcLastPageNo(totalNovelNo: number, novelNoPerPage: number) {
  if (totalNovelNo % novelNoPerPage === 0) {
    return totalNovelNo / novelNoPerPage;
  }
  if (totalNovelNo % novelNoPerPage !== 0) {
    return Math.floor(totalNovelNo / novelNoPerPage) + 1;
  }
}

function getLastPageNo(totalNoAsBigInt: BigInt, novelNoPerPage: number) {
  const totalNovelNo = Number(totalNoAsBigInt);
  if (totalNovelNo === 0) return;

  return calcLastPageNo(totalNovelNo, novelNoPerPage);
}

async function getTotalNovelNo(searchType: string, searchWord: string) {
  const dbQuery = `SELECT count(*) AS totalNoAsBigInt FROM novelInfo WHERE ${searchType} LIKE '%${searchWord}%'`;

  const { totalNoAsBigInt } = (await db(dbQuery, undefined, "first")) as {
    totalNoAsBigInt: BigInt;
  };

  return totalNoAsBigInt;
}

async function getRandomNovelsFromDB() {
  const dbQuery =
    "SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelDesc FROM novelInfo ORDER BY RAND() LIMIT 4";

  const novels = (await db(dbQuery, undefined, "all")) as NovelInDetail[];

  return novels;
}

async function getNovelsFromDB(
  searchType: string,
  searchWord: string,
  queryPartForPageLimit: string,
) {
  const dbQuery = `SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelDesc FROM novelInfo WHERE ${searchType} LIKE '%${searchWord}%' ${queryPartForPageLimit}`;

  const novels = (await db(dbQuery, undefined, "all")) as NovelInDetail[];

  return novels;
}

export default async function searchForNovels(
  searchType: "novelTitle" | "novelDesc" | "novelAuthor" | "sample",
  searchWord: string,
  pageNo: number,
) {
  // when search type is "sample", get several novels at random
  if (searchType === "sample") {
    const novels = await getRandomNovelsFromDB();

    if (novels.length === 0) return;

    return { novels, lastPageNo: 1 };
  }

  const novelNoPerPage = 10;
  const queryPartForPageLimit = `LIMIT ${(pageNo - 1) * novelNoPerPage}, ${novelNoPerPage}`;

  const novels = await getNovelsFromDB(searchType, searchWord, queryPartForPageLimit);

  if (novels.length === 0) return;

  const totalNoAsBigInt = await getTotalNovelNo(searchType, searchWord);

  const lastPageNo = getLastPageNo(totalNoAsBigInt, novelNoPerPage);
  if (lastPageNo === undefined) return;

  return { novels, lastPageNo };
}
