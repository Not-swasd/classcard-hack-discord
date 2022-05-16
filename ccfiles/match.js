var is_ios = false;
var is_android = false;
var is_app_v2 = false;
var is_app_v3 = false;
var questPauseTime = 0;
var questTimer;
var secondTimer;
var mobileTimer = null;
var is_mobile_end = false;
var timers = [];
var audio_checked = true;
var audio = new Audio();

(function (w) {
    var oldSI = w.setInterval;
    var oldCI = w.clearInterval;
    w.timers = timers;
    w.setInterval = function (fn, delay) {
        var id = oldSI(fn, delay);
        timers.push(id);
        return id;
    };
    w.clearInterval = function (id) {
        oldCI(id);
        removeTimer(id);
    };

    function removeTimer(id) {
        var index = timers.indexOf(id);
        if (index >= 0)
            timers.splice(index, 1);
    }
}(window));

jQuery(function ($) {
    try {
        var params = getQueryParams();
        if (is_skip == 0) {
            if (params.s != undefined) {
                is_skip = params.s;
                // console.log('is_skip : ' + is_skip);
            }
        }
        if (is_teacher == true && class_idx > 0 && params.t != undefined && params.t == '1') {
            is_class = true;
        }
    } catch (error) {
        console.error(error);
    }

    var effect = new Audio();
    var arr_quest = [];
    var quest_max_cnt = 20;
    var ani_time = 500;
    var is_timeover = false;
    var is_hint = false;
    var is_hurry = false;
    var next_card_ani = null;
    var limitTime = Infinity; //3 * 60 * 1000;
    var hurryTime = 1.5 * 60 * 1000;
    var hurrySpeed = 0.8;
    var isHurry = false;
    var startTime;

    var questLimit = 9 * 1000;
    var questTime;

    var current_score = 0;
    var server_score = -1;
    var is_mobile_first_click = true;
    var send_data = [];
    var arr_word = [];
    var arr_meaning = [];

    // console.log('app', 'onload');
    // initQuestion();
    showSetting();

    $(window).bind("click", function () {
        // setBackgroundVideo();
        // console.log('123', is_mobile, is_mobile_first_click);



        if (is_mobile_first_click) {
            // console.log('333333333');
            playAudioMute();
            is_mobile_first_click = false;
        }
    });

    $('#btn_end').click(function (e) {
        clearIntervalAll();
        // clearInterval(questTimer);
        clearInterval(secondTimer);
        is_mobile_end = true;

        $('.section-end-title').text('매칭타임 스코어보드');
        $('.section-end-title').removeClass('hidden');

        $('.point-text-end>div').text($('.point').first().text());
        $('.point-text-end').addClass('active');
        setTimeout(function () {
            $('.point-text-end').removeClass('active');

            if (is_ios || is_android) {
                sendEndToApp();
            } else {
                showEndScore();
            }
        }, 1000);

        e.preventDefault();
    });

    $(window).on("beforeunload", function (e) {
        // console.log('beforeunload');

        if (is_mobile_end == true) {
            return;
        }

        if (current_score == -1) {
            // console.log('skip.......................');
            return;
        }

        return "게임을 종료할까요?";

        // 		if (current_score == 0) {
        // 			current_score = eval($('.point').first().text());
        // 	    }
        sendScore(false, true);
    });

    if (is_mobile == 1) {
        $('.match-body.left .flip-card').unbind('touchstart').bind("touchstart", function (e) {
            if ($(this).find('.match-text').html()) {
            } else {
                e.preventDefault();
                return false;
            }

            if ($(this).hasClass('clicked')) {
                if ($(this).find('.btn_audio').hasClass('hidden') == false) {
                    playAudio($(this).find('.btn_audio'));
                }
                e.preventDefault();
                return false;
            }

            $('.match-body.left .flip-card').removeClass('clicked draged');
            playEffect('click');
            $(this).addClass('clicked draged');

            if (validSolve() == true) {
                $('.flip-card').removeClass('hint').find('.match-text, .match-text2').removeClass('blink x2');
                checkQuestion();
            } else {
                if ($(this).find('.btn_audio').hasClass('hidden') == false) {
                    playAudio($(this).find('.btn_audio'));
                }
            }
        });

        $('.match-body.right .flip-card').unbind('touchstart').bind("touchstart", function (e) {
            if ($(this).find('.match-text').html()) {
            } else {
                e.preventDefault();
                return false;
            }

            if ($(this).hasClass('clicked')) {
                e.preventDefault();
                return false;
            }

            $('.match-body.right .flip-card').removeClass('clicked dropped');
            playEffect('click');
            $(this).addClass('clicked dropped');

            if (validSolve() == true) {
                $('.flip-card').removeClass('hint').find('.match-text, .match-text2').removeClass('blink x2');
                checkQuestion();
            }
        });
    } else {
        $('.match-body.left .flip-card').unbind('click').click(function (e) {
            if ($(this).find('.match-text').html()) {
            } else {
                e.preventDefault();
                return false;
            }

            if ($(this).hasClass('clicked')) {
                if ($(this).find('.btn_audio').hasClass('hidden') == false) {
                    playAudio($(this).find('.btn_audio'));
                }
                e.preventDefault();
                return false;
            }

            $('.match-body.left .flip-card').removeClass('clicked draged');
            playEffect('click');
            $(this).addClass('clicked draged');

            if (validSolve() == true) {
                $('.flip-card').removeClass('hint').find('.match-text, .match-text2').removeClass('blink x2');
                checkQuestion();
            } else {
                if ($(this).find('.btn_audio').hasClass('hidden') == false) {
                    playAudio($(this).find('.btn_audio'));
                }
            }
        });

        $('.match-body.right .flip-card').unbind('click').click(function (e) {
            if ($(this).find('.match-text').html()) {
            } else {
                e.preventDefault();
                return false;
            }

            if ($(this).hasClass('clicked')) {
                e.preventDefault();
                return false;
            }

            $('.match-body.right .flip-card').removeClass('clicked dropped');
            playEffect('click');
            $(this).addClass('clicked dropped');

            if (validSolve() == true) {
                $('.flip-card').removeClass('hint').find('.match-text, .match-text2').removeClass('blink x2');
                checkQuestion();
            }
        });
    }

    $(audio)
        .bind('error', function () {
            // console.log('audio error');
            $('i', $('.btn_audio')).removeClass('text-info').addClass('text-danger');
        })
        .bind('ended', function () {
            // console.log('audio ended');
            $('i', $('.btn_audio')).removeClass('text-info text-danger');
        });

    $('.btn-app-start').click(function () {
        location.reload();
    });
    $('.btn-app-quest-prog').click(function (e) {
        questProg();
    });

    if (is_skip == 1) {
        if (is_mobile == 1) {
            mobileTimer = setTimeout(function () {
                setStart();
            }, 2000);
        } else {
            setStart();
        }
    } else {
        $('.start-match').removeClass('hidden');
    }

    function sendScoreToApp() {
        try {
            if (is_ios) {
                // console.log('app', 'run ios');
                webkit.messageHandlers.sendScore.postMessage(current_score);
            } else if (is_android) {
                // console.log('app', 'run android');
                window.androidInterface.sendScore(current_score);
            } else {
                // console.log('app', 'no device....');
            }
        } catch (err) {
            // console.log('app', err);
        }
    }

    function sendEndToApp() {
        try {
            if (current_score == -1) {
                return;
            }

            if (is_ios) {
                // console.log('app', 'run ios');
                webkit.messageHandlers.sendEnd.postMessage(current_score);
            } else if (is_android) {
                // console.log('app', 'run android');
                window.androidInterface.sendEnd(current_score);
            } else {
                // console.log('app', 'no device....');
            }

            current_score = -1;
            send_data = [];
        } catch (err) {
            // console.log(err);
        }
    }

    function suffleCard() {
        $body = $('.quest-list');

        // 모든 문제를 출제 대기 상태로 만든다.
        $body.find('.match-word').data('solve', 'r').attr('data-solve', 'r');

        $new = $body.children().clone();
        $new.sort(function () { return (Math.round(Math.random()) - .05) });

        $body.empty();
        $body.append($new);
    }

    function setAudio(arr) {
        // 모든 문제의 제시어/오디오 세팅을 초기화 한다.
        $body.find('.match-word').find('div').removeClass('hidden');
        $body.find('.match-word').find('a').addClass('hidden');

        // 오디오로 제출할 최대 개수 (30% 출제)
        var audio_max = Math.floor(arr.length * 30 / 100);
        var audio_cnt = 0;

        for (var i = 0; i < arr.length; i++) {
            $word = $('#w' + arr[i]);
            if ($word.data('audio') !== undefined && $word.data('audio').length > 0 && $word.data('audio') != '0' && $word.data('chk_a') == '1') {
                $word.find('div').addClass('hidden');
                $word.find('a').removeClass('hidden');
                if (is_hurry == true) {
                    $word.find('.card-score').text(200);
                } else {
                    $word.find('.card-score').text(150);
                }
                audio_cnt++;
            }

            if (audio_cnt >= audio_max) {
                break;
            }
        }
    }

    function setImage(arr) {
        // 모든 문제의 제시어/이미지 세팅을 초기화 한다.
        $body.find('.match-meaning').find('div').removeClass('hidden');
        $body.find('.match-meaning').find('.img-span').addClass('hidden');

        // 이미지로 제출할 최대 개수 (30% 출제)
        var image_max = Math.floor(arr.length * 30 / 100);
        var image_cnt = 0;

        // console.log(image_max, image_cnt);

        for (var i = 0; i < arr.length; i++) {
            $word = $('#m' + arr[i]);
            // console.log($word);
            if ($word.data('img') == '1') {
                $word.find('.img-span').removeClass('hidden');
                $word.find('div').addClass('hidden');
                image_cnt++;
            }

            if (image_cnt >= image_max) {
                break;
            }
        }
        // console.log(image_max, image_cnt);
    }

    function getQuest(is_audio, is_image, is_new) {
        if (is_new == true) {
            // 모든 문제의 제시어/오디오 세팅을 초기화 한다.
            $body.find('.match-word').find('div').removeClass('hidden');
            $body.find('.match-word').find('a').addClass('hidden');

            // 모든 문제의 제시어/이미지 세팅을 초기화 한다.
            $body.find('.match-meaning').find('div').removeClass('hidden');
            $body.find('.match-meaning').find('.img-span').addClass('hidden');

            // console.log('arr_quest clear');
            arr_quest = [];
            for (var i in arr_word) {
                if (arr_word[i] !== undefined && isNaN(arr_word[i]) == false) {
                    arr_quest.push(arr_word[i]);
                }
            }
            // console.log('제시된 word로 넣은 arr_quest', arr_quest);
        }

        $('.match-word').each(function (idx, el) {
            $el = $(el);

            if (isNaN($(el).data('idx')) == true) {
                return;
            }

            if (arr_quest.length < quest_max_cnt) {
                if (arr_word.indexOf($el.data('idx')) == -1 && arr_quest.indexOf($el.data('idx')) == -1) {
                    arr_quest.push($el.data('idx'));
                } else {
                    // console.log('already used.');
                }
            } else {
                $el.data('solve', 'x').attr('data-solve', 'x');
            }
        });

        fy(arr_quest);
        // console.log('arr_quest finish 1', arr_quest);

        // 세트의 타입이 워드 이면 오디오를 문제로 제출한다.
        if (set_type == 1 && is_audio) {
            fy(arr_quest);
            setAudio(arr_quest);
            // console.log('arr_quest finish 2', arr_quest);
        }

        if (is_image == true) {
            fy(arr_quest);
            setImage(arr_quest);
            // console.log('arr_quest finish 3', arr_quest);
        }

        // 문제순서를 랜덤처리한다.
        fy(arr_quest);
    }

    function initQuestion() {
        $('.card-blind').addClass('active');

        // 매칭카드를 섞는다.
        suffleCard();
        current_score = -1;
        send_data = [];
        is_timeover = false;
        is_hurry = false;
        is_hint = false;
        is_mobile_end = false;
        $('.score-end').removeClass('active');
        $('.hurryup-info').addClass('hidden');
        $('.minutes').parent().removeClass('text-danger');
        $('.match-body .flip-card').removeClass('hint disalbed');
        $('.match-content').removeClass('invisible');
        $('.quest-list .match-word .card-score').text(100);
        $('.match-body .flip-card .card-score').text(100);

        clearIntervalAll();
        // clearInterval(questTimer);

        // 2017-02-02 매칭 개선으로 카드 전체로 한다.
        quest_max_cnt = $('.quest-list').children().length;

        // 대기중인 문제를 추출한다.
        getQuest(false, false, true);

        // 제시할 문제 4개를 생성한다. (4개 미만일때는 모두 제시)
        arr_word = new Array(4);
        arr_meaning = new Array(4);
        if (arr_quest.length < 4) {
            for (var i = 0; i < arr_quest.length; i++) {
                arr_word[i] = arr_quest[i];
                arr_meaning[i] = arr_quest[i];
            }

            // 정답의 순서를 랜덤처리 한다.
            fy(arr_meaning);
        } else {
            // 정답이 있는 문제를 2개이상 넣기 위해 6개 문제를 추출한다.
            var max_count = 6;
            if (arr_quest.length < 6) {
                max_count = arr_quest.length;
            }
            for (var i = 0; i < max_count; i++) {
                arr_word[i] = arr_quest[i];
                arr_meaning[i] = arr_quest[i];
            }

            // 50% 확률로 2개문제만 맞게 처리
            if ((parseInt(Math.random() * 100) % 2) > 0) {
                // console.log('50% - 2 questions : ' + arr_meaning.length);

                if (arr_meaning.length > 5) {
                    arr_meaning = arr_meaning.slice(2, 6);
                }
            }

            // 정답의 순서를 랜덤처리 한다.
            fy(arr_meaning);

            // 문제를 4개로 만든다.
            arr_word = arr_word.slice(0, 4);
            arr_meaning = arr_meaning.slice(0, 4);

            // 문제순서를 랜덤처리 한다.
            fy(arr_word);
        }

        // console.log('word : ' + arr_word);
        // console.log('meaning : ' + arr_meaning);

        showQuestion(-1, -1, true);
        intro_ani();


    }

    function startMatch() {
        // console.log('startMatch');
        startTime = (new Date).getTime();
        secondTimer = setInterval(function () {
            refreshTimer();
        }, 400);
        $('.point').text(100);

        $('.match-body .flip-card .flip-card-inner').css('animation-delay', '');

        var end_count = getEndQuestionCount();
        var total_count = getTotalQuestCount();
    }

    function intro_ani() {
        $('.match-content').css('opacity', '0.6');
        var delay = 0;
        $('.flip-card-inner').removeClass('hideOut leftOutNoAni leftFadeOut rightFadeIn, rightOutNoAni, leftFadeIn rightFadeOut');
        $('.flip-card-inner').each(function (index) {
            // console.log(index);
            if (index % 4 == 0) { delay = 0; }
            if ($(this).find('.match-text').html().length == 0) {
                // console.log('skip');
                return;
            }

            if ($(this).closest('.match-body').hasClass('left') == true) {
                $(this)
                    .addClass('leftOutNoAni rightFadeIn')
                    .css('animation-delay', delay + 's')
                    .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                    .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                        $(this).css('animation-delay', '').removeClass('leftOutNoAni rightFadeIn');
                    });
            } else {
                $(this)
                    .addClass('rightOutNoAni leftFadeIn')
                    .css('animation-delay', delay + 's')
                    .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                    .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                        $(this).css('animation-delay', '').removeClass('rightOutNoAni leftFadeIn');
                    });
            }
            delay += 0.15;
        });

        setTimeout(function () {
            showReady();
        }, (400 + (delay * 1000) - 150));
    }

    function showHint() {
        // console.log('showHint');
        var arr_able = [];
        for (var i = 0; i < arr_word.length; i++) {
            if (arr_meaning.indexOf(arr_word[i]) > -1) {
                arr_able.push(arr_word[i]);
            }
        }

        // console.log('showHint', arr_able);

        // 힌트순서를 랜덤처리한다.
        fy(arr_able);

        // console.log('showHint', arr_able);
        // console.log('showHint', arr_able.length);

        if (arr_able.length > 0 && arr_word.indexOf(arr_able[0]) > -1) {
            // var hint_el = $('.match-body.left .flip-card[data-idx="' + arr_able[0] + '"]');
            var hint_el = $('.match-body.left .flip-card:eq(' + arr_word.indexOf(arr_able[0]) + ')');
            // console.log(hint_el);
            if (hint_el.length > 0) {
                // hint_el.addClass('hint').find('.match-text').addClass('blink');
                hint_el.addClass('hint');
                if (is_hurry == true) {
                    hint_el.find('.card-score').text(80);
                } else {
                    hint_el.find('.card-score').text(50);
                }
            }
        }

        is_hint = true;
        $('.prog-bar').removeClass('primary').addClass('danger');
    }

    function overTime(is_retry) {
        // var hint_el = $('.match-body.left .flip-card.hint');
        var hint_el = [];
        var hint_idx = -1;

        $('.match-body.left .flip-card').each(function (idx, el) {
            if ($(el).hasClass('hint')) {
                hint_el = $(el);
                hint_idx = idx;
                return false;
            }
        });

        if (hint_el.length == 0) {
            // console.log('not found hint_el');
            if (is_retry == true) {
                showHint();
                overTime();
            }
            return;
        }

        // var answer_el = $('.match-body.right .flip-card[data-idx="' + hint_el.data('idx') + '"]');
        var answer_el = $('.match-body.right .flip-card:eq(' + arr_meaning.indexOf(arr_word[hint_idx]) + ')');

        if (answer_el.length == 0) {
            // console.log('not found answer_el');
            return;
        }

        $('.match-body.left .flip-card').removeClass('draged');
        $('.match-body.right .flip-card').removeClass('dropped');

        hint_el.addClass('draged');
        answer_el.first().addClass('dropped');

        checkQuestion(true);
    }

    function addQuestion() {

        var end_count = getEndQuestionCount();
        var total_count = getTotalQuestCount();
        var word_idx = -1, meaning_idx = -1;

        // progress 표시
        $('#progress').text((total_count - end_count));

        // 총 문제수와 맞춘 카드수가 같으면 match를 종료한다.
        if (end_count === total_count) {
            // console.log('match end....................');
            clearInterval(secondTimer);
            // $('.card-blind').css({'display':'none'});
            return;
        }

        // 제시할 문제수가 0개이면 스킵한다.
        if (arr_quest.length == 0) {
            // console.log('no question..............');
            // $('.card-blind').css({'display':'none'});
            $('.card-blind').removeClass('active');
            $('.match-body').removeClass('disabled').find('.flip-card').removeClass('disabled');
            return;
        }

        // 문제순서를 랜덤처리한다.
        fy(arr_quest);

        // 정답문제를 배열에 저장처리
        var is_insert = true;
        for (var i = 0; i < arr_meaning.length; i++) {
            if (arr_meaning[i] === undefined) {
                // console.log('insert here......');

                for (var j = 0; j < arr_quest.length; j++) {
                    if (arr_meaning.indexOf(arr_quest[j]) < 0) {
                        arr_meaning[i] = arr_quest[j];
                        meaning_idx = i;
                        is_insert = false;
                        break;
                    }
                }
                break;
            }
        }
        // 우측에 4개 정답을 표기 못하면 좌측 카드중 한개를 넣는다.
        if (is_insert) {
            for (var i = 0; i < arr_meaning.length; i++) {
                if (arr_meaning[i] === undefined) {
                    // console.log('insert here......');

                    for (var j = 0; j < arr_word.length; j++) {
                        // console.log('arr_word[j] : ' + arr_word[j]);
                        if (arr_word[j] !== undefined && arr_meaning.indexOf(arr_word[j]) < 0) {
                            arr_meaning[i] = arr_word[j];
                            meaning_idx = i;
                            break;
                        }
                    }
                    break;
                }
            }
        }


        // 좌/우 카드가 매칭 안되는 우측 카드의 id를 배열로 찾는다.
        var arr_able = [];
        for (var i = 0; i < arr_meaning.length; i++) {
            if (arr_meaning[i] === undefined) continue;

            is_insert = true;
            for (var j = 0; j < arr_word.length; j++) {
                if (arr_word[j] == arr_meaning[i]) {
                    is_insert = false;
                    break;
                }
            }

            if (is_insert) {
                arr_able.push(arr_meaning[i]);
            }
        }
        // console.log('arr_word : ' + arr_word);
        // console.log('arr_meaning : ' + arr_meaning);
        // console.log('arr_able : ' + arr_able);

        // 사용 가능한 id가 3개 이상이면 우측 카드의 id로 사용한다.
        if (arr_able.length > 2) {
            fy(arr_able);

            // console.log('arr_able random : ' + arr_able);

            // 제시문제를 배열에 저장처리
            for (var i = 0; i < arr_word.length; i++) {
                if (arr_word[i] === undefined) {
                    arr_word[i] = arr_able[0];
                    word_idx = i;
                    break;
                }
            }
        } else {
            // 제시문제를 배열에 저장처리
            for (var i = 0; i < arr_word.length; i++) {
                if (arr_word[i] === undefined) {
                    for (var j = 0; j < arr_quest.length; j++) {
                        if (arr_word.indexOf(arr_quest[j]) < 0) {
                            arr_word[i] = arr_quest[j];
                            break;
                        }
                    }

                    word_idx = i;
                    break;
                }
            }
        }

        showQuestion(word_idx, meaning_idx);
    }

    function getAnswerArr(answer_arr, reduce_arr) {
        var temp_answer = answer_arr.filter(function (obj) { return obj !== undefined; });
        $.each(reduce_arr, function (i, n) {
            if (temp_answer.indexOf(n) > -1) {
                temp_answer.splice(temp_answer.indexOf(n), 1);
            }
        });
        fy(temp_answer);

        return temp_answer;
    }

    var addQuestionDelay = null;
    function addQuestion_left(is_twice) {
        if (addQuestionDelay) {
            return;
        }

        var flip_el = $('.flip-card.flip');
        if (flip_el.length > 0) {
            addQuestionDelay = setTimeout(function () {
                flip_el.removeClass('flip');
                setTimeout(function () {
                    if (addQuestionDelay) {
                        clearTimeout(addQuestionDelay);
                        addQuestionDelay = null;
                    }

                    addQuestion_left();
                }, 500);
            }, 100);

            return;
        }

        // console.log('add.............. : ' + $('.match-word').length);

        $('.right-card, .right-card2, .left-card').find('.match-text').removeClass('blink x2');

        var end_count = getEndQuestionCount();
        var total_count = getTotalQuestCount();
        var word_idx = -1, meaning_idx = -1;

        // 타이머가 끝나면 종료한다.
        if (is_timeover == true) {
            // console.log('timeover end....................');
            $('.card-blind').removeClass('active');
            $('.match-body').removeClass('disabled').find('.flip-card').removeClass('disabled');
            $('#btn_end').click();
            return;
        }

        // 총 문제수와 맞춘 카드수가 같으면 match를 종료한다.
        /*
            if (end_count === total_count) {
                console.log('match end....................');
                $('.card-blind').removeClass('active');
                $('.match-box').removeClass('disabled');
                $('#btn_end').click();
                return;
            }
        */
        if (arr_quest.length < 4) {
            if (is_hurry == true) {
                getQuest(true, true, false);
            } else {
                getQuest(false, false, false);
            }
        }

        // 제시할 문제수가 0개이면 스킵한다.
        if (arr_quest.length == 0) {
            // console.log('no question..............');
            // $('.card-blind').css({'display':'none'});
            $('.card-blind').removeClass('active');
            $('.match-body').removeClass('disabled').find('.flip-card').removeClass('disabled');
            showQuestion(-1, -1);
            return;
        }

        if (is_mobile_end) {
            return;
        }

        is_hint = false;

        // console.log(arr_quest);
        // console.log(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');

        // 문제순서를 랜덤처리한다.
        fy(arr_quest);

        // console.log(arr_quest);

        // 정답 개수가 2개 미만이면 50% 확률로 왼쪽에 정답을 채운다.
        // 아니면 문제에서 랜덤으로 출제한다.
        var arr_able = [];
        for (var i = 0; i < arr_word.length; i++) {
            if (arr_word[i] === undefined) continue;

            if (arr_meaning.indexOf(arr_word[i]) > -1) {
                arr_able.push(arr_word[i]);
            }
        }

        var is_right_empty = false;
        // console.log('pick_card right_indexOf : ' + arr_meaning.indexOf(undefined));
        if (arr_meaning.indexOf(undefined) == -1) {
            for (var i = 0; i < arr_meaning.length; i++) {
                // console.log('pick_card right_check : ' + arr_meaning[i]);
                if (arr_meaning[i] == undefined) {
                    is_right_empty = true;
                    break;
                }
            }
        }
        var is_rand_quest = false;
        if (arr_able.length > 0 || (arr_able.length == 0 && is_right_empty)) {
            // console.log('pick_card able_cnt > 0');
            if (Math.floor(Math.random() * 10) < 8) {
                // console.log('pick_card set right random');
                is_rand_quest = true;
            } else {
                // console.log('pick_card set left random');
            }
        }
        // console.log(((is_rand_quest) ? 'pick_card make right card' : 'pick_card make left card'));

        for (var i = 0; i < arr_word.length; i++) {
            // console.log('arr_word idx : ' + i + ', val : ' + arr_word[i]);
            if (arr_word[i] === undefined) {
                // console.log('arr_word idx : ' + i);
                for (var j = 0; j < arr_quest.length; j++) {
                    // console.log('arr_quest idx : ' + j + ', val : ' + arr_quest[j]);
                    if (arr_word.indexOf(arr_quest[j]) < 0) {
                        if (is_rand_quest) {
                            arr_word[i] = arr_quest[j];
                            word_idx = i;
                            break;
                        } else {
                            if (arr_meaning.indexOf(arr_quest[j]) > -1) {
                                arr_word[i] = arr_quest[j];
                                word_idx = i;
                                break;
                            }
                        }
                    }
                }

                break;
            }
        }

        if (word_idx == -1) {
            for (var i = 0; i < arr_word.length; i++) {
                // console.log('arr_word idx : ' + i + ', val : ' + arr_word[i]);
                if (arr_word[i] === undefined) {
                    // console.log('arr_word idx : ' + i);
                    for (var j = 0; j < arr_quest.length; j++) {
                        // console.log('arr_quest idx : ' + j + ', val : ' + arr_quest[j]);
                        if (arr_word.indexOf(arr_quest[j]) < 0) {
                            arr_word[i] = arr_quest[j];
                            word_idx = i;
                            break;
                        }
                    }

                    break;
                }
            }
        }

        // 좌/우 카드가 매칭 안되는 우측 카드의 id를 배열로 찾는다.
        arr_able = [];
        for (var i = 0; i < arr_word.length; i++) {
            if (arr_word[i] === undefined) continue;

            if (arr_meaning.indexOf(arr_word[i]) > -1) {
                arr_able.push(arr_word[i]);
            }
        }

        // 정답이 1개 이하이면 무조건 정답을 채워 넣는다.
        fy(arr_quest);
        // console.log('arr_quest', arr_quest);
        // console.log('arr_word', arr_word);
        // console.log('arr_meaning', arr_meaning);
        // console.log('arr_able', arr_able);

        var able_limit = (Math.floor(Math.random() * 10) < 5) ? 1 : 2;
        // console.log('arr_able.length, able_limit', arr_able.length, able_limit);
        if (arr_able.length < able_limit) {
            // console.log('arr_able.length < able_limit');
            for (var i = 0; i < arr_meaning.length; i++) {
                if (arr_meaning[i] === undefined) {
                    for (var j = 0; j < arr_quest.length; j++) {
                        if (arr_word.indexOf(arr_quest[j]) > -1 && arr_meaning.indexOf(arr_quest[j]) < 0) {
                            arr_meaning[i] = arr_quest[j];
                            meaning_idx = i;
                            break;
                        }
                    }
                    break;
                }
            }
        } else {
            // console.log('arr_able.length >= able_limit');
            for (var i = 0; i < arr_meaning.length; i++) {
                if (arr_meaning[i] === undefined) {
                    for (var j = 0; j < arr_quest.length; j++) {
                        if (arr_quest.length > 5) {
                            if (arr_word.indexOf(arr_quest[j]) < 0 && arr_meaning.indexOf(arr_quest[j]) < 0) {
                                arr_meaning[i] = arr_quest[j];
                                meaning_idx = i;
                                break;
                            }
                        } else {
                            if (arr_meaning.indexOf(arr_quest[j]) < 0) {
                                arr_meaning[i] = arr_quest[j];
                                meaning_idx = i;
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }

        // 오른쪽 카드를 채우지 못했으면 무조건 정답 1개를 채운다.
        if (meaning_idx == -1) {
            // console.log('ADDQ', 'force answer');
            for (var i = 0; i < arr_meaning.length; i++) {
                if (arr_meaning[i] === undefined) {
                    for (var j = 0; j < arr_quest.length; j++) {
                        if (arr_word.indexOf(arr_quest[j]) > -1 && arr_meaning.indexOf(arr_quest[j]) < 0) {
                            arr_meaning[i] = arr_quest[j];
                            meaning_idx = i;
                            break;
                        }
                    }
                    break;
                }
            }
        }

        if (is_twice === undefined) {
            if (word_idx > -1 && meaning_idx > -1) {
                // console.log(arr_word[word_idx], arr_meaning[meaning_idx]);
                if (arr_word[word_idx] == arr_meaning[meaning_idx]) {
                    delete arr_word[word_idx];
                    delete arr_meaning[meaning_idx];

                    // console.log('######################### same #############################');
                    addQuestion_left(true);
                    return;
                }
            }
        }


        // 	showQuestion(word_idx, meaning_idx);
        setTimeout(function () {
            showQuestion(word_idx, meaning_idx);
        }, ani_time / 3);
    }

    function getEndQuestionCount() {
        var count = 0;
        $('.match-word').each(function (idx, el) {
            $el = $(el);
            // console.log('solve : ' + $el.data('solve'));
            if ($el.data('solve') === 'e') {
                count++;
            }
        });

        // console.log('end count : ' + count);

        return count;
    }

    function getTotalQuestCount() {
        var count = 0;
        $('.match-word').each(function (idx, el) {
            $el = $(el);
            // console.log('solve : ' + $el.data('solve'));
            if ($el.data('solve') !== 'x') {
                count++;
            }
        });

        // console.log('total count : ' + count);

        return count;
    }

    function showHurry() {
        playEffect('hurry');
        is_hurry = true;

        // is_mobile

        if (is_mobile == 1) {
            $('.timer-layer').addClass('hidden');
            $('.hurryup-layer').removeClass('hidden');
            setTimeout(function () {
                $('.timer-layer').removeClass('hidden');
                $('.hurryup-layer').addClass('hidden');
                getQuest(true, true, false);
            }, 2000);
        } else {
            $('.hurryup-info').removeClass('hidden');

            $('.hurry-text').addClass('active')
                .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                    $('.hurry-text').removeClass('active').css({ opacity: 0, left: '100%' });
                    getQuest(true, true, false);
                });
        }

        $('.match-top.mobile .mobile-timer').removeClass('text-lightest').addClass('text-danger');

        $('.quest-list .match-word .card-score').each(function () {
            if (this.innerText == '150') {
                this.innerText = '200';
            } else {
                this.innerText = '130';
            }
        });
        $('.match-body.left .flip-card .card-score').each(function () {
            if (this.innerText == '50') {
                this.innerText = '80';
            } else {
                this.innerText = '130';
            }
        });
    }

    function showReady() {
        playEffect('ready');
        $('.card-blind').addClass('active');
        $('.match-top.mobile .mobile-timer').addClass('text-lightest').removeClass('text-danger');

        $('.ready-text').addClass('active')
            .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
            .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                startMatch();

                $('.ready-text').removeClass('active');
                $('.match-content').css('opacity', '');
                $('.card-blind').removeClass('active');

                clearIntervalAll();
                // clearInterval(questTimer);
                is_hint = false;
                $('.prog-bar').addClass('primary').removeClass('danger');
                questTime = (new Date).getTime();
                questTimer = setInterval(function () {
                    questProg();
                }, 500);
            });
    }

    function showPoint(val) {
        var is_correct = false;
        var font_class = 'minus';
        var point = 0;
        if (isNaN(val) == false) {
            $('.point-text').removeClass('try');
            point = val;
            if (val > 0) {
                font_class = 'plus';
                is_correct = true; val = '+' + val;
            }
        } else {
            $('.point-text').addClass('try');
        }

        console.log('###POINT###', point);
        if (point < 0) { send_data.push(ggk.d(point * -1, 0)); } else { send_data.push(ggk.d(point, 1)); }
        console.log("###sendata###", send_data);

        if (current_score == -1) { current_score = 100; }
        current_score += point;

        $('.point').text(current_score).removeClass('text-white text-success text-danger');
        if (current_score > 0) {
            $('.point').addClass('text-success');
        } else if (current_score < 0) {
            $('.point').addClass('text-danger');
        } else {
            $('.point').addClass('text-white');
        }

        sendScoreToApp();

        $('.point-text')
            .removeClass('plus minus')
            .addClass('active ' + font_class)
            .find('span')
            .html(val);

        $('.point-text')
            .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
            .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                $('.point-text').removeClass('plus minus active');
            });
    }

    function showQuestion(word_idx, meaning_idx, is_no_ani) {
        // console.log('word_idx : ' + word_idx + ', meaning_idx : ' + meaning_idx);
        // console.log(arr_word);
        $('.flip-card').removeClass('correct wrong clicked flip answer');
        $('.match-content .match-text div, .match-content .match-text2 div').dotdotdot().trigger('destroy.dot');
        for (var i = 0; i < arr_word.length; i++) {

            // 	    console.log('123123 : ' + arr_word[i]);
            var left_card = $('#left_card_' + i);
            var right_card = $('#right_card_' + i);

            // 		console.log(left_card.parent().next().find('.match-text'));

            if (arr_word[i] === undefined) {
                // console.log('123123 : 111');
                left_card.data('idx', -1).attr({ 'style': '', 'data-idx': -1 });
                left_card.find('.match-text').empty();
                left_card.find('.match-text2').empty();
            } else {
                // 		    console.log('123123 : 222');
                if (word_idx == i || is_no_ani === true) {
                    // 보여지는 문제는 중복 제시를 못하도록 상태를 변경 한다.
                    var word = $('#w' + arr_word[i]);
                    var mean = $('#m' + arr_word[i]);
                    var back = $('#b' + arr_word[i]);
                    word.data('solve', 's').attr('data-solve', 's');

                    // left_card.data('idx', arr_word[i]).attr({'data-idx': arr_word[i]});
                    left_card.data('idx', -1).attr({ 'style': '', 'data-idx': -1 });
                    left_card.find('.match-text')
                        .html(word.html())
                        .removeClass('text-center text-left')
                        .addClass(word.data('align'));

                    // 학생 점수조작을 막기 위해 값을 채우지 않음
                    left_card.find('.match-text2').html('');
                    // left_card.find('.match-text2')
                    // 	.html(back.html())
                    // 	.removeClass('text-center text-left')
                    // 	.addClass(back.data('align'));

                    // 정답은 텍스로 표기 (이미지는 감추기)
                    left_card.find('.match-text2 div').removeClass('hidden');
                    left_card.find('.match-text2 .img-span').addClass('hidden');

                    // 의미가 없고 이미지가 있으면 이미지를 보여준다.
                    if (left_card.find('.match-text2 div').text().trim().length == 0 && typeof left_card.find('.match-text2 img') != 'undefined') {
                        if (left_card.find('.match-text2 img').attr('src') != 'undefined') {
                            left_card.find('.match-text2 div').addClass('hidden');
                            left_card.find('.match-text2 .img-span').removeClass('hidden');
                        }
                    }
                }
            }

            // 	    console.log(arr_meaning[i]);

            if (arr_meaning[i] === undefined) {
                right_card.data('idx', -1).attr({ 'style': '', 'data-idx': -1 });
                right_card.find('.match-text').empty();
            } else {
                if (meaning_idx == i || is_no_ani === true) {
                    var mean2 = $('#m' + arr_meaning[i]);
                    // console.log('#### arr_meaning[i] ####', arr_meaning[i], mean2.html(), right_card);
                    // right_card.data('idx', arr_meaning[i]).attr({'data-idx': arr_meaning[i]});
                    right_card.data('idx', -1).attr({ 'style': '', 'data-idx': -1 });
                    right_card.find('.match-text')
                        .html(mean2.html())
                        .removeClass('text-center text-left')
                        .addClass(mean2.data('align'));

                    // 의미가 없고 이미지가 있으면 이미지를 보여준다.
                    if (right_card.find('.match-text div').text().trim().length == 0 && typeof right_card.find('.match-text img') != 'undefined') {
                        if (right_card.find('.match-text img').attr('src') != 'undefined') {
                            right_card.find('.match-text div').addClass('hidden');
                            right_card.find('.match-text .img-span').removeClass('hidden');
                        }
                    }
                }
            }

            if (left_card.find('.match-text').html().length > 0) {
                if (i == word_idx) {
                    left_card.find('.flip-card-inner')
                        .addClass('rightFadeIn')
                        .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                        .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                            $(this).removeClass('hideOut leftFadeOut rightFadeIn');
                        });
                } else {
                    left_card.find('.flip-card-inner').removeClass('hideOut leftOutNoAni leftFadeOut rightFadeIn');
                }
            } else {
                left_card.find('.flip-card-inner').removeClass('hideOut leftOutNoAni leftFadeOut rightFadeIn');
            }

            if (right_card.find('.match-text').html().length > 0) {
                if (i == meaning_idx) {
                    right_card.find('.flip-card-inner')
                        .addClass('leftFadeIn')
                        .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                        .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                            $(this).removeClass('hideOut rightFadeOut leftFadeIn');
                        });
                } else {
                    right_card.find('.flip-card-inner').removeClass('hideOut rightOutNoAni rightFadeOut leftFadeIn');
                }
            } else {
                right_card.find('.flip-card-inner').removeClass('hideOut rightOutNoAni rightFadeOut leftFadeIn');
            }
        };

        var fill_height = Math.round($('.match-content .match-text, .match-content .match-text2').first().height());
        if ($('body').hasClass('page-small') == true) {
            $('.match-body.left .match-text, .match-body.left .match-text2').textfill({
                maxFontPixels: 20,
                minFontPixels: 11,
                is_force: true,
                explicitHeight: fill_height,
                innerTag: 'div'
            }).ccalign();
            $('.match-body.left .match-text div, .match-body.left .match-text2 div').css('height', '').dotdotdot({ height: fill_height });

            $('.match-body.right .match-text, .match-body.right .match-text2').textfill({
                maxFontPixels: 17,
                minFontPixels: 11,
                is_force: true,
                explicitHeight: fill_height,
                innerTag: 'div'
            }).ccalign();
            $('.match-body.right .match-text div, .match-body.right .match-text2 div').css('height', '').dotdotdot({ height: fill_height });
        } else {
            $('.match-body.left .match-text, .match-body.left .match-text2').textfill({
                maxFontPixels: 30,
                minFontPixels: 16,
                is_force: true,
                explicitHeight: fill_height,
                innerTag: 'div'
            });
            $('.match-body.left .match-text div, .match-body.left .match-text2 div').css('height', '').dotdotdot({ height: fill_height });

            $('.match-body.right .match-text, .match-body.right .match-text2').textfill({
                maxFontPixels: 24,
                minFontPixels: 13,
                is_force: true,
                explicitHeight: fill_height,
                innerTag: 'div'
            }).ccalign();
            $('.match-body.right .match-text div, .match-body.right .match-text2 div').css('height', '').dotdotdot({ height: fill_height });
        }
        $('.match-content .match-body.right .match-text div').css('text-align', 'left');

        if (is_no_ani) {

        } else {
            $('.card-blind').removeClass('active');
            $('.match-body').removeClass('disabled').find('.flip-card').removeClass('disabled');
            setTimeout(function () {

                // console.log('###111###222###333###');
                $('.prog-bar').addClass('primary').removeClass('danger');
                clearIntervalAll();
                // clearInterval(questTimer);
                questTime = (new Date).getTime();
                questTimer = setInterval(function () {
                    questProg();
                }, 500);
            }, ani_time / 2);

            $('.match-body.left .btn_audio').unbind('click').click(function (e) {
                var box = $(this).closest('.flip-card');
                // console.log(box);
                box.click();

                e.preventDefault();
                return false;
            });
        }
    }

    function checkQuestion(is_skip) {
        clearIntervalAll();
        // clearInterval(questTimer);

        if (is_skip === undefined) {
            setTimeout(function () {
                checkQuestion(true);
            }, 500);
            return;
        }

        $('.flip-card').removeClass('clicked');

        var word_idx = -1;
        var meaning_idx = -1;
        var correct_word = [];
        var correct_meaning = [];

        $('.match-body.left .flip-card').each(function (idx, el) {
            $el = $(el);

            if ($el.hasClass('draged')) {
                word_idx = idx;
                correct_word = $el;
            }
        });

        $('.match-body.right .flip-card').each(function (idx, el) {
            $el = $(el);

            if ($el.hasClass('dropped')) {
                meaning_idx = idx;
                correct_meaning = $el;
            }
        });

        // console.log('word_idx : ' + word_idx + ', meaning_idx : ' + meaning_idx);
        // console.log(correct_word, correct_meaning);
        $('.flip-card').removeClass('draged dropped');

        if (word_idx > -1 && meaning_idx > -1) {
            // 동작이 끝날때 까지 다른 문제를 풀지 못하도록 이벤트 막기
            $('.card-blind').addClass('active');
            $('.match-body').addClass('disabled').find('.flip-card').addClass('disabled');

            // correct_word = $('.match-body.left .flip-card:eq(' + word_idx +')');
            // correct_meaning = $('.match-body.right .flip-card:eq(' + meaning_idx +')');

            // console.log('word : ' + correct_word.data('idx') + ', meaning : ' + correct_meaning.data('idx'));
            var point = '';

            var is_correct = false;
            if (correct_word.length == 0 || correct_meaning.length == 0) {
                is_correct = false;
                // } else if (correct_word.data('idx') === correct_meaning.data('idx')) {
            } else if (arr_word[word_idx] === arr_meaning[meaning_idx]) {
                is_correct = true;
            } else if (checkAnswer($('#m' + arr_word[word_idx]).text().trim(), correct_meaning.text().trim(), false, true)) {
                if ($('#m' + arr_word[word_idx]).text().trim().length > 0 && correct_meaning.text().trim().length > 0) {
                    is_correct = true;
                }
            }

            if ($('.flip-card.hint').length > 0) {
                is_correct = false;
            }

            if (is_correct) {
                // console.log('correct !!!!!!!!!!!!!!');
                point = eval(correct_word.find('.card-score').text());

                var el_hint = [];
                $('.flip-card .card-score').each(function () {
                    if (this.innerText == '50' || this.innerText == '80') {
                        el_hint = $(this).closest('.flip-card');
                    }
                });
                if (el_hint.length > 0) {
                    if (el_hint.find('.btn_audio').length == 0 || el_hint.find('.btn_audio').hasClass('hidden')) {
                        if (is_hurry == true) {
                            el_hint.find('.card-score').text(130);
                        } else {
                            el_hint.find('.card-score').text(100);
                        }
                    } else {
                        if (is_hurry == true) {
                            el_hint.find('.card-score').text(200);
                        } else {
                            el_hint.find('.card-score').text(150);
                        }
                    }
                }
                $('.flip-card').removeClass('hint');
                $('.match-body .match-text, .match-body .match-text2').removeClass('blink x2');

                // 제시한 문제 배열에서 제거한다.
                var remove_idx = arr_quest.indexOf(arr_word[word_idx]);
                // console.log('remove_idx : ' + remove_idx + 'word_idx : ' + word_idx + ', arr_word[word_idx] : ' + arr_word[word_idx]);
                // console.log(arr_quest);
                if (remove_idx > -1) {
                    arr_quest.splice(remove_idx, 1);
                }
                // console.log(arr_quest);
                delete arr_word[word_idx];
                delete arr_meaning[meaning_idx];

                correct_word.removeClass('disabled');
                correct_meaning.removeClass('disabled');

                // 맞은 문제는 상태를 종료로 처리한다.
                // console.log('111 : ' + $('#w' + correct_word.data('idx')).data('solve'));
                // $('#w' + correct_word.data('idx')).data('solve', 'e').attr('data-solve', 'e');
                $('#w' + arr_word[word_idx]).data('solve', 'e').attr('data-solve', 'e');
                // console.log('222 : ' + $('#w' + correct_word.data('idx')).data('solve'));

                correct_word.addClass('correct');
                correct_meaning.addClass('correct');

                showPoint(point);

                setTimeout(function () {
                    playEffect('correct');
                    playAudio(correct_word.find('.btn_audio').first(), 600);

                    correct_meaning.find('.flip-card-inner')
                        .addClass('hideOut')
                        .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend');
                    correct_word.find('.flip-card-inner')
                        .addClass('hideOut')
                        .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                        .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                            addQuestion_left();
                        });
                }, 50);
            } else {
                // console.log('wrong #########');
                point = -50;

                playAudio(correct_word.find('.btn_audio').first());

                var end_count = getEndQuestionCount();
                var total_count = getTotalQuestCount();

                // 틀린 문제는 상태를 준비로 처리하여 다시 제시할 수 있도록 한다.
                //             console.log('111 : ' + $('#w' + correct_word.data('idx')).data('solve'));
                //             $('#w' + correct_word.data('idx')).data('solve', 'r');
                //             console.log('222 : ' + $('#w' + correct_word.data('idx')).data('solve'));

                var answer_el = [];
                var delay_time = ani_time * 6;
                // 힌트로 들어온 경우 처리
                if (correct_word.hasClass('hint') == true) {
                    // console.log('............ is hint ...........');
                    point = '<div class="font-48">TIME</div><div class="">OUT&nbsp;</div>';
                    delay_time = ani_time * 6;

                    correct_word.removeClass('disabled').addClass('answer').find('.match-text').removeClass('blink x2');
                    correct_meaning.removeClass('disabled').addClass('answer');

                    // answer_el = $('.match-body.right .flip-card[data-idx="' + correct_word.data('idx') + '"]');
                    answer_el = $('.match-body.right .flip-card:eq(' + arr_meaning.indexOf(arr_word[word_idx]) + ')');
                } else {
                    correct_word.removeClass('disabled').addClass('wrong').find('.match-text').removeClass('blink x2');
                    correct_meaning.removeClass('disabled').addClass('wrong');
                }

                var el_hint = [];
                $('.flip-card .card-score').each(function () {
                    if (this.innerText == '50' || this.innerText == '80') {
                        el_hint = $(this).closest('.flip-card');
                    }
                });
                if (el_hint.length > 0) {
                    if (el_hint.find('.btn_audio').length == 0 || el_hint.find('.btn_audio').hasClass('hidden')) {
                        if (is_hurry == true) {
                            el_hint.find('.card-score').text(130);
                        } else {
                            el_hint.find('.card-score').text(100);
                        }
                    } else {
                        if (is_hurry == true) {
                            el_hint.find('.card-score').text(200);
                        } else {
                            el_hint.find('.card-score').text(150);
                        }
                    }
                }
                $('.flip-card').removeClass('hint');

                if (answer_el.length > 0) {
                    correct_meaning = answer_el.first();
                    if ((total_count - end_count) > 4) {
                        // 제시한 문제 배열에서 제거한다.
                        delete arr_word[word_idx];
                        delete arr_meaning[correct_meaning.data('num')];
                    }

                    if (correct_meaning.hasClass('wrong') == false) {
                        correct_meaning.removeClass('disabled').addClass('answer');
                    }

                    // setTimeout(function() {
                    showPoint(point);
                    // }, ani_time * 0.5);

                    setTimeout(function () {
                        playEffect('wrong');

                        if (point == 'Try Again') {
                            correct_meaning.find('.flip-card-inner')
                                .addClass('hideOut')
                                .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend');
                            correct_word.find('.flip-card-inner')
                                .addClass('hideOut')
                                .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                                .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                                    addQuestion_left();
                                });
                        } else {
                            correct_meaning.find('.flip-card-inner')
                                .addClass('rightFadeOut')
                                .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend');
                            correct_word.find('.flip-card-inner')
                                .addClass('leftFadeOut')
                                .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                                .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                                    addQuestion_left();
                                });
                        }

                    }, delay_time);
                } else {
                    var back = $('#b' + arr_word[word_idx]);
                    if (back.length > 0) {
                        correct_word.find('.match-text2')
                            .html(back.html())
                            .removeClass('text-center text-left')
                            .addClass(back.data('align'));
                    }
                    correct_word.removeClass('disabled').addClass('flip');

                    if ((total_count - end_count) > 4) {
                        // 제시한 문제 배열에서 제거한다.
                        // 					delete arr_meaning[meaning_idx];
                        delete arr_word[word_idx];
                    }

                    // setTimeout(function() {
                    showPoint(point);
                    // }, ani_time * 0.5);

                    showBackCount(correct_word, 0);

                    setTimeout(function () {
                        // correct_word.find('.match-text2').addClass('blink x2');
                        setTimeout(function () {
                            playEffect('wrong');

                            // correct_meaning.find('.flip-card-inner').animate({opacity:1, left: 0}, (ani_time * 0.7), addQuestion_left);
                            // correct_word.find('.flip-card-inner').animate({opacity:0, left: -1 * correct_word.width()}, (ani_time * 0.7));
                            // correct_meaning.find('.flip-card-inner').addClass('rightFadeOut');
                            correct_meaning
                                .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend');
                            correct_word.find('.flip-card-inner')
                                .addClass('leftFadeOut')
                                .unbind('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend')
                                .one('webkitAnimationEnd oanimationend oAnimationEnd msAnimationEnd animationend', function (e) {
                                    addQuestion_left();
                                });
                        }, ani_time * 6);
                    }, 500);
                }
            }

            return true;
        }

        return false;
    }

    var arr_circle_num = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳', '㉑', '㉒', '㉓', '㉔', '㉕', '㉖', '㉗', '㉘', '㉙', '㉚'];
    function showBackCount(el, sec) {
        var max = 3;
        var cur = max - sec;
        el.find('.match-meaning-count').text(arr_circle_num[cur]);
        // console.log(cur, el, el.find('.match-meaning-count'));
        if (cur > 1) {
            setTimeout(function () {
                showBackCount(el, (sec + 1));
            }, 1000);
        }
    }

    function convertTime(a) {
        a = Math.abs(a);
        var b = Math.floor(a / 600),
            c = Math.floor((a - 600 * b) / 10);
        return {
            minutes: b,
            seconds: 10 > c ? "0" + c : "" + c,
            tenths: a - 600 * b - 10 * c
        }
    }

    function refreshTimer() {
        var chkTime = ((new Date).getTime() < startTime) ? (startTime + limitTime + 10) : (new Date).getTime();
        var b = chkTime - startTime;
        var a = limitTime - b;
        if (a < 0) {
            $(".seconds").text('00');
            $(".minutes").text('00');
            clearInterval(secondTimer);
            is_timeover = true;
            return;
        }

        if (is_hurry == false && a < (limitTime / 2)) {
            showHurry();
        }

        if (a < 60000 && $('.minutes').parent().hasClass('text-danger') == false) {
            $('.minutes').parent().addClass('text-danger');
        }

        a = ("" + a / 1E3).split(".");
        var tenths = parseFloat(a[0] + (1 < a.length ? a[1].substr(0, 1) : 0));
        a = convertTime(tenths);
        // console.log(a);
        // $("#tens").text(a.tenths);
        $(".seconds").text(a.seconds.zf(2));
        $(".minutes").text(a.minutes.zf(2));
    }

    function questProg() {
        var chkTime = ((new Date).getTime() < questTime) ? (questTime + questLimit + 10) : (new Date).getTime();
        var limit = Infinity; //(is_hurry) ? (questLimit * hurrySpeed) : questLimit;
        var cur_time = chkTime - questTime;
        if (cur_time > limit) {
            cur_time = limit;
            clearIntervalAll();
            // clearInterval(questTimer);
            overTime(true);
        } else if (is_hint == false && cur_time > (limit / 2)) {
            showHint();
        }

        if (is_mobile == 1) {
            return;
        }

        var per = cur_time * 100 / limit;
        if (per < 4) {
            $('.prog-bar').addClass('noani');
        } else {
            $('.prog-bar').removeClass('noani');
        }
        $('.prog-bar').css('width', per + '%');
    }

    function playAudioMute() {
        if ((is_app_v2 || is_app_v3) && is_android) {
            return;
        } else if ((is_app_v2 || is_app_v3) && is_ios) {
            return;
        }

        audio.pause();
        var src = '/images/battle/mute.mp3';
        audio.src = src;
        audio.load();
        audio.play();
    }

    function playAudio(el, delay) {
        // console.log(el);
        var target = el.find('i');

        audio.pause();

        if (target.length == 0) {
            return;
        }

        if (target.data('src') == undefined || target.data('src') == '' || target.data('src') == '0') {
            return;
        }

        var src = target.data('src');
        var app_src = src.replace('https://media.classcard.net', '');
        app_src = app_src.replace('https://mobile3.classcard.net', '');
        app_src = app_src.replace('https://stgmedia.classcard.net', '');

        var obj = new Object();
        obj.src = src;
        obj.card_idx = target.data('idx');

        if (delay == null || delay === undefined) {
            delay = 0;
        }
        // console.log(obj);

        setTimeout(function () {
            if (is_app_v2 && is_android) {
                try {
                    window.androidInterface.playAudio(app_src);
                    return;
                } catch (err) {
                    // console.log('app', err);
                }
            } else if (is_app_v2 && is_ios) {
                try {
                    webkit.messageHandlers.playAudio.postMessage(app_src);
                    return;
                } catch (err) {
                    // console.log('app', err);
                }
            }

            if (is_app_v3 && is_android) {
                try {
                    window.androidInterface.playAudio2(JSON.stringify(obj));
                    return;
                } catch (err) {
                    // console.log('app', err);
                }
            } else if (is_app_v3 && is_ios) {
                try {
                    webkit.messageHandlers.playAudio2.postMessage(JSON.stringify(obj));
                    return;
                } catch (err) {
                    // console.log('app', err);
                }
            }

            audio.src = src;
            audio.load();
            audio.play();

            target.addClass('text-info');
        }, delay);
    }

    var arr_effect = [];
    function setEffect() {
        if (arr_effect.length == 0) {
            arr_key = ['ready', 'hurry', 'wrong', 'correct', 'click'];
            arr_src = ['/images/effect/fm_ready.mp3', '/images/effect/fm_warning.mp3', '/images/effect/ding.mp3', '/images/effect/correct_fade.mp3', '/images/effect/sac.mp3'];
            for (var i = 0; i < arr_key.length; i++) {
                var obj = new Object();
                var audio = new Audio();
                audio.src = arr_src[i];
                audio.load();

                obj.key = arr_key[i];
                obj.audio = audio;
                arr_effect.push(obj);
            }
        }
    }

    function playEffect(mode) {
        if ((is_app_v2 || is_app_v3) && is_android) {
            try {
                window.androidInterface.playEffect(mode);
                return;
            } catch (err) {
                // console.log('app', err);
            }
        } else if ((is_app_v2 || is_app_v3) && is_ios) {
            try {
                webkit.messageHandlers.playEffect.postMessage(mode);
                return;
            } catch (err) {
                // console.log('app', err);
            }
        }

        setEffect();
        for (var i = 0; i < arr_effect.length; i++) {
            if (arr_effect[i].key == mode) {
                arr_effect[i].audio.play();
                break;
            }
        }
    }
    try {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    } catch (error) {
        console.log(error);
    }
    console.log('################################');
    setEffect();

    function validSolve() {
        if ($('.flip-card.dropped').length > 0 && $('.flip-card.draged').length > 0) {
            return true;
        } else {
            return false;
        }
    }

    function sendScore(is_first, is_just_save) {
        if (is_first) {
            getRank(is_first, false);
        } else {
            if (current_score == -1) {
                if (is_just_save) {

                } else {
                    if (is_skip == 1) {
                        if (is_teacher) {
                            // console.log('teacher showRankPopup');
                            // 					            showRankPopup(0, class_idx, set_idx, 4, 10, current_score);
                            showRankPopup(c_u, class_idx, set_idx, 4, 10, send_score);
                        } else {
                            // console.log('std showRankPopup');
                            showRankPopup(c_u, class_idx, set_idx, 4, 10, send_score);
                        }
                    } else {
                        getRank(is_first, false);
                    }
                }

                current_score = -1;
                send_data = [];
                $('.score-end').removeClass('active');
                return;
            }

            var send_score = current_score;
            send_data = [];
            for(var i = 0; i < (2500 / 100); i++) send_data.push(ggk.d(100, 1));
            console.log(send_data);
            $data = { set_idx: set_idx, arr_key: ggk.a(), arr_score: send_data, activity: 4, tid: tid };
            // console.log($data);
            jQuery.ajax({
                url: "/Match/save",
                global: false,
                type: "POST",
                data: $data,
                dataType: "json",
                async: checkAjaxAsync(),
                success: function (data) {
                    // console.log(data);
                    if (data.result == 'ok') {
                        if (data.tid !== undefined) {
                            tid = data.tid;
                        }

                        if (is_just_save) {

                        } else {
                            if (is_skip == 1) {
                                if (is_teacher) {
                                    // console.log('teacher showRankPopup');
                                    showRankPopup(c_u, class_idx, set_idx, 4, 10, send_score);
                                } else {
                                    // console.log('std showRankPopup');
                                    showRankPopup(c_u, class_idx, set_idx, 4, 10, send_score);
                                }
                            } else {
                                getRank(is_first, false);
                            }
                        }

                        current_score = -1;
                        send_data = [];
                        $('.score-end').removeClass('active');
                    } else {
                        showAlert('오류', data.msg);
                    }
                },
                error: function (response, textStatus, errorThrown) {
                    // console.log('response', response);
                }
            });
        }
    }

    function sendPlayScore(user_name) {
        $data = { set_idx: set_idx, arr_key: ggk.a(), arr_score: send_data, activity: 4, class_idx: class_idx, user_name: user_name, tid: tid };

        // $data = {set_idx:set_idx, score:current_score, activity:4, class_idx:class_idx, user_name:user_name, tid:tid};

        // console.log($data);

        jQuery.ajax({
            url: "/Match/save",
            global: false,
            type: "POST",
            data: $data,
            dataType: "json",
            async: true,
            success: function (data) {
                // console.log(data);
                if (data.result == 'ok') {
                    if (data.tid !== undefined) {
                        tid = data.tid;
                    }

                    getRank(false, true);
                } else {
                    showAlert('오류', data.msg);
                }
            },
            error: function (response, textStatus, errorThrown) {
                // console.log('response : ' + response);
            }
        });
    }

    function getRank(is_first, is_end_play) {
        if (is_class) {
            $data = { set_idx: set_idx, activity: 4, class_idx: class_idx };
        } else {
            $data = { set_idx: set_idx, activity: 4 };
        }

        // console.log($data);

        jQuery.ajax({
            url: "/Match/rank",
            global: false,
            type: "POST",
            data: $data,
            dataType: "json",
            async: true,
            success: function (data) {
                // console.log(data);
                if (data.result == 'ok') {
                    if (is_first) {
                        for (var i = 0; i < data.msg.length; i++) {
                            var row = data.msg[i];
                            if (row.is_me == 1) {
                                server_score = eval(row.score);
                                break;
                            }
                        }
                        // console.log('sendScore getRank : false');
                        sendScore(false);
                    } else {
                        setRankModal2(data.msg, is_end_play);
                    }
                }
            },
            error: function (response, textStatus, errorThrown) {
                // console.log('response : ' + response);
            }
        });
    }

    function setRankModal(arr, is_end_play) {
        $modal = $('#sectionEndModal');

        // console.log(arr);

        $('table', $modal).empty();
        var user_name = '';
        var user_score = 0;
        var is_first = false;
        for (var i = 0; i < arr.length; i++) {
            var row = arr[i];
            var tr = '';

            if (i == (arr.length - 1) && arr.length > 1 && row.is_me == 1) {
                tr += '<tr style="height: 48px;"><td class="text-center" colspan="4"><i class="fa fa-ellipsis-v"></i></td></tr>';
                tr += '<tr style="height: 48px; background-color: #e4eed8;">';
                user_name = row.user_name;
                user_score = eval(row.score);
                if (i == 0) {
                    is_first = true;
                }
            } else if (row.is_me == 1) {
                tr += '<tr style="height: 48px; background-color: #e4eed8;">';
                user_name = row.user_name;
                user_score = eval(row.score);
                if (i == 0) {
                    is_first = true;
                }
            } else {
                tr += '<tr style="height: 48px;">';
            }

            /*
                    var a = ("" + eval(row.score) / 1E3).split(".");
                    var tenths = parseFloat(a[0] + (1 < a.length ? a[1].substr(0, 1) : 0));
                    a = convertTime(tenths);
            */

            if (row.profile_img != null && row.profile_img.length > 0) {
                tr += '<td class="text-right" width="50"><img class="img-circle" src="' + row.profile_img + '" width="35" height="35" /></td>';
            } else {
                tr += '<td class="text-right" width="50"><img class="img-circle" src="/images/default_photo.png" width="35" height="35" /></td>';
            }
            tr += '<td class="text-center text-warning" width="40">' + row.rank + '</td>';
            tr += '<td>' + row.user_name + '</td>';
            //         tr += '<td width="74">' + a.minutes + ':' + a.seconds + '</td>';
            tr += '<td width="74">' + row.score + '</td>';
            tr += '</tr>';

            $('table', $modal).append(tr);
        }


        // 	$('.section-layer', $modal).addClass('hidden');
        $('.section-layer h4', $modal).addClass('hidden');
        $('.count-layer', $modal).addClass('hidden');
        $('.modal-top-image', $modal).removeClass('hidden');
        $('.study-end-info', $modal).removeClass('hidden');
        $('.login-info', $modal).addClass('hidden');

        $('.btn-studyend-restart', $modal).removeClass('hidden').unbind('click').click(function () {
            // 	    $('.match-word').data('solve', 'r');
            initQuestion();
        });

        if (user_name.length > 0) {
            if (server_score == -1) {
                $('.study-end-info div', $modal).text('첫 도전을 축하드립니다. 1등에 도전해 보세요.');
            } else if (is_first) {
                $('.study-end-info div', $modal).text('축하합니다. ' + user_name + '님이 새로운 1등 이예요.');
            } else if (server_score > user_score) {
                /*
                            var a = ("" + eval(server_score) / 1E3).split(".");
                            var tenths = parseFloat(a[0] + (1 < a.length ? a[1].substr(0, 1) : 0));
                            a = convertTime(tenths);
                            $('.study-end-info div', $modal).text(user_name + '님 최고 기록은 ' + a.minutes + ':' + a.seconds + '입니다. 새로운 기록에 도전해 보세요.');
                */
                $('.study-end-info div', $modal).text(user_name + '님 최고 기록은 ' + server_score + '입니다. 새로운 기록에 도전해 보세요.');
            } else {
                $('.study-end-info div', $modal).text(user_name + '님의 새로운 기록을 세운 것을 축하해요! 1등에 도전해 보세요.');
            }
        } else {
            $('.study-end-info', $modal).addClass('hidden');

            if (is_end_play) {
                $('.play-end-info', $modal).addClass('hidden');
            }

            if (is_class && is_end_play == false) {
                $('.play-end-info', $modal).removeClass('hidden');
                $('.play-end-info', $modal).find('.play-score').text(current_score);
                $('.btn-studyend-restart', $modal).addClass('hidden');

                $modal.find('.btn-send-score').unbind('click').click(function (e) {
                    if (isEmpty($modal.find('[name="user_name"]').val())) {
                        showAlert('이름을 입력하세요.');
                        return;
                    }

                    sendPlayScore($modal.find('[name="user_name"]').val());
                });
                $modal.find('.btn-pass-score').unbind('click').click(function (e) {
                    sendPlayScore('이름 없음');
                });

            } else if (document.referrer.indexOf('/Embeded') > -1
                || document.referrer.indexOf('/embed/') > -1
                || document.referrer.indexOf('/set') > -1) {
                $('.login-info', $modal).removeClass('hidden');
            }
        }

        $modal.modal({
            backdrop: 'static'
        });
        $modal.modal('show');

        $('#sectionEndModal').modal({
            backdrop: 'loginModal'
        });
    }

    function setRankModal2(arr, is_end_play) {
        $modal = $('#sectionEndModal2');

        // console.log(arr);

        $('.rank-list', $modal).empty();
        var user_name = '';
        var user_score = 0;
        var is_first = false;
        var is_empty_rank = false;

        if (arr.length == 0 && is_class && is_end_play == false) {
            var tr = $modal.find('.template .game-result-row').clone();

            tr.addClass('me');
            tr.find('.game-result-img').attr('src', '/images/default_photo.png');
            tr.find('.num').text('1');
            tr.find('.name').html('<div class="input-group"><input type="text" class="form-control input-sm" name="user_name" placeholder="이름을 입력하세요"><span class="input-group-btn"><a class="btn-send-score btn btn-info btn-sm">저장</a></span></div>');

            tr.find('.score').text(current_score);

            $('.rank-list', $modal).append(tr);
            is_empty_rank = true;

            tr.find('.btn-send-score').unbind('click').click(function (e) {
                if (isEmpty($modal.find('[name="user_name"]').val())) {
                    $modal.find('[name="user_name"]').val('이름 없음');
                    /*
                                    showAlert('이름을 입력하세요.');
                                    return;
                    */
                }
                sendPlayScore($modal.find('[name="user_name"]').val());
                $modal.find('[name="user_name"]').val('');
            });
        }

        for (var i = 0; i < arr.length; i++) {
            var row = arr[i];

            if (is_class && is_end_play == false && is_empty_rank == false && current_score >= row.score) {
                var tr = $modal.find('.template .game-result-row').clone();

                tr.addClass('me');
                tr.find('.score').text(current_score);
                tr.find('.game-result-img').attr('src', '/images/default_photo.png');
                tr.find('.num').text(row.rank);
                tr.find('.name').html('<div class="input-group"><input type="text" class="form-control input-sm" name="user_name" placeholder="이름을 입력하세요"><span class="input-group-btn"><a class="btn-send-score btn btn-info btn-sm">저장</a></span></div>');



                $('.rank-list', $modal).append(tr);
                is_empty_rank = true;

                tr.find('.btn-send-score').unbind('click').click(function (e) {
                    if (isEmpty($modal.find('[name="user_name"]').val())) {
                        $modal.find('[name="user_name"]').val('이름 없음');
                        /*
                                            showAlert('이름을 입력하세요.');
                                            return;
                        */
                    }
                    sendPlayScore($modal.find('[name="user_name"]').val());
                    $modal.find('[name="user_name"]').val('');
                });
            }

            var tr = $modal.find('.template .game-result-row').clone();

            if (row.is_me == 1) {
                tr.addClass('me');
                user_name = row.user_name;
                user_score = eval(row.score);
                if (i == 0) {
                    is_first = true;
                }
            }

            /*
                    var a = ("" + eval(row.score) / 1E3).split(".");
                    var tenths = parseFloat(a[0] + (1 < a.length ? a[1].substr(0, 1) : 0));
                    a = convertTime(tenths);
                	
                    tr.find('.score').text(a.minutes + ':' + a.seconds);
            */
            tr.find('.score').text(row.score);
            if (row.profile_img != null && row.profile_img.length > 0) {
                tr.find('.game-result-img').attr('src', row.profile_img);
            } else {
                tr.find('.game-result-img').attr('src', '/images/default_photo.png');
            }
            if (is_empty_rank) {
                tr.find('.num').text(eval(row.rank) + 1);
            } else {
                tr.find('.num').text(row.rank);
            }

            if (is_class) {
                tr.find('.name').text(row.user_name);
            } else {
                tr.find('.name').text(row.login_id);
            }

            $('.rank-list', $modal).append(tr);
        }

        if (is_class && is_end_play == false && is_empty_rank == false) {
            var tr = $modal.find('.template .game-result-row').clone();

            tr.addClass('me');
            tr.find('.game-result-img').attr('src', '/images/default_photo.png');
            tr.find('.num').text($('.rank-list .game-result-row', $modal).length + 1);
            tr.find('.name').html('<div class="input-group"><input type="text" class="form-control input-sm" name="user_name" placeholder="이름을 입력하세요"><span class="input-group-btn"><a class="btn-send-score btn btn-info btn-sm">저장</a></span></div>');
            tr.find('.score').text(current_score);

            $('.rank-list', $modal).append(tr);
            is_empty_rank = true;

            tr.find('.btn-send-score').unbind('click').click(function (e) {
                if (isEmpty($modal.find('[name="user_name"]').val())) {
                    $modal.find('[name="user_name"]').val('이름 없음');
                    /*
                                    showAlert('이름을 입력하세요.');
                                    return;
                    */
                }
                sendPlayScore($modal.find('[name="user_name"]').val());
                $modal.find('[name="user_name"]').val('');
            });
        }

        if (is_class) {
            $('.btn-studyend-restart', $modal).text('Next');
        } else {
            $('.btn-studyend-restart', $modal).text('Retry');
        }
        $('.btn-studyend-restart', $modal).unbind('click').click(function () {
            initQuestion();
            $modal.modal('hide');
        });

        $('.play-end-info', $modal).addClass('hidden');
        $('.login-info', $modal).addClass('hidden');
        if (user_name.length > 0) {
            /*
                    if (server_score == -1) {
                        $('.study-end-info div', $modal).text('첫 도전을 축하드립니다. 1등에 도전해 보세요.');
                    } else if (is_first) {
                        $('.study-end-info div', $modal).text('축하합니다. ' + user_name + '님이 새로운 1등 이예요.');
                    } else if (server_score < user_score) {
                        var a = ("" + eval(server_score) / 1E3).split(".");
                        var tenths = parseFloat(a[0] + (1 < a.length ? a[1].substr(0, 1) : 0));
                        a = convertTime(tenths);
                        $('.study-end-info div', $modal).text(user_name + '님 최고 기록은 ' + a.minutes + ':' + a.seconds + '입니다. 새로운 기록에 도전해 보세요.');
                    } else {
                        $('.study-end-info div', $modal).text(user_name + '님의 새로운 기록을 세운 것을 축하해요! 1등에 도전해 보세요.');
                    }
            */
        } else {
            // console.log(is_end_play);
            if (is_end_play) {
                $('.play-end-info', $modal).addClass('hidden');
            }

            // console.log(is_class);
            // console.log(document.referrer);
            if (is_class && is_end_play == false) {

                // 	    } else if (document.referrer.length == 0 || document.referrer.indexOf('/Embeded') > -1 || document.referrer.indexOf('/set') > -1) {
            } else if (eval(c_u) == 0) {
                $('.login-info', $modal).removeClass('hidden');
            }
        }

        // console.log('');

        $('#sectionEndModal2').css({ 'display': 'block' });
        $('#sectionEndModal2').modal({
            backdrop: 'static'
        });
        $('#sectionEndModal2').modal('show');

        if ($modal.find('[name="user_name"]').length > 0) {
            setTimeout(function () {
                $modal.find('[name="user_name"]').focus();
            }, 500);
        }
    }

    function isEmpty(val) {
        // console.log(val);
        if (val == null || typeof val == 'undefind' || val.trim().length < 1) {
            return true;
        }
        return false;
    }

    function showSetting() {
        if (document.referrer.indexOf('ClassMain') > -1 && is_class == false && is_skip == 0) {
            is_class = true;
        }

        if (is_class && is_skip != 1) {
            $('.start-match .viewset-layer').addClass('hidden');
            $('.start-match .class-layer').removeClass('hidden');

            $('.top-title').text('매칭 타임');

            $('.start-match .btn-start-text').text('매칭 타임 시작');
            $('body').css({ 'background-color': '#126D3B' });
        } else {
            $('.start-match .viewset-layer').removeClass('hidden');
            $('.start-match .class-layer').addClass('hidden');

            $('.start-match .btn-start-text').text('매칭 게임 시작');
            $('body').css({ 'background-color': '#424242;' });
        }
    }

    function showEndScore() {
        // console.log('showEndScore');

        // if (current_score == 0) {
        // 	current_score = eval($('.point').first().text());
        // }

        $('.score-text').text(current_score);
        $('.score-end').addClass('active');

        if (is_class && is_skip != 1) {
            getRank(false, false);
        } else {
            if (is_skip == 1) {
                // console.log('sendScore btn_ned : false');
                sendScore(false);
            } else {
                // console.log('sendScore btn_ned : true');
                sendScore(true);
            }
        }
    }

    function setStart() {
        clearInterval(secondTimer);
        clearIntervalAll();
        // clearInterval(questTimer);
        if (is_class) {
            quest_max_cnt = matchCnt;
        }
        // console.log('##################', 0, audio_checked);
        // console.log('##################', 1);
        // if (audio_checked == false) {
        // 	console.log('##################', 2);
        // 	setTimeout(function() {
        // 		console.log('##################', 3);
        // 		chkAudioFile(0);
        // 	}, 40);
        // }
        initQuestion();
    }

    function chkAudioFile(idx) {
        var body = $('.quest-list');
        var card_list = body.find('.match-word');
        var len = card_list.length;
        // console.log(len, idx);
        if (idx < len) {
            var cur_card = $(card_list[idx]);
            // console.log('chk1');
            if (cur_card.data('audio') !== undefined && cur_card.data('audio').length > 0 && cur_card.data('audio') != '0') {
                // console.log('chk2');
                var chk_audio = new Audio();
                $(chk_audio).bind('loadeddata', function () {
                    // console.log('chk4');
                    cur_card.data('chk_a', '1').attr('data-chk_a', '1');
                    chkAudioFile((idx + 1));
                }).bind('error', function () {
                    // console.log('chk5');
                    audio_checked = true;
                });

                chk_audio.src = cur_card.data('audio');
                chk_audio.load();
            } else {
                // console.log('chk3');
                chkAudioFile((idx + 1));
            }
        } else {
            audio_checked = true;
        }
    }

    function fy(a, b, c, d) {
        c = a.length;
        while (c)
            b = Math.random() * (--c + 1) | 0
                , d = a[c]
                , a[c] = a[b]
                , a[b] = d
    }
});

function hideHeader() {
    $('#header-learn').addClass('hidden');
    $('#wrapper-learn').css({ top: 0, height: '100%' });
    $('.ly-banner').remove();
    chkDevice();

    try {
        if (is_ios) {
            // console.log('app', 'run ios');
            webkit.messageHandlers.onLoad.postMessage('onload');
        } else if (is_android) {
            // console.log('app', 'run android');
            window.androidInterface.onLoad();
        } else {
            // console.log('app', 'no device....');
        }
    } catch (err) {
        // console.log(err);
    }

    if (mobileTimer != null) {
        clearTimeout(mobileTimer);
        mobileTimer = null;
    }
    restartByApp();
}

function hideHeader2() {
    $('#header-learn').addClass('hidden');
    $('#wrapper-learn').css({ top: 0, height: '100%' });
    $('.ly-banner').remove();
    chkDevice();
    is_app_v2 = true;

    try {
        if (is_ios) {
            // console.log('app', 'run ios');
            webkit.messageHandlers.onLoad.postMessage('onload');
        } else if (is_android) {
            // console.log('app', 'run android');
            window.androidInterface.onLoad();
        } else {
            // console.log('app', 'no device....');
        }
    } catch (err) {
        // console.log(err);
    }

    if (mobileTimer != null) {
        clearTimeout(mobileTimer);
        mobileTimer = null;
    }
    restartByApp();
}

function hideHeader3() {
    $('#header-learn').addClass('hidden');
    $('#wrapper-learn').css({ top: 0, height: '100%' }).find('>div.vertical-mid').css({ 'padding-top': 30 });
    $('.ly-banner').remove();
    chkDevice();
    is_app_v2 = true;

    try {
        if (is_ios) {
            // console.log('app', 'run ios');
            webkit.messageHandlers.onLoad.postMessage('onload');
        } else if (is_android) {
            // console.log('app', 'run android');
            window.androidInterface.onLoad();
        } else {
            // console.log('app', 'no device....');
        }
    } catch (err) {
        // console.log(err);
    }

    if (mobileTimer != null) {
        clearTimeout(mobileTimer);
        mobileTimer = null;
    }
    restartByApp();
}

function hideHeader4() {
    $('#header-learn').addClass('hidden');
    $('#wrapper-learn').css({ top: 0, height: '100%' });
    $('.ly-banner').remove();
    chkDevice();
    is_app_v3 = true;

    try {
        if (is_ios) {
            // console.log('app', 'run ios');
            $('#wrapper-learn').css({ top: 0, height: '100%' }).find('>div.vertical-mid').css({ 'padding-top': 30 });
            webkit.messageHandlers.onLoad.postMessage('onload');
        } else if (is_android) {
            // console.log('app', 'run android');
            window.androidInterface.onLoad();
        } else {
            // console.log('app', 'no device....');
        }
    } catch (err) {
        // console.log(err);
    }

    if (mobileTimer != null) {
        clearTimeout(mobileTimer);
        mobileTimer = null;
    }
    restartByApp();
}

function chkDevice() {
    // console.log('app', 'chkDevice');
    try {
        if (webkit && webkit.messageHandlers) { is_ios = true; }
    } catch (err) {
        is_ios = false;
        // console.log('app', err);
    }

    try {
        if (window.androidInterface) { is_android = true; }
    } catch (err) {
        is_android = false;
        // console.log('app', err);
    }
}

function stopByApp() {
    clearIntervalAll();
    // clearInterval(questTimer);
    clearInterval(secondTimer);
    is_mobile_end = true;
    return true;
}

function restartByApp() {
    stopByApp();
    $('.btn-app-start').click();
    return true;
}

function setPause() {
    clearIntervalAll();
    // clearInterval(questTimer);
}

function setResume() {
    clearIntervalAll();
    // clearInterval(questTimer);
    if (questPauseTime > 0) {
        questTime += ((new Date).getTime() - questPauseTime);
    }
    questTimer = setInterval(function () {
        $('.btn-app-quest-prog').click();
    }, 500);
    questPauseTime = 0;
}

function clearIntervalAll() {
    for (var i = timers.length; i--;) {
        if (timers[i] != secondTimer) {
            clearInterval(timers[i]);
        }
    }
}

function failAppAudio(src) {
    // console.log('failAppAudio');
    // console.log(src);
    if (src == undefined || src == '' || src == '0') {
        return;
    }

    // console.log('audio click');
    audio.src = src;
    audio.load();
    audio.play();

    // target.addClass('text-info');
}
