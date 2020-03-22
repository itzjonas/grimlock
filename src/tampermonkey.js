// ==UserScript==
// @name         Bing Stuff
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.bing.com*
// @match        https://www.bing.com/*
// @match        https://www.microsoft.com/*
// @run-at
// @grant        none
// ==/UserScript==

function letThingsLoad() {
    // functions
        function chooseCircleAnswer(answers) {
            // TODO: choose random for index
            answers[0].onkeyup();
        }
    
        function skinnyCheckAndMark() {
            console.log('skinny buttons');
            var skinnyBoxes = document.getElementsByClassName('rqOption');
            if (skinnyBoxes.length) {
                for (let i = 0; i < skinnyBoxes.length; i += 1) {
                    setTimeout(() => {
                        skinnyBoxes[i].click();
                        if(skinnyBoxes.length - 1 === i) {
                            skinnyCheckAndMark();
                        }
                    }, 200);
                }
            } else {
                console.log('I think we close here?');
            }
        }
    
        function selectBoxes() {
            var boxes = document.getElementsByClassName('cico bt_clkImg');
            var skinnyBoxes = document.getElementsByClassName('rqOption');
    
            if(boxes.length) {
                for (let i = 0; i < boxes.length; i += 1) {
                    setTimeout(() => {
                        boxes[i].click();
                    }, 200)
                }
            }
    
            if (skinnyBoxes.length) {
                skinnyCheckAndMark();
            }
        }
    
        // quote of the day check;
        var qotd = document.getElementById('bt_qotd_Main');
        var bnq = document.getElementById('ListOfQuestionAndAnswerPanes');
        var windowLocation = window.location.pathname;
        var locationHasInculture = windowLocation.indexOf('inculture') > 0;
        var overlayQuiz = document.getElementsByClassName('TriviaOverlayData')[0];
    
        if (qotd) {
            setTimeout(() => {
                window.close();
            }, 1000);
        }
    
        if (bnq) {
            var quizAnswers = document.getElementsByClassName('wk_paddingBtm');
            console.log('circle quizes');
    
            if (quizAnswers) {
                 setTimeout(() => {
                     chooseCircleAnswer(quizAnswers);
                 }, 1000);
            } else {
                var getInputForNextQuestion = document.getElementsByTagName('input');
                for(let i = 0; i < getInputForNextQuestion.length; i += 1) {
                     if (getInputForNextQuestion[i].value === 'Next question') {
                         getInputForNextQuestion[i].click();
                         setTimeout(() => {
                            var newQuizAnswers = document.getElementsByClassName('wk_paddingBtm');
                            chooseCircleAnswer(newQuizAnswers);
                         }, 1000)
                    }
                }
            }
    
            // close
            var letsClosePage = document.getElementsByTagName('input');
            for(let i = 0; i < letsClosePage.length; i += 1) {
                if (letsClosePage[i].value === 'Get your score') {
                    window.close();
                }
            }
        }
    
        if (locationHasInculture) {
            setTimeout(() => {
                window.close();
            }, 4000)
        }
    
        if (overlayQuiz) {
            var startQuizButton = document.getElementById('rqStartQuiz');
            var squaresAreThere = document.getElementsByClassName('btOptions');
            var skinnyBoxesAreThere = document.getElementsByClassName('textBasedMultiChoice');
            var quizeComplete = document.getElementById('quizCompleteContainer');
            console.log('overlay quiz');
    
            if (startQuizButton && startQuizButton.value === 'Start playing') {
                console.log('we have start quize button');
                startQuizButton.click();
                setTimeout(() => {
                    console.log('Lets do boxes');
                    selectBoxes();
                }, 4000)
            }
    
            if (squaresAreThere.length > 0 || skinnyBoxesAreThere.length > 0) {
                console.log('squares or skinny squares start');
                selectBoxes();
            }
    
            if (quizeComplete) {
                console.log('quizeComplete');
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
    
    (function() {
        'use strict';
    
        // Your code here...
        setTimeout(() => {
            // window.close();
            letThingsLoad();
        }, 2500);
    
    
    })();