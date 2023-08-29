import getWeeklyNovelsFromPlatform from "../../shared/getWeeklyNovelsFromPlatform";

it("get weekly novels in a certain platform", async () => {
  const novels = await getWeeklyNovelsFromPlatform("카카오페이지", 10);
  console.log("novels: ", novels);
});
