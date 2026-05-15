let startTime = 0;
let timerInterval = null;
let gameLimitTimer = null;
let randomBackgroundGimmickTimer = null;
let confirmAutoGimmickTimer = null;
let openTimeInterval = null;
let helpPopupTimer = null;
let isHelpPopupTriggered = false;
let macroSabotageHandler = null;

let isGameStarted = false;
let isGameOver = false;
let isRegistrationOpen = false;
let isGameTimerStarted = false;
let openTimeSeconds = 0;

let courseCount = 0;
let creditCount = 0;

let selectedCourse = null;
let selectedButton = null;
let currentMacroCode = "";
let confirmStep = 0;

let timeGimmickStart = 0;
let timeGimmickInterval = null;
let isMouseReverse = false;

let appliedCourseCodes = new Set();
let reflectedCourseCodes = new Set();
let appliedCourses = [];
let appliedButtons = [];
let confirmAutoGimmickCount = 0;
let currentPlayerName = "";

const GAME_LIMIT_SECONDS = 90;
const MAX_CONFIRM_AUTO_GIMMICKS = 2;
const OPEN_TIME_START_SECONDS = 9 * 60 * 60 + 59 * 60 + 50;
const OPEN_TIME_END_SECONDS = 10 * 60 * 60;
const RANKING_STORAGE_KEY = "courseGameRankings";
const MAX_RANKING_COUNT = 10;


const courses = [
    { subjectCode: "009914", classNumber: "001", department: "컴퓨터공학과", courseName: "공학설계기초", credit: "3.0/3/0", courseType: "전선", grade: "2", schedule: "금 09:00-12:00" },
    { subjectCode: "009952", classNumber: "004", department: "컴퓨터공학과", courseName: "자료구조및실습", credit: "3.0/3/0", courseType: "전필", grade: "2", schedule: "화목 14:00-16:00" },
    { subjectCode: "011320", classNumber: "001", department: "대양휴머니티칼리지", courseName: "인공지능과빅데이터", credit: "3.0/2/1", courseType: "기필", grade: "2", schedule: "" },
    { subjectCode: "011238", classNumber: "001", department: "대양휴머니티칼리지", courseName: "우주자연인간", credit: "1.0/1/0", courseType: "공필", grade: "1", schedule: "" },
    { subjectCode: "004118", classNumber: "002", department: "컴퓨터공학과", courseName: "디지털시스템", credit: "3.0/3/0", courseType: "전필", grade: "2", schedule: "화목 12:00-14:00" },
    { subjectCode: "007330", classNumber: "002", department: "컴퓨터공학과", courseName: "확률및통계", credit: "3.0/3/0", courseType: "전기", grade: "2", schedule: "월수 13:30-15:00" }
];

const timer = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const rankingBtn = document.getElementById("rankingBtn");
const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");
const loginForm = document.getElementById("loginForm");
const nameInput = document.getElementById("nameInput");
const userNameText = document.getElementById("userNameText");
const openTimeText = document.getElementById("openTimeText");

const courseTable = document.getElementById("courseTable");
const selectedCourses = document.getElementById("selectedCourses");

const courseCountText = document.getElementById("courseCount");
const creditCountText = document.getElementById("creditCount");

const macroModal = document.getElementById("macroModal");
const macroNumber = document.getElementById("macroNumber");
const macroInput = document.getElementById("macroInput");
const macroSubmitBtn = document.getElementById("macroSubmitBtn");
const macroCancelBtn = document.getElementById("macroCancelBtn");
const macroCloseBtn = document.getElementById("macroCloseBtn");

const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmCourseName = document.getElementById("confirmCourseName");
const confirmOkBtn = document.getElementById("confirmOkBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmCloseBtn = document.getElementById("confirmCloseBtn");

const earlyStartModal = document.getElementById("earlyStartModal");
const earlyStartOkBtn = document.getElementById("earlyStartOkBtn");
const earlyStartCancelBtn = document.getElementById("earlyStartCancelBtn");
const earlyStartCloseBtn = document.getElementById("earlyStartCloseBtn");

const timerGimmickModal = document.getElementById("timerGimmickModal");
const timeGimmickNumber = document.getElementById("timeGimmickNumber");
const timeStopBtn = document.getElementById("timeStopBtn");
const timeGimmickCloseBtn = document.getElementById("timeGimmickCloseBtn");
const rankingModal = document.getElementById("rankingModal");
const rankingList = document.getElementById("rankingList");
const rankingEmpty = document.getElementById("rankingEmpty");
const rankingCloseBtn = document.getElementById("rankingCloseBtn");
const rankingOkBtn = document.getElementById("rankingOkBtn");
const rankingResetBtn = document.getElementById("rankingResetBtn");

const helpPopupModal = document.getElementById("helpPopupModal");
const helpQuestion = document.getElementById("helpQuestion");
const helpResult = document.getElementById("helpResult");
const helpResultImg = document.getElementById("helpResultImg");
const helpYesBtn = document.getElementById("helpYesBtn");
const helpNoBtn = document.getElementById("helpNoBtn");
const helpConfirmBtn = document.getElementById("helpConfirmBtn");

const runawayModal = document.getElementById("runawayModal");
const runawayArea = document.getElementById("runawayArea");
const runawayBtn = document.getElementById("runawayBtn");

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = nameInput.value.trim();

    if (!name) {
        alert("이름을 입력하세요.");
        nameInput.focus();
        return;
    }

    // 서버에 이름 기록 후 게임 화면으로 전환
    fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (!data.success) {
            console.error("로그인 실패:", data.message);
        }
    })
    .catch(function (err) {
        console.error("로그인 서버 오류:", err);
    })
    .finally(function () {
        // 서버 응답과 무관하게 게임 화면으로 전환
        currentPlayerName = name;
        userNameText.textContent = name + "님";
        loginScreen.style.display = "none";
        app.style.display = "block";
        startOpenTimeClock();
    });
});

function startOpenTimeClock() {
    clearInterval(openTimeInterval);

    isRegistrationOpen = false;
    openTimeSeconds = OPEN_TIME_START_SECONDS;
    openTimeText.textContent = formatClockTime(openTimeSeconds);

    openTimeInterval = setInterval(function () {
        if (openTimeSeconds >= OPEN_TIME_END_SECONDS) {
            clearInterval(openTimeInterval);
            isRegistrationOpen = true;
            openTimeText.textContent = formatClockTime(OPEN_TIME_END_SECONDS);
            return;
        }

        openTimeSeconds++;
        openTimeText.textContent = formatClockTime(openTimeSeconds);

        if (openTimeSeconds >= OPEN_TIME_END_SECONDS) {
            clearInterval(openTimeInterval);
            isRegistrationOpen = true;
            startGameTimer();
        }
    }, 1000);
}

function startGameTimer() {
    if (isGameTimerStarted || isGameOver) {
        return;
    }

    isGameTimerStarted = true;
    startTime = Date.now();
    timer.textContent = GAME_LIMIT_SECONDS.toFixed(2) + "초";

    timerInterval = setInterval(function () {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const remainTime = GAME_LIMIT_SECONDS - elapsedTime;

        if (remainTime <= 0) {
            timer.textContent = "00.00초";
            gameOver();
            return;
        }

        timer.textContent = remainTime.toFixed(2) + "초";
    }, 10);

    gameLimitTimer = setTimeout(function () {
        gameOver();
    }, GAME_LIMIT_SECONDS * 1000);
}

function formatClockTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return padClockNumber(hours) + "시 " + padClockNumber(minutes) + "분 " + padClockNumber(seconds) + "초";
}

function padClockNumber(value) {
    return String(value).padStart(2, "0");
}

function openEarlyStartModal() {
    earlyStartModal.style.display = "flex";
}

function closeEarlyStartModal() {
    earlyStartModal.style.display = "none";
}

earlyStartOkBtn.addEventListener("click", closeEarlyStartModal);
earlyStartCancelBtn.addEventListener("click", closeEarlyStartModal);
earlyStartCloseBtn.addEventListener("click", closeEarlyStartModal);

rankingBtn.addEventListener("click", openRankingModal);
rankingCloseBtn.addEventListener("click", closeRankingModal);
rankingOkBtn.addEventListener("click", closeRankingModal);
rankingResetBtn.addEventListener("click", function () {
    if (!confirm("랭킹 기록을 모두 삭제하시겠습니까?")) {
        return;
    }

    localStorage.removeItem(RANKING_STORAGE_KEY);
    renderRankings();
});

window.addEventListener("load", function () {
    nameInput.focus();

    courseTable.innerHTML = "";
    selectedCourses.innerHTML = "";

    for (let i = 0; i < 4; i++) {
        const emptyRow = document.createElement("tr");

        emptyRow.innerHTML = `
            <td>&nbsp;</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        `;

        courseTable.appendChild(emptyRow);
    }

    updateSummary();
});

startBtn.addEventListener("click", function () {
    if (!isRegistrationOpen) {
        openEarlyStartModal();
        return;
    }

    startGameTimer();

    if (isGameStarted) return;

    isGameStarted = true;
    isGameOver = false;

    courseCount = 0;
    creditCount = 0;

    appliedCourseCodes.clear();
    reflectedCourseCodes.clear();
    appliedCourses = [];
    appliedButtons = [];
    confirmAutoGimmickCount = 0;
    isHelpPopupTriggered = false;
    clearConfirmAutoGimmickTimer();

    selectedCourses.innerHTML = "";
    updateSummary();
    renderRandomCourses();

    startBtn.textContent = "진행 중";
    startBtn.disabled = true;
    startBtn.style.display = "none";
    openTimeText.style.display = "none";

    startRandomBackgroundGimmicks();
    scheduleHelpPopup();
});

function renderRandomCourses() {
    const shuffledCourses = [...courses].sort(function () {
        return Math.random() - 0.5;
    });

    courseTable.innerHTML = "";

    shuffledCourses.forEach(function (course, index) {
        const row = document.createElement("tr");
        row.dataset.subjectCode = course.subjectCode;

        row.innerHTML = `
            <td>${index + 1}</td>
            <td><button class="apply-btn">신청</button></td>
            <td>${course.subjectCode}</td>
            <td>${course.classNumber}</td>
            <td>${course.department}</td>
            <td>${course.courseName}</td>
            <td><button class="mini-btn">수업계획서</button></td>
            <td></td>
            <td>${course.credit}</td>
            <td>${course.courseType}</td>
            <td>${course.grade}</td>
            <td>${course.schedule}</td>
            <td><button class="mini-btn">인원보기</button></td>
        `;

        const applyBtn = row.querySelector(".apply-btn");

        applyBtn.addEventListener("click", function () {
            startRandomApplyGimmick(course, applyBtn);
        });

        courseTable.appendChild(row);
    });
}

function startRandomApplyGimmick(course, button) {
    if (!isGameStarted || isGameOver) {
        alert("게임이 진행 중이 아닙니다.");
        return;
    }

    selectedCourse = course;
    selectedButton = button;

    const gimmicks = [
        openMacroModal,
        openLongMacroModal,
        openTimeGimmick,
        openRunawayGimmick,
        openSabotagedMacroGimmick
    ];

    const randomIndex = Math.floor(Math.random() * gimmicks.length);
    gimmicks[randomIndex]();
}

/* 도망가는 버튼 기믹 */
function openRunawayGimmick() {
    resetRunawayButtonPosition();
    runawayModal.style.display = "flex";
}

function closeRunawayGimmick() {
    runawayModal.style.display = "none";
}

function resetRunawayButtonPosition() {
    runawayBtn.style.left = "50%";
    runawayBtn.style.top = "50%";
    runawayBtn.style.transform = "translate(-50%, -50%)";
}

runawayBtn.addEventListener("mouseover", function () {
    const maxX = runawayArea.clientWidth - runawayBtn.offsetWidth - 10;
    const maxY = runawayArea.clientHeight - runawayBtn.offsetHeight - 10;

    runawayBtn.style.transform = "none";
    runawayBtn.style.left = Math.max(5, Math.random() * maxX) + "px";
    runawayBtn.style.top = Math.max(5, Math.random() * maxY) + "px";
});

runawayBtn.addEventListener("click", function () {
    if (isGameOver) return;

    closeRunawayGimmick();
    openMacroModal();
});

/* 방해 매크로: 2번째 글자 입력 시 랜덤하게 바꿔치기 */
function openSabotagedMacroGimmick() {
    openMacroModal();
    clearMacroSabotage();

    macroSabotageHandler = function () {
        if (macroInput.value.length !== 2) return;

        const originalValue = macroInput.value;
        const firstChar = originalValue[0];
        const secondChar = originalValue[1];
        const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        let fakeChar = chars[Math.floor(Math.random() * chars.length)];

        if (fakeChar === secondChar) {
            fakeChar = chars[(chars.indexOf(fakeChar) + 1) % chars.length];
        }

        macroInput.value = firstChar + fakeChar;
        clearMacroSabotage();
    };

    macroInput.addEventListener("input", macroSabotageHandler);
}

function clearMacroSabotage() {
    if (!macroSabotageHandler) return;

    macroInput.removeEventListener("input", macroSabotageHandler);
    macroSabotageHandler = null;
}

/* 도움 요청 팝업 — 게임 당 1회, 20~45초 사이 랜덤 타이밍에 표시 */
function scheduleHelpPopup() {
    if (isHelpPopupTriggered) return;

    clearTimeout(helpPopupTimer);

    const delay = Math.floor(Math.random() * 25000) + 20000;

    helpPopupTimer = setTimeout(function () {
        if (!isGameStarted || isGameOver || isHelpPopupTriggered) return;
        isHelpPopupTriggered = true;
        showHelpPopup();
    }, delay);
}

function showHelpPopup() {
    helpQuestion.style.display = "block";
    helpResult.style.display = "none";
    helpResultImg.src = "";
    helpPopupModal.style.display = "flex";
}

function closeHelpPopup() {
    helpPopupModal.style.display = "none";
}

// 도와준다 → _02 이미지
helpYesBtn.addEventListener("click", function () {
    helpResultImg.src = "KakaoTalk_20260516_024154413_02.png";
    helpQuestion.style.display = "none";
    helpResult.style.display = "block";
});

// 도와주지 않는다 → _01 이미지
helpNoBtn.addEventListener("click", function () {
    helpResultImg.src = "KakaoTalk_20260516_024154413_01.png";
    helpQuestion.style.display = "none";
    helpResult.style.display = "block";
});

// 확인 버튼으로 팝업 닫기
helpConfirmBtn.addEventListener("click", closeHelpPopup);

/* 수강신청 중 랜덤 배경 기믹 */
function startRandomBackgroundGimmicks() {
    randomBackgroundGimmickTimer = setInterval(function () {
        if (!isGameStarted || isGameOver) return;

        const random = Math.random();

        if (random < 0.5) {
            startScreenInvert();
        } else {
            startMouseReverse();
        }
    }, 12000);
}

/* 기본 매크로 */
function openMacroModal() {
    currentMacroCode = makeRandomCode(4);

    macroNumber.textContent = currentMacroCode;
    macroInput.value = "";

    resetMacroStyle();

    macroModal.style.display = "flex";
}

/* 긴 매크로: 4~10자 */
function openLongMacroModal() {
    const length = Math.floor(Math.random() * 7) + 4;

    currentMacroCode = makeRandomCode(length);
    macroNumber.textContent = currentMacroCode;

    if (length <= 6) {
        macroNumber.style.fontSize = "88px";
        macroNumber.style.letterSpacing = "16px";
    } else if (length <= 8) {
        macroNumber.style.fontSize = "68px";
        macroNumber.style.letterSpacing = "10px";
    } else {
        macroNumber.style.fontSize = "54px";
        macroNumber.style.letterSpacing = "6px";
    }

    macroNumber.style.whiteSpace = "nowrap";
    macroNumber.style.overflow = "hidden";

    macroInput.value = "";
    macroModal.style.display = "flex";
}

function makeRandomCode(length) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
}

macroSubmitBtn.addEventListener("click", function () {
    if (isGameOver) return;

    if (macroInput.value.trim() !== currentMacroCode) {
        alert("매크로 번호가 일치하지 않습니다.");
        macroInput.value = "";
        return;
    }

    macroModal.style.display = "none";
    clearMacroSabotage();
    resetMacroStyle();
    openConfirmStep1();
});

macroCancelBtn.addEventListener("click", closeMacroModal);
macroCloseBtn.addEventListener("click", closeMacroModal);

function closeMacroModal() {
    macroModal.style.display = "none";
    clearMacroSabotage();
    resetMacroStyle();
}

function resetMacroStyle() {
    macroNumber.style.fontSize = "118px";
    macroNumber.style.letterSpacing = "25px";
    macroNumber.style.whiteSpace = "normal";
    macroNumber.style.overflow = "visible";
}

/* 3초 정확히 맞추기 */
function openTimeGimmick() {
    timerGimmickModal.style.display = "flex";
    timeGimmickStart = Date.now();

    clearInterval(timeGimmickInterval);

    timeGimmickInterval = setInterval(function () {
        const elapsed = (Date.now() - timeGimmickStart) / 1000;
        timeGimmickNumber.textContent = elapsed.toFixed(2).replace(".", ":");
    }, 10);
}

timeStopBtn.addEventListener("click", function () {
    if (isGameOver) return;

    const elapsed = (Date.now() - timeGimmickStart) / 1000;

    clearInterval(timeGimmickInterval);

    if (elapsed >= 2.95 && elapsed <= 3.12) {
        timerGimmickModal.style.display = "none";
        openConfirmStep1();
    } else {
        alert("실패했습니다. 3초에 정확히 맞춰 다시 시도하세요.");
        openTimeGimmick();
    }
});

timeGimmickCloseBtn.addEventListener("click", closeTimeGimmick);

function closeTimeGimmick() {
    clearInterval(timeGimmickInterval);
    timerGimmickModal.style.display = "none";
}

/* 화면 반전 10초 */
function startScreenInvert() {
    if (document.body.classList.contains("screen-invert")) return;

    document.body.classList.add("screen-invert");

    setTimeout(function () {
        document.body.classList.remove("screen-invert");
    }, 10000);
}

/* 마우스 반전 10초 */
function startMouseReverse() {
    if (isMouseReverse) return;

    isMouseReverse = true;

    document.addEventListener("mousemove", reverseMouseMove);

    setTimeout(function () {
        endMouseReverse();
    }, 10000);
}

function reverseMouseMove(event) {
    const reversedX = window.innerWidth - event.clientX;
    const reversedY = window.innerHeight - event.clientY;

    window.scrollTo(reversedX * 0.01, reversedY * 0.01);
}

function endMouseReverse() {
    document.removeEventListener("mousemove", reverseMouseMove);
    isMouseReverse = false;
}

/* 수강신청 확인창 */
function openConfirmStep1() {
    if (isGameOver) return;

    confirmStep = 1;

    confirmMessage.innerHTML = `
        선택한 과목을 수강신청 하시겠습니까?<br><br>
        교과목명(Course Title)
    `;

    confirmCourseName.textContent = selectedCourse.courseName;

    randomizeConfirmButtonOrder();

    confirmModal.style.display = "flex";
    scheduleConfirmAutoGimmick();
}

function openConfirmStep2() {
    if (isGameOver) return;

    confirmStep = 2;

    confirmMessage.innerHTML = `
        과목이 신청 되었습니다. 수강신청내역을 재 조회 하시겠습니까?<br><br>
        ※ 취소를 선택하실 경우 [수강신청내역]이 갱신되지 않습니다.<br><br>
        취소를 선택하실 경우 수강신청 최종 완료 후 반드시 [수강신청내역]
        재조회를 눌러 신청내역을 확인하세요.
    `;

    confirmCourseName.textContent = "";

    randomizeConfirmButtonOrder();

    confirmModal.style.display = "flex";
    scheduleConfirmAutoGimmick();
}

function scheduleConfirmAutoGimmick() {
    clearConfirmAutoGimmickTimer();

    if (!isGameStarted || isGameOver || confirmAutoGimmickCount >= MAX_CONFIRM_AUTO_GIMMICKS) {
        return;
    }

    if (Math.random() > 0.45) {
        return;
    }

    const delay = Math.floor(Math.random() * 1600) + 700;

    confirmAutoGimmickTimer = setTimeout(function () {
        if (!isGameStarted || isGameOver || confirmAutoGimmickCount >= MAX_CONFIRM_AUTO_GIMMICKS) {
            return;
        }

        if (confirmModal.style.display !== "flex" || confirmStep === 0 || confirmOkBtn.disabled) {
            return;
        }

        confirmAutoGimmickCount++;

        if (Math.random() < 0.5) {
            confirmOkBtn.click();
        } else {
            confirmCancelBtn.click();
        }
    }, delay);
}

function clearConfirmAutoGimmickTimer() {
    clearTimeout(confirmAutoGimmickTimer);
    confirmAutoGimmickTimer = null;
}

function randomizeConfirmButtonOrder() {
    if (Math.random() < 0.5) {
        confirmOkBtn.style.order = "2";
        confirmCancelBtn.style.order = "1";
    } else {
        confirmOkBtn.style.order = "1";
        confirmCancelBtn.style.order = "2";
    }
}

function resetConfirmButtons() {
    confirmOkBtn.style.order = "1";
    confirmCancelBtn.style.order = "2";
}

confirmOkBtn.addEventListener("click", function () {
    if (isGameOver) return;

    clearConfirmAutoGimmickTimer();

    if (confirmStep === 1) {
        openConfirmStep2();
    } else if (confirmStep === 2) {
        confirmOkBtn.disabled = true;
        confirmOkBtn.textContent = "처리중";

        setTimeout(function () {
            confirmModal.style.display = "none";
            confirmOkBtn.disabled = false;
            confirmOkBtn.textContent = "확인";
            resetConfirmButtons();

            applyCourse(selectedCourse, selectedButton, true);
            reflectAppliedCourses();

            selectedCourse = null;
            selectedButton = null;
            currentMacroCode = "";
            confirmStep = 0;
        }, 2000);
    }
});

confirmCancelBtn.addEventListener("click", function () {
    clearConfirmAutoGimmickTimer();

    if (confirmStep === 2) {
        applyCourse(selectedCourse, selectedButton, false);

        confirmModal.style.display = "none";
        resetConfirmButtons();

        selectedCourse = null;
        selectedButton = null;
        currentMacroCode = "";
        confirmStep = 0;
    } else {
        closeConfirmModal();
    }
});
confirmCloseBtn.addEventListener("click", closeConfirmModal);

function closeConfirmModal() {
    clearConfirmAutoGimmickTimer();
    confirmModal.style.display = "none";
    resetConfirmButtons();
    confirmStep = 0;
}

/* 실제 수강신청 처리 */
function applyCourse(course, button, markComplete) {
    if (isGameOver) return;

    if (appliedCourseCodes.has(course.subjectCode)) {
        return;
    }

    appliedCourseCodes.add(course.subjectCode);
    appliedCourses.push({
        course: course,
        button: button
    });
    appliedButtons.push(button);

    courseCount++;

    const creditValue = parseFloat(course.credit);
    creditCount += creditValue;

    if (markComplete) {
        button.disabled = true;
        button.textContent = "완료";
    }

    updateSummary();
    checkClear();
}

function reflectAppliedCourses() {
    appliedCourses.forEach(function (item) {
        if (reflectedCourseCodes.has(item.course.subjectCode)) {
            return;
        }

        addSelectedCourseRow(item.course, item.button);
        reflectedCourseCodes.add(item.course.subjectCode);
    });

    removeAppliedCoursesFromTargetTable();
    markAllAppliedButtonsComplete();
    updateSelectedCourseNumbers();
}

function addSelectedCourseRow(course, button) {
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
        <td></td>
        <td><button class="delete-btn">삭제</button></td>
        <td>${course.subjectCode}</td>
        <td>${course.classNumber}</td>
        <td>${course.department}</td>
        <td>${course.courseName}</td>
        <td><button class="mini-btn">수업계획서</button></td>
        <td></td>
        <td>${course.credit}</td>
        <td>${course.courseType}</td>
        <td>-</td>
        <td>${course.schedule}</td>
        <td><button class="mini-btn">인원보기</button></td>
    `;

    selectedCourses.appendChild(newRow);

    const deleteBtn = newRow.querySelector(".delete-btn");
    const creditValue = parseFloat(course.credit);

    deleteBtn.addEventListener("click", function () {
        if (isGameOver) return;

        newRow.remove();

        appliedCourseCodes.delete(course.subjectCode);
        reflectedCourseCodes.delete(course.subjectCode);
        appliedCourses = appliedCourses.filter(function (item) {
            return item.course.subjectCode !== course.subjectCode;
        });
        appliedButtons = appliedButtons.filter(function (savedButton) {
            return savedButton !== button;
        });

        courseCount--;
        creditCount -= creditValue;

        button.disabled = false;
        button.textContent = "신청";

        updateSelectedCourseNumbers();
        updateSummary();
    });
}

function markAllAppliedButtonsComplete() {
    appliedButtons.forEach(function (button) {
        button.disabled = true;
        button.textContent = "완료";
    });
}

function removeAppliedCoursesFromTargetTable() {
    const rows = courseTable.querySelectorAll("tr");

    rows.forEach(function (row) {
        if (appliedCourseCodes.has(row.dataset.subjectCode)) {
            row.remove();
        }
    });

    updateTargetCourseNumbers();
}

function updateTargetCourseNumbers() {
    const rows = courseTable.querySelectorAll("tr");

    rows.forEach(function (row, index) {
        row.children[0].textContent = index + 1;
    });
}

function updateSelectedCourseNumbers() {
    const rows = selectedCourses.querySelectorAll("tr");

    rows.forEach(function (row, index) {
        row.children[0].textContent = index + 1;
    });
}

function updateSummary() {
    courseCountText.textContent = courseCount;
    creditCountText.textContent = creditCount;
}

function openRankingModal() {
    rankingModal.style.display = "flex";
    rankingList.innerHTML = "";
    rankingEmpty.style.display = "none";

    // 서버에서 랭킹 데이터를 가져와 표시
    fetch("/api/ranking")
        .then(function (res) { return res.json(); })
        .then(function (data) { renderServerRankings(data); })
        .catch(function () { renderRankings(); }); // 서버 오류 시 로컬 데이터로 대체
}

function renderServerRankings(rankings) {
    rankingList.innerHTML = "";
    rankingEmpty.style.display = rankings.length === 0 ? "block" : "none";

    rankings.forEach(function (entry) {
        const row = document.createElement("tr");
        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const timeCell = document.createElement("td");
        const courseCell = document.createElement("td");

        rankCell.textContent = entry.rank;
        nameCell.textContent = entry.username;
        timeCell.textContent = entry.remainingSeconds + "초 남음";
        courseCell.textContent = courses.length + "개";

        row.append(rankCell, nameCell, timeCell, courseCell);
        rankingList.appendChild(row);
    });
}

function closeRankingModal() {
    rankingModal.style.display = "none";
}

function getRankings() {
    const savedRankings = localStorage.getItem(RANKING_STORAGE_KEY);

    if (!savedRankings) {
        return [];
    }

    try {
        const rankings = JSON.parse(savedRankings);

        if (!Array.isArray(rankings)) {
            return [];
        }

        return rankings;
    } catch (error) {
        return [];
    }
}

function saveRanking(clearTime) {
    const playerName = currentPlayerName || "이름없음";
    const rankings = getRankings();

    rankings.push({
        name: playerName,
        time: Number(clearTime.toFixed(2)),
        courses: courses.length,
        savedAt: new Date().toISOString()
    });

    rankings.sort(function (first, second) {
        return first.time - second.time;
    });

    localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(rankings.slice(0, MAX_RANKING_COUNT)));
}

function renderRankings() {
    const rankings = getRankings();

    rankingList.innerHTML = "";
    rankingEmpty.style.display = rankings.length === 0 ? "block" : "none";

    rankings.forEach(function (ranking, index) {
        const row = document.createElement("tr");
        const rankCell = document.createElement("td");
        const nameCell = document.createElement("td");
        const timeCell = document.createElement("td");
        const courseCell = document.createElement("td");

        rankCell.textContent = index + 1;
        nameCell.textContent = ranking.name;
        timeCell.textContent = Number(ranking.time).toFixed(2) + "초";
        courseCell.textContent = (ranking.courses || courses.length) + "개";

        row.append(rankCell, nameCell, timeCell, courseCell);
        rankingList.appendChild(row);
    });
}

function checkClear() {
    if (appliedCourseCodes.size === courses.length) {
        gameClear();
    }
}

function gameClear() {
    clearInterval(timerInterval);
    clearTimeout(gameLimitTimer);
    clearInterval(randomBackgroundGimmickTimer);
    clearConfirmAutoGimmickTimer();
    clearTimeout(helpPopupTimer);
    helpPopupModal.style.display = "none";
    reflectAppliedCourses();
    isGameTimerStarted = false;

    const clearTime = (Date.now() - startTime) / 1000;
    const remainingSeconds = Math.max(0, GAME_LIMIT_SECONDS - clearTime);

    // 서버에 남은 시간 제출 완료 후 알림 + 랭킹 모달 오픈 (타이밍 문제 방지)
    fetch("/api/ranking/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remainingSeconds: Math.floor(remainingSeconds) })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (!data.success) {
            console.error("랭킹 등록 실패:", data.message);
        }
    })
    .catch(function (err) {
        console.error("랭킹 서버 오류:", err);
    })
    .finally(function () {
        // 제출 완료 후 알림과 랭킹 모달 표시
        alert("수강신청 성공! 기록: " + clearTime.toFixed(2) + "초 (남은 시간: " + Math.floor(remainingSeconds) + "초)");
        openRankingModal();
    });

    isGameStarted = false;
}

function gameOver() {
    if (isGameOver) return;

    isGameOver = true;
    isGameStarted = false;
    isGameTimerStarted = false;

    clearInterval(timerInterval);
    clearTimeout(gameLimitTimer);
    clearInterval(randomBackgroundGimmickTimer);
    clearConfirmAutoGimmickTimer();
    clearInterval(timeGimmickInterval);
    reflectAppliedCourses();

    macroModal.style.display = "none";
    confirmModal.style.display = "none";
    timerGimmickModal.style.display = "none";
    runawayModal.style.display = "none";
    helpPopupModal.style.display = "none";
    clearTimeout(helpPopupTimer);
    clearMacroSabotage();

    document.body.classList.remove("screen-invert");
    endMouseReverse();

    const applyButtons = document.querySelectorAll(".apply-btn");
    applyButtons.forEach(function (button) {
        button.disabled = true;
    });

    startBtn.textContent = "게임 오버";
    startBtn.disabled = true;
    startBtn.style.display = "block";

    alert("게임 오버! 제한시간 90초 안에 수강신청을 완료하지 못했습니다.");
}
