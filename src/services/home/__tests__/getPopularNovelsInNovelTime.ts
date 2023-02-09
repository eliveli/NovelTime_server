import {
  getNovelsByNovelIDs,
  getPopularNovelsFromDB,
} from "../../shared/getPopularNovelsInNovelTime";

jest.mock("../getPopularNovelsInNovelTime", () => {
  const originalModule = jest.requireActual("../getPopularNovelsInNovelTime");
  return {
    __esModule: true,
    ...originalModule,
    getPopularNovelsFromDB: jest.fn().mockResolvedValue([]),
  };
});

it("case not to occur error when passing [] arg to getNovelsByNovelIDs where novelIDs-typed one is expected", async () => {
  const novelIDs = await getPopularNovelsFromDB(true); // it is [] as mock data
  await expect(getNovelsByNovelIDs(novelIDs, true)).rejects.toThrow(Error); // fail
  // Received promise resolved instead of rejected
  // Resolved to value: []

  // const novels = await getNovelsByNovelIDs(novelIDs);
  // console.log("novels:", novels); // novels: []
});
