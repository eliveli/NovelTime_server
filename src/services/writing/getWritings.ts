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

export default async function getWritings(
  listType: "T" | "R",
  novelGenre: string,
  search: { searchType: "writingTitle" | "writingDesc" | "userName" | "no"; searchWord: string },
  sortBy: string, // 작성일 up/down, 댓글 up/down, 좋아요 up/down
  pageNo: number, // 글 수 제한하면서 특정 페이지/무한스크롤 번호에 맞게 가져오기
) {
  const { searchType, searchWord } = search;

  const queryPartForNovelGenre = setQueryPartForNovelGenre(novelGenre);

  const writingNoPerPage = 10;
  const queryPartForPageLimit = `LIMIT ${(pageNo - 1) * writingNoPerPage}, writingNoPerPage`;

  const sortType = matchSortType(sortBy);

  if (searchType === "userName") {
    const userIDs = await getUserIdBySimilarUserName(searchWord);

    if (!userIDs) return; // do I should change this returned value?

    let queryPartForUserIDs = "userId = (?)";
    for (let i = 0; i < userIDs.length - 1; i += 1) {
      queryPartForUserIDs += " OR userId = (?)";
    }

    queryPartForUserIDs = `(${queryPartForUserIDs})`; // "( )" is necessary to set the exact query in multiple "and" and "or"

    return await db(
      `SELECT * FROM writing WHERE ${queryPartForUserIDs} AND talkOrRecommend = (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [...userIDs, listType],
      "all",
    );
  }

  if (["writingTitle", "writingDesc"].includes(searchType)) {
    return await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) ${searchType} = (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [listType, searchWord],
      "all",
    );
  }

  if (searchType === "no") {
    return await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) ${queryPartForNovelGenre} ORDER BY ${sortType} ${queryPartForPageLimit}`,
      [listType],
      "all",
    );
  }

  throw Error("error was occurred because of searchType");
}
