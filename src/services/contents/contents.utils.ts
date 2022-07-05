export const query = {
  geUserId: " SELECT userId FROM user WHERE userName = (?) ",
  getWritings: " SELECT * FROM writing WHERE userId = (?) ",
  getComments: " SELECT * FROM comment WHERE userId = (?) ",
};
