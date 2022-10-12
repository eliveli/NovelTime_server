import getUserNameAndImg from "../shared/getUserNameAndImg";
import { getUserRankByContent } from "../getUserRankOfWritings";

// I set the user data as mock to avoid ts error because it can be empty
//  when getting them from DB they may not match each other as I set them temporarily
// for the more, I won't manage the case where data is empty so that I can focus on other works.
//  to treat this I just won't let the data empty in DB later.
jest.mock("../shared/getUserNameAndImg", () =>
  // eslint-disable-next-line implicit-arrow-linebreak
  jest.fn().mockResolvedValue({
    userName: "name",
    userImgSrc: "",
    userImgPosition: "",
  }),
);
jest.mock("../getUserRankOfWritings", () => {
  const originalModule = jest.requireActual("../getUserRankOfWritings");
  return {
    __esModule: true,
    ...originalModule,
    getUserRankByContent: jest.fn().mockResolvedValue([
      { userId: "1", "sum(likeNO)": 5 },
      { userId: "2", "sum(likeNO)": 2 },
      { userId: "3", "sum(likeNO)": 2 },
      { userId: "4", "sum(likeNO)": 1 },
      { userId: "7", "sum(likeNO)": 1 },
      { userId: "8", "sum(likeNO)": 1 },
      { userId: "9", "sum(likeNO)": 1 },
      { userId: "10", "sum(likeNO)": null },
    ]),
  };
});

it("get user rank of recommend like", async () => {
  const userIdRanks = await getUserRankByContent("R", "ReceiveLike");

  // when there is any post of recommend
  expect(userIdRanks).not.toBeUndefined();

  if (userIdRanks) {
    const rank = [];
    for (const userInfo of userIdRanks) {
      const { userName, userImg } = await getUserNameAndImg(userInfo.userId);

      const count =
        "COUNT(*)" in userInfo ? Number(userInfo["COUNT(*)"]) : Number(userInfo["sum(likeNO)"]); // convert BIGINT to Number (i.e. 6n -> 6)

      const rankInfo = {
        userImg,
        userName,
        count,
      };
      rank.push(rankInfo);
    }
    console.log("userIdRanks:", rank);
  }
});
