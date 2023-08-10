import { getNovelIDsByNovelTitle } from "../novel/novels";
import { getUserIdBySimilarUserName } from "../shared/getUserId";
import db from "../utils/db";
import { Writing } from "../utils/types";

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

function calcLastPageNo(totalWritingNo: number, writingNoPerPage: number) {
  if (totalWritingNo % writingNoPerPage === 0) {
    return totalWritingNo / writingNoPerPage;
  }
  if (totalWritingNo % writingNoPerPage !== 0) {
    return Math.floor(totalWritingNo / writingNoPerPage) + 1;
  }
}

function getLastPageNo(totalNoAsBigInt: BigInt, writingNoPerPage: number) {
  const totalWritingNo = Number(totalNoAsBigInt);
  if (totalWritingNo === 0) return;

  return calcLastPageNo(totalWritingNo, writingNoPerPage);
}

export default async function getWritings(
  writingType: "T" | "R",
  novelGenre: string,
  search: {
    searchType: "writingTitle" | "writingDesc" | "userName" | "novelTitle" | "no";
    searchWord: string;
  },
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
      [...userIDs, writingType],
      "all",
    )) as Writing[];

    if (writings.length === 0) return;

    const { totalNoAsBigInt } = (await db(
      `SELECT count(*) AS totalNoAsBigInt FROM writing WHERE ${queryPartForUserIDs} AND talkOrRecommend = (?) ${queryPartForNovelGenre}`,
      [...userIDs, writingType],
      "first",
    )) as { totalNoAsBigInt: BigInt };

    const lastPageNo = getLastPageNo(totalNoAsBigInt, writingNoPerPage);
    if (lastPageNo === undefined) return;

    return { writings, lastPageNo };
  }

  if (["writingTitle", "writingDesc"].includes(searchType)) {
    const writings = (await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) AND ${searchType} LIKE (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [writingType, `%${searchWord}%`],
      "all",
    )) as Writing[];

    if (writings.length === 0) return;

    const { totalNoAsBigInt } = (await db(
      `SELECT count(*) AS totalNoAsBigInt FROM writing WHERE talkOrRecommend = (?) AND ${searchType} LIKE (?) ${queryPartForNovelGenre}`,
      [writingType, `%${searchWord}%`],
      "first",
    )) as { totalNoAsBigInt: BigInt };

    const lastPageNo = getLastPageNo(totalNoAsBigInt, writingNoPerPage);
    if (lastPageNo === undefined) return;

    return { writings, lastPageNo };
  }

  if (searchType === "novelTitle") {
    const novelIDs = await getNovelIDsByNovelTitle(searchWord);
    if (!novelIDs) return;

    let queryPartForNovelIDs = "novelId = (?)";
    for (let i = 0; i < novelIDs.length - 1; i += 1) {
      queryPartForNovelIDs += " OR novelId = (?)";
    }

    queryPartForNovelIDs = `(${queryPartForNovelIDs})`; // "( )" is necessary to set the exact query in multiple "and" and "or"

    const writings = (await db(
      `SELECT * FROM writing WHERE ${queryPartForNovelIDs} AND talkOrRecommend = (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [...novelIDs, writingType],
      "all",
    )) as Writing[];

    if (writings.length === 0) return;

    const { totalNoAsBigInt } = (await db(
      `SELECT count(*) AS totalNoAsBigInt FROM writing WHERE ${queryPartForNovelIDs} AND talkOrRecommend = (?) ${queryPartForNovelGenre}`,
      [...novelIDs, writingType],
      "first",
    )) as { totalNoAsBigInt: BigInt };

    const lastPageNo = getLastPageNo(totalNoAsBigInt, writingNoPerPage);
    if (lastPageNo === undefined) return;

    return { writings, lastPageNo };
  }

  if (searchType === "no") {
    const writings = (await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [writingType],
      "all",
    )) as Writing[];

    if (writings.length === 0) return;

    const { totalNoAsBigInt } = (await db(
      `SELECT count(*) AS totalNoAsBigInt FROM writing WHERE talkOrRecommend = (?) ${queryPartForNovelGenre}`,
      [writingType],
      "first",
    )) as { totalNoAsBigInt: BigInt };

    const lastPageNo = getLastPageNo(totalNoAsBigInt, writingNoPerPage);
    if (lastPageNo === undefined) return;

    return { writings, lastPageNo };
  }

  throw Error("error was occurred because of searchType");
}
