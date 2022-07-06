/* eslint-disable no-restricted-syntax */
import pool from "../../configs/db";
import { query } from "./contents.utils";

type Comment = {
  commentId: string;
  writingId: string;
  userId: string;
  novelTitle: string;
  createDate: string;
  commentContent: string;
  originalCommentIdForReComment: string; // if it is not "" empty string, get the info for it
};

function getTalkTitle(talkId: string) {
  return new Promise<string>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getTalkTitle, talkId)
          .then((data) => {
            const { writingTitle } = data[0];
            resolve(writingTitle);

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

async function setCommentInfo(comment: Comment) {
  const {
    commentId,
    writingId,
    userId,
    novelTitle,
    createDate,
    commentContent,
    originalCommentIdForReComment,
  } = comment;

  const talkId = writingId;
  const talkTitle = await getTalkTitle(talkId);

  return {
    commentId,
    commentContent,
    createDate,
    talkId,
    talkTitle,
    novelTitle,
  };
}

// for userPageHome page : extractComments(comments, 4)
// then return the four comments
// for userPageWriting page : extractComments(comments, 8, order)
// then return the eight comments as Nth order as requested
function extractComments(comments: Comment[], number: number, order = 1) {
  const extractedComments = comments.slice(number * (order - 1), number * order);

  return extractedComments;
}

export default function getCommentsForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getComments, userId)
          .then(async (data) => {
            const comments = data.slice(0, data.length);
            const selectedComments = extractComments(comments, 4);

            const commentsSet = [];

            for (const comment of selectedComments) {
              const commentSet = await setCommentInfo(comment);
              commentsSet.push(commentSet);
            }

            resolve({ commentsSet });

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
