import getUserNameAndImg from "../shared/getUserNameAndImg";
import {
  getNovelListLikeRank,
  getNovelListRank,
  getTalkCommentRank,
  getUserRankByContent,
  getUserWhoCreatedNovelList,
  getWritingLikeRank,
  getWritingRank,
  setRankWithUserInfo,
} from "../getUserRanks";

// I set the user data as mock to avoid ts error because it can be empty
//  when getting them from DB they may not match each other as I set them temporarily
// for the more, I won't manage the case where data is empty so that I can focus on other works.
//  to treat this I just won't let the data empty in DB later.
jest.mock("../shared/getUserNameAndImg", () =>
  jest.fn().mockResolvedValue({
    userName: "name",
    userImg: {
      src: "",
      position: "",
    },
  }),
);
// jest.mock("../getUserRanks", () => {
//   const originalModule = jest.requireActual("../getUserRanks");
//   return {
//     __esModule: true,
//     ...originalModule,
//     getUserRankByContent: jest.fn().mockResolvedValue([
//       { userId: "1", count: 5 },
//       { userId: "2", count: 2 },
//       { userId: "3", count: 2 },
//       { userId: "4", count: 1 },
//       { userId: "7", count: 1 },
//       { userId: "8", count: 1 },
//       { userId: "9", count: 1 },
//       // { userId: "10", count: null },
//     ]),
//   };
// });

it("check the async function getting data from DB", async () => {
  // console.log("getUserRankByContent: ", await getUserRankByContent("L", "ReceiveLike"));
  const data = [
    { userId: "google 10538702026809916146", count: 2n },
    { userId: "google 105387020268099161469", count: 1n },
    { userId: "kakao ecani2@naver.com", count: 1n },
  ];
  console.log("setRankWithUserInfo: ", await setRankWithUserInfo(data));
});

// it("get user rank of novel list", async () => {
//   const userIdRanks = await getUserRankByContent("L", "Create");

//   // when there is any post of recommend
//   expect(userIdRanks).not.toBeUndefined();

//   if (userIdRanks) {
//     const rank = [];
//     for (const userInfo of userIdRanks) {
//       const { userName, userImg } = await getUserNameAndImg(userInfo.userId);

//       const count = Number(userInfo.count);

//       const rankInfo = {
//         userImg,
//         userName,
//         count,
//       };
//       rank.push(rankInfo);
//     }
//     console.log("userIdRanks:", rank);
//   }
// });
