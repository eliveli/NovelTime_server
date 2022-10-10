import db from "../utils/db";
import { Novel, UserImg, UserImgAndNameInDB, Writing } from "../utils/types";

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

async function composeTalk(userName: string, userImg: UserImg, writing: Writing) {
  const { novelTitle } = await getNovelTitle(writing.novelId);

  return {
    talkId: writing.writingId,
    userName,
    userImg,
    createDate: writing.createDate,
    likeNO: writing.likeNO,
    commentNO: writing.commentNO,
    talkTitle: writing.writingTitle,
    talkImg: writing.writingImg,
    novelTitle,
  };
}
async function composeRecommend(userName: string, userImg: UserImg, writing: Writing) {
  const { novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd } = await getNovelInfo(
    writing.novelId,
  );

  return {
    recommend: {
      recommendId: writing.writingId,
      userName,
      userImg,
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
}

async function composeWritings(contentType: "T" | "R", writings: Writing[]) {
  const writingsReturned = [];

  // compose writings that will be returned as searching data
  for (const writing of writings) {
    const { userName, userImgSrc, userImgPosition } = await getUserNameAndImg(writing.userId);

    const userImg = { src: userImgSrc, position: userImgPosition };

    if (contentType === "T") {
      const writingSet = await composeTalk(userName, userImg, writing);

      writingsReturned.push(writingSet);
    }

    if (contentType === "R") {
      const writingSet = await composeRecommend(userName, userImg, writing);

      writingsReturned.push(writingSet);
    }
  }

  return writingsReturned;
}

export default async function getWritings(contentType: "T" | "R") {
  const writings = await getWritingsFromDB(contentType);
  return await composeWritings(contentType, writings);
}
