import db from "../utils/db";
import { getUserNameAndImg } from "./getWritings";

export async function getTalkCommentRank() {
  return (await db(
    `SELECT userId, COUNT(*) FROM comment
      GROUP BY userId
      ORDER BY COUNT(*) DESC LIMIT 10; 
      `,
    undefined,
    "all",
  )) as { userId: string; "COUNT(*)": BigInt }[];
}
export async function getWritingRank(contentType: "T" | "R") {
  return (await db(
    `SELECT userId, COUNT(*) FROM writing WHERE talkOrRecommend = (?) GROUP BY userId
    ORDER BY count(*) DESC LIMIT 10`,
    contentType,
    "all",
  )) as { userId: string; "COUNT(*)": BigInt }[];
}
export async function getWritingLikeRank(contentType: "T" | "R") {
  return (await db(
    `SELECT userId, sum(likeNO) FROM writing WHERE talkOrRecommend = (?) GROUP BY userId
      ORDER BY sum(likeNO) DESC LIMIT 10;`,
    contentType,
    "all",
  )) as { userId: string; "sum(likeNO)": number | null }[];
}

export async function getUserRankByContent(
  contentType: "T" | "C" | "R",
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
}

type UserIdRanks =
  | {
      userId: string;
      "COUNT(*)": BigInt;
    }[]
  | {
      userId: string;
      "sum(likeNO)": number | null;
    }[];

async function setRankWithUserInfo(userIdRanks: UserIdRanks) {
  const rank = [];
  for (const userInfo of userIdRanks) {
    const { userName, userImgSrc, userImgPosition } = await getUserNameAndImg(userInfo.userId);

    const count =
      "COUNT(*)" in userInfo ? Number(userInfo["COUNT(*)"]) : Number(userInfo["sum(likeNO)"]);
    // convert BIGINT to Number (i.e. 6n -> 6)

    const rankInfo = {
      userImg: { src: userImgSrc, position: userImgPosition },
      userName,
      count,
    };
    rank.push(rankInfo);
  }
  return rank;
}

export default async function getUserRankOfWritings(
  contentType: "T" | "C" | "R", // Talk, Comment, Recommend
  actType: "Create" | "ReceiveLike",
) {
  const userIdRanks = await getUserRankByContent(contentType, actType);

  if (!userIdRanks) return;

  return await setRankWithUserInfo(userIdRanks);
}
