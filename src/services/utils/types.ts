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
  novelId?: string;
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
export interface NovelListSetForMyOrOthersList {
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
  originalCommentIdForReComment: string; // if it is not "" empty string, get the info for it
};
