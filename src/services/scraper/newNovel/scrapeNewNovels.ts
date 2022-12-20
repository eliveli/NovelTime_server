import puppeteer from "puppeteer";
import getNovelUrl from "../utils/getNovelUrl";
import goToNovelListPage from "../utils/goToNovelListPage";
import login from "../utils/login";
import minimalArgs from "../utils/minimalArgsToLaunch";
import seeNovelListWithCardForRidi from "../utils/seeNovelListWithCardForRidi";
import { NovelPlatform } from "../utils/types";
import setNovels from "./utils/setNovels";

//  전역 변수들을 함수 안에 넣을까 ------------------------

let isGenreLoopEnd = false; // 전체 카테고리별 목록페이지 조회완료 여부

// for series
let totalPageNo = 1; // 전체 페이지 수
// for ridi
const totalPageNoList: number[] = []; // 필터 별 전체 페이지 수(참고용)

// for series, ridi
let currentPageNo = 1; // 현재 페이지 넘버

// for series, ridi, kakape
let totalNovelNo = 1; // 전체 작품 수
let currentNovelNo = 1; // 현재 작품 넘버

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
    totalPageNoList.push(currentPageNo - 1); // 해당 필터의 전체 페이지 수 표시
    totalNovelNo += (currentPageNo - 1) * 60; // 전체 작품 수에 해당 필터의 작품 수 추가
  }
  // 현재 페이지가 마지막 페이지일 때
  if (novelNO !== 1) {
    totalPageNoList.push(currentPageNo); // 해당 필터의 전체 페이지 수 표시
    totalNovelNo += (currentPageNo - 1) * 60 + (novelNO - 1); // 전체 작품 수에 해당 필터의 작품 수 추가
  }

  console.log("totalPageNoList: ", totalPageNoList, " totalNovelNo: ", totalNovelNo);
}

//-------------------------------------------------------------------------------------------------
function getTotalPageNoForSeries() {
  const calcTotalPageNO: number = Math.floor(totalNovelNo / 25);
  totalPageNo = totalNovelNo % 25 !== 0 ? calcTotalPageNO + 1 : calcTotalPageNO;
}

function getTotalNovelNoSelector(novelPlatform: NovelPlatform) {
  if (novelPlatform === "카카오페이지") {
    return "#__next > div > div > div > div > div > div > div > div > span";
  }
  if (novelPlatform === "네이버 시리즈") {
    return "#content > div > div > div.total";
  }
}
async function getTotalNovelNo(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  const totalNovelNoSelector = getTotalNovelNoSelector(novelPlatform);
  if (!totalNovelNoSelector) return;

  // 총 작품 수 구하기
  const regex = /[^0-9]/g; // 숫자가 아닌 문자열을 선택하는 정규식
  const novelNoElement = await page.waitForSelector(totalNovelNoSelector);

  const novelNoWithText = (await page.evaluate(
    (element) => element.textContent,
    novelNoElement,
  )) as string;

  totalNovelNo = Number(novelNoWithText.replace(regex, "")); // 총 작품 수
}

async function getTotalNovelNoOrPageNo(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  await getTotalNovelNo(page, novelPlatform);

  if (novelPlatform === "네이버 시리즈") {
    getTotalPageNoForSeries();
  }
}
// this is for series-------------------------------------------------------------------------

async function getNovelNoOfLastPage(page: puppeteer.Page) {
  const listOfLastPage = await page.waitForSelector("#content > div > ul");
  return (await page.evaluate((lastList) => lastList.childElementCount, listOfLastPage)) as number;
}

//-------------------------------------------------------------------------------------------------

async function getNovelUrlsForRidi(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNOs: string[],
) {
  const tempNovelUrls: string[] = [];

  // search from each category
  genreLoop: for (let ctgIdx = 0; ctgIdx < genreNOs.length; ctgIdx += 1) {
    await goToNovelListPage(page, "new", novelPlatform, {
      genreNo: genreNOs[ctgIdx],
      currentPageNo,
    });

    if (currentPageNo === 1) {
      await seeNovelListWithCardForRidi(page);
    }

    // 장르 내 목록 페이지 조회 반복
    while (true) {
      console.log(currentPageNo, "현재 페이지 번호");

      // 각 페이지에서 작품 url 가져오기
      for (let novelNO = 1; novelNO < 61; novelNO += 1) {
        try {
          // 타이밍 맞춰 page down 차례로 하면 모든 dom 노드 load 가능
          //   화면에 보이지 않는 node도 사라지지 않아 읽을 수 있음
          await loadNovelList(page);

          const novelUrl = await getNovelUrl(page, "new", novelPlatform, novelNO);
          if (!novelUrl) return;

          tempNovelUrls.push(novelUrl);

          console.log("noveNO: ", novelNO, " novelUrl: ", novelUrl);
        } catch (err) {
          console.log(err, "읽어올 작품이 더 없을 확률 높음");

          // 읽어올 작품이 더 없을 때 현재 필터의 조회 종료
          setTotalNOsOfPageAndNovel(novelNO);

          currentPageNo = 1;

          continue genreLoop; // 다음 장르 조회
        }
      }
      // 다음 페이지 이동
      currentPageNo += 1;
      await goToNovelListPage(page, "new", novelPlatform, {
        genreNo: genreNOs[ctgIdx],
        currentPageNo,
      });
      await waitForFirstNovelElement(page);
    }
  }

  return tempNovelUrls;
}

async function waitForCurrentNovelForKakape(page: puppeteer.Page) {
  await page.waitForSelector(
    `#__next > div > div > div > div > div > div > div > div > div > div > div:nth-child(${currentNovelNo}) > div > a`,
    { timeout: 500 },
  );
}

// 보완 필요!!!!!!!!!!!!!
async function getNovelUrlsForKakape(page: puppeteer.Page, novelPlatform: NovelPlatform) {
  const tempNovelUrls: string[] = [];

  // 목록 페이지에서 page down 하면서 작품 url 읽어오기
  while (currentNovelNo <= totalNovelNo) {
    console.log(`currentNovelNo: ${currentNovelNo}, totalNovelNo: ${totalNovelNo}`);

    // 1. waitForSelector 현 작품번호의 노드 기다림(try)
    // 1-1.
    //    이 때 0.5초 초과 시 end 키보드 누르기. 페이지 최하단 이동
    //    그리고 다시 노드 기다림
    // 1-2. 작품번호가 맨 마지막이라 읽어올 노드가 없다면 루프 벗어나기
    //    - 마지막 작품 여부 파악
    //     : url을 읽어온 작품 번호가 페이지에 읽어온 마지막 번호와 같을 때
    //          이건 while문 조건으로 판별 가능
    // 2. 1의 노드로부터 url 읽기
    //    그리고 url로 상세페이지에서 소설 정보 읽어오는 함수 실행

    for (let pressingEndNO = 1; pressingEndNO < 61; pressingEndNO += 1) {
      try {
        await waitForCurrentNovelForKakape(page);
        break;
      } catch {
        // 현재 작품번호의 dom 노드를 읽어오는 데 0.5초 경과 시(try)
        // press End key and wait for the node again
        await page.keyboard.press("End", { delay: 500 });
        continue;
        // 대락 1분이 지나도 (반복문 60회) 소설을 읽어오지 못한다면 소설 node 로드 실패로 간주
        //
        // 아래 중 하나 선택 후  코드 작성 필요!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // case 1 스크래퍼 종료
        // case 2 읽어온 곳까지 url 조회
      }
    }

    // 각 소설 node에서 url 읽어오기
    try {
      // await loadNovelList(page); // 이 함수 다른 플랫폼과 통합?!

      const novelUrl = await getNovelUrl(page, "new", novelPlatform, currentNovelNo);
      if (!novelUrl) return;

      tempNovelUrls.push(novelUrl);

      console.log("noveNO: ", currentNovelNo, " novelUrl: ", novelUrl);
    } catch (err) {
      // 실패하는 케이스 (추측) - selector의 a 태그에서 href 값을 읽어오지 못할 때
      //  이 소설은 넘기고 다음 소설 찾으러 가기
      console.log(err, "novel node에서 url 읽을 때 에러");
    }

    currentNovelNo += 1; // 작품 번호 +1
  }

  return tempNovelUrls;
}

async function getNovelUrlsForSeries(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNo: string,
) {
  const tempNovelUrls: string[] = [];

  // 목록 페이지 조회 반복
  while (currentPageNo <= totalPageNo) {
    console.log(currentPageNo, "현재 페이지 번호");

    let novelNoOfLastPage = 1;

    // 마지막 페이지 작품 수
    if (currentPageNo === totalPageNo) {
      novelNoOfLastPage = await getNovelNoOfLastPage(page);
    }

    // 목록에서 각 작품 정보(url) 가져오기
    for (let novelNO = 1; novelNO < 26; novelNO += 1) {
      // 마지막페이지 작품 수가 25보다 작을 때 루프 탈출
      if (currentPageNo === totalPageNo && novelNoOfLastPage < novelNO) break;

      const novelUrl = await getNovelUrl(page, "new", novelPlatform, novelNO);
      if (!novelUrl) return;

      tempNovelUrls.push(novelUrl);
      // console.log(novelList[novelNO - 1], "novel", novelNO);
    }

    // 다음 페이지 이동
    currentPageNo += 1;

    if (currentPageNo > totalPageNo) break;

    await goToNovelListPage(page, "new", novelPlatform, {
      genreNo,
      currentPageNo,
    });
  }

  return tempNovelUrls;
}

async function getNovelUrls(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNo: string[] | string,
) {
  if (novelPlatform === "카카오페이지" && typeof genreNo === "string") {
    return await getNovelUrlsForKakape(page, novelPlatform);
  }

  if (novelPlatform === "네이버 시리즈" && typeof genreNo === "string") {
    return await getNovelUrlsForSeries(page, novelPlatform, genreNo);
  }
  if (novelPlatform === "리디북스" && typeof genreNo === "object") {
    return await getNovelUrlsForRidi(page, novelPlatform, genreNo);
  }
}

export default async function newScraper(novelPlatform: NovelPlatform, genreNo: string | string[]) {
  const browser = await puppeteer.launch({
    headless: false, // 브라우저 화면 열려면 false
    args: minimalArgs, // it may be removed later
    // defaultViewport: { width: 800, height: 1080 }, // 실행될 브라우저의 화면 크기

    // -크롬에서 열기 (when 카카페 기존 로그인된 상태로 작업 / but 로그인상태가 항상 유지되지 않음)
    // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", // 크롬 경로
    // userDataDir: "C:/Users/user/AppData/Local/Google/Chrome/User Data",  // 크롬 사용자 정보를 가지는 경로
    // args: [],
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
      if (
        ["카카오페이지", "네이버 시리즈"].includes(novelPlatform) &&
        typeof genreNo === "string"
      ) {
        await goToNovelListPage(page, "new", novelPlatform, {
          genreNo,
          currentPageNo,
        });

        await getTotalNovelNoOrPageNo(page, novelPlatform);
        // console.log(totalPageNo, "totalPageNo", totalNovelNo, "totalNovelNo");
      }

      // this is for 카카페, 네이버 시리즈, 리디북스
      const novelUrlsFromPages = await getNovelUrls(page, novelPlatform, genreNo);
      if (!novelUrlsFromPages) return;

      novelUrls = novelUrlsFromPages;

      // 장르를 모두 조회한 후 완료 표시
      isGenreLoopEnd = true;
    }

    // urls로 상세페이지 조회하며 소설 정보 db에 등록
    //  장르 전체 조회 완료 후 반복문 2회차부터 실행(시크릿창 닫고 열며)
    if (isGenreLoopEnd) {
      // if (currentPageNo > totalPageNo) {
      await login(page, novelPlatform);
      // }

      currentNovelNo = await setNovels(
        page,
        { currentNovelNo, totalNovelNo, totalPageNo },
        novelPlatform,
        novelUrls[currentNovelNo - 1],
      );
    }

    await context.close(); // 시크릿창 닫기

    if (totalNovelNo < currentNovelNo) break; // 전체 작품 조회 완료 후 루프 탈출
  }
  await browser.close();
}
