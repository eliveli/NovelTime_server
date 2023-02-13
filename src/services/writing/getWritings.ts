import { getUserIdBySimilarUserName } from "../shared/getUserId";
import db from "../utils/db";

function matchSortType(sortBy: string) {
  if (sortBy === "newDate") {
    return "createDate DESC";
  }
  if (sortBy === "oldDate") {
    return "createDate";
  }
  if (sortBy === "manyComments") {
    return "commentNO DESC";
  }
  if (sortBy === "fewComments") {
    return "commentNO";
  }
  if (sortBy === "manyLikes") {
    return "likeNO DESC";
  }
  if (sortBy === "fewLikes") {
    return "likeNO";
  }

  throw Error("error when matching sorting type");
}

function setQueryPartForNovelGenre(novelGenre: string) {
  const queryPart = "AND novelGenre";

  if (novelGenre === "all") return `${queryPart} = novelGenre`;

  if (novelGenre === "extra") return `${queryPart} LIKE '%extra%'`;

  return `${queryPart} = '${novelGenre}'`;
}

function checkIfItIsLastPageOrNot(
  totalWritingNo: number,
  writingNoPerPage: number,
  currentPageNo: number,
) {
  if (totalWritingNo % writingNoPerPage === 0) {
    if (Math.floor(totalWritingNo / writingNoPerPage) === currentPageNo) return true;
    return false;
  }
  if (totalWritingNo % writingNoPerPage !== 0) {
    if (Math.floor(totalWritingNo / writingNoPerPage) + 1 === currentPageNo) return true;
    return false;
  }
}

function setIsLastPage(totalNoAsBigInt: BigInt, writingNoPerPage: number, currentPageNo: number) {
  const totalWritingNo = Number(totalNoAsBigInt);
  if (totalWritingNo === 0) return;

  return checkIfItIsLastPageOrNot(totalWritingNo, writingNoPerPage, currentPageNo);
}

export default async function getWritings(
  listType: "T" | "R",
  novelGenre: string,
  search: { searchType: "writingTitle" | "writingDesc" | "userName" | "no"; searchWord: string },
  sortBy: string, // 작성일 up/down, 댓글 up/down, 좋아요 up/down
  pageNo: number,
) {
  const { searchType, searchWord } = search;

  const queryPartForNovelGenre = setQueryPartForNovelGenre(novelGenre);

  const writingNoPerPage = 10;
  const queryPartForPageLimit = `LIMIT ${(pageNo - 1) * writingNoPerPage}, ${writingNoPerPage}`;

  const sortType = matchSortType(sortBy);

  if (searchType === "userName") {
    const userIDs = await getUserIdBySimilarUserName(searchWord);
    if (!userIDs) return;

    let queryPartForUserIDs = "userId = (?)";
    for (let i = 0; i < userIDs.length - 1; i += 1) {
      queryPartForUserIDs += " OR userId = (?)";
    }

    queryPartForUserIDs = `(${queryPartForUserIDs})`; // "( )" is necessary to set the exact query in multiple "and" and "or"

    const writings = (await db(
      `SELECT * FROM writing WHERE ${queryPartForUserIDs} AND talkOrRecommend = (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [...userIDs, listType],
      "all",
    )) as any; // ****** change this data and its type later ********

    if (writings.length === 0) return;

    const { totalNoAsBigInt } = (await db(
      `SELECT count(*) AS totalNoAsBigInt FROM writing WHERE ${queryPartForUserIDs} AND talkOrRecommend = (?) ${queryPartForNovelGenre}`,
      [...userIDs, listType],
      "first",
    )) as { totalNoAsBigInt: BigInt };

    const isLastPage = setIsLastPage(totalNoAsBigInt, writingNoPerPage, pageNo);
    if (isLastPage === undefined) return;

    return { writings, isLastPage };
  }

  if (["writingTitle", "writingDesc"].includes(searchType)) {
    const writings = (await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) AND ${searchType} = (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [listType, searchWord],
      "all",
    )) as any; // ****** change this data and its type later ********

    if (writings.length === 0) return;

    const { totalNoAsBigInt } = (await db(
      `SELECT count(*) AS totalNoAsBigInt FROM writing WHERE talkOrRecommend = (?) AND ${searchType} = (?) ${queryPartForNovelGenre}`,
      [listType, searchWord],
      "first",
    )) as { totalNoAsBigInt: BigInt };

    const isLastPage = setIsLastPage(totalNoAsBigInt, writingNoPerPage, pageNo);
    if (isLastPage === undefined) return;

    return { writings, isLastPage };
  }

  if (searchType === "no") {
    const writings = (await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [listType],
      "all",
    )) as any; // ****** change this data and its type later ********

    if (writings.length === 0) return;

    const { totalNoAsBigInt } = (await db(
      `SELECT count(*) AS totalNoAsBigInt FROM writing WHERE talkOrRecommend = (?) ${queryPartForNovelGenre}`,
      [listType],
      "first",
    )) as { totalNoAsBigInt: BigInt };

    const isLastPage = setIsLastPage(totalNoAsBigInt, writingNoPerPage, pageNo);
    if (isLastPage === undefined) return;

    return { writings, isLastPage };
  }

  throw Error("error was occurred because of searchType");
}
