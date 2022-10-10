import {
  getUserNameAndImg,
  getTalkRank,
  getTalkCommentRank,
  getUserRankByContent,
  getUserRank,
} from "../home";

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

// it("get user rank of writing T", async () => {
//   const userIdRanks = await getTalkRank();
//   console.log("userIdRanks:", userIdRanks);

//   const writing = [];
//   for (const userInfo of userIdRanks) {
//     const { userName, userImgSrc, userImgPosition } = await getUserNameAndImg(userInfo.userId);
//     const count = Number(userInfo["COUNT(*)"]);
//     const rankInfo = {
//       userImg: { src: userImgSrc, position: userImgPosition },
//       userName,
//       count,
//     };
//     writing.push(rankInfo);
//   }
//   console.log("writing:", writing);
// });

// it("get user rank of comment", async () => {
//   const userIdRanks = await getTalkCommentRank();
//   console.log("userIdRanks:", userIdRanks);
// });

it("get user rank of talk like", async () => {
  const userIdRanks = await getUserRankByContent("T", "ReceiveLike");

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
