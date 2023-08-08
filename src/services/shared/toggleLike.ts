import db from "../utils/db";

async function deleteContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  const querySelected =
    contentType === "writing"
      ? "DELETE FROM writingLike WHERE userId = (?) and writingId = (?)"
      : "DELETE FROM novelListLike WHERE userId = (?) and novelListId = (?)";
  await db(querySelected, [userId, writingId]);
}
async function setContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  const querySelected =
    contentType === "writing"
      ? "INSERT INTO writingLike SET userId = (?), writingId = (?)"
      : "INSERT INTO novelListLike SET userId = (?), novelListId = (?)";

  await db(querySelected, [userId, writingId]);
}
export async function getContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  let isLike = false;

  const querySelected =
    contentType === "writing"
      ? "SELECT * FROM writingLike WHERE userId = (?) and writingId = (?)"
      : "SELECT * FROM novelListLike WHERE userId = (?) and novelListId = (?)";
  const data = (await db(querySelected, [userId, writingId], "raw")) as Array<{
    [key: string]: any;
  }>;
  if (data[0]) {
    isLike = true;
  }

  return isLike;
}

async function decreaseLikeNo(writingId: string) {
  await db("UPDATE writing SET likeNO  = likeNO - 1 WHERE writingId = (?)", [writingId]);
}

async function increaseLikeNo(writingId: string) {
  await db("UPDATE writing SET likeNO  = likeNO + 1 WHERE writingId = (?)", [writingId]);
}

async function getLikeNo(writingId: string) {
  const { likeNO } = (await db(
    "SELECT likeNO FROM writing WHERE writingId = (?)",
    [writingId],
    "first",
  )) as { likeNO: number };

  return likeNO;
}

async function workForWriting(prevIsLike: boolean, contentId: string, loginUserId: string) {
  let isLike: boolean;
  if (prevIsLike) {
    await deleteContentLike("writing", loginUserId, contentId);
    isLike = false;

    await decreaseLikeNo(contentId);
  } else {
    await setContentLike("writing", loginUserId, contentId);
    isLike = true;

    await increaseLikeNo(contentId);
  }

  const likeNo = await getLikeNo(contentId);

  return { isLikeForWriting: isLike, likeNoForWriting: likeNo };
}
async function workForNovelList(prevIsLike: boolean, contentId: string, loginUserId: string) {
  let isLike: boolean;

  if (prevIsLike) {
    await deleteContentLike("novelList", loginUserId, contentId);

    isLike = false;
  } else {
    await setContentLike("novelList", loginUserId, contentId);
    isLike = true;
  }

  return isLike;
}
export default async function toggleLike(
  contentType: "writing" | "novelList",
  contentId: string,
  loginUserId: string,
) {
  let isLike: boolean | undefined;
  let likeNo: number | undefined; // only for writing content

  try {
    const prevIsLike = await getContentLike(contentType, loginUserId, contentId);

    if (contentType === "writing") {
      const { isLikeForWriting, likeNoForWriting } = await workForWriting(
        prevIsLike,
        contentId,
        loginUserId,
      );

      isLike = isLikeForWriting;
      likeNo = likeNoForWriting;
    } else {
      isLike = await workForNovelList(prevIsLike, contentId, loginUserId);
    }
  } catch (error) {
    console.log("error occurred in toggleLike:", error);
  }

  return { isLike, likeNo };
}
