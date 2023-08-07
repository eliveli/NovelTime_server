import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import db from "../utils/db";
import { Comment } from "../utils/types";

async function getRootCommentsByWritingId(
  talkId: string,
  commentSortType: "new" | "old",
  commentPageNo: number,
) {
  const queryPartForSorting = commentSortType === "old" ? "createDate" : "createDate DESC";

  const commentNoPerPage = 20;
  const queryPartForCommentPageLimit =
    commentPageNo === 0
      ? "" // get the all comment pages
      : `LIMIT ${(commentPageNo - 1) * commentNoPerPage}, ${commentNoPerPage}`;

  return (await db(
    `SELECT * FROM comment WHERE writingId = (?) AND parentCommentId IS NULL ORDER BY ${queryPartForSorting} ${queryPartForCommentPageLimit}`,
    talkId,
    "all",
  )) as Comment[];
}

function checkIfItHasNextPage(totalCommentNo: number, currentPageNo: number) {
  const commentNoPerPage = 20;

  if (totalCommentNo % commentNoPerPage === 0) {
    if (Math.floor(totalCommentNo / commentNoPerPage) === currentPageNo) return false;
    return true;
  }
  if (totalCommentNo % commentNoPerPage !== 0) {
    if (Math.floor(totalCommentNo / commentNoPerPage) + 1 === currentPageNo) return false;
    return true;
  }

  throw Error("error when checking if comment has next page or not");
}

async function getTotalCommentNoFromDB(talkId: string) {
  return (await db(
    "SELECT count(*) AS totalCommentNoAsBigInt FROM comment WHERE writingId = (?) AND parentCommentId IS NULL",
    [talkId],
    "first",
  )) as { totalCommentNoAsBigInt: BigInt };
}

async function hasNextCommentPage(talkId: string, commentPageNo: number) {
  if (commentPageNo === 0) return false; // when getting the all pages

  const { totalCommentNoAsBigInt } = await getTotalCommentNoFromDB(talkId);

  const totalCommentNo = Number(totalCommentNoAsBigInt);
  if (totalCommentNo === 0) return false;

  return checkIfItHasNextPage(totalCommentNo, commentPageNo);
}

async function setComment(comment: Comment) {
  const {
    commentId,
    userId,
    commentContent,
    createDate,
    reCommentNoForRootComment,
    isDeleted,
    isEdited,
  } = comment;

  if (isDeleted === 1) {
    return {
      commentId,
      userName: "",
      userImg: "",
      commentContent: "",
      createDate,
      reCommentNo: reCommentNoForRootComment || 0,
      isDeleted,
      isEdited,
    };
  }

  const user = await getUserNameAndImg(userId);
  if (!user) return;

  return {
    commentId,
    userName: user.userName,
    userImg: user.userImg,
    commentContent,
    createDate,
    reCommentNo: reCommentNoForRootComment || 0,
    isDeleted,
    isEdited,
  };
}
// 코멘트 분류 : 루트 코멘트 (상위코멘트 X)
//               리코멘트 (상위코멘트가 존재하는 모든 코멘트. 루트의 리코멘트의 리코멘트... 식으로 이어질 수 있음)
//   i.e. 루트코멘트1 - 루트1의 리코멘트1 - 리코멘트1의 리코멘트1 - 리코멘트1의 리코멘트1의 리코멘트1 - ...
//                                        - 리코멘트1의 리코멘트2
//        루트코멘트2 - 루트2의 리코멘트1
//                    - 루트2의 리코멘트2
//
//   < 코멘트 분류를 위한 db columns >
//     . parentCommentId
//          for 루트 코멘트와 리코멘트 구분
//              리코멘트하는 바로 상위의 코멘트 표시
//               ㄴ프론트에서. 이건 모든 리코멘트는 작성일로 정렬되기 때문에 넣은 기능
//     . firstAncestorCommentId
//          for 같은 루트 코멘트 표시

async function composeComments(comments: Comment[]) {
  const commentsComposed = [];

  for (const comment of comments) {
    const commentComposed = await setComment(comment);

    if (!commentComposed) continue;

    commentsComposed.push(commentComposed);
  }

  return commentsComposed;
}

export default async function getRootComments(
  talkId: string,
  commentSortType: "new" | "old",
  commentPageNo: number,
) {
  const commentsFromDB = await getRootCommentsByWritingId(talkId, commentSortType, commentPageNo);

  if (!commentsFromDB.length) {
    //  when comments empty
    return { commentList: [], hasNext: false };
  }

  const commentsComposed = await composeComments(commentsFromDB);

  const hasNext = await hasNextCommentPage(talkId, commentPageNo);

  return { commentList: commentsComposed, hasNext };
}
