import { getUserNameAndImg } from "../getWritings";
import { getUserRankByContent } from "../getUserRankOfWritings";

jest.mock("../getWritings", () => {
  const originalModule = jest.requireActual("../getWritings");
  return {
    __esModule: true,
    ...originalModule,
    getUserNameAndImg: jest.fn().mockResolvedValue({
      userName: "userName",
      userImgSrc: "",
      userImgPosition: "",
    }),
  };
});
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

  if (!userIdRanks) return;

  const rank = [];
  for (const userInfo of userIdRanks) {
    const { userName, userImgSrc, userImgPosition } = await getUserNameAndImg(userInfo.userId);

    const count =
      "COUNT(*)" in userInfo ? Number(userInfo["COUNT(*)"]) : Number(userInfo["sum(likeNO)"]); // convert BIGINT to Number (i.e. 6n -> 6)

    const rankInfo = {
      userImg: { src: userImgSrc, position: userImgPosition },
      userName,
      count,
    };
    rank.push(rankInfo);
  }

  console.log("userIdRanks:", rank);
});
