import puppeteer from "puppeteer";
import dotenv from "dotenv";
import addOrUpdateNovelInDB from "../utils/addOrUpdateNovelInDB";
import login from "../utils/login";
import seeNovelListWithCardForRidi from "../utils/seeNovelListWithCardForRidi";

dotenv.config(); // 여기(이 명령어를 실행한 파일)에서만 환경변수 사용 가능

const novelPlatform = "리디북스";

let isGenreLoopEnd = false; // 전체 카테고리별 목록페이지 조회완료 여부

const totalPageNO: number[] = []; // 필터 별 전체 페이지 수(참고용)
let totalNovelNO = 0; // 전체 작품 수 : 0으로 해야 함. 필터 별 작품 수 추가하여 계산
let currentPageNO = 1; // 현재 페이지 넘버
let currentNovelNO = 1; // 현재 작품 넘버

const novelList: Array<{ url: string }> = [
  // { url: "/books/777097927" },
];

async function goToNovelListPageOfCurrentGenre(page: puppeteer.Page, genreNo: string) {
  // 목록페이지 url // with 최신순(최신화등록일), 성인 제외
  const novelListUrl = `https://ridibooks.com/category/books/${genreNo}?order=recent&adult_exclude=y&page=`;

  // 목록 페이지 이동 & 페이지 이동 후 대기. 소설 url을 읽어 올 dom이 load되어야 함
  await page.goto(novelListUrl + String(currentPageNO), { waitUntil: "networkidle0" });
}

// in order to read dom elements from page
async function waitForFirstNovelElementFromList(page: puppeteer.Page) {
  await page.waitForSelector(
    "#__next > main > div > section > ul > li:nth-child(1) > div > div > div > h3 > a",
  );
}

async function pressPageDownForLoadingElements(page: puppeteer.Page) {
  for (let i = 1; i < 16; i += 1) {
    await page.keyboard.press("PageDown", { delay: 100 });
  }
}

async function loadElementsBeforeGettingNovelUrl(page: puppeteer.Page) {
  await waitForFirstNovelElementFromList(page);

  await pressPageDownForLoadingElements(page);
}

async function getNovelURLFromList(page: puppeteer.Page, novelNO: number) {
  const novelElHandle = await page.waitForSelector(
    `#__next > main > div > section > ul > li:nth-child(${String(
      novelNO,
    )}) > div > div > div > h3 > a`,
  );

  const novelURLunClean: string = await page.evaluate(
    (elHandle) => elHandle.getAttribute("href"),
    novelElHandle,
  );

  return novelURLunClean.slice(0, novelURLunClean.indexOf("?")); // url : "?" 부터 문자 제외
}

function setTotalNOsOfPageAndNovel(novelNO: number) {
  // 직전 페이지가 마지막 페이지일 때
  if (novelNO === 1) {
    totalPageNO.push(currentPageNO - 1); // 해당 필터의 전체 페이지 수 표시
    totalNovelNO += (currentPageNO - 1) * 60; // 전체 작품 수에 해당 필터의 작품 수 추가
  }
  // 현재 페이지가 마지막 페이지일 때
  if (novelNO !== 1) {
    totalPageNO.push(currentPageNO); // 해당 필터의 전체 페이지 수 표시
    totalNovelNO += (currentPageNO - 1) * 60 + (novelNO - 1); // 전체 작품 수에 해당 필터의 작품 수 추가
  }

  console.log("totalPageNO: ", totalPageNO, " totalNovelNO: ", totalNovelNO);
}

async function getNovelUrls(page: puppeteer.Page, genreNOs: string[]) {
  // search from each category
  genreLoop: for (let ctgIdx = 0; ctgIdx < genreNOs.length; ctgIdx += 1) {
    await goToNovelListPageOfCurrentGenre(page, genreNOs[ctgIdx]);

    if (currentPageNO === 1) {
      await seeNovelListWithCardForRidi(page);
    }

    // 장르 내 목록 페이지 조회 반복
    while (true) {
      console.log(currentPageNO, "현재 페이지 번호");

      // 각 페이지에서 작품 url 가져오기
      for (let novelNO = 1; novelNO < 61; novelNO += 1) {
        try {
          await loadElementsBeforeGettingNovelUrl(page);

          const novelURL = await getNovelURLFromList(page, novelNO);

          novelList.push({ url: novelURL });

          console.log("noveNO: ", novelNO, " novelURL: ", novelURL);
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
      await goToNovelListPageOfCurrentGenre(page, genreNOs[ctgIdx]);
      await waitForFirstNovelElementFromList(page);
    }
  }
}

async function setNovels(page: puppeteer.Page) {
  while (totalNovelNO >= currentNovelNO) {
    console.log(
      `currentNovelNO: ${currentNovelNO}, totalNovelNO: ${totalNovelNO}, totalPageNoList: `,
      totalPageNO,
    );

    try {
      const currentNovelUrl = `ridibooks.com${novelList[currentNovelNO - 1].url}`;
      await addOrUpdateNovelInDB(page, currentNovelUrl, novelPlatform);

      currentNovelNO += 1; // 작품 번호 +1

      if (currentNovelNO % 100 === 0) break; // 작품 100번째 마다 loop 탈출. for 시크릿창 여닫기
    } catch (err) {
      console.log(err, `\n 현재작품: ${currentNovelNO}, 마지막작품: ${totalNovelNO}`);
      // 에러 발생 시 해당 작품은 통과. 시크릿창 여닫으며 다음 작품으로 넘어감
      currentNovelNO += 1; // 작품 번호 +1
      break;
    }
  }
}

// 스크래퍼 리디용 (페이지네이션)-----------------------------------------------------------------------------//
export async function scrapeRidi(genreNOs: string[]) {
  const browser = await puppeteer.launch({ headless: false });

  // 반복. 브라우저 컨텍스트 열고 닫기. out of memory 방지
  // 시크릿창. 캐시나 쿠키 등을 공유하지 않음.
  // <중요> puppeteer.launch({headless:true}) 설정해야 context.close()로 브라우저 데이터 지울 수 있음.
  while (true) {
    const context = await browser.createIncognitoBrowserContext(); // 시크릿창 열기
    const page = await context.newPage();
    page.setDefaultTimeout(30000); // 마지막번호+1 작품(없음) 조회 시 대기 시간 줄이기

    // 장르 내 소설 목록 조회하며 소설 urls 받아 옴
    //  반복문 1회차에만 실행
    if (!isGenreLoopEnd) {
      await getNovelUrls(page, genreNOs);
    }

    // urls로 상세페이지 조회하며 소설 정보 db에 등록
    //  장르 전체 조회 완료 후 반복문 2회차부터 실행(시크릿창 닫고 열며)
    if (isGenreLoopEnd) {
      await login(page, novelPlatform, "new");

      await setNovels(page);
    }

    // params로 넘겨 준 목록의 장르를 모두 조회한 후 완료 표시
    //   조회했다 함은 해당 장르의 소설 목록 페이지 조회를 말함
    //  반복문 1회차에만 실행
    if (!isGenreLoopEnd) {
      isGenreLoopEnd = true;
    }
    await context.close(); // 시크릿창 닫기
    if (totalNovelNO < currentNovelNO) break; // 전체 작품 조회 완료 후 브라우저 닫기
  }
  await browser.close();
}
