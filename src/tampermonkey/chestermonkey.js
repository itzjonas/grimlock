// ==UserScript==
// @name         Grimlock (chester)
// @version      0.1.1
// @description  try to take over the world!
// @author       Chester.js
// @match        https://www.bing.com/*
// @match        https://account.microsoft.com/rewards*
// @run-at
// @grant        none
// ==/UserScript==

const { log } = console;

function letThingsLoad() {
    function chooseCircleAnswer(answers) {
        // TODO: choose random for index
        answers[0].onkeyup();
    }

    function skinnyCheckAndMark() {
        const skinnyBoxes = document.getElementsByClassName('rqOption');

        log('skinny buttons');

        if (skinnyBoxes.length) {
            for (let i = 0; i < skinnyBoxes.length; i += 1) {
                setTimeout(() => {
                    skinnyBoxes[i].click();
                    if (skinnyBoxes.length - 1 === i) {
                        skinnyCheckAndMark();
                    }
                }, 200);
            }
        } else {
            log('I think we close here?');
        }
    }

    function selectBoxes() {
        const boxes = document.getElementsByClassName('cico bt_clkImg');
        const skinnyBoxes = document.getElementsByClassName('rqOption');

        if (boxes.length) {
            for (let i = 0; i < boxes.length; i += 1) {
                setTimeout(() => {
                    boxes[i].click();
                }, 200);
            }
        }

        if (skinnyBoxes.length) {
            skinnyCheckAndMark();
        }
    }

    // quote of the day check;
    const qotd = document.getElementById('bt_qotd_Main');
    const bnq = document.getElementById('ListOfQuestionAndAnswerPanes');
    const windowLocation = window.location.pathname;
    const locationHasInculture = windowLocation.indexOf('inculture') > 0;
    const overlayQuiz = document.getElementsByClassName('TriviaOverlayData')[0];

    if (qotd) {
        setTimeout(() => {
            window.close();
        }, 1000);
    }

    if (bnq) {
        const quizAnswers = document.getElementsByClassName('wk_paddingBtm');
        // close
        const letsClosePage = document.getElementsByTagName('input');

        log('circle quizes');

        if (quizAnswers) {
            setTimeout(() => {
                chooseCircleAnswer(quizAnswers);
            }, 1000);
        } else {
            const getInputForNextQuestion = document.getElementsByTagName('input');

            for (let i = 0; i < getInputForNextQuestion.length; i += 1) {
                if (getInputForNextQuestion[i].value === 'Next question') {
                    getInputForNextQuestion[i].click();
                    setTimeout(() => {
                        const newQuizAnswers = document.getElementsByClassName('wk_paddingBtm');
                        chooseCircleAnswer(newQuizAnswers);
                    }, 1000);
                }
            }
        }

        for (let i = 0; i < letsClosePage.length; i += 1) {
            if (letsClosePage[i].value === 'Get your score') {
                window.close();
            }
        }
    }

    if (locationHasInculture) {
        setTimeout(() => {
            window.close();
        }, 4000);
    }

    if (overlayQuiz) {
        const startQuizButton = document.getElementById('rqStartQuiz');
        const squaresAreThere = document.getElementsByClassName('btOptions');
        const skinnyBoxesAreThere = document.getElementsByClassName('textBasedMultiChoice');
        const quizeComplete = document.getElementById('quizCompleteContainer');

        log('overlay quiz');

        if (startQuizButton && startQuizButton.value === 'Start playing') {
            log('we have start quize button');

            startQuizButton.click();
            setTimeout(() => {
                log('Lets do boxes');
                selectBoxes();
            }, 4000);
        }

        if (squaresAreThere.length > 0 || skinnyBoxesAreThere.length > 0) {
            log('squares or skinny squares start');

            selectBoxes();
        }

        if (quizeComplete) {
            log('quizeComplete');

            setTimeout(() => {
                window.close();
            }, 2500);
        }

        // possilby only for daily pole?
        if (document.getElementById('btoption0')) {
            document.getElementById('btoption0').click();

            setTimeout(() => {
                window.close();
            }, 4000);
        }

        // do we need something for virtual tours? just need to close page after it loads
    }
}

setTimeout(() => {
    // window.close();
    letThingsLoad();
}, 2500);
