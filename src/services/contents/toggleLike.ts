import pool from "../../configs/db";
import { query } from "./contents.utils";

async function deleteContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  try {
    const connection = await pool.getConnection();

    try {
      const querySelected =
        contentType === "writing" ? query.deleteWritingLike : query.deleteNovelListLike;
      await connection.query(querySelected, [userId, writingId]);

      // When done with the connection, release it.
      await connection.release();
    } catch (err) {
      console.log(err);
      await connection.release();
    }
  } catch (err) {
    console.log(`not connected due to error: ${err}`);
  }
}
async function setContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  try {
    const connection = await pool.getConnection();

    try {
      const querySelected =
        contentType === "writing" ? query.setWritingLike : query.setNovelListLike;

      await connection.query(querySelected, [userId, writingId]);

      // When done with the connection, release it.
      await connection.release();
    } catch (err) {
      console.log(err);
      await connection.release();
    }
  } catch (err) {
    console.log(`not connected due to error: ${err}`);
  }
}
async function getContentLike(
  contentType: "writing" | "novelList",
  userId: string,
  writingId: string,
) {
  let isLike = false;
  try {
    const connection = await pool.getConnection();

    try {
      const querySelected =
        contentType === "writing" ? query.getWritingLike : query.getNovelListLike;

      const data = await connection.query(querySelected, [userId, writingId]);

      if (data) {
        isLike = true;
      }

      // When done with the connection, release it.
      await connection.release();
    } catch (err) {
      console.log(err);
      await connection.release();
    }
  } catch (err) {
    console.log(`not connected due to error: ${err}`);
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
      await setContentLike(contentType, loginUserId, contentId);
      isLike = false;
    } else {
      await deleteContentLike(contentType, loginUserId, contentId);
      isLike = true;
    }
  } catch (error) {
    console.log("error occurred in toggleLike:", error);
  }
  return { isLike };
}
