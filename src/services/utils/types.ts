export type UserInfo = {
  userId: string;
  userName: string;
  userImg: {
    src: string;
    position: string;
  };
  userBG: {
    src: string;
    position: string;
  };
};
export type UserInfoInDB = {
  userId?: string;
  userName: string;
  userImgSrc: string;
  userImgPosition: string;
  userBGSrc: string;
  userBGPosition: string;
  // refreshToken // it exists but don't use it here
};
export type UserImgAndNameInDB = {
  userName: string;
  userImgSrc: string;
  userImgPosition: string;
};
export type UserImg = {
  src: string;
  position: string;
};
export type NovelListInfo = {
  userId: string;
  novelListId: string;
  novelListTitle: string;
  novelIDs: string;
};

export type Novel = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelAuthor: string;
  novelGenre: string;
  novelIsEnd: boolean;
};

export type NovelWithoutEnd = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelAuthor: string;
  novelGenre: string;
};

export type NovelInDetail = {
  novelId: string;
  novelImg: string;
  novelTitle: string;
  novelAuthor: string;
  novelGenre: string;
  novelDesc: string;
};

export type NovelWithoutId = {
  novelImg: string;
  novelTitle: string;
  novelAuthor: string;
  novelGenre: string;
  novelIsEnd: boolean;
};

export type NovelList = {
  novels: Novel[];
  novelListId: string;
  userId: string;
  novelListTitle: string;
  novelIDs: string;
};
export interface NovelListsSimpleInfos {
  listId: string;
  listTitle: string;
  userName?: string;
  userImg?: {
    src: string;
    position: string;
  };
}
export interface NovelListThatUserCreatedOrLiked {
  listId: string;
  listTitle: string;
  isLike: boolean;
  otherList: NovelListsSimpleInfos[];
  novel: Novel[];
  userName?: string;
  userImg?: { src: string; position: string };
}
export type Writing = {
  writingId: string;
  userId: string;
  createDate: string;
  writingTitle: string;
  writingImg: string;
  writingDesc: string;
  novelId: string;
  likeNO: number;
  commentNO: number;
  talkOrRecommend: "T" | "R";
  novelGenre: string;
  // ㄴ actually this wasn't considered in src\services\userContent\writings
  // ㄴㄴ but the functions worked well in the file
};
export type WritingWithoutGenre = {
  writingId: string;
  userId: string;
  createDate: string;
  writingTitle: string;
  writingImg?: string;
  writingDesc: string;
  novelId: string;
  likeNO: number;
  commentNO: number;
  talkOrRecommend: "T" | "R";
};
export type Recommend = {
  recommendId: string;
  recommendTitle: string;
  createDate: string;
  likeNO: number;
  novelTitle: string;
  novelImg: string;
  userName?: string;
};
export type Talk = {
  talkId: string;
  talkTitle: string;
  createDate: string;
  likeNO: number;
  commentNO: number;
  novelTitle: string;
  novelImg: string;
  userName?: string;
};

export type Comment = {
  commentId: string;
  writingId: string;
  userId: string;
  novelTitle: string;
  createDate: string;
  commentContent: string;
  parentCommentId: string; // for reComment
  firstAncestorCommentId: string; // for reComment
  reCommentNoForRootComment: number;
  // ㄴnumber of reComments included in certain root comment
  // ㄴif the comment is not root comment, it will be null or 0

  isDeleted: 0 | 1;
  isEdited: 0 | 1;

  // reComment?: Comment[];
  // ㄴused in src\services\writing\getWriting.ts
  // ㄴactually it isn't in DB
};
