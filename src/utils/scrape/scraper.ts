import puppeteer, { ElementHandle } from "puppeteer";
import dotenv from "dotenv";
import getCurrentTime from "./getCurrentTime";
import { setNovel } from "../../services/novels";

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

        if (currentNovelNO % 10 === 0) break; // 작품 10번째 마다 loop 탈출, 시크릿창 여닫기
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

// 스크래퍼 시리즈용 (페이지네이션)-----------------------------------------------------------------------------//
export async function scrapeSeries(genreNO: string) {
  const browser = await puppeteer.launch({ headless: true });

  let totalPageNO = 1; // 전체 페이지 수
  let currentPageNO = 1; // 현재 페이지 넘버
  let totalNovelNO = 1; // 전체 작품 수
  let currentNovelNO = 1; // 현재 작품 넘버

  const novelListUrl = `https://series.naver.com/novel/categoryProductList.series?categoryTypeCode=genre&genreCode=${genreNO}&orderTypeCode=new&is&isFinished=true&page=`;

  interface aboutNovel {
    url: string;
    isEnd: boolean;
  }
  // 작품 리스트 : 작품 url, 완결여부 저장
  const novelList: aboutNovel[] = [];

  // 반복. 브라우저 컨텍스트 열고 닫기. out of memory 방지
  // 시크릿창. 캐시나 쿠키 등을 공유하지 않음.
  // <중요> puppeteer.launch({headless:true}) 설정해야 context.close()로 브라우저 데이터 지울 수 있음.
  while (true) {
    const context = await browser.createIncognitoBrowserContext(); // 시크릿창 열기
    const page = await context.newPage();

    await page.goto(novelListUrl + currentPageNO);

    // 총 작품 수 구하기
    const regex = /[^0-9]/g; // 숫자가 아닌 문자열을 선택하는 정규식
    const noElement = await page.waitForSelector("#content > div > div > div.total");
    const _novelNO = await page.evaluate((noElement) => noElement.textContent, noElement);
    totalNovelNO = _novelNO.replace(regex, ""); // 총 작품 수

    // 총 페이지 수 구하기
    const _totalNO: number = Math.floor(totalNovelNO / 25);
    totalPageNO = totalNovelNO % 25 !== 0 ? _totalNO + 1 : _totalNO;

    // console.log(totalPageNO, "totalPageNO", totalNovelNO, "totalNovelNO");

    // 목록 페이지 조회 반복
    while (currentPageNO <= totalPageNO) {
      console.log(currentPageNO, "현재 페이지 번호");

      // 마지막 페이지 작품 수
      let lastPageNovelNO = 1;
      if (currentPageNO === totalPageNO) {
        const lastList = await page.waitForSelector("#content > div > ul");
        lastPageNovelNO = await page.evaluate((lastList) => lastList.childElementCount, lastList);
      }
      // 목록에서 각 작품 정보(url, 완결여부) 가져오기
      for (let novelNO = 1; novelNO < 26; novelNO++) {
        if (currentPageNO === totalPageNO && lastPageNovelNO < novelNO) break;
        // 마지막페이지 작품 수가 25보다 작을 때 루프 탈출

        const urlElement = await page.waitForSelector(
          `#content > div > ul > li:nth-child(${novelNO}) > div > h3 > a`,
        );
        const novelURL = await page.evaluate(
          (urlElement) => urlElement.getAttribute("href"),
          urlElement,
        );

        const endElement = await page.waitForSelector(
          "#content > div > ul > li:nth-child(1) > div > h3 > a",
        );
        const _isEnd = await page.evaluate((endElement) => endElement.innerText, endElement);

        novelList.push({ url: novelURL, isEnd: !_isEnd.includes("미완결") });
        // console.log(novelList[novelNO - 1], "novel", novelNO);
      }

      // 다음 페이지 이동
      currentPageNO += 1;
      if (currentPageNO > totalPageNO) break;
      await page.goto(novelListUrl + currentPageNO);
    }

    // 로그인
    if (currentPageNO > totalPageNO) {
      // -시리즈 회원정보 입력
      // set id, pw
      let seriesID: string;
      let seriesPW: string;
      // handle undefined env variable
      if (process.env.SERIES_ID) {
        seriesID = process.env.SERIES_ID;
      } else {
        throw new Error("SERIES_ID env is not set");
      }
      if (process.env.SERIES_PW) {
        seriesPW = process.env.SERIES_PW;
      } else {
        throw new Error("SERIES_PW env is not set");
      }

      await page.goto("https://nid.naver.com/nidlogin.login");

      const idElement = await page.waitForSelector("#id");
      await page.evaluate(
        (seriesID, idElement) => (idElement.value = seriesID),
        seriesID,
        idElement,
      ); // id
      const pwElement = await page.waitForSelector("#pw");
      await page.evaluate(
        (seriesPW, pwElement) => (pwElement.value = seriesPW),
        seriesPW,
        pwElement,
      ); // password

      await page.click("#login_keep_wrap > div.keep_check > label"); // check 로그인상태유지
      await page.click("#frmNIDLogin > ul > li > div > div.btn_login_wrap"); // submit
      await page.waitForSelector("#frmNIDLogin > fieldset > span.btn_upload");
      await page.click("#frmNIDLogin > fieldset > span.btn_upload");
    }
    // ----------------------------------------------------------------//

    // 작품 상세페이지 조회 반복
    while (currentNovelNO <= totalNovelNO) {
      console.log(currentNovelNO, "currentNovelNO");
      await page.goto(`https://series.naver.com${novelList[currentNovelNO - 1].url}`);

      // 상세페이지 정보 읽기
      try {
        // get img
        const imgElement = await page.waitForSelector("#container > div.aside img");
        novelInfo.novelImg = await page.evaluate(
          (imgElement) => imgElement.getAttribute("src"),
          imgElement,
        );

        // get title : 제목 앞에 추가정보 붙은 경우 제외하고 가져오기
        const titleElement = await page.waitForSelector("#content > div.end_head > h2");
        novelInfo.novelTitle = await page.evaluate((titleElement) => {
          if (titleElement.childNodes.length !== 1) {
            const beforeTitle = titleElement.children[0].innerText;
            return titleElement.innerText.slice(beforeTitle.length);
          }
          return titleElement.innerText;
        }, titleElement);

        // get url, isEnd
        novelInfo.novelUrl = `https://series.naver.com${novelList[currentNovelNO - 1].url}`;
        novelInfo.novelIsEnd = novelList[currentNovelNO - 1].isEnd;

        // get desc : [더보기] 여부에 따라
        const descElement = await page.waitForSelector("#content > div.end_dsc > div:nth-child(1)");
        const _desc = await page.evaluate((descElement) => descElement.innerText, descElement);
        // [더보기] 버튼 있을 때 상세정보 받아오기
        if (_desc.slice(-3) === "더보기") {
          await page.click("#content > div.end_dsc > div:nth-child(1) span > a");
          await page.waitForSelector("#content > div.end_dsc.open > div:nth-last-child(1)");
          const moreDescElement = await page.waitForSelector(
            "#content > div.end_dsc > div:nth-last-child(1)",
          );
          const desc = await page.evaluate(
            (moreDescElement) => moreDescElement.innerText,
            moreDescElement,
          );
          novelInfo.novelDesc = desc.slice(0, -3); // '접기' 글자 제외
        }
        // [더보기] 없을 때 기존 정보 할당
        else {
          novelInfo.novelDesc = _desc;
        }

        // get author
        const authorElement = await page.waitForSelector(
          "#content > ul.end_info > li > ul > li:nth-child(3) > a",
        );
        novelInfo.novelAuthor = await page.evaluate(
          (authorElement) => authorElement.innerText,
          authorElement,
        );
        // get age
        const ageElement = await page.waitForSelector(
          "#content > ul.end_info > li > ul > li:nth-last-child(1)",
        );
        novelInfo.novelAge = await page.evaluate((ageElement) => ageElement.innerText, ageElement);

        // get genre : 로맨스, 로판, 판타지, 현판, 무협, 미스터리, 라이트노벨, BL
        const genreElement = await page.waitForSelector(
          "#content > ul.end_info > li > ul > li:nth-child(2) > span > a",
        );
        novelInfo.novelGenre = await page.evaluate(
          (genreElement) => genreElement.innerText,
          genreElement,
        );

        // set platform, id
        novelInfo.novelPlatform = "네이버 시리즈";
        novelInfo.novelId = getCurrentTime();

        console.log(novelInfo);

        // db 저장
        setNovel(novelInfo);

        currentNovelNO += 1; // 작품 번호 +1

        if (currentNovelNO % 100 === 0) break; // 작품 100번째 마다 loop 탈출. 시크릿창 여닫기
      } catch (err) {
        console.log(`${err} 현재작품: ${currentNovelNO}, 마지막작품: ${totalNovelNO}`);
        // 에러 발생 시 해당 작품은 통과. 시크릿창 여닫으며 다음 작품으로 넘어감
        currentNovelNO += 1; // 작품 번호 +1
        break;
      }
    }
    await context.close(); // 시크릿창 닫기
    if (totalNovelNO < currentNovelNO) break; // 전체 작품 조회 완료 후 루프 탈출
  }
  await browser.close();
}

// 스크래퍼 리디용 (페이지네이션)-----------------------------------------------------------------------------//
export async function scrapeRidi(genreNOs: string[]) {
  const browser = await puppeteer.launch({ headless: true });

  let isCategoryLoopEnd = false; // 전체 카테고리별 목록페이지 조회완료 여부

  const totalPageNO = []; // 필터 별 전체 페이지 수(참고용)
  let totalNovelNO = 0; // 전체 작품 수 : 0으로 해야 함. 필터 별 작품 수 추가하여 계산
  let currentPageNO = 1; // 현재 페이지 넘버
  let currentNovelNO = 1; // 현재 작품 넘버

  // 작품 리스트 : 작품 url 저장
  const novelList = [
    // { url: "/books/777097927", isAdult: false },
  ];

  // 반복. 브라우저 컨텍스트 열고 닫기. out of memory 방지
  // 시크릿창. 캐시나 쿠키 등을 공유하지 않음.
  // <중요> puppeteer.launch({headless:true}) 설정해야 context.close()로 브라우저 데이터 지울 수 있음.
  while (true) {
    const context = await browser.createIncognitoBrowserContext(); // 시크릿창 열기
    const page = await context.newPage();
    page.setDefaultTimeout(15000); // 마지막번호+1 작품(없음) 조회 시 대기 시간 줄이기

    // 카테고리 조회
    categoryLoop: for (let ctgIdx = 0; ctgIdx < genreNOs.length; ctgIdx++) {
      // 카테고리별 목록 페이지 전체 조회 완료라면 다시 조회하지 않음 : 시크릿창 닫고 새로 열 때 표시 필요
      if (isCategoryLoopEnd) break;

      // 목록페이지 url // with 최신순(최신화등록일)
      const novelListUrl = `https://ridibooks.com/category/books/${genreNOs[ctgIdx]}?order=recent&page=`;

      await page.goto(novelListUrl + currentPageNO); // 목록 페이지 이동

      // 목록 페이지 조회 반복
      while (true) {
        console.log(currentPageNO, "현재 페이지 번호");

        // 목록에서 각 작품 url 가져오기
        for (let novelNO = 1; novelNO < 21; novelNO++) {
          try {
            const novelElHandle = await page.waitForSelector(
              `#page_category > div.book_macro_wrapper.js_book_macro_wrapper > div:nth-child(${
                novelNO * 2 - 1
              }) > div.book_thumbnail_wrapper > div > a`,
            );
            // 작품 url 및 성인여부 저장
            let novelURL = await page.evaluate(
              (novelElHandle) => novelElHandle.getAttribute("href"),
              novelElHandle,
            );
            // url : "?" 부터 문자 제외
            novelURL = novelURL.slice(0, novelURL.indexOf("?"));

            // 성인 여부 : 비로그인 시 작품 표지가 19세 이용불가 이미지일 때 true
            const adultElement = await page.waitForSelector(
              `#page_category > div.book_macro_wrapper.js_book_macro_wrapper > div:nth-child(${
                novelNO * 2 - 1
              }) > div.book_thumbnail_wrapper > div > div > img`,
            );
            const isAdult = await page.evaluate(
              (adultElement) =>
                adultElement.getAttribute("src") ===
                "https://static.ridicdn.net/books/dist/images/book_cover/cover_adult.png",
              adultElement,
            );

            novelList.push({ url: novelURL, isAdult });
            // console.log("noveNO: " + novelNO + " novelURL: " + novelURL);
          } catch (err) {
            console.log(err, "읽어올 작품이 더 없을 확률 높음");

            // 읽어올 작품이 더 없을 때 현재 필터의 조회 종료
            // 직전 페이지가 마지막 페이지일 때
            if (novelNO === 1) {
              totalPageNO.push(currentPageNO - 1); // 해당 필터의 전체 페이지 수 표시
              totalNovelNO += (currentPageNO - 1) * 20; // 전체 작품 수에 해당 필터의 작품 수 추가
            }
            // 현재 페이지가 마지막 페이지일 때
            else if (novelNO !== 1) {
              totalPageNO.push(currentPageNO); // 해당 필터의 전체 페이지 수 표시
              totalNovelNO += (currentPageNO - 1) * 20 + (novelNO - 1); // 전체 작품 수에 해당 필터의 작품 수 추가
            }

            console.log(`totalPageNO: ${totalPageNO}totalNovelNO: ${totalNovelNO}`);
            currentPageNO = 1; // 현재 작품 넘버 1로 리셋

            continue categoryLoop; // 다음 카테고리 조회
          }
        }
        // 다음 페이지 이동
        currentPageNO += 1;
        await page.goto(novelListUrl + currentPageNO);
      }
    }

    // 로그인
    if (isCategoryLoopEnd) {
      // set id, pw
      let ridiID: string;
      let ridiPW: string;
      // handle undefined env variable
      if (process.env.RIDI_ID) {
        ridiID = process.env.RIDI_ID;
      } else {
        throw new Error("RIDI_ID env is not set");
      }
      if (process.env.RIDI_PW) {
        ridiPW = process.env.RIDI_PW;
      } else {
        throw new Error("RIDI_PW env is not set");
      }

      await page.goto(
        "https://ridibooks.com/account/login?return_url=https%3A%2F%2Fridibooks.com%2Fcategory%2Fbooks%2F1703%3Forder%3Drecent%26page%3D1",
      );

      const idElement = await page.waitForSelector("#login_id");
      await page.evaluate((ridiID, idElement) => (idElement.value = ridiID), ridiID, idElement);
      const pwElement = await page.waitForSelector("#login_pw");
      await page.evaluate((ridiPW, pwElement) => (pwElement.value = ridiPW), ridiPW, pwElement);
      await page.click("#login > form > div > div > label > input[type=checkbox]"); // check 로그인상태유지
      await page.click("#login > form > button"); // submit
    }
    // ----------------------------------------------------------------//

    // 작품 상세페이지 조회 반복
    while (isCategoryLoopEnd && totalNovelNO >= currentNovelNO) {
      console.log(
        `currentNovelNO: ${currentNovelNO}, totalNovelNO: ${totalNovelNO}, totalPageNoList:${totalPageNO}`,
      );
      try {
        // set url
        novelInfo.novelUrl = `https://ridibooks.com${novelList[currentNovelNO - 1].url}`;

        // go to detail page
        await new Promise((resolve) => setTimeout(resolve, 500)); // 로그인 후 페이지 리다이렉트 됨. 잠시 대기 후 상세페이지로 이동해야 에러 안 남.
        await page.goto(novelInfo.novelUrl);

        // 상세페이지 정보 읽기
        // get img
        const imgElement = await page.waitForSelector(
          "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_thumbnail_wrap > div.header_thumbnail.book_macro_200.detail_scalable_thumbnail > div > div > div > img",
        );
        novelInfo.novelImg = await page.evaluate(
          (imgElement) => imgElement.getAttribute("src"),
          imgElement,
        );

        // get title
        const titleElement = await page.waitForSelector(
          "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div.info_title_wrap > h3",
        );
        novelInfo.novelTitle = await page.evaluate(
          (titleElement) => titleElement.innerText,
          titleElement,
        );
        // get isEnd : element의 class에 따라 완결/미완 다름. 표시 없는 작품은 완결로 표시.
        novelInfo.novelIsEnd = await page.evaluate(() => {
          const notEndElement = document.querySelector(
            "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_info_series_complete_wrap > span.metadata_item.not_complete",
          );
          return notEndElement === null;
        });

        // get desc
        const descElement = await page.waitForSelector(
          "article.detail_box_module.detail_introduce_book #introduce_book > p",
        );
        const desc = await page.evaluate((descElement) => {
          // 첫 줄에 제목 + 로맨스 가이드 있을 때 그 부분 제외
          if (
            descElement.children[0].tagName === "SPAN" &&
            descElement.innerText.includes(">\n로맨스 가이드\n\n")
          ) {
            const _idx = descElement.innerText.indexOf(">\n로맨스 가이드\n\n");
            return descElement.innerText.slice(_idx + 11);
          }
          // 첫 줄 제목 제외
          if (
            descElement.children[0].tagName === "SPAN" &&
            (descElement.children.length === 1 || descElement.children[1].tagName !== "IMG")
          ) {
            const _idx = descElement.innerText.indexOf(">\n");
            return descElement.innerText.slice(_idx + 2);
          }
          // 첫 줄에 제목, 둘째 줄에 이미지, 셋째 넷째 비어있을 때 제외
          if (
            descElement.children[0].tagName === "SPAN" &&
            descElement.children[1].tagName === "IMG" &&
            descElement.children[2].tagName === "BR" &&
            descElement.children[3].tagName === "BR"
          ) {
            const _idx = descElement.innerText.indexOf(">\n\n\n");
            return descElement.innerText.slice(_idx + 4);
          }
        }, descElement);

        const keywords = await page.evaluate(() => {
          const keywordList = document.querySelectorAll(
            "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_box_module.detail_keyword.js_detail_keyword_module > ul > li",
          );
          let keywords = "";
          filterKeyword: for (let i = 0; i < keywordList.length; i++) {
            const keyword = keywordList[i].textContent;
            if (keyword === null) {
              throw new Error("키워드가 없는데도 반복문 실행됨");
            }
            const exceptKeys = [
              "만원",
              "3000",
              "리뷰",
              "별점",
              "평점",
              "연재",
              "단행본",
              "무료",
              "2013",
              "2015",
              "권이하",
              "년출간",
            ];
            for (let j = 0; j < exceptKeys.length; j++) {
              if (keyword.includes(exceptKeys[j])) continue filterKeyword;
              if (exceptKeys[j] === exceptKeys[exceptKeys.length - 1]) {
                keywords += `${keyword} `;
              }
            }
          }
          return keywords;
        });

        // set desc only : 기존 작품소개에 키워드가 포함되어 있거나 받아온 키워드가 없다면
        if (desc.includes("#") || desc.includes("키워드") || keywords === "") {
          novelInfo.novelDesc = desc;
        }
        // set desc with keywords
        else {
          novelInfo.novelDesc = `${keywords}\n\n${desc}`;
        }

        // get author
        const authorElement = await page.waitForSelector(
          "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > div:nth-child(4) > p.metadata.metadata_writer > span > a",
        );
        novelInfo.novelAuthor = await page.evaluate(
          (authorElement) => authorElement.innerText,
          authorElement,
        );
        // get age
        const ageElement = await page.waitForSelector("#notice_component > ul > li");
        const notification = await page.evaluate((ageElement) => ageElement.innerText, ageElement);
        novelInfo.novelAge =
          novelList[currentNovelNO - 1].isAdult === true
            ? "청소년 이용불가"
            : notification.includes("15세")
            ? "15세 이용가"
            : notification.includes("12세")
            ? "12세 이용가"
            : "전체 이용가";

        // get genre
        const genreElement = await page.waitForSelector(
          "#page_detail > div.detail_wrap > div.detail_body_wrap > section > article.detail_header.trackable > div.header_info_wrap > p",
        );
        const inputGenre = await page.evaluate(
          (genreElement) => genreElement.innerText,
          genreElement,
        );
        novelInfo.novelGenre = inputGenre.includes("로판")
          ? "로판"
          : inputGenre.includes("로맨스")
          ? "로맨스"
          : inputGenre.includes("무협")
          ? "무협"
          : inputGenre.includes("라이트노벨")
          ? "라이트노벨"
          : inputGenre.includes("BL")
          ? "BL"
          : inputGenre.includes("현대") ||
            inputGenre.includes("게임") ||
            inputGenre.includes("스포츠")
          ? "현판"
          : inputGenre.includes("판타지")
          ? "판타지"
          : "기타";

        // set platform, id
        novelInfo.novelPlatform = "리디북스";
        novelInfo.novelId = getCurrentTime();

        console.log(novelInfo);

        // db 저장
        setNovel(novelInfo);

        currentNovelNO += 1; // 작품 번호 +1

        if (currentNovelNO % 100 === 0) break; // 작품 100번째 마다 loop 탈출. 시크릿창 여닫기
      } catch (err) {
        console.log(`${err} \n 현재작품: ${currentNovelNO}, 마지막작품: ${totalNovelNO}`);
        // 에러 발생 시 해당 작품은 통과. 시크릿창 여닫으며 다음 작품으로 넘어감
        currentNovelNO += 1; // 작품 번호 +1
        break;
      }
    }
    // 카테고리 전체 조회 완료 시 표시 : 조회 완료 후 시크릿창 한 번 닫기 위해 이 위치에 넣음
    if (!isCategoryLoopEnd) {
      isCategoryLoopEnd = true;
    }
    await context.close(); // 시크릿창 닫기
    if (totalNovelNO < currentNovelNO) break; // 전체 작품 조회 완료 후 브라우저 닫기
  }
  await browser.close();
}
