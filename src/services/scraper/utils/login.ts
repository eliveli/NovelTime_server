import puppeteer, { ElementHandle } from "puppeteer";

type NovelPlatform = "카카오페이지" | "네이버 시리즈" | "리디북스";

type ScraperType = "new" | "weekly";

async function typeLoginInfo(page: puppeteer.Page) {
  let ridiID: string;
  let ridiPW: string;

  // handle undefined env variable
  if (process.env.RIDI_ID) {
    ridiID = process.env.RIDI_ID;
  } else {
    throw new Error("RIDI_ID env was not set");
  }
  if (process.env.RIDI_PW) {
    ridiPW = process.env.RIDI_PW;
  } else {
    throw new Error("RIDI_PW env was not set");
  }

  await page.waitForSelector("#__next > div > section > div > form > input.fig-w58liu.e1yjg41i0", {
    timeout: 50000,
  });

  await page.type("#__next > div > section > div > form > input.fig-w58liu.e1yjg41i0", ridiID, {
    delay: 100,
  });

  await page.waitForSelector("#__next > div > section > div > form > input.fig-7he7ta.e1yjg41i0");

  await page.type("#__next > div > section > div > form > input.fig-7he7ta.e1yjg41i0", ridiPW, {
    delay: 100,
  });
}

const novelListUrl = {
  // this is for weekly scraper
  // any page in ridi is okay for new scraper
  //   로판 웹소설(장르불문 스크랩 불가) / 성인 작품 제외됨
  ridi: "https://ridibooks.com/category/bestsellers/6050?adult_exclude=y&page=1",
};

// this is necessary to wait for element to load to read
async function waitForProfileIconAfterLogin(page: puppeteer.Page) {
  await page.waitForSelector(
    "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li > a > span",
  );
}

export default async function login(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  scraperType: ScraperType,
) {
  // login for passing 15 age limitation

  if (novelPlatform === "리디북스") {
    await page.goto(novelListUrl.ridi);

    const loginBtn = (await page.waitForSelector(
      "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li:nth-child(2) > a",
    )) as ElementHandle<HTMLAnchorElement>; // wait object load

    // loginBtn null error handling
    if (!loginBtn) {
      throw new Error("login 버튼 null 에러");
    }

    await page.click(
      "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li:nth-child(2) > a",
    ); // click and go to the login page in a current tab/window

    await typeLoginInfo(page);

    await page.click("#__next > div > section > div > form > div > input"); // 로그인상태유지

    await page.click("#__next > div > section > div > form > button"); // click login button

    if (scraperType === "weekly") {
      await waitForProfileIconAfterLogin(page);
    }
  }
}
