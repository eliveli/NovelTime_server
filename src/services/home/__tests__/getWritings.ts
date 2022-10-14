import { Writing } from "../../utils/types";
import getWritings, { composeWritings, getWritingsFromDB } from "../getWritings";

jest.mock("../getWritings", () => {
  const originalModule = jest.requireActual("../getWritings");
  return {
    __esModule: true,
    ...originalModule,
    getWritingsFromDB: jest.fn().mockResolvedValue([]),
  };
});

it("case to return undefined : passing [] to composeWritings", async () => {
  const writings = await getWritingsFromDB("R"); // resolving [] as mock data

  await expect(composeWritings("R", writings)).resolves.toEqual(undefined);
});

it("case to return empty array : user doesn't match one in DB", async () => {
  const writings: Writing[] = [
    {
      writingId: "a",
      userId: "a",
      createDate: "a",
      writingTitle: "a",
      writingImg: "a",
      writingDesc: "a",
      novelId: "a",
      likeNO: 1,
      commentNO: 3,
      talkOrRecommend: "T",
    },
  ];

  await expect(composeWritings("R", writings)).resolves.toEqual([]);
});

it("case to return expected data : getWritings used actually", async () => {
  await expect(getWritings("R")).resolves.toEqual([]); // fail : got specific data in array
});
