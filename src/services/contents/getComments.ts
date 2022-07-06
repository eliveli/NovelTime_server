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

function extractComments(comments: Comment[], isHome = true, order = 1) {
  // for UserPageHome page get the 4 comments
  // for UserPageWriting(Comment) page get the 8 comments as requested order
  const requiredNumber = isHome ? 4 : 8;

  const extractedComments = comments.slice(requiredNumber * (order - 1), requiredNumber * order);

  return extractedComments;
}

async function getCommentsSet(selectedComments: Comment[]) {
  const commentsSet = [];

  for (const comment of selectedComments) {
    const commentSet = await setCommentInfo(comment);
    commentsSet.push(commentSet);
  }
  return commentsSet;
}

function getCommentsByUserId(userId: string) {
  return new Promise<Comment[]>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getComments, userId)
          .then(async (data) => {
            const comments = data.slice(0, data.length);

            resolve(comments as Comment[]);

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
export default function getCommentsForUserPageHome(userId: string) {
  return new Promise<any>(async (resolve) => {
    const comments = await getCommentsByUserId(userId);

    const selectedComments = extractComments(comments);

    const commentsSet = await getCommentsSet(selectedComments);

    resolve({ commentsSet });
  });
}
