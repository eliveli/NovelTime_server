import puppeteer, { ElementHandle } from "puppeteer";
import dotenv from "dotenv";
import getCurrentTime from "../utils/getCurrentTime";
import { setNovel } from "../../novels";

dotenv.config(); // 여기(이 명령어를 실행한 파일)에서만 환경변수 사용 가능
// require("dotenv").config();

const novelInfo = {
  novelId: "",
  novelImg: "",
  novelTitle: "",
  novelDesc: "",
  novelAuthor: "",
  novelAge: "",
  novelGenre: "",
  novelIsEnd: false,
  novelPlatform: "",
  novelUrl: "",
};

// 스크래퍼 카카페용 (무한스크롤)
export async function scrapeKakape(genreNO: string, currentOrder: number) {
  // 크로미엄에서 열기 (디폴트)
  const browser = await puppeteer.launch({
    headless: true, // 브라우저 화면 열려면 false
    // defaultViewport: { width: 800, height: 1080 }, // 실행될 브라우저의 화면 크기

    // -크롬에서 열기 (when 카카페 기존 로그인된 상태로 작업 / but 로그인상태가 항상 유지되지 않음)
    // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", // 크롬 경로
    // userDataDir: "C:/Users/user/AppData/Local/Google/Chrome/User Data",  // 크롬 사용자 정보를 가지는 경로
    // args: [],
  });

  const novelListUrl = `https://page.kakao.com/genre-total?categoryUid=11&subCategoryUid=${genreNO}`;

  let totalNovelNO: number = currentOrder; // 총 작품 수
  let currentNovelNO: number = currentOrder; // 현재 작품 번호

  // 반복. 브라우저 컨텍스트 열고 닫기. out of memory 방지
  // 시크릿창. 캐시나 쿠키 등을 공유하지 않음.
  // <중요> puppeteer.launch({headless:true}) 설정해야 context.close()로 브라우저 데이터 지울 수 있음.
  while (totalNovelNO >= currentNovelNO) {
    const context = await browser.createIncognitoBrowserContext();

    const page = await context.newPage();
    await page.goto(novelListUrl);
    page.setDefaultTimeout(10000);

    // 카카페 로그인 -------------------------------------------------------------------------//
    const loginBtn = (await page.waitForSelector(
      "#kpw-header > div > div > button > div:nth-child(3)",
    )) as ElementHandle<HTMLDivElement>; // wait object load
    // loginBtn null error handling
    if (!loginBtn) {
      throw new Error("login 버튼 null 에러");
    }

    const newPagePromise = new Promise((x) => page.once("popup", x)); // declare promise for popup event

    await loginBtn.click(); // click, a new tab/window opens
    const newPage = (await newPagePromise) as puppeteer.Page; // declare new tab/window, now you can work with it

    // -카카페 회원정보 입력
    // set id, pw
    let kakaoID: string;
    let kakaoPW: string;
    // handle undefined env variable
    if (process.env.KAKAO_ID) {
      kakaoID = process.env.KAKAO_ID;
    } else {
      throw new Error("KAKAO_ID env is not set");
    }
    if (process.env.KAKAO_PW) {
      kakaoPW = process.env.KAKAO_PW;
    } else {
      throw new Error("KAKAO_PW env is not set");
    }

    const idElement = await newPage.waitForSelector("#id_email_2");
    await newPage.evaluate((kakaoID, idElement) => (idElement.value = kakaoID), kakaoID, idElement); // email
    const pwElement = await newPage.waitForSelector("#id_password_3");
    await newPage.evaluate((kakaoPW, pwElement) => (pwElement.value = kakaoPW), kakaoPW, pwElement); // password
    await newPage.click(
      "#login-form > fieldset > div.set_login > div > label > span.ico_account.ico_check",
    ); // check 로그인상태유지
    await newPage.click("#login-form > fieldset > div.wrap_btn > button.btn_g.btn_confirm.submit"); // submit

    // -----------------------------------------------------------------------------------------//

    // 새 창에서 로그인 후 화면 로그인 아이콘 바뀔 때까지 대기
    await page.waitForSelector("#kpw-header > div > div > div > button > img");

    // 최신순 정렬
    await page.click(
      "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-7g2whp > div.css-2607za.enuper1 > div.css-azpd88 > div:nth-child(3) > div",
    );
    const newBtn =
      "body > div.ReactModalPortal > div > div > div > div > div.css-17v4b0g > div:nth-child(3) > div.css-ad0zfg > div:nth-child(2) > div";
    const searchBtn =
      "body > div.ReactModalPortal > div > div > div > div > div.css-cat29d > button.css-2lvb6l";
    await page.waitForSelector(searchBtn);
    await page.click(newBtn);
    await page.click(searchBtn);

    // 총 작품 수 구하기
    const regex = /[^0-9]/g; // 숫자가 아닌 문자열을 선택하는 정규식
    const noElement = await page.waitForSelector(
      "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-18fshcv > div.css-doe2ia",
    );
    const _novelNO = await page.evaluate((noElement) => noElement.textContent, noElement);
    totalNovelNO = _novelNO.replace(regex, ""); // 총 작품 수

    // 카카페 크롤러.
    while (currentNovelNO <= totalNovelNO) {
      console.log(`currentNovelNO: ${currentNovelNO}, totalNovelNO: ${totalNovelNO}`);

      // 작품 목록 받아오는 함수: 화면 최하단 이동(작품 페이지에서 무한스크롤로 받아옴)
      const getNovelList = async () => {
        await page.evaluate(async () => {
          await new Promise<void>(async (resolve) => {
            await new Promise((resolve) => setTimeout(resolve, 200));
            window.scrollTo(0, document.body.scrollTop - 100);
            await new Promise((resolve) => setTimeout(resolve, 200));
            window.scrollTo(0, document.body.offsetHeight);

            resolve(); // 다음 코드 실행하려면 필수!
          });
        });
      };

      // 작품 25개 단위로 새로 불러오기 (via 무한스크롤. 뒤로가기로 상세->목록 페이지이동한 상태)
      const scrollCnt = Math.floor(currentNovelNO / 25); // Math.floor(숫자) 소수점 버리고 반환
      let currLoopNO = 0; // 현재 스크롤루프 넘버
      currLoopNO = 1;
      while (scrollCnt >= 1 && currLoopNO <= scrollCnt) {
        await getNovelList();
        currLoopNO += 1;
      }

      // 작품 선택
      try {
        const novelSelector = `#root > div.mainContents.mainContents_pc.hiddenMenuContent > div > div > div:nth-child(${
          5 + currentNovelNO
        }) > div > div > div > span`;
        await page.waitForSelector(novelSelector);
        await page.click(novelSelector);

        // 작품 정보 읽기
        // get img
        const imgElement = await page.waitForSelector(
          "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div > div.css-1y42t5x > img",
        );
        const _imgUrl = await page.evaluate(
          (imgElement) => imgElement.getAttribute("src"),
          imgElement,
        );
        novelInfo.novelImg = _imgUrl.slice(0, _imgUrl.indexOf("&filename=th1"));

        // get title
        const titleElement = await page.waitForSelector(
          "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div > div.css-1ydjg2i > div.css-4cffwv > h2",
        );
        novelInfo.novelTitle = await page.evaluate(
          (titleElement) => titleElement.innerText,
          titleElement,
        );

        // title. 일단 필터 없이 다 저장, 추후 관리
        // // -- 단행본은 바로 저장 : 추후 단행본을 키워드로 같은 작품 합칠 예정
        // else if (i === 1 && info.includes("단행본")) {
        //   novelInfo.novelTitle = info;
        // }
        // // -- 부가 정보 제외 : [ ] or ( )
        // else if (i === 1 && (info.includes("[") || info.includes("("))) {
        //   const _deleteIdx =
        //     info.indexOf("[") !== -1 ? info.indexOf("[") : info.indexOf("(");
        //   const deleteIdx =
        //     info[_deleteIdx - 1] === " " ? _deleteIdx - 1 : _deleteIdx; // [ or ( 바로 앞에 공백이 있는 경우 공백 인덱스 가져오기
        //   novelInfo.novelTitle = info.slice(0, deleteIdx); // [ or ( 바로 앞 문자까지만 제목으로 보관
        // }

        // get author
        const authorElement = await page.waitForSelector(
          "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div.css-knfhfe > div.css-1ydjg2i > div.css-1nlm7ol > div.css-ymlwac > div:nth-child(2)",
        );
        novelInfo.novelAuthor = await page.evaluate(
          (authorElement) => authorElement.innerText,
          authorElement,
        );

        // get url
        novelInfo.novelUrl = await page.evaluate(() => window.location.href);

        // get desc, age
        await page.click(
          "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div.css-knfhfe > div.css-1ydjg2i > div.css-1nlm7ol > div.css-82j595 > button.css-nxuz68",
        );
        const descElement = await page.waitForSelector(
          "div.jsx-3755015728.descriptionBox.lineHeight",
        );
        novelInfo.novelDesc = await page.evaluate(
          (descElement) => descElement.innerText,
          descElement,
        );
        const ageElement = await page.waitForSelector(
          ".modalBody > div > div > table > tbody > tr.jsx-3755015728.first > td.jsx-3755015728.contentCol > div:nth-child(4) > div:nth-child(2)",
        );
        novelInfo.novelAge = await page.evaluate((ageElement) => ageElement.innerText, ageElement);

        // get genre : 로맨스, 로판, 판타지, 현판, 무협
        // 카카페는 BL이 작품소개에 로맨스 분류됨 : 작품제목에 BL이 있으면 장르 나누기
        const genreElement = await page.waitForSelector(
          "div.modalBody > div > div > table > tbody > tr.jsx-3755015728.first > td.jsx-3755015728.contentCol > div:nth-child(2) > div:nth-child(2)",
        );
        const inputGenre = await page.evaluate(
          (genreElement) => genreElement.innerText,
          genreElement,
        );
        const _genre = novelInfo.novelTitle.includes("[BL]")
          ? "BL"
          : inputGenre.includes("로맨스")
          ? "로맨스"
          : inputGenre.includes("로판")
          ? "로판"
          : inputGenre.includes("판타지")
          ? "판타지"
          : inputGenre.includes("현판")
          ? "현판"
          : inputGenre.includes("무협")
          ? "무협"
          : "기타";
        novelInfo.novelGenre = _genre;

        await page.click("i.jsx-3114325382.modalClose.modalClose_pc.title > img");

        // get isEnd
        const endElement = await page.waitForSelector(
          "#root > div.jsx-885677927.mainContents.mainContents_pc.hiddenMenuContent > div > div > div.css-sgpdfd > div > div.css-1ydjg2i > div.css-1nlm7ol > div.css-ymlwac > div:nth-child(1)",
        );
        const _isEnd = await page.evaluate((endElement) => endElement.textContent, endElement);
        novelInfo.novelIsEnd = _isEnd.includes("완결");

        // set platform, id
        novelInfo.novelPlatform = "카카오페이지";
        novelInfo.novelId = getCurrentTime();

        console.log(novelInfo);

        // db 저장
        setNovel(novelInfo);

        currentNovelNO += 1;

        if (currentNovelNO % 5 === 0) break; // 작품 5번째 마다 loop 탈출, 시크릿창 여닫기
        // : 작품 번호가 클수록 무한스크롤 횟수가 많으므로 루프 탈출 주기도 점점 짧게 하기

        await page.goBack(); // 목록 페이지로 이동
      } catch (err) {
        console.log(`${err} 현재작품: ${currentNovelNO}, 마지막작품: ${totalNovelNO}`);
        currentNovelNO += 1;
        // 에러 발생 시 시크릿창 닫고 다음 작품 번호부터 실행
        break;
      }
    }

    await context.close(); // 시크릿창 닫기
  }

  await browser.close(); // 브라우저 닫기
}
