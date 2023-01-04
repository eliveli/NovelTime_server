import puppeteer from "puppeteer";
import seeNovelListWithCardForRidi from "./seeNovelListWithCardForRidi";
import { NovelPlatform } from "./types";

function getNovelSelector(novelPlatform: NovelPlatform, novelNO: number) {
  if (novelPlatform === "카카오페이지") {
    return `#__next > div > div.flex.w-full.grow.flex-col.px-122pxr > div > div.flex.grow.flex-col > div.flex.grow.flex-col > div > div.flex.w-full.grow.flex-col.py-5px > div > div > div > div:nth-child(${novelNO}) > div > div > a`;
  }

  if (novelPlatform === "네이버 시리즈") {
    return `#content > div > ul > li:nth-child(${novelNO}) > a`;
  }

  if (novelPlatform === "리디북스") {
    return `#__next > main > div > section > ul.fig-1o0lea8 > li:nth-child(${novelNO}) > div > div.fig-7p4nhu > a`;
  }

  if (novelPlatform === "조아라") {
    return `#root > div > div.subpage-container.double-tabs-list > ul > li:nth-child(${novelNO}) > div > div.detail > a:nth-child(2)`;
  }
}

// for all platforms in weekly scraper
//    and for series in new scraper
export async function waitForNovel(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  currentNovelNo: number,
) {
  const novelSelector = getNovelSelector(novelPlatform, currentNovelNo);
  if (!novelSelector) return;

  if (novelPlatform === "리디북스") {
    if (currentNovelNo === 1) {
      await seeNovelListWithCardForRidi(page);
      // 카드형으로 보기 & 스크래퍼 viewport 설정
      // -> 위클리 소설 20개 한 번에 불러오기
      //   (페이지 다운해 소설 추가 요청할 필요 없음)
    }
  }

  return await page.waitForSelector(novelSelector);
}

// wait or load novel for kakape, ridi in new scraper //
async function waitForCurrentNovel(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform,
  currentNovelNo: number,
  waitingNo: number,
) {
  let waitingTime = 1000; // 기본 대기 시간

  // for kakape //
  // . 요청 마다 소설 24개 불러옴
  //    (End 키를 눌러 요청 - see the waitOrLoadNovel function)
  // . 기다리는 시간 증가 cases
  //   : 요청 후 불러오는 첫번째 소설
  //   : 소설 200번째 마다 기다리는 시간 +1
  //      ex. 101번째 - 1초, 202번째 - 2초

  // for ridi //
  // <중요>
  //  . 스크래퍼에서 viewport 크기를 설정함으로써 목록 페이지에서 한 번에 소설 요청
  //    여러 번 페이지를 내려 소설을 요청하지 않음.
  //  . 이 변경사항 적용으로 아래의 리디 용 일부 코드는 무의미해진 듯 보이나
  //       ex. 소설 노드를 읽어오지 못하면 페이지 내리는 부분
  //     변수 대비 및 추후 사용될 가능성이 있어 그대로 둠
  // <중요>
  //
  // . 요청하는 소설 수는 창 크기에 따라, 게시 형식(카드형/목록형)에 따라 다름
  //    - 카드형일 때 창 width가 넓으면 1줄에 많은 소설이 게시됨 (최대 1줄 5작품)
  //      목록형일 때 1줄에 소설 1개 게시
  // . PageDown 키를 눌러 한 번에 여러 줄 요청(창 height에 따라 다름)
  //    - 현재 화면에 보여야 하는 소설들이 요청됨.
  //      End 키를 눌러 페이지 끝으로 이동할 경우 중간에 위치한 소설은 요청 안 됨
  // . 타이밍 맞춰 PageDown을 차례로 하면 모든 소설 요청 가능
  // . 요청 후 불러오는 첫 번째 소설에 기다리는 시간 증가

  //   소설 요청 상세는 소설 플랫폼의 소설 목록 페이지에서 개발자 도구 - 네트워크 탭 참고

  const totalQuantityOfNovelsInOneRequest = novelPlatform === "카카오페이지" ? 24 : 5;

  const waitingTimeForFirstNovel =
    novelPlatform === "카카오페이지" ? 1000 * (Math.floor(currentNovelNo / 200) + 1) : 2000;

  const novelSelector =
    novelPlatform === "카카오페이지"
      ? `#__next > div > div > div > div > div > div > div > div > div > div > div:nth-child(${currentNovelNo}) > div > a`
      : `#__next > main > div > section > ul > li:nth-child(${currentNovelNo}) > div > div > div > h3 > a`;

  if (currentNovelNo % totalQuantityOfNovelsInOneRequest === 1) {
    waitingTime = waitingTimeForFirstNovel;
  }

  // 직전에 소설 노드 대기 시간 초과 후 페이지 다운 한 번 또는 두 번 했을 경우
  //  waiting time 3배
  if ([2, 3].includes(waitingNo)) {
    waitingTime *= 3;
  }

  return await page.waitForSelector(novelSelector, { timeout: waitingTime });
}

export async function waitOrLoadNovel(
  page: puppeteer.Page,
  novelPlatform: NovelPlatform, // for kakape or ridi in new scraper
  currentNovelNo: number,
) {
  const downKey = novelPlatform === "카카오페이지" ? "End" : "PageDown";

  // 변경 사항
  // (기존) 소설 노드를 못 읽으면 페이지 내려 소설 요청
  // (변경) 먼저 요청하고 못 읽으면 재요청하기
  //      . 카카페는 소설 묶음 단위인 24개 기준으로 페이지 다운 시점 설정 (조건문, % 등 활용)
  //      . 가장 처음에는 요청하지 않기
  //      . 간혹 페이지다운이 작동하지 않을 수 있으니 이전 코드와 같이 페이지다운 두 번 까지 허용
  // (기대 효과) 실행 시간 줄임

  for (let waitingNo = 1; waitingNo < 4; waitingNo += 1) {
    try {
      if (
        novelPlatform === "카카오페이지" &&
        currentNovelNo !== 1 &&
        currentNovelNo % 24 === 1 &&
        waitingNo === 1
      ) {
        throw Error("대기 없이 소설 요청");
      }
      // wait for loading current novel element
      // and increase waiting time when reading a first novel
      //    right after moving a page down and loading novels
      return await waitForCurrentNovel(page, novelPlatform, currentNovelNo, waitingNo);
    } catch {
      // 최대 두 번 까지 소설 다시 요청(페이지 다운이 작동하지 않을 경우 고려한 것)
      // if timeout occurs when waitingNo is 1 or 2
      //  move a page down by pressing an End key for kakape, Page Down key for ridi
      //  and request next novel pack
      // and wait for the node again

      console.log("waitingNo:", waitingNo);

      if (waitingNo === 3) return;

      await page.keyboard.press(downKey, { delay: 100 });
      continue; // 페이지 다운 후 다시 소설 노드 읽기 시도

      // error case for kakape (이전 코드에서 발견. 지금은 참고만 하기)
      // 새로운 소설을 요청 후 받아오기 전에 다시 같은 소설을 요청하는 작업을 반복될 때
      //  -> 에러페이지로 이동
      //  -> 설정한 시간(page.setDefaultTimeout(시간) or jest.setTimeout(시간)) 경과 후 스크래퍼 종료
      //   : 무한스크롤 방식. 후반부로 갈수록 요청한 소설을 받아오는 데 시간이 걸려서 문제 발생
      //  -> 같은 소설 묶음을 재요청할 때 waitingTime을 늘려 해결
    }
  }
}
