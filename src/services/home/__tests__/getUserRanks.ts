import getUserNameAndImg from "../shared/getUserNameAndImg";
import {
  getNovelListRank,
  getTalkCommentRank,
  getUserRankByContent,
  getWritingLikeRank,
  getWritingRank,
} from "../getUserRanks";

// I set the user data as mock to avoid ts error because it can be empty
//  when getting them from DB they may not match each other as I set them temporarily
// for the more, I won't manage the case where data is empty so that I can focus on other works.
//  to treat this I just won't let the data empty in DB later.
jest.mock("../shared/getUserNameAndImg", () =>
  // eslint-disable-next-line implicit-arrow-linebreak
  jest.fn().mockResolvedValue({
    userName: "name",
    userImg: {
      src: "",
      position: "",
    },
  }),
);
jest.mock("../getUserRankOfWritings", () => {
  const originalModule = jest.requireActual("../getUserRankOfWritings");
  return {
    __esModule: true,
    ...originalModule,
    getUserRankByContent: jest.fn().mockResolvedValue([
      { userId: "1", count: 5 },
      { userId: "2", count: 2 },
      { userId: "3", count: 2 },
      { userId: "4", count: 1 },
      { userId: "7", count: 1 },
      { userId: "8", count: 1 },
      { userId: "9", count: 1 },
      // { userId: "10", count: null },
    ]),
  };
});

it("check the async function getting data from DB", async () => {
  console.log("getTalkCommentRank:", await getTalkCommentRank());
  console.log("getWritingRank:", await getWritingRank("R"));
  console.log("getWritingLikeRank:", await getWritingLikeRank("T"));
  console.log("getNovelListRank:", await getNovelListRank());
});

it("get user rank of novel list", async () => {
  const userIdRanks = await getUserRankByContent("L", "Create");

  // when there is any post of recommend
  expect(userIdRanks).not.toBeUndefined();

  if (userIdRanks) {
    const rank = [];
    for (const userInfo of userIdRanks) {
      const { userName, userImg } = await getUserNameAndImg(userInfo.userId);

      const count = Number(userInfo.count);

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
