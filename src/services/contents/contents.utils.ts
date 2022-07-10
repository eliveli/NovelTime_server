/* eslint-disable import/prefer-default-export */
export const query = {
  geUserId: " SELECT userId FROM user WHERE userName = (?) ",
  getUserNameByUserId: " SELECT userName FROM user WHERE userId = (?) ",
  getWritings: " SELECT * FROM writing WHERE userId = (?) ",
  getTalksOrRecommendsByUserId:
    " SELECT * FROM writing WHERE userId = (?) and talkOrRecommend = (?) ",
  getWritingIDsByUserId: " SELECT writingId FROM writingLike WHERE userId = (?) ",

  getUserNameAndImgByUserId:
    " SELECT userName, userImgSrc, userImgPosition FROM user WHERE userId = (?) ",

  getTwoOfNovelListInfoListByUserId: " SELECT * FROM novelList WHERE userId = (?) limit 2",
  getAllOfNovelListInfoListByUserId: " SELECT * FROM novelList WHERE userId = (?) ",

  getTwoOfNovelListIDsByUserId: " SELECT novelListId FROM novelListLike WHERE userId = (?) limit 2",
  getAllOfNovelListIDsByUserId: " SELECT novelListId FROM novelListLike WHERE userId = (?) ",

  getNovelListInfoByListId: " SELECT * FROM novelList WHERE novelListId = (?) ",

  getNovelInfoByNovelId:
    " SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?) ",
  getWritingByWritingId: " SELECT * FROM writing WHERE writingId = (?) ",
  getTalksOrRecommendsByWritingId:
    " SELECT * FROM writing WHERE writingId = (?) and talkOrRecommend = (?)",
  getNovelTitleAndImg: " SELECT novelTitle, novelImg FROM novelInfo WHERE novelId = (?) ",
  getTalkTitle: " SELECT writingTitle FROM writing WHERE writingId = (?) ",
  getComments: " SELECT * FROM comment WHERE userId = (?) ",
};
