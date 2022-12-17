import puppeteer from "puppeteer";
import login from "../utils/login";
import minimalArgs from "../utils/minimalArgsToLaunch";
import seeNovelListWithCardForRidi from "../utils/seeNovelListWithCardForRidi";
import { NovelPlatform } from "../utils/types";
import goToNewNovelListPage from "./utils/goToNewNovelListPage";
import setNovels from "./utils/setNovels";

let isGenreLoopEnd = false; // 전체 카테고리별 목록페이지 조회완료 여부

// this is for series
let totalPageNO = 1; // 전체 페이지 수

// this is for ridi
const totalPageNoList: number[] = []; // 필터 별 전체 페이지 수(참고용)

let currentPageNO = 1; // 현재 페이지 넘버
let totalNovelNO = 1; // 전체 작품 수
let currentNovelNO = 1; // 현재 작품 넘버

let novelUrls: string[];

// this is for ridi------------------------------------------------------------------------------
// in order to read dom elements from page
async function waitForFirstNovelElement(page: puppeteer.Page) {
  await page.waitForSelector(
    "#__next > main > div > section > ul > li:nth-child(1) > div > div > div > h3 > a",
  );
}
async function loadNovelList(page: puppeteer.Page) {
  await waitForFirstNovelElement(page);

  // to load elements
  for (let i = 1; i < 16; i += 1) {
    await page.keyboard.press("PageDown", { delay: 100 });
  }
}

function setTotalNOsOfPageAndNovel(novelNO: number) {
  // 직전 페이지가 마지막 페이지일 때
  if (novelNO === 1) {
    totalPageNoList.push(currentPageNO - 1); // 해당 필터의 전체 페이지 수 표시
    totalNovelNO += (currentPageNO - 1) * 60; // 전체 작품 수에 해당 필터의 작품 수 추가
  }
  // 현재 페이지가 마지막 페이지일 때
  if (novelNO !== 1) {
    totalPageNoList.push(currentPageNO); // 해당 필터의 전체 페이지 수 표시
    totalNovelNO += (currentPageNO - 1) * 60 + (novelNO - 1); // 전체 작품 수에 해당 필터의 작품 수 추가
  }

  console.log("totalPageNoList: ", totalPageNoList, " totalNovelNO: ", totalNovelNO);
}

//-------------------------------------------------------------------------------------------------

// this is for series-------------------------------------------------------------------------
async function calcTotalNovelAndPageNO(page: puppeteer.Page) {
  // 총 작품 수 구하기
  const regex = /[^0-9]/g; // 숫자가 아닌 문자열을 선택하는 정규식
  const noElement = await page.waitForSelector("#content > div > div > div.total");
  //
  // 확인!!!! 얘를 string으로 읽으려나 number로 읽으려나. 추구 확인 후 다루기
  const novelNOfromPage = await page.evaluate((element) => element.textContent, noElement);
  totalNovelNO = novelNOfromPage.replace(regex, ""); // 총 작품 수

  // 총 페이지 수 구하기
  const calcTotalPageNO: number = Math.floor(totalNovelNO / 25);
  totalPageNO = totalNovelNO % 25 !== 0 ? calcTotalPageNO + 1 : calcTotalPageNO;
}

// console.log(totalPageNO, "totalPageNO", totalNovelNO, "totalNovelNO");

async function getNovelNoOfLastPage(page: puppeteer.Page) {
  const listOfLastPage = await page.waitForSelector("#content > div > ul");
  return (await page.evaluate((lastList) => lastList.childElementCount, listOfLastPage)) as number;
}

//-------------------------------------------------------------------------------------------------

async function getNovelUrl(page: puppeteer.Page, novelPlatform: NovelPlatform, novelNO: number) {
  if (novelPlatform === "네이버 시리즈") {
    const urlElement = await page.waitForSelector(
      `#content > div > ul > li:nth-child(${novelNO}) > div > h3 > a`,
    );
    const novelURL = (await page.evaluate(
      (element) => element.getAttribute("href"),
      urlElement,
    )) as string;

    return novelURL;
  }

  if (novelPlatform === "리디북스") {
    const urlElement = await page.waitForSelector(
      `#__next > main > div > section > ul > li:nth-child(${String(
        novelNO,
      )}) > div > div > div > h3 > a`,
    );

    const novelURLunClean = (await page.evaluate(
      (element) => element.getAttribute("href"),
      urlElement,
    )) as string;

    return novelURLunClean.slice(0, novelURLunClean.indexOf("?")); // url : "?" 부터 문자 제외
  }
}

async function getNovelUrlsForRidi(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNOs: string[],
) {
  const tempNovelUrls: string[] = [];

  // search from each category
  genreLoop: for (let ctgIdx = 0; ctgIdx < genreNOs.length; ctgIdx += 1) {
    await goToNewNovelListPage(page, novelPlatform, genreNOs[ctgIdx], currentPageNO);

    if (currentPageNO === 1) {
      await seeNovelListWithCardForRidi(page);
    }

    // 장르 내 목록 페이지 조회 반복
    while (true) {
      console.log(currentPageNO, "현재 페이지 번호");

      // 각 페이지에서 작품 url 가져오기
      for (let novelNO = 1; novelNO < 61; novelNO += 1) {
        try {
          await loadNovelList(page);

          const novelUrl = await getNovelUrl(page, novelPlatform, novelNO);
          if (!novelUrl) return;

          tempNovelUrls.push(novelUrl);

          console.log("noveNO: ", novelNO, " novelUrl: ", novelUrl);
        } catch (err) {
          console.log(err, "읽어올 작품이 더 없을 확률 높음");

          // 읽어올 작품이 더 없을 때 현재 필터의 조회 종료
          setTotalNOsOfPageAndNovel(novelNO);

          currentPageNO = 1;

          continue genreLoop; // 다음 장르 조회
        }
      }
      // 다음 페이지 이동
      currentPageNO += 1;
      await goToNewNovelListPage(page, novelPlatform, genreNOs[ctgIdx], currentPageNO);
      await waitForFirstNovelElement(page);
    }
  }

  return tempNovelUrls;
}

async function getNovelUrlsForSeries(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNO: string,
) {
  const tempNovelUrls: string[] = [];

  // 목록 페이지 조회 반복
  while (currentPageNO <= totalPageNO) {
    console.log(currentPageNO, "현재 페이지 번호");

    let novelNoOfLastPage = 1;

    // 마지막 페이지 작품 수
    if (currentPageNO === totalPageNO) {
      novelNoOfLastPage = await getNovelNoOfLastPage(page);
    }

    // 목록에서 각 작품 정보(url) 가져오기
    for (let novelNO = 1; novelNO < 26; novelNO += 1) {
      // 마지막페이지 작품 수가 25보다 작을 때 루프 탈출
      if (currentPageNO === totalPageNO && novelNoOfLastPage < novelNO) break;

      const novelUrl = await getNovelUrl(page, novelPlatform, novelNO);
      if (!novelUrl) return;

      tempNovelUrls.push(novelUrl);
      // console.log(novelList[novelNO - 1], "novel", novelNO);
    }

    // 다음 페이지 이동
    currentPageNO += 1;

    if (currentPageNO > totalPageNO) break;

    await goToNewNovelListPage(page, novelPlatform, genreNO, currentPageNO);
  }

  return tempNovelUrls;
}

async function getNovelUrls(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNO: string[] | string,
) {
  if (novelPlatform === "네이버 시리즈" && typeof genreNO === "string") {
    return await getNovelUrlsForSeries(page, novelPlatform, genreNO);
  }
  if (novelPlatform === "리디북스" && typeof genreNO === "object") {
    return await getNovelUrlsForRidi(page, novelPlatform, genreNO);
  }
}

export default async function newScraper(novelPlatform: NovelPlatform, genreNO: string | string[]) {
  const browser = await puppeteer.launch({
    headless: false, // 브라우저 화면 열려면 false
    args: minimalArgs, // it may be removed later
  });

  // 반복. 브라우저 컨텍스트 열고 닫기. out of memory 방지
  // 시크릿창. 캐시나 쿠키 등을 공유하지 않음.
  // <중요> puppeteer.launch({headless:true}) 설정해야 context.close()로 브라우저 데이터 지울 수 있음.
  while (true) {
    const context = await browser.createIncognitoBrowserContext(); // 시크릿창 열기
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    // 장르 내 소설 목록 조회하며 소설 urls 받아 옴
    //  반복문 1회차에만 실행
    if (!isGenreLoopEnd) {
      if (novelPlatform === "네이버 시리즈" && typeof genreNO === "string") {
        await goToNewNovelListPage(page, novelPlatform, genreNO, currentPageNO);

        await calcTotalNovelAndPageNO(page); // 함수 분리해 카카페, 시리즈에 사용하기!!!
      }
      // this is for 네이버 시리즈, 리디북스 !!!!
      const novelUrlsFromPages = await getNovelUrls(page, novelPlatform, genreNO);
      if (!novelUrlsFromPages) return;

      novelUrls = novelUrlsFromPages;

      // 장르를 모두 조회한 후 완료 표시
      isGenreLoopEnd = true;
    }

    // urls로 상세페이지 조회하며 소설 정보 db에 등록
    //  장르 전체 조회 완료 후 반복문 2회차부터 실행(시크릿창 닫고 열며)
    if (isGenreLoopEnd) {
      // if (currentPageNO > totalPageNO) {
      await login(page, novelPlatform);
      // }

      currentNovelNO = await setNovels(
        page,
        { currentNovelNO, totalNovelNO, totalPageNO },
        novelPlatform,
        novelUrls[currentNovelNO - 1],
      );
    }

    await context.close(); // 시크릿창 닫기

    if (totalNovelNO < currentNovelNO) break; // 전체 작품 조회 완료 후 루프 탈출
  }
  await browser.close();
}
