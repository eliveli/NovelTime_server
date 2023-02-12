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

export default async function getWritings(
  listType: "T" | "R",
  novelGenre: string,
  search: { searchType: "writingTitle" | "writingDesc" | "userName" | "no"; searchWord: string },
  sortBy: string, // 작성일 up/down, 댓글 up/down, 좋아요 up/down
  pageNo: number,
) {
  const { searchType, searchWord } = search;

  const queryPartForNovelGenre = novelGenre === "all" ? "novelGenre" : `'${novelGenre}'`;

  const sortType = matchSortType(sortBy);

  if (searchType === "userName") {
    const userIDs = await getUserIdBySimilarUserName(searchWord);

    if (!userIDs) return;

    let queryPartForUserIDs = "userId = (?)";
    for (let i = 0; i < userIDs.length - 1; i += 1) {
      queryPartForUserIDs += " OR userId = (?)";
    }

    queryPartForUserIDs = `(${queryPartForUserIDs})`; // "( )" is necessary to set the exact query in multiple "and" and "or"

    return await db(
      `SELECT * FROM writing WHERE ${queryPartForUserIDs} AND talkOrRecommend = (?) AND novelGenre = ${queryPartForNovelGenre} ORDER BY ${sortType}`,
      [...userIDs, listType],
      "all",
    );
  }

  if (["writingTitle", "writingDesc"].includes(searchType)) {
    return await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) ${searchType} = (?) AND novelGenre = ${queryPartForNovelGenre} ORDER BY ${sortType}`,
      [listType, searchWord],
      "all",
    );
  }

  if (searchType === "no") {
    return await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) AND novelGenre = ${queryPartForNovelGenre} ORDER BY ${sortType}`,
      [listType],
      "all",
    );
  }

  throw Error("error was occurred because of searchType");
}
