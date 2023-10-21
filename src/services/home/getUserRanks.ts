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
    SELECT novelList.userId, count(*) AS count FROM novelListLike
      INNER JOIN novelList ON novelListLike.novelListId = novelList.novelListId
      GROUP BY novelList.userId
      ORDER BY count(*) DESC LIMIT 10; 
    `,
    undefined,
    "all",
  )) as { userId: string; count: BigInt }[];
}

export async function getNovelListLikeRank() {
  const novelListRanks = await getNovelListLikeRankFromDB();

  if (novelListRanks.length === 0) return [];

  return novelListRanks;
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
  return []; // when getting no data from DB
}

type UserIdRanks = {
  userId: string;
  count: BigInt | number | null; // i.e. BigInt : 6n
}[];

export async function setRankWithUserInfo(userIdRanks: UserIdRanks) {
  if (userIdRanks.length === 0) return; // when getting no data from DB

  const rank = [];
  for (const userInfo of userIdRanks) {
    const user = await getUserNameAndImg(userInfo.userId);

    if (!user) continue;

    const count = Number(userInfo.count);

    const rankInfo = { userImg: user.userImg, userName: user.userName, count };
    rank.push(rankInfo);
  }
  return rank;
}

export default async function getUserRanks(
  contentType: "T" | "C" | "R" | "L", // Talk, Comment, Recommend, novelList
  actType: "Create" | "ReceiveLike",
) {
  const userIdRanks = await getUserRankByContent(contentType, actType);

  return await setRankWithUserInfo(userIdRanks);
}
