import puppeteer from "puppeteer";
import dotenv from "dotenv";
import { NovelPlatform } from "./types";

dotenv.config();

function getLoginSelector(novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    return "#__next > div > div > div > div > div > img.active\\:opacity-30.cursor-pointer.pr-16pxr";
  }

  if (novelPlatform === "네이버 시리즈") {
    return "#gnb_login_button";
  }

  if (novelPlatform === "리디북스") {
    return "#__next > div.fig-16izi9a > div.fig-fs8jml > div > ul.fig-1aswo17 > li:nth-child(2) > a";
  }

  if (novelPlatform === "조아라") {
    return "#root > div > div.gnb > div.pc-util-nav > ul > li:nth-child(1) > a";
  }

  throw Error("error when getting login selector");
}

async function waitAndClickLoginBtn(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  const loginSelector = getLoginSelector(novelPlatform);

  const loginBtn = await page.waitForSelector(loginSelector); // wait object load

  if (novelPlatform === "카카오페이지") {
    if (!loginBtn) {
      // loginBtn null error handling
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

  if (novelPlatform === "네이버 시리즈") {
    // following login process doesn't always work //
    await page.evaluate(
      async (selector) => await document.querySelector(selector).click(),
      loginSelector,
    ); // inner async and await are required
    // "page.click(selector)" doesn't always work for series

    return page;
  }

  // for ridi, joara
  await page.click(loginSelector); // click and go to the login page in a current tab/window
  return page;
}

function getIDandPW(novelPlatform: NovelPlatform) {
  let platformID = "";
  let platformPW = "";

  // handle undefined env variable
  if (novelPlatform === "카카오페이지" && process.env.KAKAO_ID && process.env.KAKAO_PW) {
    platformID = process.env.KAKAO_ID;
    platformPW = process.env.KAKAO_PW;
  }

  if (novelPlatform === "네이버 시리즈" && process.env.SERIES_ID && process.env.SERIES_PW) {
    platformID = process.env.SERIES_ID;
    platformPW = process.env.SERIES_PW;
  }

  if (novelPlatform === "리디북스" && process.env.RIDI_ID && process.env.RIDI_PW) {
    platformID = process.env.RIDI_ID;
    platformPW = process.env.RIDI_PW;
  }

  if (novelPlatform === "조아라" && process.env.JOARA_ID && process.env.JOARA_PW) {
    platformID = process.env.JOARA_ID;
    platformPW = process.env.JOARA_PW;
  }

  if (!(platformID && platformPW)) {
    throw new Error("env for ID or PW was not set");
  }

  return { platformID, platformPW };
}

function getSelectorOfIDandPW(novelPlatform: NovelPlatform) {
  let idSelector = "";
  let pwSelector = "";

  if (novelPlatform === "카카오페이지") {
    idSelector = "#input-loginKey";
    pwSelector = "#input-password";
  }

  if (novelPlatform === "네이버 시리즈") {
    idSelector = "#id";
    pwSelector = "#pw";
  }

  if (novelPlatform === "리디북스") {
    idSelector = "#__next > div > section > div > form > input.fig-w58liu.e1yjg41i0";
    pwSelector = "#__next > div > section > div > form > input.fig-7he7ta.e1yjg41i0";
  }

  if (novelPlatform === "조아라") {
    idSelector = "#root > div > div > div > div.input-group > input[type=text]:nth-child(1)";
    pwSelector = "#root > div > div > div > div.input-group > input[type=password]:nth-child(2)";
  }

  if (!(idSelector && pwSelector)) {
    throw new Error("selector for ID or PW was not set");
  }

  return { idSelector, pwSelector };
}

async function typeLoginInfo(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  const { idSelector, pwSelector } = getSelectorOfIDandPW(novelPlatform);
  const { platformID, platformPW } = getIDandPW(novelPlatform);

  // id //
  await page.waitForSelector(idSelector);
  await page.click(idSelector);
  await page.keyboard.type(platformID);

  // pw //
  await page.waitForSelector(pwSelector);
  await page.click(pwSelector);
  await page.keyboard.type(platformPW);
}

function getProfileIcon(novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    return "#__next > div > div > div > div > div > div > div > div > img";
  }

  if (novelPlatform === "네이버 시리즈") {
    return "#gnb_my_namebox";
  }

  if (novelPlatform === "리디북스") {
    // this icon is for both login user and non-login user
    return "#__next > div.fig-193ya7q > header > nav > div.fig-1r8dvo7 > div:nth-child(2) > div:nth-child(4) > a";
  }

  if (novelPlatform === "조아라") {
    return "#root > div > div.gnb > div.pc-util-nav > ul > li:nth-child(1) > a";
  }

  throw Error("can't get selector for profile icon");
}

// this is necessary to wait for element to load to read
async function waitForProfileIconAfterLogin(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  const profileIcon = getProfileIcon(novelPlatform);

  await page.waitForSelector(profileIcon);
}

function getSubmitBtnForLogin(novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    return "#mainContent > div > div > form > div.confirm_btn > button.btn_g.highlight";
  }
  if (novelPlatform === "네이버 시리즈") {
    return "#log\\.login";
  }
  if (novelPlatform === "리디북스") {
    return "#__next > div > section > div > form > button";
  }
  if (novelPlatform === "조아라") {
    return "#root > div > div > div > button";
  }

  throw Error("can't get submit button for login");
}
// login to pass age limitation
//  :  age 15 for kakape, 19 for all platforms
export default async function login(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  const submitBtn = getSubmitBtnForLogin(novelPlatform);

  // only kakape requires new page for login
  const pageForLogin = await waitAndClickLoginBtn(page, novelPlatform);

  if (novelPlatform === "카카오페이지" && !pageForLogin) {
    throw Error("can't get new page for login for kakape");
  }

  await typeLoginInfo(pageForLogin, novelPlatform);

  await pageForLogin.click(submitBtn);

  if (novelPlatform === "네이버 시리즈") {
    await pageForLogin.waitForSelector("#new\\.save");
    await pageForLogin.click("#new\\.save"); // 자주 사용하는 기기 등록
  }

  await waitForProfileIconAfterLogin(page, novelPlatform);
}
