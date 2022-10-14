import getNovelListsOfUsers, {
  composeNovelLists,
  getNovelListsOfUsersFromDB,
} from "../getNovelListsOfUsers";

jest.mock("../getNovelListsOfUsers", () => {
  const originalModule = jest.requireActual("../getNovelListsOfUsers");
  return {
    __esModule: true,
    ...originalModule,
    getNovelListsOfUsersFromDB: jest.fn().mockResolvedValue([]),
  };
});

it("case to return undefined : passing [] to composeNovelLists", async () => {
  const novelLists = await getNovelListsOfUsersFromDB(); // resolving [] as mock data

  await expect(composeNovelLists(novelLists)).resolves.toEqual(undefined);
});

it("case to return empty array : user doesn't match one in DB", async () => {
  const novelLists = [
    {
      userId: "1",
      novelListId: "1",
      novelListTitle: "1",
      novelIDs: "1 2 3",
    },
  ];

  await expect(composeNovelLists(novelLists)).resolves.toEqual([]);
});

it("case to return expected data : getNovelListsOfUsers used actually", async () => {
  await expect(getNovelListsOfUsers()).resolves.toEqual([]); // fail : got specific data in array
});
