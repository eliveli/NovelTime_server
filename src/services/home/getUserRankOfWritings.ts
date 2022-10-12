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
  //   if (contentType === "L" && actType === "ReceiveLike") {
  //     return await getWritingLikeRank(contentType);
  //   }
}

type UserIdRanks = {
  userId: string;
  count: BigInt | number | null; // i.e. BigInt : 6n
}[];

async function setRankWithUserInfo(userIdRanks: UserIdRanks) {
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

export default async function getUserRankOfWritings(
  contentType: "T" | "C" | "R" | "L", // Talk, Comment, Recommend, novelList
  actType: "Create" | "ReceiveLike",
) {
  const userIdRanks = await getUserRankByContent(contentType, actType);

  if (!userIdRanks) return;

  return await setRankWithUserInfo(userIdRanks);
}
