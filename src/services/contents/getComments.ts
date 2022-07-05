/* eslint-disable no-restricted-syntax */
import pool from "../../configs/db";
import { query } from "./contents.utils";

type Comment = {
  commentId: string;
  writingId: string;
  userId: string;
  createDate: string;
  commentContent: string;
  originalCommentIdForReComment: string; // if it is not "" empty string, get the info for it
};

// for userPageHome page : extractComments(comments, 4)
// then return the four comments
// for userPageWriting page : extractComments(comments, 8, order)
// then return the eight comments as Nth order as requested
function extractComments(comments: Comment[], number: number, order = 1) {
  const extractedComments = comments.slice(number * (order - 1), number * order);

  return extractedComments;
}

export default function getComments(userId: string) {
  return new Promise<any>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getComments, userId)
          .then((data) => {
            const comments = data.slice(0, data.length);
            const selectedComments = extractComments(comments, 4);
            resolve(selectedComments);

            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}
