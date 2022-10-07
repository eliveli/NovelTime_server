import { getUserNameAndImg, getTalkRank } from "../home";

jest.mock("../home", () => {
  const originalModule = jest.requireActual("../home");
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

it("get user rank of writing T", async () => {
  const userIdRanks = await getTalkRank();
  console.log("userIdRanks:", userIdRanks);

  const writing = [];
  for (const userInfo of userIdRanks) {
    const { userName, userImgSrc, userImgPosition } = await getUserNameAndImg(userInfo.userId);
    const count = Number(userInfo["COUNT(*)"]);
    const rankInfo = {
      userImg: { src: userImgSrc, position: userImgPosition },
      userName,
      count,
    };
    writing.push(rankInfo);
  }
  console.log("writing:", writing);
});
