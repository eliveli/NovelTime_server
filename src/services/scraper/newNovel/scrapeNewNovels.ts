import puppeteer from "puppeteer";
import getNovelUrl from "../utils/getNovelUrl";
import goToNovelListPage from "../utils/goToNovelListPage";
import login from "../utils/login";
import { minimalArgs } from "../utils/variables";
import seeNovelListWithCardForRidi from "../utils/seeNovelListWithCardForRidi";
import { NovelPlatform } from "../utils/types";
import setNovels from "./utils/setNovels";
import { waitForNovel, waitOrLoadNovel } from "../utils/waitOrLoadNovel";
import skipNovelForAge19 from "../utils/skipNovelForAge19";

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

function passTotalPageNo(
  novelPlatform: NovelPlatform,
  totalPageNoForSeries: number,
  totalPageNoListForRidi: number[],
) {
  if (novelPlatform === "네이버 시리즈") {
    return totalPageNoForSeries;
  }
  if (novelPlatform === "리디북스") {
    return totalPageNoListForRidi;
  }
  return undefined;
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

async function getNovelUrlsForRidi(
  page: puppeteer.Page,
  genreNOs: number[],
  totalNovelNoToScrape?: number,
  isSkipForAge19?: false,
) {
  const novelPlatform = "리디북스";
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
      isSkipForAge19,
    });

    if (currentPageNo === 1) {
      await seeNovelListWithCardForRidi(page);
    }

    // 장르 내 목록 페이지 조회 반복
    while (true) {
      console.log("현재 페이지 번호: ", currentPageNo);

      // 각 페이지에서 작품 url 가져오기
      for (
        let currentNovelNoInCurrentPage = 1;
        currentNovelNoInCurrentPage <= totalNovelNoPerPage;
        currentNovelNoInCurrentPage += 1
      ) {
        try {
          const novelElement = await waitOrLoadNovel(
            page,
            novelPlatform,
            currentNovelNoInCurrentPage,
          );
          if (!novelElement) {
            throw Error("can't load novel node");
          }

          const novelUrl = await getNovelUrl(page, novelPlatform, novelElement);
          if (!novelUrl) {
            throw Error("can't get url from the node");
          }

          novelUrls.push(novelUrl);

          console.log(
            `noveNO: ${currentNovelNoInCurrentPage}/60 novelUrl: ${novelUrl} currentPageNo: ${currentPageNo}
             genre order: ${ctgIdx + 1} genre number: ${genreNOs[ctgIdx]}`,
          );

          accumulatedNovelNoOfCurrentGenre += 1;

          if (totalNovelNoToScrape && accumulatedNovelNoOfCurrentGenre === totalNovelNoToScrape) {
            throw Error("설정한 만큼 스크랩 완료");
          }

          if (currentNovelNoInCurrentPage === totalNovelNoPerPage) {
            // 1. 페이지 내 소설이 가득 차 있음(60개)
            // 2. 조회하는 목록 페이지가 마지막 페이지 이상일 때 마지막 페이지를 불러옴.
            // 1+2
            //   : 현재 페이지가 마지막 페이지라도 페이지 내 소설이 가득 채워져 있다면
            //      이후 같은 페이지를 계속 반복 조회하게 됨.
            //   -> 1의 조건을 만족할 때 마지막 페이지 여부 확인 필요
            throw Error("꽉 채워진 한 페이지의 마지막 소설 노드 읽은 후");
          }
        } catch (err: any) {
          // 소설 읽기 실패 시 or 꽉 채워진 한 페이지의 마지막 소설 노드 읽은 후 //

          // (유의) 리디에서는 마지막 페이지 이상의 수는 마지막 페이지로 인식 (url로 목록 페이지 조회 시)
          // -> 목록 페이지 하단의 페이지 번호 엘리먼트를 읽어 마지막 페이지 여부 파악
          //    : 페이지 번호 엘리먼트는 현재 페이지 번호를 포함해 최대 5개 나타남.
          //        현재 장르의 총 페이지 수가 5개 미만인 경우에만 5개 미만이고 그 외에는 항상 5개.
          //      이 때 현재 페이지가 마지막 페이지라면 나열된 페이지번호 엘리먼트 중 마지막 차례에 표시됨
          //      -> isLastPage 값이 true일 경우
          const lastPageNoElementIn5 = await page.waitForSelector(
            "#__next > main > div > section > div:nth-child(6) > div > ul > li:last-child > a",
          );
          const isLastPage = (await page.evaluate(
            (element, pageNo) => element.innerText.includes(String(pageNo)),

            lastPageNoElementIn5,
            currentPageNo,
          )) as boolean;

          // 1. 다음 페이지 읽으러 가기 //
          if (err.message === "꽉 채워진 한 페이지의 마지막 소설 노드 읽은 후" && !isLastPage) {
            break;
          }

          const novelListElement = await page.waitForSelector(
            "#__next > main > div > section > ul.fig-1o0lea8",
          );
          const totalNovelNoInCurrentPage = await page.evaluate(
            (element) => Number(element.childElementCount),
            novelListElement,
          );

          // 2. 다음 장르 읽으러 가기 //
          // : 정해 둔 스크랩할 소설 수 만큼
          //   또는 마지막 페이지의 마지막 소설 노드까지 읽었을 때
          //    후자는 페이지에 소설이 꽉 채워져 있지 않을 때와 채워져 있을 때로 구분
          //   (아래 조건문에 차례로 적용)
          if (
            err.message === "설정한 만큼 스크랩 완료" ||
            (isLastPage && currentNovelNoInCurrentPage > totalNovelNoInCurrentPage) ||
            (isLastPage && err.message === "꽉 채워진 한 페이지의 마지막 소설 노드 읽은 후")
          ) {
            console.log(
              err,
              "\n  현재 장르 조회 완료 : 설정한 만큼 스크랩 완료 또는 읽어올 작품이 더 없음",
            );

            // 플랫폼 내 현재 장르의 페이지 수를 리스트에 추가 //
            if (currentNovelNoInCurrentPage !== 1 || totalNovelNoToScrape === 1) {
              // 페이지의 소설 몇 개를 읽고 catch문 실행 시 또는 스크랩할 소설 수가 1일 때
              //   현재 페이지를 마지막 페이지로 간주
              totalPageNoListForRidi.push(currentPageNo);
            } else if (currentNovelNoInCurrentPage === 1) {
              // 페이지의 첫 번째 소설도 읽지 못하고 catch문 실행 시
              //     직전 페이지를 마지막 페이지로 간주
              totalPageNoListForRidi.push(currentPageNo - 1);
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

          // 3. 현재 페이지의 다음 소설 노드 읽으러 가기 //
          //   : 2의 조건문을 만족하지 않으면서 소설 노드 읽기 실패 시
          console.log(err, "\n  현재 노드 또는 노드의 url 읽기 실패");
          continue;
        }
      }
      // 다음 페이지 이동
      currentPageNo += 1;
      await goToNovelListPage(page, "new", novelPlatform, {
        genreNo: genreNOs[ctgIdx],
        currentPageNo,
        isSkipForAge19,
      });
    }
  }

  return {
    novelUrlsFromPages: novelUrls,
    totalNovelNoForRidi: totalNovelNoListForRidi.reduce((a, b) => a + b), // 세부 장르 별 소설 수 합산
    totalNovelNoListForRidi,
    totalPageNoListForRidi,
  };
}

async function getNovelUrlsForKakape(
  page: puppeteer.Page,
  totalNovelNoToScrape: number,
  isSkipForAge19?: false,
) {
  const novelPlatform = "카카오페이지";

  const novelUrls: string[] = [];

  let currentNovelNo = 1;

  // repeat : load novel node and read url from it
  while (currentNovelNo <= totalNovelNoToScrape) {
    console.log(`currentNovelNo: ${currentNovelNo}, totalNovelNoToScrape: ${totalNovelNoToScrape}`);

    try {
      const novelElement = await waitOrLoadNovel(page, novelPlatform, currentNovelNo);
      if (!novelElement) {
        throw Error("can't load novel node");
      }

      // 19세 소설 스킵(기본)
      if (isSkipForAge19 === undefined) {
        await skipNovelForAge19(page, currentNovelNo, novelPlatform, "new");
      }

      // read novel url from the novel node
      const novelUrl = await getNovelUrl(page, novelPlatform, novelElement);
      if (!novelUrl) {
        throw Error("can't get url from the node");
      }

      novelUrls.push(novelUrl);

      console.log("noveNO: ", currentNovelNo, " novelUrl: ", novelUrl);
    } catch (err) {
      console.log(err, "\n 현재 작품 노드 또는 url 읽기 실패");
    }

    currentNovelNo += 1; // 다음 작품 노드 읽으러 가기
  }

  return novelUrls;
}

async function getNovelUrlsForSeries(
  page: puppeteer.Page,
  genreNo: number,
  totalNo: {
    totalPageNo: number;
    totalNovelNoToScrape: number;
  },
) {
  const novelPlatform = "네이버 시리즈";
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
      try {
        // 마지막페이지일 때 마지막 페이지의 작품 수 만큼 읽기
        if (currentPageNo === totalPageNo && novelNoOfLastPage < currentNovelNoOfPage) break;

        const novelElement = await waitForNovel(page, novelPlatform, currentNovelNoOfPage);
        if (!novelElement) {
          throw Error("can't load novel node");
        }

        await skipNovelForAge19(page, currentNovelNoOfPage, novelPlatform, "new");

        const novelUrl = await getNovelUrl(page, novelPlatform, novelElement);
        if (!novelUrl) {
          throw Error("can't get url from the node");
        }

        novelUrls.push(novelUrl);

        console.log(
          `novelNo: ${currentNovelNoOfPage}/25 novelUrl: ${novelUrl} currentPageNo: ${currentPageNo} totalPageNo: ${totalPageNo}`,
        );
      } catch (err: any) {
        console.log(err, "\n  현재 작품 노드 또는 url 읽기 실패");
        continue; // 다음 소설 읽으러 가기
      }
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
// note. 시리즈는 목록 페이지 이동 시 한 번에 모든 소설을 요청
//       카카페, 리디는 목록페이지에서 페이지를 내려야 소설 세트 요청 가능
export default async function newScraper(
  novelPlatform: NovelPlatform,
  genreNo: number | number[], // only ridi gets multiple genres from this
  totalNovelNoToScrapeFromParam?: number,
  isSkipForAge19?: false,
) {
  let isGenreLoopEnd = false; // 전체 카테고리별 목록페이지 조회완료 여부

  let novelUrls: string[] = [];

  let currentNoToGetNovel = 1; // 현재 작품 넘버

  // 리디는 스크래퍼 실행 중에 세부 장르 별 소설 수의 합산 값으로 대체됨
  let totalNovelNoToScrape = setInitialTotalNovelNo(totalNovelNoToScrapeFromParam);

  const totalNovelNoListForRidi = [] as number[]; // for ridi

  let totalPageNoForSeries = 1; // for series
  const totalPageNoListForRidi = [] as number[]; // for ridi

  const browser = await puppeteer.launch({
    headless: false, // 브라우저 화면 열려면 false
    args: [...minimalArgs, "--start-maximized"],
    // "--start-maximized" to maximize the browser
    //  : in my case "--start-fullscreen" arg is not good
    //      when I used it the incognito window was never increased
    //    and I should also set the viewport in incognito window. see the below

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

    await page.setViewport({ width: 1840, height: novelPlatform === "리디북스" ? 5800 : 970 });
    // for ridi : viewport height를 플랫폼의 document height에 가깝게 설정
    //   -> 한 페이지에 있는 소설을 한 번에 불러올 수 있음(여러 번 나눠 요청X)
    // for kakape : viewport height를 window height 가깝게 설정
    //   -> 한 번에 25개씩 정해진 양을 불러옴. height 길 필요 없음
    // for series : 목록 페이지의 모든 소설을 한 번에 요청함. 페이지 다운을 위해 height 조정할 필요 없음

    // (X) { width: 0, height: 0 }
    //    -> it doesn't always work to maximize the viewport in incognito window
    //         especially headless option is true, it doesn't work

    page.setDefaultTimeout(30000);

    // 장르 내 소설 목록 조회, 소설 urls 받아 옴
    //  반복문 1회차에만 실행
    if (!isGenreLoopEnd) {
      if (novelPlatform === "카카오페이지" && typeof genreNo === "number") {
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
          totalNovelNoToScrape,
          isSkipForAge19,
        );
        if (!novelUrlsFromPages) return;

        novelUrls = novelUrlsFromPages;
      }

      if (novelPlatform === "네이버 시리즈" && typeof genreNo === "number") {
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
          totalPageNoForSeries = totalPageNoFromPage;
        }

        // 시리즈 19세 소설 항상 스킵(in following function)
        const novelUrlsFromPages = await getNovelUrlsForSeries(page, genreNo, {
          totalPageNo: totalPageNoForSeries,
          totalNovelNoToScrape,
        });
        if (!novelUrlsFromPages) return;
        novelUrls = novelUrlsFromPages;
      }

      if (novelPlatform === "리디북스" && typeof genreNo === "object") {
        const novelUrlsAndTotalNOs = await getNovelUrlsForRidi(
          page,
          genreNo,
          totalNovelNoToScrapeFromParam ? totalNovelNoToScrape : undefined,
          isSkipForAge19,
        );
        if (!novelUrlsAndTotalNOs) return;

        novelUrls = novelUrlsAndTotalNOs.novelUrlsFromPages;
        totalNovelNoToScrape = novelUrlsAndTotalNOs.totalNovelNoForRidi; // 세부 장르 별 소설 수 합산
        totalNovelNoListForRidi.push(...novelUrlsAndTotalNOs.totalNovelNoListForRidi);
        totalPageNoListForRidi.push(...novelUrlsAndTotalNOs.totalPageNoListForRidi);
      }

      // 장르 전체 조회 완료 표시
      isGenreLoopEnd = true;
    }

    // urls로 상세페이지 조회, 소설 정보 db에 등록
    //  장르 전체 조회 완료 후 반복문 2회차부터 실행(시크릿창 닫고 열며)
    if (isGenreLoopEnd) {
      if (novelUrls.length === 0) return;

      if (currentNoToGetNovel !== 1) {
        await goToNovelListPage(page, "new", novelPlatform, {
          genreNo: typeof genreNo === "number" ? genreNo : genreNo[0],
          currentPageNo: 1,
        });
      }

      // to skip age limitation when getting novel
      // - actually login function is only for kakape where novel for age 15 needs login
      // - I don't need novel for age 19 which needs login for all platforms
      //    for series, login doesn't always work. and I won't login for it
      if (novelPlatform !== "네이버 시리즈") {
        await login(page, novelPlatform);
      }

      // if a novel needs login because of age limitation but I didn't login previously,
      //    the novel won't be scraped and I will go to the next novel in the scrape process
      // + I added code to skip novels for age 19 for series when getting novel urls above
      //   so I can spend less time because I even won't visit novel pages for age 19 (for series)
      currentNoToGetNovel = await setNovels(
        page,
        {
          currentNovelNo: currentNoToGetNovel,
          totalNovelNo: totalNovelNoToScrape,
          totalNovelNoListForRidi,
          totalPageNo: passTotalPageNo(novelPlatform, totalPageNoForSeries, totalPageNoListForRidi),
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
