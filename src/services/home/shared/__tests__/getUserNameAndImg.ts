import { getUserNameAndImgFromDB } from "../getUserNameAndImg";

jest.mock("../getUserNameAndImg", () => {
  const originalModule = jest.requireActual("../getUserNameAndImg");
  return {
    __esModule: true,
    ...originalModule,
    getUserNameAndImgFromDB: jest.fn().mockResolvedValue(undefined),
  };
});

it("case to return undefined : in function getUserNameAndImg : receiving undefined from getUserNameAndImgFromDB", async () => {
  async function getUserNameAndImg() {
    const user = await getUserNameAndImgFromDB("id"); // resolving undefined as mock data
    if (!user) return;

    return {
      userName: user.userName,
      userImg: { src: user.userImgSrc, position: user.userImgPosition },
    };
  }
  await expect(getUserNameAndImg()).resolves.toEqual(undefined);
});
