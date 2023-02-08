import writingHomeService from "../home";

function matchPlatformName(platformGiven: string) {
  if (platformGiven === "kakape") return "카카오페이지";
  if (platformGiven === "series") return "네이버 시리즈";
  if (platformGiven === "ridi") return "리디북스";
  if (platformGiven === "joara") return "조아라";

  throw Error("플랫폼 선택 오류");
}

export default async function getWeeklyNovelsForHomeOrListPage(
  platform: string,
  isForHome: boolean,
) {
  const platformGiven = matchPlatformName(platform);

  return await writingHomeService.getWeeklyNovelsFromPlatform(platformGiven, isForHome);
}
