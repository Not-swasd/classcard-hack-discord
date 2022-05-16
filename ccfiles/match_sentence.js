var is_ios = false;
var is_android = false;
var is_app_v2 = false;
var is_app_v3 = false;
var secondTimer;
var mobileTimer = null;
var is_mobile_end = false;
var back_audio = new Audio();

jQuery(function ($) {
    var audio = new Audio();
    var effect = new Audio();
    var is_mobile_first_click = true;
    var is_hurry_up = false;
    var current_score = 100;
    var startTime;
    var limitTime = Infinity;
    var hurryTime = 2 * 60 * 1000;
    var timer_el = $('.txt-timer');
    var total_score_el = $('.txt-total-score');
    var ani_end_event = 'webkitTransitionEnd transitionend';
    var click_event = (is_mobile == 1) ? 'touchstart' : 'click';
    var is_play_mute = false;
    var send_data = [];

    // console.log('app', 'onload');
    // initQuestion();
    // console.log('######################################222');
    $(document).bind('click', function (e) {
        // setBackgroundVideo();
        // console.log('document click!!!! 123', is_mobile, is_mobile_first_click);

        if (is_mobile_first_click) {
            // console.log('333333333');
            playAudioMute();

            is_mobile_first_click = false;
            $(document).unbind('click');
        }
    });
    $('.study-body').click(function (e) {
        // console.log('study-body click');
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

        sendScore(false, true);
    });

    $(audio)
        .bind('error', function () {
            // console.log('audio error');
            if (is_play_mute) {
                is_play_mute = false;
                return;
            }
            autoQuestAfterAudio();
        })
        .bind('ended', function () {
            // console.log('audio ended');
            if (is_play_mute) {
                is_play_mute = false;
                return;
            }
            autoQuestAfterAudio();
        });

    $('.btn-app-start').click(function (e) {
        setStart();
    });
    $('.btn-app-next-quest').click(function (e) {
        autoQuestAfterAudio();
    });

    $('.btn-back-audio').click(function (e) {
        if ($(this).data('on') == 0) {
            $('.btn-back-audio').data('on', 1)
                .find('i').removeClass('vol_off').addClass('vol_on');
            // console.log('BackAudio', 'pause', '2222');
            back_audio.pause();
        } else {
            $('.btn-back-audio').data('on', 0)
                .find('i').addClass('vol_off').removeClass('vol_on');
            playBackAudio();
        }
    });

    var background_timer = null;
    function setBackgroundMove() {
        if (background_timer != null) {
            clearTimeout(background_timer);
            background_timer = 0;
        }
        var back = $('.study-body');
        if (back.hasClass('left')) {
            back.removeClass('left').addClass('right');
        } else {
            back.addClass('left').removeClass('right');
        }

        background_timer = setTimeout(function () {
            setBackgroundMove();
        }, 11000);
    }

    function sendScoreToApp() {
        try {
            if (is_ios) {
                // console.log('app', 'run ios');
                webkit.messageHandlers.sendScore.postMessage(eval($('.txt-total-score').first().text()));
            } else if (is_android) {
                // console.log('app', 'run android');
                window.androidInterface.sendScore(eval($('.txt-total-score').first().text()));
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
                webkit.messageHandlers.sendEnd.postMessage(eval($('.txt-total-score').first().text()));
            } else if (is_android) {
                // console.log('app', 'run android');
                window.androidInterface.sendEnd(eval($('.txt-total-score').first().text()));
            } else {
                // console.log('app', 'no device....');
            }

            current_score = -1;
        } catch (err) {
            // console.log(err);
        }
    }

    function playAudioMute() {
        if (back_audio.paused && back_audio.src.length > 0) {
            playBackAudio();
        }

        back_audio.pause();
        var src = '/images/battle/mute.mp3';
        back_audio.loop = false;
        back_audio.src = src;
        back_audio.load();
        back_audio.play();

        if ((is_app_v2 || is_app_v3) && is_android) {
            return;
        } else if ((is_app_v2 || is_app_v3) && is_ios) {
            return;
        }

        is_play_mute = true;
        audio.pause();
        var src = '/images/battle/mute.mp3';
        audio.src = src;
        audio.load();
        audio.play();
    }

    function playBackAudio() {
        // 배경음악 처리 안함.
        return;
        // console.log('BackAudio', 'pause', '333');
        back_audio.pause();

        src = '/images/v2/match/background_match_01.mp3';
        back_audio.volume = 0.25;
        back_audio.loop = true;
        back_audio.src = src;
        back_audio.load();

        // console.log('back_audio 333');
        if ($('.btn-back-audio').data('on') == 0) {
            // console.log('back_audio 444');
            // console.log('BackAudio', 'pppppllllllaaaaaayyyy', '1111');
            back_audio.play();
        }
    }

    function playBackEndAudio() {
        // console.log('BackAudio', 'pause', '1111');
        back_audio.pause();

        src = '/images/battle/hurry_03.mp3';
        back_audio.volume = 0.4;
        back_audio.loop = false;
        back_audio.src = src;
        back_audio.load();
        // console.log('BackAudio', 'pppppllllllaaaaaayyyy', '22222');
        back_audio.play();
    }

    function playAudio(delay) {
        audio.pause();

        if (quest_idx >= study_data.length) {
            autoQuestAfterAudio();
            return;
        }
        if (study_data[quest_idx].audio_path === undefined) {
            autoQuestAfterAudio();
            return;
        }
        var src = study_data[quest_idx].audio_path;
        if (src.length == 0 || src == '0') {
            autoQuestAfterAudio();
            return;
        }
        if (delay == null || delay === undefined) {
            delay = 0;
        }

        $('.study-blind').addClass('active');
        setTimeout(function () {
            $('.audio-icon-body').addClass('active');
            if (is_app_v2 && is_android) {
                try {
                    window.androidInterface.playAudio(src);
                    return;
                } catch (err) {
                    // console.log('app', err);
                }
            } else if (is_app_v2 && is_ios) {
                try {
                    webkit.messageHandlers.playAudio.postMessage(src);
                    return;
                } catch (err) {
                    // console.log('app', err);
                }
            }

            var obj = new Object();
            obj.src = src;
            obj.card_idx = study_data[quest_idx].card_idx;
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

            audio.src = media_server + src;
            audio.load();
            audio.play();
        }, delay);
    }

    var arr_effect = [];
    function setEffect() {
        if (arr_effect.length == 0) {
            arr_key = ['ready', 'hurry', 'wrong', 'correct', 'click', 'perfect', 'next', 'good'];
            arr_src = ['/images/effect/fm_ready.mp3', '/images/effect/fm_warning.mp3', '/images/effect/ding.mp3', '/images/effect/correct_fade.mp3', '/images/effect/sac.mp3', '/images/battle/combo.mp3', '/images/battle/newcard.mp3', '/images/effect/good.mp3'];
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
        // console.log('playEffect', mode);
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
    setEffect();
    let q = false;
    function setStart() {
        // console.log('BackAudio', 'pause', '444');
        if(q) location.reload();
        q = true;
        back_audio.pause();
        fy(study_data);

        current_score = 1000;
        send_data = [];
        quest_idx = 0;
        combo_cnt = 0;
        is_hurry_up = false;
        clearInterval(secondTimer);

        $('#wrapper-learn').removeClass('is-hurry');
        var a = ("" + limitTime / 1E3).split(".");
        var tenths = parseFloat(a[0] + (1 < a.length ? a[1].substr(0, 1) : 0));
        a = convertTime(tenths);
        var txt_time = a.minutes.zf(2) + ':' + a.seconds.zf(2);
        timer_el.addClass('text-white').removeClass('text-danger').text(txt_time);
        total_score_el.text(current_score);

        showReady();
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
            $('#btn_end').click();
            return;
        }

        if (is_hurry_up == false && a < hurryTime) {
            showHurry();
        }

        a = ("" + a / 1E3).split(".");
        var tenths = parseFloat(a[0] + (1 < a.length ? a[1].substr(0, 1) : 0));
        a = convertTime(tenths);

        var txt_time = a.minutes.zf(2) + ':' + a.seconds.zf(2);
        if (is_hurry_up && is_mobile != 1) { txt_time += ' Hurry Up!'; }
        timer_el.text(txt_time)
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

    function fy(a, b, c, d) {
        c = a.length;
        while (c)
            b = Math.random() * (--c + 1) | 0
                , d = a[c]
                , a[c] = a[b]
                , a[b] = d
    }

    function autoQuestAfterAudio() {
        $('.audio-icon-body').removeClass('active');
        if (wrong_cnt == 0) {
            showScore(9999, true);
        } else {
            quest_idx++;
            setQuest();
        }
    }

    var quest_idx = 0;
    var word_idx = 0;
    var wrong_cnt = 0;
    var combo_cnt = 0;
    var arr_answer = [];
    var arr_input = [];
    function setQuest() {
        $('.study-blind').removeClass('active');

        var chkTime = ((new Date).getTime() < startTime) ? (startTime + limitTime + 10) : (new Date).getTime();
        var b = chkTime - startTime;
        var a = limitTime - b;
        if (a < 0) {
            clearInterval(secondTimer);
            is_timeover = true;
            current_score = eval(total_score_el.text().trim());
            $('#btn_end').click();
            return;
        }

        if (quest_idx >= study_data.length) {
            fy(arr_answer);
            quest_idx = 0;
            setQuest();
            return;
        }
        var front = study_data[quest_idx].front;
        arr_answer = front.replace(/(\s\/\s)/gi, ' ').blank().toArray(' ');
        arr_input = [];
        word_idx = 0;
        wrong_cnt = 0;
        // console.log(arr_answer);

        var quest_body = $('.quest-body');
        if (quest_body.hasClass('trans') == false) {
            quest_body.addClass('trans');
            setTimeout(function () {
                setQuest();
            }, 700);
            return;
        }

        $('.user-input-body').empty();
        setAnswerWord(-1);
        setSuggest();

        quest_body.removeClass('trans');
    }

    var fever_timer = null;
    function setSuggest() {
        var chkTime = ((new Date).getTime() < startTime) ? (startTime + limitTime + 10) : (new Date).getTime();
        var b = chkTime - startTime;
        var a = limitTime - b;
        if (a < 0) {
            clearInterval(secondTimer);
            is_timeover = true;
            current_score = eval(total_score_el.text().trim());
            $('#btn_end').click();
            return;
        }

        if (word_idx >= arr_answer.length) {
            //++++++ 답안이 5단어 이상일때 발음 재생 처리 +++++++
            if (arr_answer.length > 4) {
                playAudio(0);
            } else {
                quest_idx++;
                setQuest();
            }
            return;
        }

        var suggest_body = $('.suggest-body');
        suggest_body.empty();
        var arr_suggest = [];
        var start_idx = word_idx;
        var end_idx = (is_hurry_up) ? start_idx + 6 : start_idx + 4;
        if (end_idx > arr_answer.length) { end_idx = arr_answer.length; }
        if ((arr_answer.length - end_idx) == 1) { end_idx += 1; }
        for (var i = start_idx; i < end_idx; i++) {
            arr_suggest.push(arr_answer[i]);
        }

        fy(arr_suggest);
        // console.log(start_idx, end_idx);
        // console.log(arr_answer);
        // console.log(arr_suggest);

        $.each(arr_suggest, function (idx, item) {
            suggest_body.append('<div class="word-box"><div class="cc-ellipsis l1">' + item + '</div></div>')
        });

        //+++++ 블럭이 4개 이상인 경우에만 피버 적용
        suggest_body.removeClass('fever');
        if (fever_timer != null) {
            clearTimeout(fever_timer);
            fever_timer = null;
        }
        if (arr_suggest.length > 3) {
            suggest_body.addClass('fever');
            fever_timer = setTimeout(function () {
                suggest_body.removeClass('fever');
            }, (arr_suggest.length * 1000 * 1));
        }

        suggest_body.find('.word-box').unbind(click_event).bind(click_event, function () {
            var is_correct = false;
            if (word_idx < arr_answer.length && arr_answer[word_idx] != null) {
                if ($(this).text().trim() == arr_answer[word_idx].trim().replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')) {
                    is_correct = true;
                }
            }
            if (is_correct == true) {
                $(this).addClass('answer-o clicked').data('idx', word_idx);
                word_idx++;
            } else {
                $(this).addClass('answer-x');
                $('.suggest-body .word-box').addClass('clicked');
            }
        })
            .unbind(ani_end_event).one(ani_end_event, function (e) {
                if ($(this).hasClass('clicked') == false) {
                    return;
                }

                $(this).addClass('ani-start');
                if ($(this).hasClass('fade-out') == false) {
                    if ($(this).hasClass('answer-o')) {
                        if ($('.suggest-body .word-box').length == $('.suggest-body .answer-o.clicked.ani-start').length) {
                            clearTimeout(fever_timer);
                            fever_timer = null;
                            showScore($('.suggest-body .word-box').length * 50);
                        } else {
                            playEffect('click');
                        }

                        setAnswerWord(eval($(this).data('idx')));
                    } else {
                        wrong_cnt++;
                        combo_cnt = 0;
                        showScore(-50);
                    }
                }
                $(this).addClass('fade-out');
            });
        playEffect('next');
        calScrollHeight();

        if (back_audio.paused) {
            // console.log('back_audio 111');
            setTimeout(function () {
                // console.log('back_audio 222');
                playBackAudio();
            }, 500);
        }
    }

    var showNextBlockTimer = null;
    function setAnswerWord(idx) {
        if (showNextBlockTimer != null) {
            clearTimeout(showNextBlockTimer);
            showNextBlockTimer = null;
        }

        if (idx >= arr_answer.length) {
            return;
        }

        var body = $('.user-input-body');
        if (idx != -1) {
            body.find('.user-box.quest').remove();
            body.append('<div class="user-box heartBeat">' + arr_answer[idx] + '</div>')
        }

        if ((idx + 1) < arr_answer.length) {
            showNextBlockTimer = setTimeout(function () {
                body.append('<div class="user-box quest">?</div>');
            }, 700);
        }
    }

    function calScrollHeight() {
        var body = $('.study-content');
        var total_height = body.height();
        var cal_height = total_height;
        body.find('>*').each(function (idx, el) {
            if ($(el).hasClass('user-input-body')) {
                return;
            }
            cal_height -= $(el).outerHeight(true);
        });
        // console.log(total_height, cal_height);
        body.find('>.user-input-body').css('height', cal_height);
    }

    function showEndScore() {
        // console.log('showEndScore');
        // console.log('sendScore btn_ned : false');
        sendScore(false);
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
                            showRankPopup(c_u, class_idx, set_idx, 4, 10, send_score, 5);
                        } else {
                            // console.log('std showRankPopup');
                            showRankPopup(c_u, class_idx, set_idx, 4, 10, send_score, 5);
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
            // $data = {set_idx:set_idx, score:send_score, activity:4, tid:tid};

            // console.log($data);
            $data = { set_idx: set_idx, arr_key: ggk.a(), arr_score: send_data, activity: 4, tid: tid };

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
                            if (is_teacher) {
                                // console.log('teacher showRankPopup');
                                showRankPopup(c_u, class_idx, set_idx, 4, 10, send_score, 5);
                            } else {
                                // console.log('std showRankPopup');
                                showRankPopup(c_u, class_idx, set_idx, 4, 10, send_score, 5);
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
                    // console.log('response : ' + response);
                }
            });
        }
    }

    function getPerfectString() {
        var rtn = 'PERFECT!';
        if (combo_cnt == 2) { rtn = 'COMBO!'; }
        else if (combo_cnt == 3) { rtn = 'GREAT!'; }
        else if (combo_cnt == 4) { rtn = 'WOW!'; }
        else if (combo_cnt > 4) {
            var arr = ['AWESOME!', 'GENIUS!', 'REAL?', 'AMAZING!', 'OH MY GOD!', 'UNBELIEVABLE!', 'SUPER!'];
            rtn = arr[Math.floor(Math.random() * arr.length)];
        }
        return rtn;
    }

    function getPerfectPoint() {
        var combo_idx = combo_cnt - 1;
        if (combo_idx < 0) combo_idx = 0;
        if (combo_idx > 10) combo_idx = 10;
        return combo_idx * 100;
    }

    var show_score_timer = null;
    function showScore(val, is_perfect) {
        var el = $('.txt-score');
        var body = el.closest('.score-body');
        body.addClass('active');
        el.removeClass('correct wrong perfect bonus bounceOut bounceIn bounceInRight bounceOutLeft');
        if (val > 0) {
            if (val == 9999 && is_perfect !== undefined && is_perfect == true) {
                playEffect('perfect');
                val = arr_answer.length * 50;
                combo_cnt++;

                if (combo_cnt < 2) {
                    el.addClass('perfect').html('<div class="font-32">PERFECT!</div><div>+' + val + '</div>');
                } else {
                    if (is_mobile == 1) {
                        el.addClass('perfect').html('<div class="font-32">' + getPerfectString() + '</div><div style="font-size: 44px;">' + val + ' + ' + getPerfectPoint() + '</div>');
                    } else {
                        el.addClass('perfect').html('<div class="font-32">' + getPerfectString() + '</div><div class="font-50">' + val + ' + ' + getPerfectPoint() + '</div>');
                    }
                    val = val + getPerfectPoint();
                }
            } else {
                if ($('.suggest-body').hasClass('fever')) {
                    playEffect('good');
                    if (is_mobile == 1) {
                        el.addClass('bonus').html('<div class="font-32">FAST RUSH!</div><div class="font-55">' + val + ' X 2' + '</div>');
                    } else {
                        el.addClass('bonus').html('<div class="font-32">FAST RUSH!</div><div class="font-64">' + val + ' X 2' + '</div>');
                    }
                    val = val * 2;
                } else {
                    playEffect('correct');
                    el.addClass('correct').text('+' + val);
                }
            }
        } else {
            playEffect('wrong');
            el.addClass('wrong').text(val);
        }

        if (val < 0) { send_data.push(ggk.d(val * -1, 0)); } else { send_data.push(ggk.d(val, 1)); }

        if (current_score == -1) {
            current_score = eval(total_score_el.text().trim()) + eval(val);
        } else {
            current_score = eval(current_score) + eval(val);
        }
        total_score_el.text(current_score);
        sendScoreToApp();

        if (show_score_timer != null) {
            clearTimeout(show_score_timer);
            show_score_timer = null;
        }
        el.addClass('bounceIn');
        show_score_timer = setTimeout(function () {
            el.removeClass('bounceIn').addClass('bounceOut');
            setTimeout(function () {
                body.removeClass('active');
                el.text('').removeClass('bounceOut');
                //++++++ 발음 이후 Perfect 표시 처리 +++++++
                // if (is_perfect !== undefined && is_perfect == true) {
                // 	quest_idx++;
                // 	setQuest();
                // } else {
                // 	setSuggest();
                // }

                //++++++ Perfect이면 발음 없이 바로 다음문제 출제 처리 +++++++
                //++++++ 답안이 5단어 미만 이면 Perfect 없음 +++++++
                if (wrong_cnt == 0 && word_idx >= arr_answer.length && arr_answer.length > 4) {
                    if (is_perfect !== undefined && is_perfect == true) {
                        quest_idx++;
                        setQuest();
                    } else {
                        showScore(9999, true);
                    }
                } else {
                    setSuggest();
                }
            }, 500);
        }, 1000);
    }

    function showHurry() {
        playEffect('hurry');
        is_hurry_up = true;
        $('#wrapper-learn').addClass('is-hurry');
        timer_el.removeClass('text-white').addClass('text-danger');

        var el = $('.txt-hurry');
        var body = el.closest('.score-body');
        body.addClass('active');
        el.removeClass('hurry ready bounceOut bounceIn bounceInRight bounceOutLeft').addClass('hurry').text('Hurry Up!');

        el.addClass('bounceInRight');
        setTimeout(function () {
            el.removeClass('bounceInRight').addClass('bounceOutLeft');
            setTimeout(function () {
                body.removeClass('active');
                el.text('').removeClass('text-danger bounceOutLeft');
            }, 500);
        }, 1000);
    }

    function showReady() {
        is_mobile_end = false;
        var el = $('.txt-hurry');
        var body = el.closest('.score-body');
        body.addClass('active');
        el.removeClass('hurry ready bounceOut bounceIn bounceInRight bounceOutLeft').addClass('ready').text('READY!');

        el.addClass('bounceInRight');
        setTimeout(function () {
            playEffect('ready');
        }, 400);
        setTimeout(function () {
            setBackgroundMove();

            el.removeClass('bounceInRight').addClass('bounceOutLeft');
            setTimeout(function () {
                body.removeClass('active');
                el.text('').removeClass('text-white bounceOutLeft');
                setQuest();
                startTime = (new Date).getTime();
                secondTimer = setInterval(function () {
                    refreshTimer();
                }, 400);
            }, 500);
        }, 1000);
    }

    $('#btn_end').click(function (e) {
        clearInterval(secondTimer);
        is_mobile_end = true;

        playBackEndAudio();
        if (background_timer != null) {
            clearTimeout(background_timer);
            background_timer = 0;
        }
        $('.point-text-end>div').text(current_score);
        $('.point-text-end').addClass('active');
        setTimeout(function () {
            $('.point-text-end').removeClass('active');

            if (is_ios || is_android) {
                sendEndToApp();
            } else {
                showEndScore();
            }
        }, 5000);

        e.preventDefault();
    });

    if (is_mobile == 1) {
        mobileTimer = setTimeout(function () {
            setStart();
        }, 2000);
    } else {
        setStart();
    }
});

function hideHeader() {
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
    chkDevice();
    is_app_v3 = true;

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
    // console.log('BackAudio', 'pause', '5555');
    back_audio.pause();
    clearInterval(secondTimer);
    is_mobile_end = true;
    return true;
}

function restartByApp() {
    stopByApp();
    $('.btn-app-start').click();
    is_mobile_first_click = true;
    return true;
}

function setPause() {
    // clearInterval(questTimer);
    // console.log('BackAudio', 'pause', '6666');
    back_audio.pause();
}

function setResume() {
    // console.log('BackAudio', 'pause', '7777');
    back_audio.pause();
    // clearInterval(questTimer);
    // if (questPauseTime > 0) {
    // 	questTime += ((new Date).getTime() - questPauseTime);
    // }
    // questTimer = setInterval(function() {
    // 	questProg();
    // }, 500);
    // questPauseTime = 0;
}

function goNextQuest() {
    $('.btn-app-next-quest').click();
}