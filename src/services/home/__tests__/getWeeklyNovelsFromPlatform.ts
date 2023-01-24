import getWeeklyNovelsInPlatform from "../getWeeklyNovelsFromPlatform";

it("get weekly novels in a certain platform", async () => {
  const novels = await getWeeklyNovelsInPlatform("카카오페이지");
  console.log("novels: ", novels);
});
