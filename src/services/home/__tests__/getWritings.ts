import getWritings from "../getWritings";

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

it("getWritings", async () => {
  const writings = await getWritings("R");
  console.log("writings:", writings);
});
