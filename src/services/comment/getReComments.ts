import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import db from "../utils/db";
import { Comment } from "../utils/types";

async function getUserIdByCommentId(commentId: string) {
  return (await db("SELECT userId FROM comment WHERE commentId = (?)", commentId, "first")) as {
    userId: string;
  };
}

async function getUserNameByUserId(userId: string) {
  return (await db("SELECT userName FROM user WHERE userId = (?)", userId, "first")) as {
    userName: string;
  };
}

async function getUserNameByCommentId(commentId: string) {
  const { userId } = await getUserIdByCommentId(commentId);

  if (!userId) return; // * fix?

  const { userName } = await getUserNameByUserId(userId);

  return userName;
}

// * needed to change for reComments
async function setReComment(comment: Comment) {
  const { commentId, userId, commentContent, createDate, parentCommentId } = comment;

  const user = await getUserNameAndImg(userId);
  if (!user) return;

  const parentCommentUserName = await getUserNameByCommentId(parentCommentId);

  if (!parentCommentUserName) return; // * fix?

  return {
    commentId,
    userName: user.userName,
    userImg: user.userImg,
    commentContent,
    createDate,

    parentCommentId,
    parentCommentUserName,
  };
}

async function composeReComments(comments: Comment[]) {
  const commentsComposed = [];

  for (const comment of comments) {
    const commentComposed = await setReComment(comment);

    if (!commentComposed) continue;

    commentsComposed.push(commentComposed);
  }

  return commentsComposed;
}

async function getReCommentsByRootCommentId(rootCommentId: string, commentSortType: "new" | "old") {
  const queryPartForSorting = commentSortType === "old" ? "createDate" : "createDate DESC";

  return (await db(
    `SELECT * FROM comment WHERE firstAncestorCommentId = (?) ORDER BY ${queryPartForSorting}`,
    rootCommentId,
    "all",
  )) as Comment[];
}

export default async function getReComments(rootCommentId: string, commentSortType: "new" | "old") {
  const reCommentsFromDB = await getReCommentsByRootCommentId(rootCommentId, commentSortType);

  if (!reCommentsFromDB.length) {
    // when comments are empty
    return {}; // * check whether I should fix
  }

  const reCommentsComposed = await composeReComments(reCommentsFromDB);

  return reCommentsComposed;
}
