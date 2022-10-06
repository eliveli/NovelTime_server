import db from "../utils/db";
import { Novel, UserImgAndNameInDB, Writing } from "../utils/types";

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

async function getUserNameAndImg(userId: string) {
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

// async function getUserRank(contentType: "T" | "R") {}

export const writingHomeService = {
  getWritings,
};
export default writingHomeService;
