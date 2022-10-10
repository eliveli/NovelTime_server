import db from "../utils/db";
import { Novel, UserImgAndNameInDB, UserInfoInDB, Writing } from "../utils/types";

async function getNovelInfo(novelId: string) {
  return (await db(
    "SELECT novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as Novel;
}
async function getNovelTitle(novelId: string) {
  return (await db("SELECT novelTitle FROM novelInfo WHERE novelId = (?)", novelId, "first")) as {
    novelTitle: string;
  };
}

export async function getUserNameAndImg(userId: string) {
  return (await db(
    "SELECT userName, userImgSrc, userImgPosition FROM user WHERE userId = (?)",
    userId,
    "first",
  )) as UserImgAndNameInDB;
}

async function getWritingsFromDB(contentType: "T" | "R") {
  return (await db(
    "SELECT * FROM writing WHERE talkOrRecommend = (?) limit 3",
    contentType,
    "all",
  )) as Writing[];
}

async function composeWritings(contentType: "T" | "R", writings: Writing[]) {
  const writingsReturned = [];

  // compose writings that will be returned as searching data needed
  for (const writing of writings) {
    const { userName, userImgSrc, userImgPosition } = await getUserNameAndImg(writing.userId);

    if (contentType === "T") {
      const { novelTitle } = await getNovelTitle(writing.novelId);

      const writingSet = {
        talkId: writing.writingId,
        userName,
        userImg: { src: userImgSrc, position: userImgPosition },
        createDate: writing.createDate,
        likeNO: writing.likeNO,
        commentNO: writing.commentNO,
        talkTitle: writing.writingTitle,
        talkImg: writing.writingImg,
        novelTitle,
      };

      writingsReturned.push(writingSet);
    }

    if (contentType === "R") {
      const { novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd } = await getNovelInfo(
        writing.novelId,
      );

      const writingSet = {
        recommend: {
          recommendId: writing.writingId,
          userName,
          userImg: { src: userImgSrc, position: userImgPosition },
          createDate: writing.createDate,
          likeNO: writing.likeNO,
          recommendTitle: writing.writingTitle,
        },
        novel: {
          novelImg,
          novelTitle,
          novelAuthor,
          novelGenre,
          isEnd: novelIsEnd,
        },
      };

      writingsReturned.push(writingSet);
    }
  }

  return writingsReturned;
}
async function getWritings(contentType: "T" | "R") {
  const writings = await getWritingsFromDB(contentType);
  return await composeWritings(contentType, writings);
}

//

export async function getTalkCommentRank() {
  return (await db(
    `SELECT userId, COUNT(*) FROM comment
    GROUP BY userId
    ORDER BY COUNT(*) DESC LIMIT 10; 
    `,
    undefined,
    "all",
  )) as { userId: string; "COUNT(*)": any }[];
}
export async function getTalkRank() {
  return (await db(
    `SELECT userId, COUNT(*) FROM writing WHERE talkOrRecommend = "T" GROUP BY userId
  ORDER BY count(*) DESC LIMIT 10`,
    undefined,
    "all",
  )) as { userId: string; "COUNT(*)": any }[];
}
export async function getTalkLikeRank() {
  return (await db(
    `SELECT userId, sum(likeNO) FROM writing WHERE talkOrRecommend = 'T' GROUP BY userId
    ORDER BY sum(likeNO) DESC LIMIT 10;`,
    undefined,
    "all",
  )) as { userId: string; "sum(likeNO)": any }[];
}
export async function getUserRankByContent(
  contentType: "T" | "C" | "R",
  actType: "Create" | "ReceiveLike",
) {
  if (contentType === "T" && actType === "Create") {
    return await getTalkRank();
  }
  if (contentType === "C" && actType === "Create") {
    return await getTalkCommentRank();
  }
  if (contentType === "T" && actType === "ReceiveLike") {
    return await getTalkLikeRank();
  }
}

type UserIdRanks =
  | {
      userId: string;
      "COUNT(*)": any;
    }[]
  | {
      userId: string;
      "sum(likeNO)": any;
    }[];

async function composeUserRank(userIdRanks: UserIdRanks) {
  const rank = [];
  for (const userInfo of userIdRanks) {
    const { userName, userImgSrc, userImgPosition } = await getUserNameAndImg(userInfo.userId);

    const count =
      "COUNT(*)" in userInfo ? Number(userInfo["COUNT(*)"]) : Number(userInfo["sum(likeNO)"]);
    // convert BIGINT to Number (i.e. 6n -> 6)
    // though type of userInfo["sum(likeNO)"] from mariaDB is not BIGINT,
    //   Number function is necessary as well to confirm the type to avoid ts error

    const rankInfo = {
      userImg: { src: userImgSrc, position: userImgPosition },
      userName,
      count,
    };
    rank.push(rankInfo);
  }
  return rank;
}
export async function getUserRank(
  contentType: "T" | "C" | "R", // Talk, Comment, Recommend
  actType: "Create" | "ReceiveLike",
) {
  const userIdRanks = await getUserRankByContent(contentType, actType);

  if (!userIdRanks) return;

  return await composeUserRank(userIdRanks);
}

export const writingHomeService = {
  getWritings,
  getUserRank,
};
export default writingHomeService;
