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
  search: { searchType: string; searchWord: string },
  sortBy: string, // 작성일 up/down, 댓글 up/down, 좋아요 up/down
  pageNo: number,
) {
  const sortType = matchSortType(sortBy);

  if (novelGenre === "all") {
    return await db(
      `SELECT * FROM writing WHERE talkOrRecommend = (?) ORDER BY ${sortType}`,
      [listType],
      "all",
    );
  }

  const writings = await db(
    `SELECT * FROM writing WHERE talkOrRecommend = (?) AND novelGenre = (?) ORDER BY ${sortType}`,
    [listType, novelGenre],
    "all",
  );

  return writings;
}
