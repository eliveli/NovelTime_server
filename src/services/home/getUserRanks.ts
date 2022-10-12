import db from "../utils/db";
import getUserNameAndImg from "./shared/getUserNameAndImg";

export async function getTalkCommentRank() {
  return (await db(
    `SELECT userId, COUNT(*) AS count FROM comment
      GROUP BY userId
      ORDER BY COUNT(*) DESC LIMIT 10; 
      `,
    undefined,
    "all",
  )) as { userId: string; count: BigInt }[];
}
export async function getWritingRank(contentType: "T" | "R") {
  return (await db(
    `SELECT userId, COUNT(*) AS count FROM writing WHERE talkOrRecommend = (?) GROUP BY userId
    ORDER BY count(*) DESC LIMIT 10`,
    contentType,
    "all",
  )) as { userId: string; count: BigInt }[];
}
export async function getWritingLikeRank(contentType: "T" | "R") {
  return (await db(
    `SELECT userId, sum(likeNO) AS count FROM writing WHERE talkOrRecommend = (?) GROUP BY userId
      ORDER BY sum(likeNO) DESC LIMIT 10;`,
    contentType,
    "all",
  )) as { userId: string; count: number | null }[];
}

export async function getNovelListRank() {
  return (await db(
    `SELECT userId, count(*) AS count FROM novelList
        GROUP BY userId
        ORDER BY count(*) DESC LIMIT 10;`,
    undefined,
    "all",
  )) as { userId: string; count: BigInt }[];
}

export async function getNovelListLikeRankFromDB() {
  return (await db(
    `
    SELECT novelListId, count(*) AS count FROM novelListLike
      GROUP BY novelListId
      ORDER BY count(*) DESC LIMIT 10; 
    `,
    undefined,
    "all",
  )) as { novelListId: string; count: BigInt }[];
}
export async function getUserWhoCreatedNovelList(novelListId: string) {
  return (await db(
    `SELECT userId FROM novelList WHERE novelListId = (?)
    `,
    novelListId,
    "first",
  )) as { userId: string };
}

export async function getNovelListLikeRank() {
  const ranksWithUserId = [];

  const novelListRanks = await getNovelListLikeRankFromDB();

  for (const novelListRank of novelListRanks) {
    const { userId } = await getUserWhoCreatedNovelList(novelListRank.novelListId);

    ranksWithUserId.push({ userId, count: novelListRank.count });
  }
  return ranksWithUserId;
}

export async function getUserRankByContent(
  contentType: "T" | "C" | "R" | "L",
  actType: "Create" | "ReceiveLike",
) {
  if (contentType === "T" && actType === "Create") {
    return await getWritingRank(contentType);
  }
  if (contentType === "C" && actType === "Create") {
    return await getTalkCommentRank();
  }
  if (contentType === "T" && actType === "ReceiveLike") {
    return await getWritingLikeRank(contentType);
  }

  if (contentType === "R" && actType === "Create") {
    return await getWritingRank(contentType);
  }
  if (contentType === "R" && actType === "ReceiveLike") {
    return await getWritingLikeRank(contentType);
  }

  if (contentType === "L" && actType === "Create") {
    return await getNovelListRank();
  }
  if (contentType === "L" && actType === "ReceiveLike") {
    return await getNovelListLikeRank();
  }
}

type UserIdRanks = {
  userId: string;
  count: BigInt | number | null; // i.e. BigInt : 6n
}[];

export async function setRankWithUserInfo(userIdRanks: UserIdRanks) {
  const rank = [];
  for (const userInfo of userIdRanks) {
    const { userName, userImg } = await getUserNameAndImg(userInfo.userId);

    const count = Number(userInfo.count);

    const rankInfo = {
      userImg,
      userName,
      count,
    };
    rank.push(rankInfo);
  }
  return rank;
}

export default async function getUserRanks(
  contentType: "T" | "C" | "R" | "L", // Talk, Comment, Recommend, novelList
  actType: "Create" | "ReceiveLike",
) {
  const userIdRanks = await getUserRankByContent(contentType, actType);

  if (!userIdRanks) return;

  return await setRankWithUserInfo(userIdRanks);
}
