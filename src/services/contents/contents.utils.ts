export const query = {
  geUserId: " SELECT userId FROM user WHERE userName = (?) ",
  getWritings: " SELECT * FROM writing WHERE userId = (?) ",
  getWritingIDsByUserId: " SELECT writingId FROM writingLike WHERE userId = (?) ",
  getNovelListInfoListByUserId: " SELECT * FROM novelList WHERE userId = (?) ",
  getNovelInfoByNovelId: " SELECT * FROM novelInfo WHERE novelId = (?) ",
  getWritingByWritingId: " SELECT * FROM writing WHERE writingId = (?) ",
  getNovelTitleAndImg: " SELECT novelTitle, novelImg FROM novelInfo WHERE novelId = (?) ",
  getTalkTitle: " SELECT writingTitle FROM writing WHERE writingId = (?) ",
  getComments: " SELECT * FROM comment WHERE userId = (?) ",
};
