import getUserNameAndImg from "../home/shared/getUserNameAndImg";
import db from "../utils/db";
import { Comment } from "../utils/types";

type CommentComposed = {
  commentId: string;
  userName: string;
  userImg: {
    src: string;
    position: string;
  };
  commentContent: string;
  createDate: string;
  reComment: any[];
};

async function getRootCommentsByWritingId(
  talkId: string,
  commentSortType: "new" | "old",
  commentPageNo: number,
) {
  const queryPartForSorting = commentSortType === "old" ? "createDate" : "createDate DESC";

  const commentNoPerPage = 50;
  const queryPartForCommentPageLimit = `LIMIT ${
    (commentPageNo - 1) * commentNoPerPage
  }, ${commentNoPerPage}`;

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
    // reComment, // it can be undefined
  } = comment;

  const user = await getUserNameAndImg(userId);
  if (!user) return;

  // const reCommentComposed: any[] = [];

  // // set reComments
  // if (reComment) {
  //   const reComments = [];
  //   const commentsUserNames: { [commentId: string]: string } = {
  //     [commentId]: user.userName,
  //   }; // to set parentCommentUserName

  //   // compose reComments
  //   for (const _ of reComment) {
  //     const { parentCommentId } = _;
  //     const reCommentSet1st = await setComment(_);
  //     if (!reCommentSet1st) continue;

  //     commentsUserNames[reCommentSet1st.commentId] = reCommentSet1st.userName;

  //     reComments.push({
  //       commentId: reCommentSet1st.commentId,
  //       parentCommentId,
  //       parentCommentUserName: "",
  //       userName: reCommentSet1st.userName,
  //       userImg: reCommentSet1st.userImg,
  //       commentContent: reCommentSet1st.commentContent,
  //       createDate: reCommentSet1st.createDate,
  //     });
  //   }

  //   // add parent comments' user names to reComments
  //   const reCommentsWithOriginalCommentsUserNames = reComments.map((_) => {
  //     const r = _;
  //     r.parentCommentUserName = commentsUserNames[r.parentCommentId];

  //     return r;
  //   });

  //   reCommentComposed = reCommentsWithOriginalCommentsUserNames;
  // }

  return {
    commentId,
    userName: user.userName,
    userImg: user.userImg,
    commentContent,
    createDate,
    reCommentNo: reCommentNoForRootComment || 0,
    // reComment: reCommentComposed,
  };
}

function setCommentsWithReComments(commentsFromServer: Comment[]) {
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

  // 루트 코멘트 - 부모코멘트가 없는 것
  const rootComments = commentsFromServer.filter((_) => !_.parentCommentId);

  // 모든 리코멘트 - 부모코멘트가 있는 것
  const allReComments = commentsFromServer.filter((_) => !!_.parentCommentId);

  if (allReComments.length === 0) {
    return rootComments; // 리코멘트가 없는 경우
  }

  // 리코멘트 분류 - 첫번째 조상 코멘트, 즉 같은 루트 코멘트를 둔 것끼리 분류
  // { 조상코멘트아이디 : 리코멘트[] }
  //                        ㄴ(2차, 3차, ... 모든 리코멘트)
  const reCommentsWithFirstAncestorID: { [x: string]: Comment[] } = {};

  allReComments.forEach((c) => {
    if (!reCommentsWithFirstAncestorID[c.firstAncestorCommentId]) {
      reCommentsWithFirstAncestorID[c.firstAncestorCommentId] = [c];
      //
    } else if (reCommentsWithFirstAncestorID[c.firstAncestorCommentId]) {
      reCommentsWithFirstAncestorID[c.firstAncestorCommentId] = [
        ...reCommentsWithFirstAncestorID[c.firstAncestorCommentId],
        c,
      ];
    }
  });

  // 각 루트 코멘트 아래에 리코멘트 넣기
  const commentsWithReComments = rootComments.map((_) => {
    const c = _;
    if (reCommentsWithFirstAncestorID[c.commentId]) {
      c.reComment = reCommentsWithFirstAncestorID[c.commentId];
    }
    return c;
  });

  return commentsWithReComments;
}

async function composeComments(comments: Comment[]) {
  const commentsComposed = [];

  for (const comment of comments) {
    const commentComposed = await setComment(comment);

    if (!commentComposed) continue;

    commentsComposed.push(commentComposed);
  }

  return commentsComposed;
}

function sortCommentsOld(c1: CommentComposed, c2: CommentComposed) {
  if (c1.createDate < c2.createDate) return -1;
  if (c1.createDate > c2.createDate) return 1;
  return 0;
}
function sortCommentsNew(c1: CommentComposed, c2: CommentComposed) {
  if (c1.createDate < c2.createDate) return 1;
  if (c1.createDate > c2.createDate) return -1;
  return 0;
}

function sortComments(comments: CommentComposed[], sortType: "new" | "old") {
  // sort comments
  if (sortType === "old") {
    comments.sort(sortCommentsOld);
  } else {
    comments.sort(sortCommentsNew);
  }

  // sort reComments
  const commentsSorted = comments.map((_) => {
    const c = _;
    if (c.reComment.length) {
      if (sortType === "old") {
        c.reComment.sort(sortCommentsOld);
      } else {
        c.reComment.sort(sortCommentsNew);
      }
    }
    return c;
  });

  return commentsSorted;
}

export async function getRootComments(
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