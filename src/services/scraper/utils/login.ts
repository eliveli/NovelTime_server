import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { NovelPlatform, ScraperType } from "./types";

dotenv.config();

async function waitAndClickLoginBtn(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  scraperType?: ScraperType,
) {
  if (novelPlatform === "카카오페이지" && scraperType === "weekly") {
    const loginBtn = await page.waitForSelector(
      "#__next > div > div.css-1uny17z-Sticky-PcLayoutHeader > div > div.css-uhicds-PcHeader > div.css-8qyfof-PcHeader > img.css-dqete9-Icon-PcHeader",
    ); // wait object load
    // loginBtn null error handling
    if (!loginBtn) {
      throw new Error("login 버튼 null 에러");
    }

    // declare promise for popup event
    //  eslint-disable-next-line no-promise-executor-return
    const newPagePromise = new Promise((x) => page.once("popup", x));

    await loginBtn.click(); // click, a new tab/window opens

    // declare new tab/window, now you can work with it
    const newPage = (await newPagePromise) as puppeteer.Page;
    return newPage;
  }
  if (novelPlatform === "네이버 시리즈" && scraperType === "weekly") {
    const loginBtn = await page.waitForSelector("#gnb_login_button"); // wait object load

    // loginBtn null error handling
    if (!loginBtn) {
      throw new Error("login 버튼 null 에러");
    }

    await page.click("#gnb_login_button"); // click and go to the login page in a current tab/window
  }
  if (novelPlatform === "리디북스") {
    const loginBtn = await page.waitForSelector(
      "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li:nth-child(2) > a",
    ); // wait object load

    // loginBtn null error handling
    if (!loginBtn) {
      throw new Error("login 버튼 null 에러");
    }

    await page.click(
      "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li:nth-child(2) > a",
    ); // click and go to the login page in a current tab/window
  }
}
async function typeLoginInfo(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  scraperType?: ScraperType,
) {
  if (novelPlatform === "카카오페이지" && scraperType === "weekly") {
    let kakaoID: string;
    let kakaoPW: string;

    // handle undefined env variable
    if (process.env.KAKAO_ID) {
      kakaoID = process.env.KAKAO_ID;
    } else {
      throw new Error("KAKAO_ID env was not set");
    }
    if (process.env.KAKAO_PW) {
      kakaoPW = process.env.KAKAO_PW;
    } else {
      throw new Error("KAKAO_PW env was not set");
    }

    // sometimes it can not work (when playing video or running DBeaver)
    //  It seems to occur when there are many processes in my computer
    await page.waitForSelector("#input-loginKey", { timeout: 50000 });

    await page.type("#input-loginKey", kakaoID);

    await page.waitForSelector("#input-password");

    await page.type("#input-password", kakaoPW);
  }

  if (novelPlatform === "네이버 시리즈" && scraperType === "weekly") {
    let seriesID: string;
    let seriesPW: string;

    // handle undefined env variable
    if (process.env.SERIES_ID) {
      seriesID = process.env.SERIES_ID;
    } else {
      throw new Error("SERIES_ID env was not set");
    }
    if (process.env.SERIES_PW) {
      seriesPW = process.env.SERIES_PW;
    } else {
      throw new Error("SERIES_PW env was not set");
    }

    await page.waitForSelector("#id", { timeout: 50000 });

    // sometimes not all characters of login id is typed
    //  I guess it's because there are many other process (but I'm not sure)
    await page.type("#id", seriesID, { delay: 100 });

    await page.waitForSelector("#pw");

    await page.type("#pw", seriesPW, { delay: 100 });
  }

  if (novelPlatform === "리디북스") {
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

    await page.waitForSelector(
      "#__next > div > section > div > form > input.fig-w58liu.e1yjg41i0",
      {
        timeout: 50000,
      },
    );

    await page.type("#__next > div > section > div > form > input.fig-w58liu.e1yjg41i0", ridiID, {
      delay: 100,
    });

    await page.waitForSelector("#__next > div > section > div > form > input.fig-7he7ta.e1yjg41i0");

    await page.type("#__next > div > section > div > form > input.fig-7he7ta.e1yjg41i0", ridiPW, {
      delay: 100,
    });
  }
}

const selectorProfileIcon = {
  // following is for weekly scraper
  kakape:
    "#__next > div > div.css-1uny17z-Sticky-PcLayoutHeader > div > div.css-uhicds-PcHeader > div.css-8qyfof-PcHeader > div",
  // following is for weekly scraper
  series: "#gnb_my_namebox",
  ridi: "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li > a > span",
};
// this is necessary to wait for element to load to read
async function waitForProfileIconAfterLogin(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  scraperType?: ScraperType,
) {
  if (novelPlatform === "카카오페이지") {
    await page.waitForSelector(selectorProfileIcon.kakape);
  }
  if (novelPlatform === "네이버 시리즈") {
    await page.waitForSelector(selectorProfileIcon.series);
  }
  if (novelPlatform === "리디북스") {
    await page.waitForSelector(selectorProfileIcon.ridi);
  }
}

// login for passing 15 age limitation
export default async function login(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  scraperType?: ScraperType,
) {
  if (novelPlatform === "카카오페이지" && scraperType === "weekly") {
    // await page.goto(novelListUrl, { waitUntil: "load", timeout: 500000 });
    // set timeout specifically for navigational events such as page.waitForSelector

    const newPage = await waitAndClickLoginBtn(page, novelPlatform, scraperType);

    if (!newPage) return;

    await typeLoginInfo(newPage, novelPlatform, scraperType);

    await newPage.click(
      "#mainContent > div > div > form > div.set_login > div > label > span.ico_comm.ico_check",
    ); // click 로그인상태유지

    // click login button
    await newPage.click(
      "#mainContent > div > div > form > div.confirm_btn > button.btn_g.highlight",
    ); // submit

    await waitForProfileIconAfterLogin(page, novelPlatform, scraperType);
  }

  if (novelPlatform === "네이버 시리즈" && scraperType === "weekly") {
    await waitAndClickLoginBtn(page, novelPlatform, scraperType);

    await typeLoginInfo(page, novelPlatform, scraperType);

    await page.click("#keep"); // 로그인상태유지

    await page.click("#log\\.login"); // click login button

    await page.waitForSelector("#new\\.save");
    await page.click("#new\\.save"); // 자주 사용하는 기기 등록

    await waitForProfileIconAfterLogin(page, novelPlatform, scraperType);
  }

  if (novelPlatform === "리디북스") {
    await waitAndClickLoginBtn(page, novelPlatform, scraperType);

    await typeLoginInfo(page, novelPlatform);

    await page.click("#__next > div > section > div > form > div > input"); // 로그인상태유지

    await page.click("#__next > div > section > div > form > button"); // click login button
  }
}
