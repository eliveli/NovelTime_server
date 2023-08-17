import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import db from "../utils/db";
import { WritingWithoutGenre } from "../utils/types";

function checkIfItHasNextPage(totalWritingNo: number, pageNo: number) {
  const writingNoPerPage = 10;

  if (totalWritingNo % writingNoPerPage === 0) {
    if (Math.floor(totalWritingNo / writingNoPerPage) === pageNo) return false;
    return true;
  }
  if (totalWritingNo % writingNoPerPage !== 0) {
    if (Math.floor(totalWritingNo / writingNoPerPage) + 1 === pageNo) return false;
    return true;
  }

  throw Error("error when checking if writing has next page or not");
}

async function getTotalWritingNo(novelId: string, writingType: "T" | "R") {
  const query =
    "SELECT count(*) AS totalWritingNoAsBigInt FROM writing WHERE novelId = (?) AND talkOrRecommend = (?)";
  const { totalWritingNoAsBigInt } = (await db(query, [novelId, writingType], "first")) as {
    totalWritingNoAsBigInt: BigInt;
  };

  return totalWritingNoAsBigInt;
}

async function hasNextWritingPage(novelId: string, writingType: "T" | "R", pageNo: number) {
  const totalWritingNoAsBigInt = await getTotalWritingNo(novelId, writingType);

  const totalWritingNo = Number(totalWritingNoAsBigInt);
  if (totalWritingNo === 0) return false;

  return checkIfItHasNextPage(totalWritingNo, pageNo);
}

async function getWritingNoWithAllTypeFromDB(novelId: string) {
  const query = "SELECT count(*) AS totalWritingNoAsBigInt FROM writing WHERE novelId = (?)";
  const { totalWritingNoAsBigInt } = (await db(query, [novelId], "first")) as {
    totalWritingNoAsBigInt: BigInt;
  };

  return totalWritingNoAsBigInt;
}

async function getWritingNoWithAllType(novelId: string) {
  const totalWritingNoAsBigInt = await getWritingNoWithAllTypeFromDB(novelId);

  const totalWritingNo = Number(totalWritingNoAsBigInt);

  return totalWritingNo;
}

async function setWritingsWithUsers(writings: WritingWithoutGenre[], writingType: "T" | "R") {
  const writingsWithUsers = [];

  for (const writing of writings) {
    const user = await getUserNameAndImg(writing.userId);
    if (!user) continue;

    // 리코멘드일 때 코멘트 넘버 undefined
    const commentNO = writingType === "T" ? writing.commentNO : undefined;

    const writingWithUser = { ...writing, ...user, commentNO };
    writingsWithUsers.push(writingWithUser);
  }
  return writingsWithUsers;
}

async function getWritings(novelId: string, writingType: "T" | "R", pageNo: number) {
  const writingNoPerPage = 10;
  const queryPartForPageLimit = `LIMIT ${(pageNo - 1) * writingNoPerPage}, ${writingNoPerPage}`;

  const query = `SELECT * FROM writing WHERE novelId = (?) AND talkOrRecommend = (?) ${queryPartForPageLimit}`;
  const writings = (await db(query, [novelId, writingType], "all")) as WritingWithoutGenre[];

  const writingsWithUsers = await setWritingsWithUsers(writings, writingType);
  return writingsWithUsers;
}

export default async function getWritingsOfTheNovel(
  novelId: string,
  writingType: "T" | "R",
  pageNo: number,
) {
  const writings = await getWritings(novelId, writingType, pageNo);

  const writingNoWithAllType = await getWritingNoWithAllType(novelId);

  const hasNext = await hasNextWritingPage(novelId, writingType, pageNo);

  return {
    writings,
    writingNoWithAllType,
    hasNext,
  };
}
