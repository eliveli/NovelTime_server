import puppeteer from "puppeteer";
import getNovelUrl from "../utils/getNovelUrl";
import goToNovelListPage from "../utils/goToNovelListPage";
import login from "../utils/login";
import minimalArgs from "../utils/minimalArgsToLaunch";
import seeNovelListWithCardForRidi from "../utils/seeNovelListWithCardForRidi";
import { NovelPlatform } from "../utils/types";
import setNovels from "./utils/setNovels";

function setInitialTotalNovelNo(totalNovelNoToScrapeFromParam?: number) {
  if (totalNovelNoToScrapeFromParam && totalNovelNoToScrapeFromParam >= 2) {
    return Math.floor(totalNovelNoToScrapeFromParam);
  }
  // - 1을 반환하는 경우 -
  //  1. 스크랩 할 소설 수(totalNovelNoToScrapeFromParam)를 넘겨주지 않았을 때
  //      이 때는 단지 변수를 비워두지 않기 위해 1을 반환.
  //      totalNovelNoToScrapeFromParam 값이 undefined라면 추후 플랫폼에서 읽어 온 실제 값으로 대체
  //  2. 해당 값이 1이거나 1이하의 실수일 때
  return 1; // 단지 변수를 비워두지 않기 위해 반환.
}

// get total page number or total novel number //
function getTotalPageNoForSeries(totalNovelNoToScrape: number) {
  const calcTotalPageNO: number = Math.floor(totalNovelNoToScrape / 25);
  return totalNovelNoToScrape % 25 !== 0 ? calcTotalPageNO + 1 : calcTotalPageNO;
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

  return Number(novelNoWithText.replace(regex, "")); // 총 작품 수
}

// for ridi //
async function waitForFirstNovelElement(page: puppeteer.Page) {
  await page.waitForSelector(
    "#__next > main > div > section > ul > li:nth-child(1) > div > div > div > h3 > a",
    { timeout: 60000 },
  );
}
async function loadNovelList(page: puppeteer.Page) {
  await waitForFirstNovelElement(page);

  // to load elements
  for (let i = 1; i < 16; i += 1) {
    await page.keyboard.press("PageDown", { delay: 100 });
  }
}

async function getNovelUrlsForRidi(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNOs: string[],
  totalNovelNoToScrape?: number,
) {
  const novelUrls: string[] = [];

  let currentPageNo = 1; // 현재 페이지 넘버
  const totalNovelNoPerPage = 60; // 페이지 당 소설 수 60

  let accumulatedNovelNoOfCurrentGenre = 0; // 현재 조회하는 세부 장르의 누적 소설 수

  const totalPageNoListForRidi: number[] = [];
  const totalNovelNoListForRidi: number[] = [];

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
      for (
        let novelNoOfCurrentPage = 1;
        novelNoOfCurrentPage <= totalNovelNoPerPage;
        novelNoOfCurrentPage += 1
      ) {
        try {
          // 타이밍 맞춰 page down 차례로 하면 모든 dom 노드 load 가능
          //  . 화면에 보이지 않는 node도 사라지지 않아 읽을 수 있음
          //  . 스크롤 조금씩 내린다면(not page down) 화면에 보이는 만큼만 새로 불러옴
          //    (소설 목록이 카드 형태일 때는 한 줄에 소설 5작품 기준)
          //                     한 줄에 하나 씩 보일 때는 1작품 기준)
          //  . (개발자 도구 - 네트워크 탭 참고)
          await loadNovelList(page);

          const novelUrl = await getNovelUrl(page, "new", novelPlatform, novelNoOfCurrentPage);
          if (!novelUrl) return;

          novelUrls.push(novelUrl);

          console.log("noveNO: ", novelNoOfCurrentPage, " novelUrl: ", novelUrl);

          accumulatedNovelNoOfCurrentGenre += 1;

          if (totalNovelNoToScrape && accumulatedNovelNoOfCurrentGenre === totalNovelNoToScrape) {
            throw Error("현재 장르 조회 완료");
          }
        } catch (err) {
          // loadNovelList 함수 내부의 waitForSelector에 timeout 1분 설정
          // 1분 초과 시 읽어올 작품이 더 없다고 간주, 현재 장르 조회 완료

          console.log(err, "읽어올 작품이 더 없다고 가정, 현재 장르 조회 완료");

          // 플랫폼 내 현재 장르의 페이지 수를 리스트에 추가 //
          // 직전 페이지가 마지막 페이지일 때
          if (novelNoOfCurrentPage === 1) {
            totalPageNoListForRidi.push(currentPageNo - 1);
          }
          // 현재 페이지가 마지막 페이지일 때
          if (novelNoOfCurrentPage !== 1) {
            totalPageNoListForRidi.push(currentPageNo);
          }

          currentPageNo = 1; // 페이지 넘버 1로 리셋

          totalNovelNoListForRidi.push(accumulatedNovelNoOfCurrentGenre); // 세부 장르 별 소설 수 추가
          accumulatedNovelNoOfCurrentGenre = 0;

          console.log(
            "totalPageNoListForRidi: ",
            totalPageNoListForRidi,
            " totalNovelNoListForRidi: ",
            totalNovelNoListForRidi,
          );

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

  return {
    novelUrlsFromPages: novelUrls,
    totalNovelNoForRidi: totalNovelNoListForRidi.reduce((a, b) => a + b), // 세부 장르 별 소설 수 합산
    totalNovelNoListForRidi,
    totalPageNoListForRidi,
  };
}

// for kakape //
async function waitForCurrentNovelForKakape(page: puppeteer.Page, currentNovelNo: number) {
  let waitingTime = 1000;

  // waitingTime 변경
  //  : 페이지 다운 후 불러오는 첫 번째 소설 (24개 단위로 소설을 불러옴)
  if (currentNovelNo % 24 === 1) {
    // 소설 천 번째 단위마다 기다리는 시간 증가
    // ex. 1011번째 - 2초, 2022번째 - 3초
    waitingTime *= Math.floor(currentNovelNo / 1000) + 1;
  }

  await page.waitForSelector(
    `#__next > div > div > div > div > div > div > div > div > div > div > div:nth-child(${currentNovelNo}) > div > a`,
    { timeout: waitingTime },
  );
}

async function getNovelUrlsForKakape(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  totalNovelNoToScrape: number,
) {
  const novelUrls: string[] = [];

  let novelNo = 1;

  // repeat : load novel node and read url from it
  while (novelNo <= totalNovelNoToScrape) {
    console.log(`novelNo: ${novelNo}, totalNovelNoToScrape: ${totalNovelNoToScrape}`);

    // 1. waitForSelector 현 작품번호의 노드 기다림(try)
    // 1-1.
    //    이 때 1초 초과 시 end 키보드 누르기. 페이지 최하단 이동
    //    1초 후 다시 노드 기다림
    // 1-2.
    //    한 번 요청할 때마다 24개 소설을 불러옴
    //      (개발자 도구 - 네트워크 탭 참고)
    //    이 중 첫 번째 소설을 읽을 때는
    //    노드 기다리는 시간 변경 (천 번째 단위로 1초 씩 증가)
    // 1-3.
    //    작품번호가 맨 마지막이라 읽어올 노드가 없다면 루프 벗어나기
    //     - 마지막 작품 여부 파악
    //     : url을 읽어온 작품 번호가 페이지에 읽어온 마지막 번호와 같을 때
    //          이건 while문 조건으로 판별 가능
    // 2. 1의 노드로부터 url 읽기
    //    그리고 url로 상세페이지에서 소설 정보 읽어오는 함수 실행

    for (let pressingEndNo = 1; pressingEndNo < 61; pressingEndNo += 1) {
      try {
        // wait for loading current novel element
        // and increase waiting time when reading a first novel
        //    right after moving a page down and loading novels
        await waitForCurrentNovelForKakape(page, novelNo);
        break;
      } catch {
        // load new novels if timeout by pressing End key
        // press End key and wait for the node again
        await page.keyboard.press("End", { delay: 1000 });
        continue;
        //
        // 만약 연속적으로 소설을 로딩하다가 에러 페이지로 이동될 경우
        //  설정한 시간/page.setDefaultTimeout(시간) or jest.setTimeout(시간)/ 지나고 스크래퍼 종료
        //
        // 에러페이지 이동 없이 load 실패할 경우
        //  다음 코드에서 url 읽어오려다 실패, 다음 소설 node 기다리러 감
        //
      }
    }

    // read novel url from the novel node
    try {
      // await loadNovelList(page); // 이 함수 다른 플랫폼과 통합?!

      const novelUrl = await getNovelUrl(page, "new", novelPlatform, novelNo);
      if (!novelUrl) {
        throw Error("can't get url from node");
      }

      novelUrls.push(novelUrl);

      console.log("noveNO: ", novelNo, " novelUrl: ", novelUrl);
    } catch (err) {
      // failure case (추측) - selector의 a 태그에서 href 값을 읽어오지 못할 때
      //  go getting next novel node
      console.log(err, "error when reading url from href attribute in novel node");
    }

    novelNo += 1; // 작품 번호 +1
  }

  return novelUrls;
}

// for series //
async function getNovelUrlsForSeries(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  genreNo: string,
  totalNo: {
    totalPageNo: number;
    totalNovelNoToScrape: number;
  },
) {
  const { totalPageNo, totalNovelNoToScrape } = totalNo;

  const novelUrls: string[] = [];

  let currentPageNo = 1; // 현재 페이지 넘버
  const novelNoPerPage = 25;

  // 목록 페이지 조회 반복
  while (currentPageNo <= totalPageNo) {
    console.log(currentPageNo, "현재 페이지 번호");

    let novelNoOfLastPage = 1;

    // 마지막 페이지 작품 수
    if (currentPageNo === totalPageNo) {
      novelNoOfLastPage = totalNovelNoToScrape % novelNoPerPage;
    }

    // 페이지 내 소설들의 url 읽어오기 (페이지 당 소설 수 25)
    for (let currentNovelNoOfPage = 1; currentNovelNoOfPage < 26; currentNovelNoOfPage += 1) {
      // 마지막페이지일 때 마지막 페이지의 작품 수 만큼 읽기
      if (currentPageNo === totalPageNo && novelNoOfLastPage < currentNovelNoOfPage) break;

      const novelUrl = await getNovelUrl(page, "new", novelPlatform, currentNovelNoOfPage);
      if (!novelUrl) return;

      console.log("novelUrl:", novelUrl);
      novelUrls.push(novelUrl);
    }

    // 다음 페이지 이동
    currentPageNo += 1;

    if (currentPageNo > totalPageNo) break;

    await goToNovelListPage(page, "new", novelPlatform, {
      genreNo,
      currentPageNo,
    });
  }

  return novelUrls;
}

// scraper for new novels //
export default async function newScraper(
  novelPlatform: NovelPlatform,
  genreNo: string | string[], // only ridi gets multiple genres from this
  totalNovelNoToScrapeFromParam?: number,
) {
  let isGenreLoopEnd = false; // 전체 카테고리별 목록페이지 조회완료 여부

  let novelUrls: string[] = [];

  let currentNoToGetNovel = 1; // 현재 작품 넘버

  // 리디는 스크래퍼 실행 중에 세부 장르 별 소설 수의 합산 값으로 대체됨
  let totalNovelNoToScrape = setInitialTotalNovelNo(totalNovelNoToScrapeFromParam);

  const totalNovelNoOfEachGenre = [] as number[]; // for ridi

  let totalPageNo = 1; // for series
  const totalPageNoOfEachGenre = [] as number[]; // for ridi

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

    // 장르 내 소설 목록 조회, 소설 urls 받아 옴
    //  반복문 1회차에만 실행
    if (!isGenreLoopEnd) {
      if (novelPlatform === "카카오페이지" && typeof genreNo === "string") {
        await goToNovelListPage(page, "new", novelPlatform, {
          genreNo,
          currentPageNo: 1,
        });

        const totalNovelNoFromPage = await getTotalNovelNo(page, novelPlatform);
        if (
          totalNovelNoFromPage &&
          (!totalNovelNoToScrapeFromParam || totalNovelNoToScrape > totalNovelNoFromPage)
        ) {
          // reset total novel number from novel platform page
          totalNovelNoToScrape = totalNovelNoFromPage;
        }

        const novelUrlsFromPages = await getNovelUrlsForKakape(
          page,
          novelPlatform,
          totalNovelNoToScrape,
        );
        if (!novelUrlsFromPages) return;

        novelUrls = novelUrlsFromPages;
      }

      if (novelPlatform === "네이버 시리즈" && typeof genreNo === "string") {
        await goToNovelListPage(page, "new", novelPlatform, {
          genreNo,
          currentPageNo: 1,
        });

        const totalNovelNoFromPage = await getTotalNovelNo(page, novelPlatform);
        if (
          totalNovelNoFromPage &&
          (!totalNovelNoToScrapeFromParam || totalNovelNoToScrape > totalNovelNoFromPage)
        ) {
          // reset total novel number from novel platform page
          totalNovelNoToScrape = totalNovelNoFromPage;
        }

        const totalPageNoFromPage = getTotalPageNoForSeries(totalNovelNoToScrape);
        if (totalPageNoFromPage) {
          totalPageNo = totalPageNoFromPage;
        }

        const novelUrlsFromPages = await getNovelUrlsForSeries(page, novelPlatform, genreNo, {
          totalPageNo,
          totalNovelNoToScrape,
        });
        if (!novelUrlsFromPages) return;
        novelUrls = novelUrlsFromPages;
      }

      if (novelPlatform === "리디북스" && typeof genreNo === "object") {
        const novelUrlsAndTotalNOs = await getNovelUrlsForRidi(
          page,
          novelPlatform,
          genreNo,
          totalNovelNoToScrapeFromParam ? totalNovelNoToScrape : undefined,
        );
        if (!novelUrlsAndTotalNOs) return;

        novelUrls = novelUrlsAndTotalNOs.novelUrlsFromPages;
        totalNovelNoToScrape = novelUrlsAndTotalNOs.totalNovelNoForRidi; // 세부 장르 별 소설 수 합산
        totalNovelNoOfEachGenre.push(...novelUrlsAndTotalNOs.totalNovelNoListForRidi);
        totalPageNoOfEachGenre.push(...novelUrlsAndTotalNOs.totalPageNoListForRidi);
      }

      // 장르 전체 조회 완료 표시
      isGenreLoopEnd = true;
    }

    // urls로 상세페이지 조회, 소설 정보 db에 등록
    //  장르 전체 조회 완료 후 반복문 2회차부터 실행(시크릿창 닫고 열며)
    if (isGenreLoopEnd) {
      if (novelUrls.length === 0) return;

      await login(page, novelPlatform);

      currentNoToGetNovel = await setNovels(
        page,
        {
          currentNovelNo: currentNoToGetNovel,
          totalNovelNo: totalNovelNoToScrape,
          totalNovelNoList: totalNovelNoOfEachGenre,
          totalPageNo: totalPageNoOfEachGenre.length === 0 ? totalPageNo : totalPageNoOfEachGenre,
        },
        novelPlatform,
        novelUrls,
      );
    }

    await context.close(); // 시크릿창 닫기

    if (totalNovelNoToScrape < currentNoToGetNovel) break; // 전체 작품 조회 완료 후 루프 탈출
  }
  await browser.close();
}
