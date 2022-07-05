export const query = {
  geUserId: " SELECT userId FROM user WHERE userName = (?) ",
  getWritings: " SELECT * FROM writing WHERE userId = (?) ",
  getNovelTitleAndImg: " SELECT novelTitle, novelImg FROM novelInfo WHERE novelId = (?) ",
  getTalkTitle: " SELECT writingTitle FROM writing WHERE writingId = (?) ",
  getComments: " SELECT * FROM comment WHERE userId = (?) ",
};
