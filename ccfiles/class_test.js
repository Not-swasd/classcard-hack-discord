var card_index = -1;
var timer_index = null;
var cur_time;
var limit_time;
var handicap_time = 0;
var isChange = false;
var isSystemPopup = true;
var is_submited = 0;
var is_change_setting = false;

jQuery(function ($) {
    $('[data-toggle="audio-tooltip"]').tooltip({ container: 'body' });

    function setTestState(mode) {
        if (typeof (Storage) !== "undefined") {
            if (mode == 0) {
                localStorage.removeItem('test_state');
            } else {
                localStorage.setItem('test_state', mode);
            }
        }
    }

    $('.btn-back').unbind('click').click(function (e) {
        if (isChange) {
            showConfirm('테스트를 종료하고 결과를 제출하시겠습니까?', ''
                , function () {
                    $('#confirmModal').modal('hide');
                    setTimeout(function () {
                        submitTest();
                    }, 100);
                }
                , null, null, null, '제출');
        } else {
            location.href = '/set/' + set_idx;
        }
    });
    $('.btn-home').unbind('click').click(function (e) {
        if (isChange) {
            showConfirm('테스트를 종료하고 결과를 제출하시겠습니까?', ''
                , function () {
                    setTimeout(function () {
                        submitTest(home_url);
                    }, 100);
                }
                , null, null, null, '제출');
        } else {
            location.href = home_url;
        }
    });

    $('.quiz-start-div .btn-condition-next').click(function (e) {

        var this_obj = $(this);
        if (is_change_setting == true) {
            showConfirm('테스트 설정을 변경하고 저장하지 않았습니다. 변경사항을 버리고 테스트를 시작할까요?', null, function () { this_obj.closest('.layer').addClass('pass hidden'); $('.quiz-start-div .layer').not('.pass').first().removeClass('hidden'); }, null, null, null, '테스트 시작');
        } else {
            $(this).closest('.layer').addClass('pass hidden');
            $('.quiz-start-div .layer').not('.pass').first().removeClass('hidden');
        }
    });

    $('.test_pw').unbind('change').keyup(function (e) {
        var input = $(this);
        input.next().addClass('hidden');

        if (input.val().length == 4) {
            $.isLoading({ text: "비밀번호를 확인 중 입니다." });

            jQuery.ajax({
                url: '/ClassMainAsync/testPW',
                global: false,
                type: "POST",
                data: { class_idx: class_idx, set_idx: set_idx, pw: input.val() },
                dataType: "json",
                async: true,
                success: function (data) {
                    console.log(data);
                    if (data.result == 'ok') {
                        $('#quizPwdModal').modal('hide');
                        $('.retry-layer').addClass('pass hidden');
                        $('.quiz-start-div .layer').not('.pass').first().removeClass('hidden');
                    } else {
                        $('.pw-msg').text('비밀번호가 일치하지 않습니다').addClass('text-danger');
                    }
                },

                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest);
                },
                complete: function () {
                    $.isLoading("hide");
                }
            });
        }
    });

    $('#quizPwdModal').on('shown.bs.modal', function (e) {
        $('.test_pw').val('');
        $('.test_pw').focus();
        $('.test_pw').next().addClass('hidden');
    });
    $('#quizPwdModal').on('hidden.bs.modal', function (event) {
        $('.pw-msg').text('비밀번호를 입력하세요 (4자리)').removeClass('text-danger');
    });

    $('#testForm input').change(function () {
        isChange = true;
    });

    var isOnIOS = navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i);
    var eventName = isOnIOS ? "pagehide" : "beforeunload";

    window.addEventListener(eventName, function (event) {
        if (isChange) {
            if (isSystemPopup) {
                submitTestUnload();
            }
        }
    });

    var audio = new Audio();

    $(audio)
        .bind('loadstart', function () {
            console.log('audio loadstart');
            var ad = $('.btn-audio[data-src="' + $(this).attr('src') + '"]');

            if (ad.length > 0) {
                ad.addClass('text-info');
            }
        })
        .bind('error', function () {
            console.log('audio error');
            var ad = $('.btn-audio[data-src="' + $(this).attr('src') + '"]');

            if (ad.length > 0) {
                ad.removeClass('text-info').addClass('text-danger');
            }
        })
        .bind('ended', function () {
            console.log('audio ended');
            var ad = $('.btn-audio[data-src="' + $(this).attr('src') + '"]');

            if (ad.length > 0) {
                ad.removeClass('text-info text-danger');
            }
        });

    $('.btn-audio-auto').unbind('click').click(function (e) {
        e.preventDefault();
        return false;
    });

    $('.btn-audio').unbind('click').click(function (e) {
        playAudio($(this));
        e.preventDefault();
        return false;
    });

    $('.btn-current-send-input').unbind('click').click(function (e) {
        var _this = $(this);
        if (_this.hasClass('disabled')) {
            e.preventDefault();
            return false;
        }

        _this.addClass('disabled');
        setTimeout(function () {
            _this.removeClass('disabled');
        }, 500);

        console.log('##changeCard##', '1');
        changeCard();
    });

    $('.btn-test-retry').click(function (e) {
        if (is_owner == 1) {
            location.replace('/ClassTest/' + class_idx + '/' + set_idx + '?p=1&ex=1');
        } else {
            location.replace('/ClassTest/' + class_idx + '/' + set_idx);
        }
    });

    $('.btn-go-exit').unbind('click').click(function (e) {
        isSystemPopup = false;
        is_submited = 1;
        isChange = false;
        history.back();
    });

    $('.btn-retry-submit').unbind('click').click(function (e) {
        submitTest();
    });

    $('.btn-go-result').unbind('click').click(function (e) {

        $body = $('.test-end-box');
        $body.children().remove();
        jQuery.ajax({
            url: '/ClassMainAsync/getTestSubmitHistory',
            global: false,
            type: "POST",
            data: { class_idx: class_idx, set_idx: set_idx, user_idx: user_idx },
            dataType: "json",
            async: true,
            success: function (data) {
                console.log(data);
                if (data.result.result == 'ok') {
                    if (data.test_list.length > 0) {
                        var v_cnt = 0;
                        $.each(data.test_list, function (index, item) {
                            if (eval(index + 1) > (data.test_list.length - 3)) {
                                v_cnt++;
                                if (item.mem_progress == null) {
                                    var mem_progress = '';
                                } else {
                                    var mem_progress = item.mem_progress;
                                }
                                if (item.recall_progress == null) {
                                    var recall_progress = '';
                                } else {
                                    var recall_progress = item.recall_progress;
                                }
                                if (item.spell_progress == null) {
                                    var spell_progress = '';
                                } else {
                                    var spell_progress = item.spell_progress;
                                }
                                $html = '<div class="test-end-item">';
                                $html += '<div class="font-bold">' + eval(index + 1) + '차</div>';
                                $html += '<div class="font-12 m-t-xs text-gray">' + item.reg_date + '</div>';
                                $html += '<div class="m-t-sm">암기: ' + mem_progress + '%</div>';
                                $html += '<div>리콜: ' + recall_progress + '%</div>';
                                $html += '<div>스펠: ' + spell_progress + '%</div>';
                                if (v_cnt == 3 || v_cnt == data.test_list.length) {
                                    var score_class_name = 'text-primary';
                                    var score_text = item.score + '점 PASS';
                                    if (goal_score > -1) {
                                        if (item.score < goal_score) {
                                            score_class_name = 'text-danger';
                                            score_text = item.score + '점';
                                        }
                                    } else {
                                        score_class_name = 'text-gray';
                                        score_text = item.score + '점';
                                    }

                                    $html += '<div class="m-t-sm font-24 font-bold ' + score_class_name + '">' + score_text + '</div>';
                                } else {
                                    $html += '<div class="m-t-sm font-24 font-bold text-gray">' + item.score + '점</div>';
                                }

                                // 무조건 마지막 응시의 시험지 
                                if (eval(index + 1) == data.test_list.length) {
                                    btn_class = 'btn btn-primary';
                                    if (goal_score > -1) {
                                        if (item.score < goal_score) {
                                            btn_class = 'btn-danger';
                                        } else {
                                            btn_class = 'btn-primary';
                                        }
                                    } else {
                                        btn_class = 'btn-gray2';
                                    }
                                    $html += '<a style="padding:3px" class="w-80 m-t-xs font-13 btn radius show-test-sheet ' + btn_class + '" data-clsidx=' + class_idx + ' data-setidx=' + set_idx + ' data-useridx=' + user_idx + ' data-seq=' + eval(index + 1) + '>시험지</a>';
                                } else {
                                    $html += '<div style="height:18px;"></div>';
                                }

                                $html += '</div>';

                                $body.append($html);

                                $body.find('.show-test-sheet-alert').unbind('click').click(function (e) {
                                    showAlert('선생님이 시험지를 비공개 처리하셨습니다.');
                                });

                                $body.find('.show-test-sheet').unbind('click').click(function (e) {
                                    var class_idx = $(this).data('clsidx');
                                    var set_idx = $(this).data('setidx');
                                    var user_idx = $(this).data('useridx');
                                    var seq = $(this).data('seq');
                                    if (v_cnt == 3 || v_cnt == data.test_list.length) {
                                        $('#user_test_report_modal').modal('show').find('.modal-content').load('/ClassMain/getTestReport/' + class_idx + '/' + set_idx + '/' + user_idx);
                                    } else {
                                        showAlert('전체문항을 출제한 ' + seq + '차 응시 결과입니다.<br>(오답문제만 응시한 결과는 확인할 수 없습니다.)', '',
                                            function () {
                                                $('#user_test_report_modal').modal('show').find('.modal-content').load('/ClassMain/getTestReport/' + class_idx + '/' + set_idx + '/' + user_idx);
                                            }
                                        );
                                    }
                                });
                            }
                        });
                    }
                }
            },

            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log(XMLHttpRequest);
            },
            complete: function () {
                $.isLoading("hide");
            }
        });

        $('.end-layer .end').addClass('hidden');
        $('.end-layer .end.end-step-2').removeClass('hidden');
    });

    function playAudio(el) {
        if (el.data('src').length == 0) {
            return;
        }

        if (el.hasClass('text-danger')) {
            return;
        }

        audio.src = el.data('src');
        audio.load();
        audio.play();
    }

    $('.btn-show-ox').click(function (e) {
        $(this).find('i').removeClass('fa-check-square-o fa-square-o');
        if ($(this).hasClass('active')) {
            $(this).find('i').addClass('fa-square-o');
        } else {
            $(this).find('i').addClass('fa-check-square-o');
        }
        $(this).toggleClass('active');
    });

    $('.btn-quiz-start').click(function (e) {
        if (is_std_start == true) {
            card_index = -1;
            setLayer('test');
            nextCard();
            isChange = true;
        } else {
            if (disable_time_yn == 1) {
                checkAvailTestTime();
            } else {
                $.isLoading({ text: "테스트 문제를 생성중 입니다." });
                setTimeout(function () {
                    $.cookie("is_std_start", 1, { path: '/', expires: 1 });
                    document.location.reload();
                }, 100);
            }
        }
    });

    if (is_std_start) {
        $('.btn-quiz-start').click();
    }

    function checkAvailTestTime() {
        $.isLoading({ text: "테스트 문제를 생성중 입니다." });
        jQuery.ajax({
            url: '/ClassMainAsync/getAvailableTestTime',
            global: false,
            type: "POST",
            data: { class_idx: class_idx, set_idx: set_idx, user_idx: user_idx },
            dataType: "json",
            async: true,
            success: function (data) {
                if (data.result == 'ok') {
                    $.isLoading({ text: "테스트 문제를 생성중 입니다." });
                    setTimeout(function () {
                        $.cookie("is_std_start", 1, { path: '/', expires: 1 });
                        document.location.reload();
                    }, 100);
                } else {
                    showAlert(data.msg);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log(XMLHttpRequest);
            },
            complete: function () {
                $.isLoading("hide");
            }
        });
    }

    function setLayer(mode) {
        $('.layer').addClass('hidden');
        $('.' + mode + '-layer').removeClass('hidden');

        if (mode == 'test') {
            $('.test-top').removeClass('hidden');
            $('.test-bottom').removeClass('hidden');
            setInputEvent();
        } else if (mode == 'end') {
            $('.end-layer .end').addClass('hidden');
            $('.end-layer .end.end-step-0').removeClass('hidden');
            $('.end-layer .end.end-step-0 .ly-error').addClass('hidden');
        }
    }

    var next_timer = null;
    function setInputEvent() {
        $('.flip-card .flip-card-front').unbind('click').click(function () {
            console.log('##changeCard##', '2');
            $(this).unbind('click');
            changeCard();
        });

        $('.cc-radio-box input[type="radio"]').unbind('change').change(function (e) {
            if (next_timer != null) {
                clearTimeout(next_timer);
                next_timer = null;
            }

            next_timer = setTimeout(function () {
                console.log('##changeCard##', '3');
                changeCard();
            }, 200);
        });

        $('.flip-card .flip-card-back input[type="text"]').unbind('keyup').keyup(function (e) {
            if (this.value.trim().length == 0) {
                $(this).closest('.flip-card-back').find('.btn-send-input').text('몰라요');
            } else {
                $(this).closest('.flip-card-back').find('.btn-send-input').text('제출');
            }

            if (e.keyCode === 13) {
                console.log('##changeCard##', '4');
                changeCard();
            }
        });
        $('.flip-card .flip-card-back textarea').unbind('keyup').keyup(function (e) {
            var el = $(this).closest('.flip-card');

            var user_input = this.value;
            if (user_input.length > 0 && user_input.substring(user_input.length - 1) != ' ') {
                user_input = user_input.substring(0, user_input.length - 1);
            }
            console.log('user_input : ', user_input);
            var search_idx = 0;
            if (user_input.length > 0) {
                search_idx = user_input.blank().toArray(' ').length;
            }
            console.log('@#$@#$@#$@#$@#$@#$', search_idx);
            var answer = obj_answer['q' + el.find('[name="test_question[]"]').val()];
            var arr_answer = answer.blank().toArray(' ');
            var answer2 = filterVal(answer, false, true, true);
            answer = filterVal(answer, false, true);

            var user_input = filterVal(this.value, false, true);
            var user_input2 = filterVal(this.value, false, true, true);

            console.log('%%%%%%%%%%%%%%%', user_input, answer);

            if (answer.indexOf(user_input) == 0 || answer2.indexOf(user_input2) == 0) {
                $(this).removeClass('text-danger');
            } else {
                $(this).addClass('text-danger');
            }
        });

        $('.flip-card .flip-card-back .btn-send-input').unbind('click').click(function () {
            if ($(this).hasClass('disabled') == true) { return; }
            console.log('##changeCard##', '5');
            changeCard();
        });
    }

    function setOrderTopBtnEvent(els) {
        els.click(function (e) {
            var card_back = $(this).closest('.flip-card-back');
            var box = card_back.find('.box');
            if (box.hasClass('correct') || box.hasClass('wrong')) {
                e.preventDefault();
                return false;
            }
            if (box.hasClass('order')) {
                setOrdering(card_back, $(this));
                e.preventDefault();
                return false;
            }

            card_back.find('.test-sentence-words .btn-sentence-word[data-idx="' + $(this).data('idx') + '"]').removeClass('clicked');
            $(this).remove();

            if (card_back.find('.test-sentence-input .btn').length > 1) {
                card_back.find('.btn-start-order').removeClass('hidden');
            } else {
                card_back.find('.btn-start-order').addClass('hidden');
            }

            e.preventDefault();
            return false;
        });
    }

    function setOrdering(el, cur_btn) {
        el.find('.box').removeClass('order').addClass('ordering');
        el.find('.current-ordering-btn').html(cur_btn.clone().removeClass('clicked bottom'));

        var list = el.find('.ordering-btns');
        list.empty();
        el.find('.test-sentence-input .btn-sentence-word').each(function () {
            if ($(this).data('idx') == cur_btn.data('idx')) {
                return;
            }
            list.append($(this).clone());
        });

        list.find('.btn-sentence-word').unbind('click').click(function (e) {
            var idx = $(this).data('idx');
            var target = el.find('.current-ordering-btn .btn-sentence-word');
            var target_idx = target.data('idx');

            var btns = el.find('.test-sentence-input');
            btns.empty();
            $(this).parent().children().each(function () {
                btns.append($(this).clone());
                if ($(this).data('idx') == idx) {
                    btns.append(target.clone());
                }
            });
            setOrderTopBtnEvent(btns.find('.btn-sentence-word'));

            el.find('.test-sentence-words .btn-sentence-word[data-idx="' + target_idx + '"]').addClass('clicked');
            el.find('.box').removeClass('ordering');
            el.find('.btn-start-order').click();
        });
    }

    function setProgress(per) {
        $('.prog-bar').css('width', per + '%');
        if (per < 100) {
            $('.prog-bar').removeClass('danger').addClass('primary');
        } else {
            $('.prog-bar').removeClass('primary').addClass('danger');
        }
    }

    function setTimer(time) {
        clearTimer();

        limit_time = time;
        handicap_time = 0;
        cur_time = new Date();
        timer_index = setInterval(function () {
            var cal = new Date() - cur_time + handicap_time;
            var rate = (cal + 200) * 100 / limit_time;
            setProgress(rate);

            if (cal > limit_time) {
                clearTimer();
                console.log('##changeCard##', '6');
                changeCard();
            }
        }, 100);
    }

    function clearTimer() {
        if (next_timer != null) {
            clearTimeout(next_timer);
            next_timer = null;
        }

        if (timer_index != null) {
            clearInterval(timer_index);
            timer_index = null;
        }
    }


    var change_timer = null;
    var is_test_changing = false;
    function changeCard() {
        if (is_test_changing) {
            return;
        }

        is_test_changing = true;
        clearTimeout(change_timer);
        clearTimer();

        change_timer = setTimeout(function () {
            el = $('.flip-card:eq(' + card_index + ')');
            if (el.hasClass('flip') == true) {
                if (getQuestType(el) == 1) {
                    el.find('input[type="text"], textarea').blur();
                }

                if (
                    el.find('.box').last().hasClass('correct') == false
                    && el.find('.box').last().hasClass('wrong') == false
                ) {
                    setAnswer(el);
                } else {
                    nextCard();
                }
            } else {
                flipCard(el);
            }
        }, 200);
    }

    function flipCard(el) {
        setProgress(0);

        if (el === undefined) {
            el = $('.flip-card:eq(' + card_index + ')');
        }
        el.addClass('flip');

        var quest_type = getQuestType(el);
        var set_type = eval($('#set_type').val());
        if (quest_type == 1) {
            if (set_type == 5) {
                $('.btn-current-send-input').text('제출');
                $('.quiz-direction').text('정답을 입력하고 제출버튼을 클릭하세요.');
            } else {
                $('.quiz-direction').text('정답을 입력하고 엔터를 치세요.');
            }

            setTimeout(function () {
                el.find('input[type="text"], textarea').focus();
            }, 300);
        } else if (quest_type == 2) {
            $('.quiz-direction').text('블록을 클릭하여 단어를 순서대로 배열하세요.');
            $('.btn-current-send-input').text('제출');
            setSentenceBottom(el, el.find('.test-sentence-input').children().length);
        } else {
            $('.quiz-direction').text('마우스 또는 키보드로 선택하세요.');
        }

        setTimeout(function () {
            is_test_changing = false;
            setTimer(eval(el.data('limit2')));
            if (el.find('.btn-audio-auto').parent().hasClass('hidden') == false) {
                el.find('.btn-audio').first().click();
            }
        }, 300);
    }

    function nextCard() {
        setProgress(0);

        card_index++;

        if (card_index >= $('.flip-card').length) {
            console.log('######### end ########');
            if (card_index == $('.flip-card').length) {
                console.log('###########################################', '..........send............', '@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
                submitTest();
            }
            is_test_changing = false;
            return;
        }

        if (card_index > 0) { $('.flip-card:lt(' + (card_index - 1) + ')').removeClass('prev showing next').addClass('hidden'); }
        $('.flip-card:gt(' + (card_index + 1) + ')').removeClass('prev showing next').addClass('hidden');
        $('.flip-card:eq(' + (card_index - 1) + ')').removeClass('showing next hidden').addClass('prev');
        var el = $('.flip-card:eq(' + card_index + ')');
        el.removeClass('prev next hidden').addClass('showing');
        $('.flip-card:eq(' + (card_index + 1) + ')').removeClass('prev showing hidden').addClass('next');

        $('.current-quest-num').text((card_index + 1));
        $('.quiz-direction').text('정답을 생각한 후 시작하세요 (스페이스 키)');

        var quest_type = getQuestType(el);
        var set_type = eval($('#set_type').val());
        var send_btn = $('.btn-current-send-input');
        send_btn.text('시작하기');
        if (quest_type == 2 || (quest_type == 1 && set_type == 5)) {
            send_btn.parent().removeClass('hidden');
        } else {
            send_btn.parent().addClass('hidden');
        }

        el.find('.flip-card-front .cc-table>div>div').css('height', '');
        el.find('.flip-card-front .cc-table>div').ccalign();

        setTimeout(function () {
            is_test_changing = false;
            setTimer(eval(el.data('limit1')));
            if (el.find('.btn-audio-auto').parent().hasClass('hidden') == false) {
                el.find('.btn-audio').first().click();
            }
        }, 300);
    }

    function setAnswer(el) {
        if (el === undefined) {
            el = $('.flip-card:eq(' + card_index + ')');
        }

        console.log('######### setAnswer #########', el);

        var quest_type = getQuestType(el);
        var set_type = eval($('#set_type').val());

        var answer = obj_answer['q' + el.find('[name="test_question[]"]').val()];
        var user_answer = '';
        var is_filer = true;
        var is_allow_apostrophe = false;
        if (quest_type == 1) {
            user_answer = el.find('input[type="text"], textarea').removeClass('text-danger').val();
            el.find('.user_answer').val(user_answer);
            el.find('input[type="text"], textarea').attr('disabled', true);
            is_allow_apostrophe = true;
        } else if (quest_type == 2) {
            var user_answer = '';
            el.find('.test-sentence-input').children().each(function (i) {
                if (i > 0) { user_answer += ' '; }
                if (this.tagName == 'E') {
                    user_answer += '[e]' + $(this).text() + '[/e]';
                } else {
                    user_answer += $(this).text();
                }
            });
            el.find('.user_answer').val(user_answer);

            // 어순배열에서 오답을 선택한 단어를 제거 처리 (정오답 체크를 위해)
            user_answer = user_answer.replace(/(\[e\])(.*?)(\[\/e\])/gi, '');
        } else {
            user_answer = el.find('input[type="radio"]:checked').val();
            el.find('.user_answer').val(user_answer);
            user_answer = el.find('input[type="radio"]:checked').next().text().trim();
            el.find('input[type="radio"]').attr('disabled', true);
            is_filer = true;
        }

        var delay = 3000;
        var correct_yn = (
            (case_sensitive_yn == 1 && checkAnswer(answer, user_answer, false, is_filer, is_allow_apostrophe, (set_type == 2)) == true)
            || (case_sensitive_yn == 0 && checkAnswer(answer, user_answer, true, is_filer, is_allow_apostrophe, (set_type == 2)) == true)
        );
        // 오답 + 단어/용어 세트 + 단어/용어 제시 + 뜻 1개 정답인정 일때 처리
        console.log('###OneAnswer###', correct_yn, set_type, el.data('qoption'), spell_condition_yn);
        if (correct_yn == false && (set_type == 1 || set_type == 2) && el.data('qoption') == '1' && spell_condition_yn == 1) {
            var arr_ans = answer.split(/\r\n|\r|\n|;|,/gi);
            var arr_value = user_answer.split(/;|,/gi);
            console.log('###OneAnswer CHK###', '111', arr_ans, arr_value);

            var correct_cnt = 0;
            for (var j = 0; j < arr_value.length; j++) {
                for (var i = 0; i < arr_ans.length; i++) {
                    console.log('###OneAnswer VAL###', arr_ans[i], arr_value[j]);
                    if (arr_ans[i].trim().length == 0) {
                        continue;
                    }

                    var current_correct = (
                        (case_sensitive_yn == 1 && checkAnswer(arr_ans[i], arr_value[j], false, is_filer, is_allow_apostrophe, (set_type == 2)) == true)
                        || (case_sensitive_yn == 0 && checkAnswer(arr_ans[i], arr_value[j], true, is_filer, is_allow_apostrophe, (set_type == 2)) == true)
                    );
                    if (current_correct == true) {
                        correct_cnt++;
                        break;
                    }
                }
            }

            if (correct_cnt > 0 && correct_cnt == arr_value.length) {
                correct_yn = true;
            } else {
                correct_yn = false;
            }
        } else {
            console.log('###OneAnswer CHK###', '222');
        }
        if (correct_yn == true) {
            el.find('.flip-card-back .box').addClass('correct');
            delay = 500;
            playEffect('correct');
        } else {
            setTimeout(function () {
                el.find('.btn-audio').first().click();
            }, 700);

            el.find('.flip-card-back .box').addClass('wrong');
            el.find('.answer-body .text-success').text(answer);
            playEffect('wrong');
        }

        is_test_changing = false;
        if (quest_type == 2 || (quest_type == 1 && set_type == 5)) {
            $('.quiz-direction').text('다음 버튼을 선택하거나 스페이스 키를 눌러 다음 문제로 이동하세요');
            $('.btn-current-send-input').text('다음 문제');
        } else {
            $('.quiz-direction').text('3초 후 다음 문항으로 넘어갑니다 (즉시 이동하려면 스페이스 키)');

            next_timer = setTimeout(function () {
                console.log('##changeCard##', '7');
                changeCard();
            }, delay);
        }
    }

    var current_sentence_idx = 0;
    var sentenceBottomResetTimer = null;
    function setSentenceBottom(el, idx) {
        current_sentence_idx = idx;
        var answer = obj_answer['q' + el.find('[name="test_question[]"]').val()];
        var answer_arr = answer.replace(/(\s\/\s)/gi, ' ').blank().toArray(' ');
        if (current_sentence_idx >= answer_arr.length) {
            console.log('##changeCard##', '8');
            changeCard();
            return;
        }

        var suggest_cnt = 6;

        var limit_len = current_sentence_idx + suggest_cnt;
        var bottom_arr = [];
        for (var i = current_sentence_idx; (i < answer_arr.length && i < limit_len); i++) {
            if (answer_arr[i].replace(/[!?,.;]+$/gi, '').trim().length == 0) {
                bottom_arr.push(answer_arr[i].trim());
            } else {
                bottom_arr.push(answer_arr[i].replace(/[!?,.;]+$/gi, '').trim());
            }
        }
        fy(bottom_arr);

        var bottom_el = el.find('.test-sentence-words');
        bottom_el.empty();
        $.each(bottom_arr, function (index) {
            bottom_el.append('<a class="btn btn-sentence-word bottom animated">' + this + '</a>');
        });
        if (answer_arr.length > limit_len) {
            bottom_el.append('<span style="padding: 4.5px 12px 7.5px; vertical-align: middle;">⋯</span>');
        }

        bottom_el.find('.btn-sentence-word').unbind('click').click(function (e) {
            var card = $(this).closest('.flip-card');
            var card_back = card.find('.flip-card-back');
            var box = card_back.find('.box');
            if (box.hasClass('correct') || box.hasClass('wrong')) {
                e.preventDefault();
                return false;
            }

            if (box.hasClass('order')) {
                setOrdering(card_back, $(this));
                e.preventDefault();
                return false;
            }

            var user_input_el = card.find('.test-sentence-input');
            var answer_text = obj_answer['q' + el.find('[name="test_question[]"]').val()];
            var answer_arr = answer_text.replace(/(\s\/\s)/gi, ' ').blank().toArray(' ');

            if (user_input_el.find('span').length < answer_arr.length) {
                // 정/오답 체크...
                var pre_user_answer = filterVal($(this).text(), true);
                var pre_answer = filterVal(answer_arr[user_input_el.find('span').length], true);

                if (pre_user_answer == pre_answer) {
                    user_input_el.append('<span>' + answer_arr[user_input_el.find('span').length] + '</span>');
                    $(this).addClass('clicked correct fadeOut');

                    if (card.find('.test-sentence-words .btn-sentence-word').not('.clicked').length == 0) {
                        if (sentenceBottomResetTimer != null) {
                            clearTimeout(sentenceBottomResetTimer);
                            sentenceBottomResetTimer = null;
                        }
                        sentenceBottomResetTimer = setTimeout(function () {
                            setSentenceBottom(card, user_input_el.find('span').length);
                        }, 800);
                    }
                } else {
                    // 틀림....
                    console.log('틀림 처리를 합시다....');

                    user_input_el.append('<e>' + $(this).text() + '</e>');
                    card.find('.test-sentence-words .btn-sentence-word').addClass('disabled');
                    $(this).addClass('wrong shake');

                    var cap = limit_time / answer_arr.length * 1;
                    handicap_time += cap;
                    console.log('handi : ' + handicap_time + ', limit : ' + limit_time + ", answer_cnt : " + answer_arr.length);

                    var guide_body = $('.test-guide-body');
                    guide_body.find('.txt-test-guide').text('- ' + (cap / 1000).toFixed(1) + '초');
                    guide_body.addClass('active');
                    setTimeout(function () {
                        guide_body.removeClass('active');
                    }, 800);

                    if (sentenceBottomResetTimer != null) {
                        clearTimeout(sentenceBottomResetTimer);
                        sentenceBottomResetTimer = null;
                    }
                    sentenceBottomResetTimer = setTimeout(function () {
                        setSentenceBottom(card, user_input_el.find('span').length);
                    }, 900);
                }
            } else {
                // 다음 문제로 이동해야 함......
                console.log('##changeCard##', '9');
                changeCard();
            }

            e.preventDefault();
            return false;
        });
    }

    var arr_effect = [];
    function setEffect() {
        if (arr_effect.length == 0) {
            arr_key = ['wrong', 'correct'];
            arr_src = ['/images/effect/incorrect_short.mp3', '/images/effect/correct_fade.mp3'];
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

    // 문제유형
    // 0: 객관식, 1: 주관식, 2: 어순배열
    function getQuestType(el) {
        if (el.find('input[type="text"], textarea').length > 0) {
            return 1;
        } else if (el.find('.btn-sentence-word').length > 0) {
            return 2;
        }
        return 0;
    }

    $(document).unbind('keydown').keydown(function (e) {
        console.log(e.keyCode);
        console.log(e.ctrlKey);

        if (e.keyCode === 9) {
            var t = document.activeElement;
            console.log(t.tagName);
            if (t.tagName != 'INPUT') {
                console.log('cancel : tap key');
                e.preventDefault();
                return false;
            }

            if (t.tagName === 'INPUT') {
                var find_idx = -1;
                var arr_el = $(t).closest('.flip-card').find('>div ' + t.tagName);
                arr_el.each(function (el_idx, el) {
                    if (t == el) {
                        find_idx = el_idx;
                        return false;
                    }
                });
                if (find_idx > -1) {
                    console.log(find_idx, arr_el.length, e.shiftKey);
                    if (find_idx == 0 && e.shiftKey == true) {
                        console.log('cancel : first input, shift tap');
                        e.preventDefault();
                        return false;
                    }
                    if (find_idx > -1 && find_idx == (arr_el.length - 1) && e.shiftKey == false) {
                        console.log('cancel : last input');
                        e.preventDefault();
                        return false;
                    }
                }
            }
        }

        if ($('#alertModal').css('display') == 'block') {
            e.preventDefault();
            return;
        }

        if ($('.test-layer').hasClass('hidden') == true) {
            return;
        }

        if ($('.txt-next-guide').hasClass('active') == true) {
            showSpeedResult(true, true);
            e.preventDefault();
        }

        // backspace 처리
        if (e.keyCode == 8) {
            var t = document.activeElement;
            if (t.tagName != "INPUT" && t.tagName != "TEXTAREA")
                return false;
        }

        if (e.keyCode === 49 || e.keyCode === 97) {
            clickAnswer(0, e);
        } else if (e.keyCode === 50 || e.keyCode === 98) {
            clickAnswer(1, e);
        } else if (e.keyCode === 51 || e.keyCode === 99) {
            clickAnswer(2, e);
        } else if (e.keyCode === 52 || e.keyCode === 100) {
            clickAnswer(3, e);
        } else if (e.keyCode === 53 || e.keyCode === 101) {
            clickAnswer(4, e);
        } else if (e.keyCode === 54 || e.keyCode === 102) {
            clickAnswer(5, e);
        } else {
            if (e.target.tagName == "INPUT" || e.target.tagName == "TEXTAREA") {

            } else if (e.keyCode === 86) { // ctrl + space key or v key: audio button
                el = $('.flip-card:eq(' + card_index + ')');
                if (el.find('.btn-audio-auto').parent().hasClass('hidden') == false) {
                    el.find('.btn-audio').first().click();
                }
            }
        }

        if (e.target.tagName == "INPUT" || e.target.tagName == "TEXTAREA") {
        } else if (e.keyCode === 86) { // ctrl + space key or v key: audio button
            el = $('.flip-card:eq(' + card_index + ')');
            if (el.find('.btn-audio-auto').parent().hasClass('hidden') == false) {
                el.find('.btn-audio').first().click();
            }
        }


    });
    $(document).unbind('keyup').keyup(function (e) {
        console.log(e);

        if ($('#alertModal').css('display') == 'block') {
            e.preventDefault();
            return;
        }

        if ($('.test-layer').hasClass('hidden') == true) {
            return;
        }

        if ($('.txt-next-guide').hasClass('active') == true) {
            e.preventDefault();
            return;
        }

        // backspace 처리
        if (e.keyCode == 8) {
            var t = document.activeElement;
            if (t.tagName != "INPUT" && t.tagName != "TEXTAREA")
                return false;
        }

        if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA' && e.target.type != 'text' && e.target.type != 'textarea' && e.keyCode === 32) {
            if (chkObjectQuest()) {
                console.log('객관식 풀고 있는 중...');
                return false;
            } else {
                console.log('##changeCard##', '10');
                changeCard();
                e.preventDefault();
                return false;
            }
        }
    });

    function chkObjectQuest() {
        var el = $('.flip-card:eq(' + card_index + ')');
        if (el.length > 0) {
            if (el.hasClass('flip') == false) {
                return false;
            }
            if (getQuestType(el) == 0) {
                var box = el.find('.flip-card-back .box');
                if (box.hasClass('correct') == false && box.hasClass('wrong') == false) {
                    return true;
                }
            }
        }
        return false;
    }

    function clickAnswer(idx, ev) {
        var el = $('.flip-card:eq(' + card_index + ')');
        if (el.length > 0) {
            if (el.hasClass('flip') == false) {
                return;
            }
            if (getQuestType(el) == 0) {
                if (el.find('input[type="radio"]:eq(' + idx + ')').length > 0) {
                    el.find('input[type="radio"]:eq(' + idx + ')').click();
                }
                ev.preventDefault();
            }
        }
    }

    function submitTest(redirect) {
        $('.net-chk').remove();

        console.log('submit');
        clearTimer();
        setLayer('end');
        $.isLoading({ text: "응시기록을 제출중 입니다." });
        $form = $('#testForm');
        $.ajax('/ClassTest/submittest', {
            type: 'post',
            data: new FormData($form[0]),
            dataType: 'json',
            processData: false,
            contentType: false,

            success: function (data) {
                console.log(data);
                if (data.result == 'ok') {
                    isSystemPopup = false;
                    is_submited = 1;
                    isChange = false;

                    if (redirect !== undefined) {
                        location.href = redirect;
                        return;
                    }

                    if (goal_score > -1) {
                        var my_score = data.score.score;
                        if (my_score == 100) {
                            $('.end-layer .test-end-msg-title').html('<i><span class="text-primary">와우 100점이에요!</span></i>');
                            $('.end-layer .test-end-msg-body').html('축하합니다. 정말 대단합니다.');
                        } else if (my_score >= goal_score) {
                            $('.end-layer .test-end-msg-title').html('<i><span class="text-primary">' + my_score + '점이에요!</span></i>');
                            $('.end-layer .test-end-msg-body').html('선생님의 목표점수(' + goal_score + '점)을 달성하였습니다.');
                        } else {
                            $('.end-layer .test-end-msg-title').html('<i><span class="text-primary">' + my_score + '점이네요.</span></i>');
                            $('.end-layer .test-end-msg-body').html('선생님의 목표점수(' + goal_score + '점)에 재도전해 보세요.');
                        }
                    }

                    setLayer('end');
                    $('.end-layer .end').addClass('hidden');
                    $('.end-layer .end.end-step-1').removeClass('hidden');
                } else {
                    $('.end-layer .end.end-step-0 .ly-error').removeClass('hidden');
                    $('.ly-error').append('<div class="w-800 net-chk" style="margin-left:-22px; margin-top:190px; "><div class="text-white">⚠️ 아래 화면에 홈페이지가 정상적으로 표시되지 않으면 네트웍 오류를 점검해 주세요.</div><iframe class="m-t-sm fill-parent-w h-400" src="https://small.dic.daum.net/index.do"></iframe></div>');
                }
            },

            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log(XMLHttpRequest);
                $('.end-layer .end.end-step-0 .ly-error').removeClass('hidden');
                $('.ly-error').append('<div class="w-800 net-chk" style="margin-left:-22px; margin-top:190px; "><div class="text-white">⚠️ 아래 화면에 홈페이지가 정상적으로 표시되지 않으면 네트웍 오류를 점검해 주세요.</div><iframe class="m-t-sm fill-parent-w h-400" src="https://small.dic.daum.net/index.do"></iframe></div>');
            },
            complete: function () {
                $.isLoading("hide");
            }
        });
    }

    function submitTestUnload() {
        console.log('########################################################', 'start');
        setUserPref('unload_submit', 1);

        clearTimer();

        console.log('unload submit');
        setTestState(test_try_cnt);
        console.log('###@@@@###@@@@###@@@@###@@@@###@@@@ 11', test_try_cnt);

        isSystemPopup = false;
        is_submited = 1;
        isChange = false;

        $form = $('#testForm');
        $.ajax('/ClassTest/submittest', {
            type: 'post',
            data: new FormData($form[0]),
            dataType: 'json',
            async: checkAjaxAsync(),
            processData: false,
            contentType: false,

            success: function (data) {
                console.log(data);
                if (data.result == 'ok') {

                }
            },

            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log(XMLHttpRequest);
            },
            complete: function () {
                isSystemPopup = false;
                is_submited = 1;
                isChange = false;
                console.log('########################################################', 'end');
            }
        });
    }

    function fy(a, b, c, d) {
        c = a.length;
        while (c)
            b = Math.random() * (--c + 1) | 0
                , d = a[c]
                , a[c] = a[b]
                , a[b] = d
    }



    // 테스트 설정
    $('.btn-show-setting').click(function (e) {
        $(this).parent().toggleClass('open');
    });

    $('.btn-test-setting-close').click(function (e) {
        $('.setting-parent').toggleClass('open');
    });

    $('.btn-audio-auto').unbind('click').click(function (e) {
        if ($(this).hasClass('text-info')) {
            setUserPref('is_auto_play', 0);
            $('.btn-audio-auto').removeClass('text-info');
        } else {
            setUserPref('is_auto_play', 1);
            $('.btn-audio-auto').addClass('text-info');
        }

        e.preventDefault();
        return false;
    });

    if (is_owner == 1 && is_std_start == false) {
        $('.btn-show-setting').click();
    }

    var obj_answer = new Object();
    $('#testForm .flip-card').each(function () {
        var answer_el = $(this).find('.answer.hidden');
        obj_answer['q' + $(this).find('[name="test_question[]"]').val()] = answer_el.text().trim();

        answer_el.remove();
    });

});