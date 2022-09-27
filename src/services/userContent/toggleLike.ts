import db from "../utils/db";
import { query } from "../utils/query";

async function deleteContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  const querySelected =
    contentType === "writing" ? query.deleteWritingLike : query.deleteNovelListLike;
  await db(querySelected, [userId, writingId]);
}
async function setContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  const querySelected = contentType === "writing" ? query.setWritingLike : query.setNovelListLike;

  await db(querySelected, [userId, writingId]);
}
async function getContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  let isLike = false;

  const querySelected = contentType === "writing" ? query.getWritingLike : query.getNovelListLike;
  const data = await db(querySelected, [userId, writingId], true);
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
