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

  if (!userId) return;

  const { userName } = await getUserNameByUserId(userId);

  return userName;
}

async function setReComment(comment: Comment) {
  const { commentId, userId, commentContent, createDate, parentCommentId, isDeleted, isEdited } =
    comment;

  if (isDeleted === 1) {
    return {
      commentId, // it is required to know which comment is the parent of other reComment
      userName: "",
      userImg: "",
      commentContent: "",
      createDate,

      parentCommentId: "",
      parentCommentUserName: "",

      isDeleted,
      isEdited,
    };
  }

  const parentCommentUserName = await getUserNameByCommentId(parentCommentId);

  const user = await getUserNameAndImg(userId);
  if (!user) return;

  return {
    commentId,
    userName: user.userName,
    userImg: user.userImg,
    commentContent,
    createDate,

    parentCommentId,
    parentCommentUserName, // it can be empty if its parent was deleted
    isDeleted,
    isEdited,
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
    return [];
  }

  const reCommentsComposed = await composeReComments(reCommentsFromDB);

  return reCommentsComposed;
}
