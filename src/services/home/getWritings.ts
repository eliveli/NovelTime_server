import db from "../utils/db";
import { NovelWithoutId, UserImg, Writing } from "../utils/types";
import getUserNameAndImg from "./shared/getUserNameAndImg";

async function getNovelInfo(novelId: string) {
  const novel = (await db(
    "SELECT novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?)",
    novelId,
    "first",
  )) as NovelWithoutId;

  if (!novel) return;

  return { ...novel, novelIsEnd: !!novel.novelIsEnd };
}
async function getNovelTitle(novelId: string) {
  return (await db("SELECT novelTitle FROM novelInfo WHERE novelId = (?)", novelId, "first")) as {
    novelTitle: string;
  };
}

export async function getWritingsFromDB(contentType: "T" | "R") {
  const limitNo = contentType === "T" ? 5 : 4;

  return (await db(
    `SELECT * FROM writing WHERE talkOrRecommend = (?) ORDER BY createDate DESC limit ${limitNo}`,
    contentType,
    "all",
  )) as Writing[];
}

async function composeTalkWithNovel(
  userName: string,
  userImg: UserImg,
  writing: Writing,
  searchType?: string,
) {
  const novel = await getNovelTitle(writing.novelId);

  if (!novel) return;

  return {
    talkId: writing.writingId,
    userName,
    userImg,
    createDate: writing.createDate,
    likeNO: writing.likeNO,
    commentNO: writing.commentNO,
    talkTitle: writing.writingTitle,
    talkDesc: searchType === "writingDesc" ? writing.writingDesc : undefined,
    talkImg: writing.writingImg,
    novelTitle: novel.novelTitle,
  };
}
async function composeRecommendWithNovel(
  userName: string,
  userImg: UserImg,
  writing: Writing,
  searchType?: string,
) {
  const novel = await getNovelInfo(writing.novelId);

  if (!novel) return;

  return {
    recommend: {
      recommendId: writing.writingId,
      userName,
      userImg,
      createDate: writing.createDate,
      likeNO: writing.likeNO,
      recommendTitle: writing.writingTitle,
      recommendDesc: searchType === "writingDesc" ? writing.writingDesc : undefined,
    },
    novel: {
      novelImg: novel.novelImg,
      novelTitle: novel.novelTitle,
      novelAuthor: novel.novelAuthor,
      novelGenre: novel.novelGenre,
      isEnd: novel.novelIsEnd,
    },
  };
}

export async function composeWritings(
  contentType: "T" | "R",
  writings: Writing[],
  searchType?: string,
) {
  if (writings.length === 0) return;

  const writingsReturned = [];

  // compose writings that will be returned as searching data
  for (const writing of writings) {
    const user = await getUserNameAndImg(writing.userId);

    if (!user) continue;

    if (contentType === "T") {
      const writingSet = await composeTalkWithNovel(
        user.userName,
        user.userImg,
        writing,
        searchType,
      );

      if (!writingSet) continue;

      writingsReturned.push(writingSet);
    }

    if (contentType === "R") {
      const writingSet = await composeRecommendWithNovel(
        user.userName,
        user.userImg,
        writing,
        searchType,
      );

      if (!writingSet) continue;

      writingsReturned.push(writingSet);
    }
  }

  return writingsReturned;
}

export default async function getWritings(contentType: "T" | "R") {
  const writings = await getWritingsFromDB(contentType);
  return await composeWritings(contentType, writings);
}
