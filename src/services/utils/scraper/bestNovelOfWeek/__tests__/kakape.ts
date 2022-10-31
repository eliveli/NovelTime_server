import weeklyKakape from "../kakape";

jest.setTimeout(500000);
it("case to run properly :", async () => {
  await weeklyKakape();
});
