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

async function getUserInfo(userId: string) {
  return (await db(
    "SELECT userName, userImgSrc, userImgPosition, userBGSrc, userBGPosition FROM user WHERE userId = (?)",
    userId,
    "first",
  )) as UserInfoInDB;
}
export async function getTalkRank() {
  return (await db(
    `SELECT userId, COUNT(*) FROM writing WHERE talkOrRecommend = (?) GROUP BY userId
  ORDER BY count(*) DESC LIMIT 10`,
    "T",
    "all",
  )) as { userId: string; "COUNT(*)": any }[];
}

export async function getUserRank(contentType: "T" | "R") {
  if (contentType === "T") {
    const userIdRanks = await getTalkRank();

    const writing = [];
    for (const userInfo of userIdRanks) {
      const { userName, userImgSrc, userImgPosition } = await getUserNameAndImg(userInfo.userId);
      const count = Number(userInfo["COUNT(*)"]);
      const rankInfo = {
        userImg: { src: userImgSrc, position: userImgPosition },
        userName,
        count,
      };
      writing.push(rankInfo);
    }
    return writing;
  }
}

export const writingHomeService = {
  getWritings,
  getUserRank,
};
export default writingHomeService;
