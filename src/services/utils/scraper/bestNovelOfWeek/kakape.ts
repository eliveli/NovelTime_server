import puppeteer from "puppeteer";
import getCurrentTime from "../novel/getCurrentTime";

// 각 플랫폼에서 주간베스트 소설 20개 씩 가져오기

export default async function weeklyKakape() {
  const browser = await puppeteer.launch({
    headless: true, // 브라우저 화면 열려면 false
  });

  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  const novelListUrl =
    "https://page.kakao.com/menu/11/screen/16?subcategory_uid=0&ranking_type=weekly";

  await page.goto(novelListUrl);
  page.setDefaultTimeout(10000);

  // 로그인 필요! 15세 이용가 작품이 베스트인 경우
  //

  const selectorsOfNovelPage = {
    img: "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-4z4dsn-ContentMainPcContainer > div.css-6wrvoh-ContentMainPcContainer > div.css-dwn26i > div > div.css-0 > div.css-1p0xvye-ContentOverviewThumbnail > div > div > img",
    title:
      "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-4z4dsn-ContentMainPcContainer > div.css-6wrvoh-ContentMainPcContainer > div.css-dwn26i > div > div.css-0 > div.css-6vpm3i-ContentOverviewInfo > span",
    desc: "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-1m11tvk-ContentMainPcContainer > div.css-1hq49jx-ContentDetailTabContainer > div.css-t3lp6q-ContentTitleSection-ContentDetailTabContainer > span",
    age: "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-1m11tvk-ContentMainPcContainer > div.css-1hq49jx-ContentDetailTabContainer > div.css-9rge6r > div:nth-child(1) > div.css-1luchs4-ContentDetailTabContainer > div:nth-child(3) > div",
    author:
      "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-1m11tvk-ContentMainPcContainer > div.css-1hq49jx-ContentDetailTabContainer > div.css-9rge6r > div:nth-child(2) > div.css-1luchs4-ContentDetailTabContainer > div > div",
    genre:
      "#__next > div > div.css-gqvt86-PcLayout > div.css-oezh2b-ContentMainPage > div.css-4z4dsn-ContentMainPcContainer > div.css-6wrvoh-ContentMainPcContainer > div.css-dwn26i > div > div.css-0 > div.css-6vpm3i-ContentOverviewInfo > div.css-1ao35gu-ContentOverviewInfo > span:nth-child(9)",
  };

  async function getNovelUrls() {
    let bestNo = 1;
    const novelUrls = [];
    while (bestNo < 21) {
      const novelElement = await page.waitForSelector(
        `#__next > div > div.css-gqvt86-PcLayout > div.css-58idf7-Menu > div.css-1dqbyyp-Home > div > div > div.css-1k8yz4-StaticLandingRanking > div > div > div > div:nth-child(${bestNo}) > div > div > a`,
      );
      const novelUrl: string = await page.evaluate(
        (novelElement) => novelElement.getAttribute("href"),
        novelElement,
      );

      novelUrls.push(novelUrl);

      bestNo += 1;
    }
    return novelUrls;
  }

  async function getInfo(
    selector: string,
    instruction: "attr" | "html" | undefined = undefined,
    attributeName = "",
  ) {
    const infoElement = await page.waitForSelector(selector);
    const info: string = await page.evaluate((infoElement) => {
      if (instruction === "attr") {
        return infoElement.getAttribute(attributeName);
      }

      if (instruction === "html") {
        return infoElement.innerHTML;
      }

      return infoElement.innerText;
    }, infoElement);
    return info;
  }

  //  -- check novel image in db and make sure that img is saved as small size in DB
  //     to reduce time when downloading image
  //     only send image as big size when it is needed especially when showing the full image
  //       to do remove the following in the end of the img src when needed : "&filename=th3"
  //

  async function setGenre(novelTitle: string) {
    if (novelTitle.includes("[BL]")) {
      return "BL";
    }
    return await getInfo(selectorsOfNovelPage.genre);
  }

  async function getNovel(novelUrl: string) {
    await page.goto(`page.kakao.com${novelUrl}?tab_type=about`);

    // DB에 있는 소설인지 확인 필요.

    // DB 테이블 추가 : 주간 베스트
    // - set primary key as novel id
    //   get novel info from novelInfo table

    const novelTitle = await getInfo(selectorsOfNovelPage.title);

    const novel = {
      novelId: getCurrentTime(),

      novelImg: await getInfo(selectorsOfNovelPage.img, "attr", "src"),

      novelTitle,

      novelDesc: await getInfo(selectorsOfNovelPage.desc, "html"),

      novelAuthor: await getInfo(selectorsOfNovelPage.author),

      novelAge: await getInfo(selectorsOfNovelPage.age),

      novelGenre: await setGenre(novelTitle),

      novelIsEnd: "boolean;",

      novelPlatform: "카카오페이지",

      novelUrl: `page.kakao.com${novelUrl}`,
    };
    return novel;
  }

  async function getNovels(novelUrls: string[]) {
    let novelNo = 1;
    const novels = [];

    while (novelUrls.length !== 0) {
      const novel = await getNovel(novelUrls[novelNo - 1]);

      novels.push(novel);

      novelUrls.shift();
      novelNo += 1;
    }

    return novels;
  }

  const novelUrls = await getNovelUrls();
  const novels = await getNovels(novelUrls);

  await context.close(); // 시크릿창 닫기
  await browser.close(); // 브라우저 닫기

  return novels;
}
