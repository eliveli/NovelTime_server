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
  await db(querySelected, [userId, writingId], "raw");
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

  await db(querySelected, [userId, writingId], "raw");
}
async function getContentLike(
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

export default async function toggleLike(
  contentType: "writing" | "novelList",
  contentId: string,
  loginUserId: string,
) {
  let isLike;
  try {
    const prevIsLike = await getContentLike(contentType, loginUserId, contentId);
    if (prevIsLike) {
      await deleteContentLike(contentType, loginUserId, contentId);
      isLike = false;
    } else {
      await setContentLike(contentType, loginUserId, contentId);
      isLike = true;
    }
  } catch (error) {
    console.log("error occurred in toggleLike:", error);
  }
  return { isLike };
}
