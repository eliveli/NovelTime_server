export const query = {
  geUserId: " SELECT userId FROM user WHERE userName = (?) ",
  getWritings: " SELECT * FROM writing WHERE userId = (?) ",
  getWritingIDsByUserId: " SELECT writingId FROM writingLike WHERE userId = (?) ",
  getTwoOfNovelListInfoListByUserId: " SELECT * FROM novelList WHERE userId = (?) limit 2",
  getNovelListInfoListByUserId: " SELECT * FROM novelList WHERE userId = (?) ",
  getNovelInfoByNovelId:
    " SELECT novelId, novelImg, novelTitle, novelAuthor, novelGenre, novelIsEnd FROM novelInfo WHERE novelId = (?) ",
  getWritingByWritingId: " SELECT * FROM writing WHERE writingId = (?) ",
  getNovelTitleAndImg: " SELECT novelTitle, novelImg FROM novelInfo WHERE novelId = (?) ",
  getTalkTitle: " SELECT writingTitle FROM writing WHERE writingId = (?) ",
  getComments: " SELECT * FROM comment WHERE userId = (?) ",
};
