import { getUserRankByContent, setRankWithUserInfo } from "../getUserRanks";

it("case to return expected data : getUserRankByContent", async () => {
  expect(async () => await getUserRankByContent("L", "ReceiveLike")).not.toThrow();
  // console.log("userIdRanks: ", await getUserRankByContent("L", "ReceiveLike"));
});

it("case to return expected data : passing specific argument to setRankWithUserInfo", async () => {
  const userIdRanks = [
    { userId: "1", count: 5n },
    { userId: "2", count: 2n },
    { userId: "3", count: 2n },
    { userId: "4", count: 1n },
    { userId: "7", count: 1n },
    { userId: "8", count: 1n },
    { userId: "9", count: 1n },
  ];
  expect(async () => await setRankWithUserInfo(userIdRanks)).not.toThrow();
});

jest.mock("../getUserRanks", () => {
  const originalModule = jest.requireActual("../getUserRanks");
  return {
    __esModule: true,
    ...originalModule,
    getUserRankByContent: jest.fn().mockResolvedValue([]),
  };
});
it("case to return undefined : passing [] to setRankWithUserInfo", async () => {
  const userIdRanks = await getUserRankByContent("L", "Create"); // resolving data is []

  await expect(setRankWithUserInfo(userIdRanks)).resolves.toEqual(undefined);
});
