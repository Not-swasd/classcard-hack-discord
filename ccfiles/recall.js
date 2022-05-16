var audio = new Audio();
var slider;
var guide_timer;
var current_quest_idx = 0;
var is_data_loading = false;
var study_mode = 'recall';
var current_card_total = 0;

function getCards(all_cnt) {
	var arr_card_idx = [];
	var is_all = ($('.selScope:checked').val() == "1") ? true : false;
	
	if (current_section == 2000 || current_section == 3000 || current_section == 4000 || current_section == 0) {
//         is_all = false;
	}
	if (all_cnt == true) {
	    is_all = true;
    }
    
	if (is_all && current_section > 0 && current_section < 2000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.section_num === current_section; });
	} else if (current_section > 0 && current_section < 2000) {
		arr_slide_data = study_data.filter(function(obj) { return (obj.section_num === current_section && obj.known_yn < 1); });
	} else if (is_all && current_section == 2000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.recall_known_yn == 0; });
	} else if (current_section == 2000) {
		arr_slide_data = study_data.filter(function(obj) { return (obj.recall_known_yn == 0 && obj.known_yn < 1); });
	} else if (is_all && current_section == 3000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.spell_known_yn == 0; });
	} else if (current_section == 3000) {
		arr_slide_data = study_data.filter(function(obj) { return (obj.spell_known_yn == 0 && obj.known_yn < 1); });
	} else if (is_all && current_section == 4000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.favor_yn == 1; });
	} else if (current_section == 4000) {
		arr_slide_data = study_data.filter(function(obj) { return (obj.favor_yn == 1 && obj.known_yn < 1); });
	} else if (is_all && current_section == 6000) {
		arr_slide_data = study_data;
	} else if (current_section == 6000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.known_yn < 1; });
	} else if (current_section == 0) {
		arr_slide_data = study_data;
	}
	
	arr_slide_data.forEach(function(item, index) {
		arr_card_idx.push(item.card_idx);
	});
	    
    return arr_card_idx;
}

var arr_send_card_idx = [];
var arr_send_score = [];
var isChange = false;
function setSendLog(card_idx, score) {
	if (card_idx != 0) { isChange = true; }
	if (arr_send_card_idx.indexOf(card_idx) == -1) {
		arr_send_card_idx.push(card_idx);
		arr_send_score.push(score);
	} else if (arr_send_card_idx.indexOf(card_idx) < arr_send_score.length) {
		arr_send_score[arr_send_card_idx.indexOf(card_idx)] = score;
	}
}

var arr_send_view_idx = [];
function setSendView(card_idx) {
	if (card_idx < 1) { return; }
	if (arr_send_view_idx.indexOf(card_idx) == -1) {
		arr_send_view_idx.push(card_idx);
	}
}

function sendLearnAll() {
	isChange = false;
    console.log(arr_send_card_idx);
    console.log(arr_send_score);
    
    if (arr_send_card_idx.length == 0 || arr_send_card_idx.length != arr_send_score.length)
    {
	    arr_send_card_idx = [];
		arr_send_score = [];
// 	    return;
    }
    
    var send_section = (current_section > 999) ? 1 : current_section;
    var data = {
		set_idx_2:set_idx, 
		card_idx:arr_send_card_idx, 
		score:arr_send_score, 
		activity:2, 
		last_section:send_section, 
		last_round:current_round, 
		view_cnt:arr_send_view_idx.length,
		user_idx: c_u
	};
	
    jQuery.ajax({
		// url: "/Memorize/learnAll",
		url: "/ViewSetAsync/learnAll",
        global: false,
        type: "POST",
        data: data,
        dataType: "json",
        async: checkAjaxAsync(),
        success: function(data) {
            console.log(data);
            if (data.result == 'ok') {
                
            }
        },
        error: function(response, textStatus, errorThrown) {
            console.log('response : ' + response);
        },
        complete: function() {
	        arr_send_card_idx = [];
	        arr_send_score = [];
	        arr_send_view_idx = [];
	        setSendLog(0, 0);
        }
    });
}

function resetAllLog(is_study) {
	if (is_study === undefined) {
		is_study = false;
	}
	var data = {
		set_idx:set_idx, 
		activity:2,
		user_idx: c_u,
		view_cnt: arr_send_view_idx.length
	};

	isChange = false;
	if (is_study == true) {
		if ($('.selScope').is(':checked') == true) {
			$('.selScope').prop('checked', false);
		}
		hideStudyEnd();
	} else {
		console.log(getLogTime(), data);

		jQuery.ajax({
			// url: "/Memorize/resetAllLog",
			url: "/ViewSetAsync/resetAllLog",
			global: false,
			type: "POST",
			data: data,
			dataType: "json",
			async: true,
			success: function(data) {
				console.log(getLogTime(), data);
				if (data.result == 'ok') {
					study_data.forEach(function(item, index) {
						item.known_yn = -1;
					});
					
					current_round = 1;
					if ((current_section % 1000) == 0) {
	// 	                current_section = 1;
					} else {
						current_section = 1;
					}
					repeat_cnt++;
					arr_score = [];
					arr_total = [];
					arr_send_card_idx = [];
					arr_send_score = [];
					arr_send_view_idx = [];
					setSendLog(0, 0);
				}
			},
			error: function(response, textStatus, errorThrown) {
				console.log(getLogTime(), 'response : ' + response);
			}
		});
	}
}

function deleteLog(is_continue) {
	var arr_card_idx = getCards(true);
	var data = {
		set_idx:set_idx, 
		card_idx:arr_card_idx, 
		activity:2, 
		last_section:current_section,
		user_idx: c_u
	};

    console.log(data);

    jQuery.ajax({
		// url: "/Memorize/deleteLog",
		url: "/ViewSetAsync/deleteLog",
        global: false,
        type: "POST",
        data: data,
        dataType: "json",
        async: true,
        success: function(data) {
            console.log(data);
            if (data.result == 'ok') {
                for (var i = 0; i < arr_card_idx.length; i++) {
					var arr_data = study_data.filter(function(obj) { return obj.card_idx == arr_card_idx[i]; });
					arr_data.forEach(function(item, index) {
						item.known_yn = -1;
					});
                }
                
                if (is_continue && is_continue == true) {
	                current_round += 1;
                } else {
	                current_round = 1;
                }
	            arr_score = [];
	            arr_total = [];
				arr_send_card_idx = [];
				arr_send_score = [];
	
	            if ($('.selScope').is(':checked') == true) {
					$('.selScope').prop('checked', false);
				}
	            hideStudyEnd();
            }
        },
        error: function(response, textStatus, errorThrown) {
            console.log('response : ' + response);
        }
    });
}

function getCardCnt(all_cnt) {
    return getCards(all_cnt).length;
}

function changeStatusCard() {
	$send_yn = false;
	var cover = slider.find('.CardItem.current .card-cover');
	if (cover.data('status') == 'button') {
		$send_yn = true;
	}

    if ($send_yn) {
		console.log('113311', 'saveStudyStatus true');
        saveStudyStatus(true);
    }
}

function saveStudyStatus(is_next)
{
	console.log('is_next', is_next);
	var card = slider.find('.CardItem.current');
	var card_idx = card.data('idx');
    var status = card.data('status');
    var score = (status == 'k') ? 1 : 0;

	var send_section = (current_section > 999) ? 1 : current_section;
	setSendLog(card_idx, score);
	console.log('^^^^^^^^^^^^^^', status);
	if (status == 'k' || status == 'xk') {
		$('.btn-short-change-next').text('다음 카드');
		if (is_next)
		{
			console.log('paused : ' + audio.paused);
			if (audio.paused) {
				console.log('timeout next');
				isAuto = false;

				if (nextButtonTimer) {
					clearTimeout(nextButtonTimer);
					nextButtonTimer = null;
				}
				nextButtonTimer = setTimeout(function() {
					$('.btnNextCard').first().click();
				}, 1000);
			} else {
				console.log('audio next');
				isAuto = true;
			}
		}
    } else {
		$('.btn-short-change-next').text('나중에 한번 더');
		if (is_next)
		{
			console.log('paused : ' + audio.paused);
			if (audio.paused) {
				console.log('timeout next');
				isAuto = false;

				if (nextButtonTimer) {
					clearTimeout(nextButtonTimer);
					nextButtonTimer = null;
				}
				nextButtonTimer = setTimeout(function() {
					$('.btnNextCard').first().click();
				}, 1000);
			} else {
				console.log('audio next');
				isAuto = true;
			}
		}
    }
}

function refreshProgress() {
	console.log('start refreshProgress');
	var total_count = 0;
    var known_count = 0;	
    
	// 2016.11.02 TODO(1312)에 의거하여 보여지는 카드의 개수로 표시
	total_count = slider.find('.CardItem').length;
	known_count = slider.find('.CardItem[data-status="k"]').length;
    
    var unknown_count = total_count - known_count;
    console.log(getLogTime(), 'get prog cnt');

    // progress 표시
    $('.known_count').text((current_card_total - total_count) + known_count);
	$('.unknown_count').text(unknown_count);
	$('.total_count').text(current_card_total);

    blockCover = false;
}

var showCardStatusTimer = null;
function showCardStatus(el) {
	setTimeout(function() {
		if (el.data('status') == 'k') {
			el.addClass('correct');
			el.addClass('active').removeClass('deactive');
		} else {
			el.addClass('wrong');
			el.addClass('deactive').removeClass('active');
			
			if ($('body').hasClass('page-small') == true && window.navigator) {
				if (window.navigator.webkitVibrate !== undefined) {
					window.navigator.webkitVibrate(200);
				} else if (window.navigator.mozVibrate !== undefined) {
					window.navigator.mozVibrate(200);
				} else if (window.navigator.vibrate) {
					window.navigator.vibrate(200);
				} 
			}
		}
	}, 30);
	
	showCardStatusTimer = setTimeout(function() {
		if (el.hasClass('correct') == true) {
			el.addClass('active');
			el.removeClass('deactive');
		} else if (el.hasClass('wrong') == true) {
			el.addClass('deactive');
			el.removeClass('active');
		}
		el.removeClass('correct wrong');
		
		// 맞았을때 애니메이션 처리
	    if (el.hasClass('active') == true) {
		    var ani_el = el.find('.card-top').first().clone();
		    ani_el.addClass('ani');
		    el.append(ani_el);
		    setTimeout(function() {
			    ani_el.addClass('start');
			    setTimeout(function() {
				    el.find('.card-top.ani').remove();
					refreshProgress();
					
					setTimeout(function() {
						setButtonSpace();
					}, 500);
			    }, 610);
		    }, 10);		    
	    } else {
		    var ani_el = el.find('.card-top').first().clone();
			ani_el.addClass('ani').css({'background': '#fff'});
			el.append(ani_el);
			el.find('.card-correct-info').css('z-index', 3);
			setTimeout(function() {
				ani_el.addClass('animated shake');
				setTimeout(function() {
					el.find('.card-top.ani').remove();
					el.find('.card-correct-info').css('z-index', 1);
					// el.find('.card-top > div div').dotdotdot().trigger( 'destroy.dot' ).css({'height': ''});
					// el.find('.card-top .sentence-body').text(el.find('.card-bottom .normal-body').text());
					// setAutoFont(el);
					
					refreshProgress();

					setTimeout(function() {
						setButtonSpace();
					}, 500);
				}, 850);
			}, 10);
	    }
	}, 100);
}

function setButtonSpace() {
	console.log('############################');
	var card = slider.find('.CardItem.current');
	var cursor = 'default';
	card.find('.card-quest-item').each(function() {
		if ($(this).css('cursor') != 'default') {
			cursor = $(this).css('cursor');
		}
	});
	if (card.find('.card-cover').hasClass('down') && cursor == 'default') {
		console.log('^^^^^^^^^^^^^^', card);
		if (card.data('status') == 'k') {
			$('.btn-short-change-next').text('다음 카드');
		} else {
			$('.btn-short-change-next').text('나중에 한번 더');
		}
		$('#wrapper-learn .study-bottom').addClass('down');
	} else {
		$('#wrapper-learn .study-bottom').removeClass('down');
	}

	console.log('############################', $('.show_type:checked').val());
	if ($('.show_type:checked').val() == '2') {
		// 예문제시 - 예문없음이면 동작하지 않게 처리한다.
		console.log('############################', card.find('.card-top .text-example').children().length, card.find('.card-top .text-example').children()[0].tagName, card.find('.card-top .text-example span').hasClass('exam-data'));
		if (
			card.find('.card-top .text-example').children().length > 0
			&& card.find('.card-top .text-example').children()[0].tagName == 'SPAN'
			&& card.find('.card-top .text-example span').hasClass('exam-data') == false
		) {
			console.log('############################', '123123');
			$('#wrapper-learn .study-bottom').addClass('down');
			card.find('.card-cover').addClass('down');
			$('.btn-short-change-next').text('다음 카드');
		}
	}
}

function coverDown(is_change) {
	var cover = slider.find('.CardItem.current .card-cover');
    if (cover.length == 0 || cover.hasClass('hidden')) {
	    return;
    }
    $cover_height = cover.parent().height();
    
    console.log(eval(cover.css('top').replace('px', '')));
    if (eval(cover.css('top').replace('px', '')) >= $cover_height) {
	    return;
    }
    
    $('.card-quest-item .card-quest-list', slider).textfill({
		maxFontPixels: 18,
		minFontPixels: 12,
		innerTag: 'div',
		is_force: true
	});
	$('.card-quest-item .card-quest-list', slider).dotdotdot();

    if (is_change && set_type != 5) {
        $(cover).data('status', 'button');
    } else {
	    $(cover).data('status', 'cover');
    }
    
	cover.addClass('down').animate({top:$cover_height}, 250);
	
	setButtonSpace();
}

function coverUp() {
    var cover = slider.find('.CardItem.current .card-cover');
    if (cover.length == 0 || cover.hasClass('hidden')) {
	    return;
    }
    var top_min = cover.parent().children().first().outerHeight();

    cover.data('status', 'cover');
	cover.removeClass('down').animate({top:top_min}, 250);
	
	setButtonSpace();
}

function playAudio(is_force) {
	var btn_audio = slider.find('.CardItem.current .btn_audio');

	if (is_force !== undefined && is_force == true) {
		btn_audio.removeClass('disabled').tooltip({container: 'body'});
	}

	if (btn_audio.hasClass('disabled')) {
		if (set_type == 1) {
			showAlert('정답을 선택하고 발음을 들어 보세요.');
		} else if (set_type == 5) {
			showAlert('빈칸에 어순배열하고 발음을 들어 보세요.');
		}
		return;
	}

	audio.pause();
	
	console.log(getLogTime(), btn_audio.data('src'));

	if (btn_audio.data('src') === undefined || btn_audio.data('src') == '') {
		if (isAuto) {
			$('.btnNextCard').first().click();
		}	
		isAuto = false;
		return;
	}

	console.log('%%%%%%%%%%%%%%%%', audio.src, btn_audio.data('src'));
	if (audio.src.indexOf(btn_audio.data('src')) > -1 && btn_audio.hasClass('text-success')) {
		console.log('%%%%%%%%%%%%%%%%', 'match');
		btn_audio.removeClass('text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
		return;
	}

	audio.src = btn_audio.data('src');
	audio.load();
	try {
		var promise = audio.play();
		console.log(promise);
		if (promise !== undefined) {
			promise.then(function() {
				// Autoplay started!
			}).catch(function(error) {
				console.log(error);
				setTimeout(function() {
					console.log('123123');
					var ad = $('.btn_audio[data-src="' + audio.src + '"]');
					if (ad.length > 0) {
						ad.removeClass('text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
					}
				}, 300);
				
			});
		}
	} catch (error) {
		console.log(error);
	}
}
function stopAudio() {
	audio.pause();
	slider.find('.btn_audio').removeClass('text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
}

var arr_slide_data = [];
function setCard() {
	is_data_loading = true;
	if (slider.hasClass('in') == true) {
		slider.removeClass('in');
		setTimeout(function() {
			setCard();
		}, 150);
		return;
	}

	current_card_total = getCardCnt(true);

	var show_type = $('.show_type:checked').val();
	var is_all = ($('.selScope:checked').val() == "1") ? true : false;
    
    arr_slide_data = [];
	if (is_all && current_section > 0 && current_section < 2000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.section_num === current_section; });
	} else if (current_section > 0 && current_section < 2000) {
		arr_slide_data = study_data.filter(function(obj) { return (obj.section_num === current_section && obj.known_yn < 1); });
	} else if (is_all && current_section == 2000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.recall_known_yn == 0; });
	} else if (current_section == 2000) {
		arr_slide_data = study_data.filter(function(obj) { return (obj.recall_known_yn == 0 && obj.known_yn < 1); });
	} else if (is_all && current_section == 3000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.spell_known_yn == 0; });
	} else if (current_section == 3000) {
		arr_slide_data = study_data.filter(function(obj) { return (obj.spell_known_yn == 0 && obj.known_yn < 1); });
	} else if (is_all && current_section == 4000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.favor_yn == 1; });
	} else if (current_section == 4000) {
		arr_slide_data = study_data.filter(function(obj) { return (obj.favor_yn == 1 && obj.known_yn < 1); });
	} else if (is_all && current_section == 6000) {
		arr_slide_data = study_data;
	} else if (current_section == 6000) {
		arr_slide_data = study_data.filter(function(obj) { return obj.known_yn < 1; });
	} else if (current_section == 0) {
		arr_slide_data = study_data;
	}
	setCookieAt00('l_sec', current_section, 1);
	
	slider.empty();
	var template = $('.template .CardItem');
	var temp_quest = $('.template .card-quest-item');
	
	arr_slide_data.forEach(function(item, index) {
		var row = template.clone();
		
		row
			.data('idx', item.card_idx).attr('data-idx', item.card_idx)
			.data('favor', item.favor_yn).attr('data-favor', item.favor_yn);
		
		if (item.known_yn > 0) {
			row.addClass('active').data('status', 'k').attr('data-status', 'k');
		} else if (item.known_yn == 0) {
			// row.addClass('deactive').data('status', 'u').attr('data-status', 'u');
		}
		
		if (item.spell_known_yn > 0) {
			row.data('spell', 'k').attr('data-spell', 'k');
		} else {
			row.data('spell', 'u').attr('data-spell', 'u');
		}
		
		row.find('.card_order').val(item.card_order);
		row.find('.img_path').val(media_domain + item.img_path);
		
		if (item.front.indexOf('\n') > -1) {
			row.find('.card-top .text-normal').addClass('text-left');
		}
		if (item.front.length == 1) {
			row.find('.card-top .text-normal').html('<span class="normal-body lg" style="font-size: 80px; line-height: 50px;">' + item.front + '</span>');
		} else {
			row.find('.card-top .text-normal').html('<span class="normal-body">' + item.front.replace(/\n/gi, '<br>') + '</span>');
		}
		
		if (item.example_sentence == null || item.example_sentence.length == 0) {
			row.find('.card-top .text-example').html('<span style="color: #dfdfdf; border-bottom-width: 0px;">예문이 없는 카드입니다.</span>').addClass('text-center');
		} else {
			row.find('.card-top .text-example').css({'font-size': '24px', 'font-weight': 'normal', 'letter-spacing': '-0.7px'}).html(item.example_front.replace(/\n/gi, '<br>'));
		}
		
		if (set_type != 5 && item.img_path != null && item.img_path.length > 0) {
			row.find('.card-top')
				.addClass('img');
			row.find('.card-bottom').addClass('img');
			row.find('.card-bottom>div>div')
				.prepend('<span class="el-vertical img-span learn-small"><img src="' + media_domain + item.img_path + '"></span>')
		}
		
		if (item.audio_path != null && item.audio_path.length > 0 && item.audio_path != '0') {
			row.find('.icon-left .btn_audio').data('src', media_domain + item.audio_path).attr('data-src', media_domain + item.audio_path).append('<i class="cc vol_on"></i>');
			// row.find('.icon-left').append('<a class="btn-auto-play font-16 font-bold pos-relative" style="top: -3px;" data-toggle="tooltip" data-placement="right" title="오디오 자동 재생">AUTO</a>');
		}

		if (set_type == 5) {
			row.find('.icon-left .btn-auto-play').addClass('hidden');
		}
		
		row.find('.icon-middle .btn_favor i').data('idx', item.card_idx).attr('data-idx', item.card_idx);
		if (item.favor_yn > 0) {
			row.find('.icon-middle .btn_favor i').addClass('star text-warning');
		} else {
			row.find('.icon-middle .btn_favor i').addClass('star_o');
		}
		
		row.find('.icon-right .btn_know').data('idx', item.card_idx).attr('data-idx', item.card_idx);
		
		if (item.back.length == 1 && (item.example_sentence == null || item.example_sentence.length == 0)) {
			row.find('.card-bottom .text-normal').html('<span class="normal-body lg" style="font-size: 80px; line-height: 50px;">' + item.back + '</span>');
		} else {
			row.find('.card-bottom .text-normal').addClass('font-32').html('<span class="normal-body">' + item.back.replace(/\n/gi, '<br>') + '</span>');
		}
		if (item.back.indexOf('\n') > -1) {
			row.find('.card-bottom .text-normal').addClass('text-left');
		}
		
		if (item.example_sentence == null || item.example_sentence.length == 0) {
			row.find('.card-bottom .text-example').html(item.front.replace(/\n/gi, '<br>'));
		} else {
			row.find('.card-bottom .text-normal')
				.css('text-align', 'left')
				.append('<div class="exam_text" style="font-size: 24px; font-weight: normal; letter-spacing: -0.7px;">' + item.example_front.replace(/\n/gi, "<br>") + '</div>');
			row.find('.card-bottom .text-example').html(item.example_back.replace(/\n/gi, '<br>'));
		}
		
		var quest_height = 100;
		var num = 4;
		
		if (set_type == 5) {
			var sens = [];
			var sens_words = [];
			var blank_cnt = 4;
			
			var arr_front = item.front.replace(/(\s\/\s)/gi, ' ').toArray(' ');
			var s_idx = 0;
			if (arr_front.length > blank_cnt) {
				var s = 1;
				var e = arr_front.length - blank_cnt;
				s_idx = Math.floor((Math.random() * (e - s + 1)) + s);
			}
			var txt = '<span class="sentence-body">';
			$.each(arr_front, function (idx) {
// 					console.log('sentence : ' + this);
				
				if (idx > 0) { txt += ' '; }
				
				if (idx >= s_idx && idx < (s_idx + blank_cnt)) {
					txt += '<span class="sentence-word">';
					txt += '<span class="items"></span>';
					txt += '<span class="items">____</span>';
					if (show_type == '0') {
						sens_words.push(this);
					}
				} else {
					txt += '<span class="sentence-word clicked quest">';
					txt += '<span class="items">' + this + '</span>';
					txt += '<span class="items"></span>';
				}
				
				txt += '</span>';
			});
			txt += '</span>';
			row.find('.card-bottom .text-normal').append(txt);
			
			var arr_back = item.back.toArray(' ');
			s_idx = 0;
			if (arr_back.length > blank_cnt) {
				var s = 1;
				var e = arr_back.length - blank_cnt;
				s_idx = Math.floor((Math.random() * (e - s + 1)) + s);
			}
			txt = '<span class="sentence-body">';
			$.each(arr_back, function (idx) {
// 					console.log('sentence : ' + this);
				
				if (idx > 0) { txt += ' '; }
				
				if (idx >= s_idx && idx < (s_idx + blank_cnt)) {
					txt += '<span class="sentence-word">';
					txt += '<span class="items">' + this + '</span>';
					txt += '<span class="items">____</span>';
					if (show_type != '0') {
						sens_words.push(this);
					}
				} else {
					txt += '<span class="sentence-word clicked quest">';
					txt += '<span class="items">' + this + '</span>';
					txt += '<span class="items">____</span>';
				}
				txt += '</span>';
			});
			txt += '</span>';
			row.find('.card-top .text-normal').append(txt);
			
			if (show_type == '0') {
// 					sens = row.find('.card-bottom .sentence-word').not('.clicked');
				row.find('.card-top .sentence-word').addClass('clicked quest');

				var answer_text = '';
				row.find('.card-bottom .sentence-word').each(function() {
					if (answer_text.length > 0) { answer_text += ' '; }
					if ($(this).hasClass('clicked')) {
						// answer_text += $(this).find('span:first-child').text().trim();
					} else {
						answer_text += $(this).find('span:first-child').text().trim();
					}
				});
				// row.find('.card-top .sentence-body').prepend('<div class="text-success answer-box force font-18 text-left m-b-md"><span class="label label-success radius">정답</span> ' + answer_text + '</div>');
				// row.find('.card-bottom .sentence-word').not('.clicked').find('span:first-child').each(function() {
				// 	answer_text += ' ' + $(this).text().trim();
				// });
				// row.find('.card-top .sentence-body').append('<div class="text-success answer-box font-70p m-t-sm"><span class="label label-success radius">정답</span>' + answer_text + '</div>');
			} else {
// 					sens = row.find('.card-top .sentence-word').not('.clicked');
				row.find('.card-bottom .sentence-word').addClass('clicked quest');

				var answer_text = '';
				row.find('.card-top .sentence-word').each(function() {
					if (answer_text.length > 0) { answer_text += ' '; }
					if ($(this).hasClass('clicked')) {
						// answer_text += $(this).find('span:first-child').text().trim();
					} else {
						answer_text += $(this).find('span:first-child').text().trim();
					}
				});
				// row.find('.card-bottom .sentence-body').prepend('<div class="text-success answer-box force font-18 text-left m-b-md"><span class="label label-success radius">정답</span> ' + answer_text + '</div>');
				// row.find('.card-top .sentence-word').not('.clicked').find('span:first-child').each(function() {
				// 	answer_text += ' ' + $(this).text().trim();
				// });
				// row.find('.card-bottom .sentence-body').append('<div class="text-success answer-box font-70p m-t-sm"><span class="label label-success radius">정답</span>' + answer_text + '</div>');
			}
/*
			sens.each(function(index) {
				sens_words.push($(this).children().first().text());
			});
*/
			sens_words.sort(function() {
				return (Math.random() - Math.random());
			});
			num = sens_words.length;
			quest_height = 100 / num;
			sens_words.forEach(function(quest, index) {
				var input_q = quest.replace(/[!?,.;]+$/gi, '');
				if (input_q.length == 0) {
					input_q = quest;
				}
				var q = temp_quest.clone();
				q.data('idx', index).attr('data-idx', index);
				if (show_type == '0') {
					q.addClass('front-quest');
				} else {
					q.addClass('back-quest');
				}
				
				q.addClass('front-quest').css('height', quest_height + '%');
				q.find('.quest-num .num').text((index + 1) + '.');
				// q.removeClass('cc-table middle fill-parent-w');
				// q.find('.quest-num').addClass('hidden');
				q.find('.card-quest-list div').html(input_q);
				q.addClass('answer');
				
				row.find('.card-quest').append(q);
			});
			
			row.find('.card-top, .card-bottom').addClass('active');
			row.find('.card-cover').addClass('down').css('visibility', 'hidden');
		} else {
			if (show_type == '0') {
				num = item.front_quest.length + 1;
				quest_height = 100 / num;
				item.front_quest.forEach(function(quest, index) {
					var q = temp_quest.clone();
					q.data('idx', index).attr('data-idx', index);
					q.addClass('front-quest').css('height', quest_height + '%');
					q.find('.quest-num .num').text((index + 1) + '.');
					q.find('.card-quest-list div').html(getHtmlString(quest).replace(/<br>/gi, ' '));
					
					var chk1 = item.front.trim().replace(/\n/gi, ' ').replace(/<br>/gi, ' ');
					var chk2 = quest.toString().trim().replace(/\n/gi, ' ').replace(/<br>/gi, ' ');
					if (checkAnswer(chk1, chk2)) {
						q.addClass('answer');
					}
					
					row.find('.card-quest').append(q);
				});
			} else if (show_type == '1') {
				num = item.back_quest.length + 1;
				quest_height = 100 / num;
				item.back_quest.forEach(function(quest, index) {
					var q = temp_quest.clone();
					q.data('idx', index).attr('data-idx', index);
					q.addClass('back-quest').css('height', quest_height + '%');
					q.find('.quest-num .num').text((index + 1) + '.');
					q.find('.card-quest-list div').html(getHtmlString(quest).replace(/<br>/gi, ' '));
					
					var chk1 = item.back.trim().replace(/\n/gi, ' ').replace(/<br>/gi, ' ');
					var chk2 = quest.toString().trim().replace(/\n/gi, ' ').replace(/<br>/gi, ' ');
					if (checkAnswer(chk1, chk2)) {
						q.addClass('answer');
					}
					
					row.find('.card-quest').append(q);
				});
			} else {
				console.log(item);
				num = item.exam_quest.length + 1;
				quest_height = 100 / num;
				item.exam_quest.forEach(function(quest, index) {
					var q = temp_quest.clone();
					q.data('idx', index).attr('data-idx', index);
					q.addClass('exam-quest').css('height', quest_height + '%');
					q.find('.quest-num .num').text((index + 1) + '.');
					q.find('.card-quest-list div').html(getHtmlString(quest).replace(/<br>/gi, ' '));

					var chk1 = item.example_back.trim().replace(/\n/gi, ' ').replace(/<br>/gi, ' ');
					var chk2 = quest.toString().trim().replace(/\n/gi, ' ').replace(/<br>/gi, ' ');
					if (checkAnswer(chk1, chk2)) {
						q.addClass('answer');
					}
					
					row.find('.card-quest').append(q);
				});
			}
			
			var q = temp_quest.clone();
			q.data('idx', (num - 1)).attr('data-idx', (num - 1));
			q.css('height', quest_height + '%');
			q.find('.quest-num .num').text(num + '.');
			q.find('.card-quest-list div').html('모름');
			row.find('.card-quest').append(q);
		}
		
		if (show_type == '0') {
			$top_html = $('.card-top', row).html();
			$bottom_html = $('.card-bottom', row).html();
			$('.card-top', row).html($bottom_html);
			$('.card-bottom', row).html($top_html);
			
			// 의미제시 일때 예문이 안나오게 처리한다.
			// if (row.find('.card-top').find('.exam_text').length > 0) {
			// 	row.find('.card-top').addClass('left');
			// }
			row.find('.card-top').find('.exam_text').addClass('hidden');
		} else if (show_type == '2') {
			row.find('.card-top').addClass('left');
			row.find('.card-top').addClass('example');
			row.find('.card-bottom').addClass('example');
			// row.find('.btn_audio').addClass('hidden');
			// 2018-07-12 메뉴로 이동하면서 감추기 제거
// 				row.find('.btn-auto-play').addClass('hidden');
		} else {
			if (row.find('.card-bottom').find('.exam_text').length > 0) {
				row.find('.card-bottom').addClass('left');
			}
		}

		if (set_type != 5 && show_type != '1') {
			row.find('.btn_audio').addClass('disabled').tooltip('destroy');
		}

		if (set_type != 5) {
			row.find('.card-bottom').empty();
		} else {
			row.find('.card-top .text-example').text('');
			row.find('.card-bottom .normal-body').text('');
		}

		if (set_type == 1 && show_type == 2) {
			row.find('.card-top .normal-body').empty();
		}
					
		slider.append(row);
	});
    
    // shuffle 기능 추가
    if (set_type != 3 && $('.is_shuffle').is(':checked')) {
	    $new = slider.children().clone();
	    slider.empty();
	    $new.sort(function() {return (Math.round(Math.random()) -.05)});
	    slider.append($new);
	}

	slider.find('.card-bottom > div').addClass('hidden');
	
	if (is_auto_play == 1) {
	    slider.find('.btn-auto-play').addClass('active');
    }

    $('.btn_audio', slider).unbind('click').click(function(e) {
		playAudio();
		
		e.preventDefault();
		return false;
    });

    $('.btn_favor', slider).unbind('click').click(function(el) {
        $target = $(el.target);
		var card_idx = $target.data('idx');
		console.log($target[0].className);
        var favor_yn = ($target[0].className == 'cc star_o') ? 1 : 0;

        $data = {set_idx:set_idx, card_idx:card_idx, favor_yn:favor_yn};

        jQuery.ajax({
            url: "/Memorize/favor",
            global: false,
            type: "POST",
            data: $data,
            dataType: "json",
            async: true,
            success: function(data) {
                console.log(data);
                if (data.result == 'ok') {
                    if (favor_yn == 1) {
                        $target[0].className = 'cc star text-warning';
                    } else {
                        $target[0].className = 'cc star_o';
                    }

					var arr_data = study_data.filter(function(obj) { return obj.card_idx == card_idx; });
					arr_data.forEach(function(item, index) {
						item.favor_yn = favor_yn;
					});
                }
            },
            error: function(response, textStatus, errorThrown) {
                console.log('response : ' + response);
            }
		});
		
		el.preventDefault();
		return false;
    });
    
    $('.btn_know', slider).unbind('click').click(function(e) {
	    // 이슈 1524번 알아요/몰라요 막기
	    return;
	    
        $obj = $(this);
        
        if (showCardStatusTimer && $card_box_current.length > 0) {
			if ($card_box_current.hasClass('correct') == true) {
				$card_box_current.addClass('active');
				$card_box_current.removeClass('deactive');
			} else if ($card_box_current.hasClass('wrong') == true) {
				$card_box_current.addClass('deactive');
				$card_box_current.removeClass('active');
			}
			$card_box_current.removeClass('correct wrong');
			clearTimeout(showCardStatusTimer);
		}
        
        $card_box_current = $obj.parent().parent().parent();
        console.log($card_box_current);
        $card_idx = $obj.data('idx');
        console.log($card_idx);
        $score = ($card_box_current.data('status') == 'k') ? 0 : 1;
        console.log($score);

		var card_all = arr_slide_data.find(function(obj) { return obj.card_idx == $card_box_current.data('idx'); });
		
		if ($score == 0) {
            $card_box_current.data('status', 'u').attr('data-status', 'u');
			card_all.known_yn = 0;
        } else {
            $card_box_current.data('status', 'k').attr('data-status', 'k');
			card_all.known_yn = 1;
        }
		showCardStatus($card_box_current);
		console.log('113311', 'saveStudyStatus false');
        saveStudyStatus(false);
        changeStatusCard();
        refreshProgress();
        setTimeout(function() {
        	isQuestClick = true;
//             	coverUp();
// 			$obj.parent().addClass('hidden');
			// 안다/모른다 토글 이후 카드 이동을 막기위해 처리
			coverDown(false);
			
        }, 1000);
/*
        refreshProgress();
		saveStudyStatus(false);
*/
    });
    
    $('.btn_kown_o', slider).unbind('click').click(function(e) {
	    // 이슈 1524번 알아요/몰라요 막기
	    return;
	    
	    console.log('btn_o click');
	    
	    var temp_btn = $(this).parent();
	    var idx = temp_btn.data('idx');
	    var card = slider.find('.CardItem[data-idx="' + idx + '"]');
	    card.data('status', 'u').attr('data-status', 'u');
	    temp_btn.click();
	    
	    e.preventDefault();
	    return false;
	});
	$('.btn_kown_x', slider).unbind('click').click(function(e) {
		// 이슈 1524번 알아요/몰라요 막기
	    return;
	    
	    console.log('btn_x click');
	    
	    var temp_btn = $(this).parent();
	    var idx = temp_btn.data('idx');
	    var card = slider.find('.CardItem[data-idx="' + idx + '"]');
	    card.data('status', 'k').attr('data-status', 'k');
	    temp_btn.click();
	    
	    e.preventDefault();
	    return false;
	});
    
    // 2015.12.15 정답보기 제거로 인해 마우스 포인터 설정
	var arr_selected_text = [];
	var arr_selected_idx = [];
    $('.card-quest-item', slider).css({'cursor':'pointer'});
    $('.card-quest-item', slider).click(function(e) {
    	if (isQuestClick == false) {
	    	return false;
    	}
    	
    	if (set_type == 5) {
	    	// if ($(this).hasClass('clicked') == true) {
		    // 	return false;
	    	// }
	    	
	    	// $(this).addClass('clicked');
	    	// var card = $(this).closest('.CardItem');
	    	// card.find('.card-top div').dotdotdot().trigger( 'destroy.dot' ).css({'height': ''});
	    	// $(this).closest('.CardItem').find('.card-top .sentence-word').not('.clicked').first().addClass('clicked').children().first().html('<span style="text-decoration: underline;">' +  getHtmlString($(this).find('.card-quest-list div').text()) + '</span>');
	    	// setAutoFont(card);
	    	
			var cur_el = $(this);
			console.log('###TEST###', cur_el.data('idx'));
			var cur_val = getHtmlString(cur_el.find('.card-quest-list div').text());
			var cur_idx = cur_el.data('idx');
	    	var quest_body = cur_el.closest('.card-quest');

			if (quest_body.find('.card-quest-item.clicked').length == 0) {
				arr_selected_text = [];
				arr_selected_idx = [];
			}
			cur_el.toggleClass('clicked');
			// var find_idx = arr_selected_text.indexOf(cur_val);
			var find_idx = arr_selected_idx.indexOf(cur_idx);
			console.log('###TEST###', find_idx, cur_idx);
			if (cur_el.hasClass('clicked')) {
				if (find_idx == -1) {
					arr_selected_text.push(cur_val);
					arr_selected_idx.push(cur_idx);
				}
			} else {
				if (find_idx > -1) {
					arr_selected_text.splice(find_idx, 1);
					arr_selected_idx.splice(find_idx, 1);
				}
			}
			console.log('###TEST###', arr_selected_text, arr_selected_idx);

			var card = cur_el.closest('.CardItem');
			var arr_content = card.find('.card-top .sentence-word').not('.quest');
			arr_content.removeClass('clicked');
			// $.each(arr_selected_text, function(idx, text) {
			// 	if (idx < arr_content.length) {
			// 		var sel_el = $(arr_content.get(idx));
			// 		sel_el.addClass('clicked');
			// 		sel_el.children().first().html('<span style="text-decoration: underline;">' +  text + '</span>')
			// 	}
			// });
			$.each(arr_selected_idx, function(idx, idx2) {
				console.log(idx, idx2);
				if (idx2 < arr_content.length) {
					var sel_el = $(arr_content.get(idx));
					sel_el.addClass('clicked');
					sel_el.children().first().html('<span style="text-decoration: underline;">' +  arr_selected_text[idx] + '</span>')
				}
			});

			console.log(quest_body.children().length, quest_body.find('.card-quest-item.clicked').length);
	    	if (quest_body.children().length == quest_body.find('.card-quest-item.clicked').length) {
		    	var card_all = arr_slide_data.find(function(obj) { return obj.card_idx == card.data('idx'); });
				// var user_input = card.find('.card-top .sentence-word .items:first-child').text();
				var user_input = '';
				card.find('.card-top .sentence-word .items:first-child').each(function() {
					if (user_input.length > 0) { user_input += ' '; }
					user_input += $(this).text();
				});
				// var answer = card.find('.card-bottom .text-normal .normal-body').text();
				var answer = card_all.front;
				console.log('###ANS###', user_input, answer);
				console.log(card_all);
		    	console.log(user_input, answer);
		    	
		    	if (checkAnswer(user_input, answer)) {
					card.find('.card-top .sentence-word .items>span').closest('.sentence-word').addClass('text-success')
	                card.data('status', 'k').attr('data-status', 'k');
	                card_all.known_yn = 1;
					
					console.log('113311', 'saveStudyStatus false');
		            saveStudyStatus(false);
		            changeStatusCard();
		        } else {
					card.find('.card-top .sentence-word .items>span').closest('.sentence-word').addClass('text-danger')
		            card.data('status', 'x').attr('data-status', 'x');
		            card_all.known_yn = 0;
		
		            card.find('.btn_know span').text('✘');
					
					console.log('113311', 'saveStudyStatus false');
		            saveStudyStatus(false);
		            // changeStatusCard();
				}
				
				if ((set_type == 1 || set_type == 5) && $('.is_auto_play').is(':checked')) {
					playAudio(true);
				}
				
		        quest_body.addClass('hidden');
				card.find('.card-bottom>div').removeClass('hidden');

				var arr_answer = answer.replace(/(\s\/\s)/gi, ' ').toArray(' ');
				var gen_answer = '';
				card.find('.card-top .sentence-body .sentence-word').each(function(idx, el) {
					if ($(el).hasClass('quest') == false && idx < arr_answer.length) {
						if (gen_answer.length > 0) { gen_answer += ' '; }
						gen_answer += arr_answer[idx];
					}
				});

				card.find('.card-bottom .sentence-body').prepend('<div class="text-success answer-box force font-18 text-left m-b-md"><span class="label label-success radius">정답</span> ' + gen_answer + '</div>');
		        showCardStatus(card);
	    	}
    	} else {
	    	if (showCardStatusTimer && $card_box_current.length > 0) {
				if ($card_box_current.hasClass('correct') == true) {
					$card_box_current.addClass('active');
					$card_box_current.removeClass('deactive');
				} else if ($card_box_current.hasClass('wrong') == true) {
					$card_box_current.addClass('deactive');
					$card_box_current.removeClass('active');
				}
				$card_box_current.removeClass('correct wrong');
				clearTimeout(showCardStatusTimer);
			}
	    	
		    $obj = $(this);
		    $obj.removeClass('card-quest-o card-quest-x show-answer');
		    
	        $card_box_current = slider.find('.CardItem.current');
	        
	        if ($('.show_type:checked').val() == '2') {
		       	// 예문제시 - 예문없음이면 동작하지 않게 처리한다.
		        if (
			        $card_box_current.find('.card-top .text-example').children().length > 0
			        && $card_box_current.find('.card-top .text-example').children()[0].tagName == 'SPAN'
			        && $card_box_current.find('.card-top .text-example span').hasClass('exam-data') == false
		        ) {
			        console.log('skip.....');
			        return false;
		        }
	        }
	
	        var card_all = arr_slide_data.find(function(obj) { return obj.card_idx == $card_box_current.data('idx'); });
	
	        var is_answer = $obj.hasClass('answer');
			console.log('isanswer:'+is_answer);
			console.log($card_box_current.data('status'));
	        
	        if (set_type == 1 && $('.is_auto_play').is(':checked')) {
		        playAudio(true);
		    }
	        
	        if (is_answer) {
				$card_box_current.data('status', 'k').attr('data-status', 'k');
				card_all.known_yn = 1;
	            
	            console.log($card_box_current.data('status'));
				
	            $obj.addClass('card-quest-o');
				
				console.log('113311', 'saveStudyStatus false');
	            saveStudyStatus(false);
	            changeStatusCard();
	            setTimeout(function() {
	            	isQuestClick = true;
	//             	coverUp();
					// 2015.12.15 학습속도가 느리다는 의견으로 정답보기 제거
	// 				$obj.parent().addClass('hidden');
	            }, 1500);
	        } else {
	            $card_box_current.data('status', 'x').attr('data-status', 'x');
	            card_all.known_yn = 0;
	
	            $card_box_current.find('.btn_know span').text('✘');
	            $obj.addClass('card-quest-x');
	            
	            var answer_obj = null;
	            $obj.parent().find('.card-quest-item').each(function() {
		            if ($(this).hasClass('answer')) {
			            answer_obj = $(this);
		            }
	            });
	            if (answer_obj) {
		            answer_obj.addClass('show-answer');
	            }
				
				console.log('113311', 'saveStudyStatus false');
	            saveStudyStatus(false);
	            // changeStatusCard();
	            setTimeout(function() {
		            isQuestClick = true;
	            }, 1500);
	        }
	        
	        // 2015.12.15 정답보기 제거로 인해 마우스 포인터 설정 및 클릭이벤트 제거
	        $obj.parent().find('.card-quest-item').unbind('click').css({'cursor':'default'});
	        console.log('11111');
	        showCardStatus($card_box_current);
	        
	        isQuestClick = false;
		}

        e.preventDefault();
    });
    
    $('.btn-auto-play').unbind('click').click(function(e) {
	    if ($(this).hasClass('active')) {
		    setUserPref('is_auto_play', 0);
			slider.find('.btn-auto-play').removeClass('active');
			$('#is_auto_play').prop('checked', false);
	    } else {
		    setUserPref('is_auto_play', 1);
			slider.find('.btn-auto-play').addClass('active');
			$('#is_auto_play').prop('checked', true);
	    }
        e.preventDefault();
        return false;
    });

	if (slider.find('.CardItem').length > 0) {
		cur_idx = 0;
					
		$('.card-quest-item .card-quest-list', slider).dotdotdot();
		animateCards();
	} else {
		console.log('end1');
		showStudyEnd();
	}
	
	console.log('tooltip start');
	$('[data-toggle="tooltip"]').not('.disabled').tooltip({container: 'body'});
	
	// SB 2.9 정책으로 설정값에 따라 활성화처리
	if (is_auto_play == 1) {
	    slider.find('.btn-auto-play').addClass('active');
    }
	
	console.log('fade in');
	slider.addClass('in');
	
	if (is_first_load) {
		is_first_load = false;
		var params = getQueryParams();
		if (params.c != undefined) {
			for (i = 1; i < params.c; i++) {
				$('.btnNextCard').first().click();
			}
		}
	}
	
	refreshProgress();
	
	setTimeout(function() {
		startCover();
	}, 500);

	is_data_loading = false;
}

function showAllCard() {
	$('.btn-opt-scope').first().click();
}

var is_first_load = true;
var cur_idx = 0;
var audioTimer = null;
var coverTimer = null;
function animateCards() {
	stopAudio();

	$cards = slider.find('.CardItem');
	
	if ($cards.length == 0) {
		return;
	}
	
	$('.btnPrevCard').removeClass('invisible');
	if (cur_idx < 1) {
		$('.btnPrevCard').addClass('invisible');
	}

	console.log(cur_idx);
	console.log('animatedCard 1');
	if (cur_idx > 1) {
		$($cards.get(cur_idx - 2)).addClass('hidden previous').removeClass('current next showing');
	}
	console.log('animatedCard 2');
	if (cur_idx > 0) {
		$($cards.get(cur_idx - 1)).addClass('previous').removeClass('hidden current next showing');
	}
	console.log('animatedCard 3');
	if (cur_idx > -1) {
		$($cards.get(cur_idx)).removeClass('hidden previous next').addClass('current showing');
		setSendView($($cards.get(cur_idx)).data('idx'));
		setTimeout(function() {
			setAutoFont($($cards.get(cur_idx)));
			
			if (set_type == 5) {
				console.log('#############################11111', $($cards.get(cur_idx)));
				if ($($cards.get(cur_idx)).find('.card-quest').hasClass('hidden') == true) {
					console.log('#############################222');
					$($cards.get(cur_idx)).find('.card-top .sentence-word').addClass('active');
				}
			}
		}, 50);
	}
	console.log('animatedCard 4');
	if (cur_idx < $cards.length - 1) {
		$($cards.get(cur_idx + 1)).addClass('next').removeClass('hidden previous current showing');
	}
	console.log('animatedCard 5');
	if (cur_idx < $cards.length - 2) {
		$($cards.get(cur_idx + 2)).addClass('hidden next').removeClass('previous current showing');
	}
	console.log('animatedCard 6');

	setButtonSpace();

	if (audioTimer) {
		clearTimeout(audioTimer);
		audioTimer = null;
	}
	audioTimer = setTimeout(function() {
		// 단어세트인 경우 옵션에서 재생버튼 활성화 일때 1회 재생함.
		// 2015.12.22 버전 1.62에 따라 단어제시일 경우에만 재생처리
	    if (set_type == 1 && $('.is_auto_play').is(':checked') && $('.show_type:checked').val() == 1) {
	        playAudio(true);
	    }
	}, 600);

	if (set_type == 5) {
		var find_idx = slider.find('.current.showing').data('idx');
		var find_obj = study_data.find(function(obj) { return eval(obj.card_idx) === eval(find_idx); });
		if (find_obj == null) {
			$('.txt-card-no').text('');
		} else {
			$('.txt-card-no').text(find_obj.card_order.toString().zf(3));
		}
	}
}

function setAutoFont(el) {
	console.log(el);
	// if (set_type == 5) {
		return;
	// }

	var fill_height_top = el.find('.card-top>div').height();
	var fill_height_bottom = el.find('.card-bottom>div').height();
	var max_font = 35;
	var min_font = 16;
	var max_font_ex = 30;
	var min_font_ex = 14;
	
	if ($('body').hasClass('page-small') == true) {
		min_font = 14;
	}
	console.log('textfill', fill_height_top, fill_height_bottom);
	
	if ($('.study-mode').hasClass('X2')) {
		max_font = Math.floor(max_font * 1.4);
		min_font = Math.floor(min_font * 1.4);
		max_font_ex = Math.floor(max_font_ex * 1.4);
		min_font_ex = Math.floor(min_font_ex * 1.4);
	} else if ($('.study-mode').hasClass('X3')) {
		max_font = Math.floor(max_font * 1.8);
		min_font = Math.floor(min_font * 1.8);
		max_font_ex = Math.floor(max_font_ex * 1.8);
		min_font_ex = Math.floor(min_font_ex * 1.8);
	}
	
	el.find('.card-top>div>div>div div').dotdotdot().trigger( 'destroy.dot' ).css({'height': ''});
	el.find('.card-bottom>div>div>div div').dotdotdot().trigger( 'destroy.dot' ).css({'height': ''});
	if ($('.show_type:checked').val() == '2') {
		el.find('.card-top>div>div>div').textfill({
			explicitHeight: fill_height_top,
			maxFontPixels: max_font_ex,
			minFontPixels: min_font_ex,
			innerTag: 'div',
			is_force: true
		}).ccalign();
	} else {
		el.find('.card-top>div>div>div').textfill({
			explicitHeight: fill_height_top,
			maxFontPixels: max_font,
			minFontPixels: min_font,
			innerTag: 'div',
			is_force: true
		}).ccalign();
	}
	el.find('.card-bottom>div>div>div').textfill({
		explicitHeight: fill_height_bottom,
		maxFontPixels: max_font,
		minFontPixels: min_font,
		innerTag: 'div',
		is_force: true
	}).ccalign();
	el.find('.card-top>div>div>div div').css('height', '').dotdotdot({height: fill_height_top});
	if (set_type == 5) {
		el.find('.card-top>div>div>div div').css('text-align', 'left');
	}
	el.find('.card-bottom>div>div>div div').css('height', '').dotdotdot({height: fill_height_bottom});
}

function choiceAnswer(selIdx) {
	$card_box = slider.find('.CardItem.current');

	if ($card_box.hasClass('active') || $card_box.hasClass('deactive')) {
		return;
	}

	if ($card_box.find('.card-quest-item.clicked').length >= $card_box.find('.card-quest-item').length) {
		return;
	}

	$obj = $('.card-quest-item', $card_box);
	
	if ($('.show_type:checked').val() == '2') {
       	// 예문제시 - 예문없음이면 동작하지 않게 처리한다.
        if (
			$card_box.find('.card-top .text-example').children().length > 0
			&& $card_box.find('.card-top .text-example').children().first().hasClass('exam-data') == false
	        && $card_box.find('.card-top .text-example').children()[0].tagName == 'SPAN'
        ) {
	        console.log('skip.....');
	        return false;
        }
    }
	
	if (selIdx == 3 && selIdx > ($obj.length - 1)) {
		selIdx = $obj.length - 1;
	}
	
	if (selIdx > ($obj.length - 1)) {
		return;
	}
	
	$obj[selIdx].click();
}

function startCover() {	
	coverDown(true);
}

var blockCover = false;
var isAuto = false;
var isQuestClick = true;
var nextButtonTimer = null;

jQuery(function($){
    slider = $('#wrapper-learn .study-body');
    
    setSendLog(0, 0);
    
/*
    setCard();
    refreshProgress();
*/
	$(audio)
    .bind('loadstart', function() {
		console.log('audio loadstart');
		var ad = $('.btn_audio[data-src="' + $(this).attr('src') + '"]');
	    if (ad.length > 0) {
		    ad.removeClass('text-danger').addClass('text-success').find('i').addClass('fa fa-pause').removeClass('cc vol_on');
	    }
    })
    .bind('error', function() {
		console.log('audio error');
		var ad = $('.btn_audio[data-src="' + $(this).attr('src') + '"]');
	    if (ad.length > 0) {
		    ad.addClass('text-danger').removeClass('text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
	    }
		if (isAuto) {
			if (nextButtonTimer) {
				clearTimeout(nextButtonTimer);
				nextButtonTimer = null;
			}
			nextButtonTimer = setTimeout(function() {
				$('.btnNextCard').first().click();
			}, 1000);
		}
        isAuto = false;
	})
	.bind('ended', function() {
		console.log('audio ended');
		var ad = $('.btn_audio[data-src="' + $(this).attr('src') + '"]');
	    if (ad.length > 0) {
		    ad.removeClass('text-danger text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
	    }
        
        if (isAuto) {
            $('.btnNextCard').first().click();
        }

        isAuto = false;
	});
	
	$('.btn-short-change-next').click(function(e) {
        $('.btnNextCard').first().click();

		e.preventDefault();
		return false;
	});

	var current_show_type = $('.show_type:checked');
    $('.show_type').change(function(e) {
// 	    console.log('show_type : ' + this.value);
		if (this.value == 2) {
			var is_no_exist_exam = true;
			study_data.forEach(function(item, index) {
				if (is_no_exist_exam == false) {
					return;
				}
				if (item.example_sentence != null && item.example_sentence.length > 0) {
					is_no_exist_exam = false;
				}
			});
			if (is_no_exist_exam) {
				current_show_type.prop('checked', true);
				showAlert('', '이 세트에는 예문이 없어, 예문제시 할 수 없습니다.');
				return;
			}
		}

		if (set_type == 1) {
			setUserPref('show_w_r', this.value);
		} else if (set_type == 2) {
			setUserPref('show_t_r', this.value);
		}
		
		current_show_type = $(this);
		setShowTypeText(current_show_type.next());
        setCard();
//         refreshProgress();
        
        setTimeout(function() {
		    startCover();
	    }, 1000);
	});
	setShowTypeText(current_show_type.next());
	function setShowTypeText(el) {
		$('.txt-show-type').text(el.text());
	}
	
	$('.is_shuffle').change(function() {
		if (set_type == 5){
			setUserPref('learn_shuffle_s', (this.checked ? 1 : 0));
		}else{
			setUserPref('learn_shuffle', (this.checked ? 1 : 0));
		}

		setCard();
		setTimeout(function() {
		    startCover();
	    }, 1000);
	});

	$('.is_auto_play').change(function(e) {
		if (this.checked) {
			setUserPref('is_auto_play', 1);
			slider.find('.btn-auto-play').addClass('active');
		} else {
			setUserPref('is_auto_play', 0);
			slider.find('.btn-auto-play').removeClass('active');
		}
	});

    $selScope = $('.selScope');
    $selScope.change(function() {
        setCard();
//         refreshProgress();
        
        setTimeout(function() {
		    startCover();
	    }, 1000);
    });
    
    $('.btn-opt-shuffle').click(function(e) {
        setCard();
//         refreshProgress();
        
        setTimeout(function() {
		    startCover();
	    }, 1000);
    });
    
    $('.btnPrevCard').click(function(e) {
		console.log('btnPrevCard Click');
		
		if (cur_idx == 0) {
			return;
		}
		
		isAuto = false;
		if (nextButtonTimer) {
			clearTimeout(nextButtonTimer);
			nextButtonTimer = null;
		}

		cur_idx--;
		animateCards();
// 		setAutoFont(slider.find('.CardItem.showing'));
		
		if (coverTimer) {
			clearTimeout(coverTimer);
			coverTimer = null;
		}

		coverTimer = setTimeout(function() {
			coverDown(true);
		}, 800);
		
		e.preventDefault();
	});

	$('.btnNextCard').click(function(e) {
		console.log('btnNextCard Click');
		
		isAuto = false;
		if (nextButtonTimer) {
			clearTimeout(nextButtonTimer);
			nextButtonTimer = null;
		}

		if (cur_idx >= ($cards.length - 1)) {
			showStudyEnd();
			return;
		}

		cur_idx++;
		animateCards();
// 		setAutoFont(slider.find('.CardItem.showing'));
		
		if (coverTimer) {
			clearTimeout(coverTimer);
			coverTimer = null;
		}

		coverTimer = setTimeout(function() {
			coverDown(true);
		}, 800);
		
		e.preventDefault();
	});

    // Toastr options
    toastr.options = {
	    "closeButton": true,
		"debug": false,
		"newestOnTop": false,
		"progressBar": false,
		"positionClass": "toast-top-center",
		"preventDuplicates": false,
		"onclick": null,
		"showDuration": "300",
		"hideDuration": "1000",
		"timeOut": "2000",
		"extendedTimeOut": "1000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
    };

	// 2015.12.15 암기학습만 학습팁 제공으로 변경
/*
    if ($('.learn-guide').data('init') == '1') {
        $('.learn-guide').removeClass('hidden');
        guide_timer = setTimeout(function(){
            $('.learn-guide').addClass('hidden');
            $('.learn-guide').data('init', '0');
            setRound(true);
        }, 3000);
    } else {
        $('.learn-guide').addClass('hidden');
        // 리콜학습 최초진입이 아닌 경우 토스트 표시 없음.
        setRound(true);
    }
*/
	$('.learn-guide').addClass('hidden');
	setRound(true);

    $('.learn-guide').click(function() {
        console.log('learn-guide click');
        clearTimeout(guide_timer);
        $('.learn-guide').addClass('hidden');
        $('.learn-guide').data('init', '0');
        setRound(true);
    });

    $('.learn-nav-help').click(function() {
        $('.learn-guide').removeClass('hidden');
        clearTimeout(guide_timer);
        guide_timer = setTimeout(function(){
            $('.learn-guide').addClass('hidden');
            $('.learn-guide').data('init', '0');
        }, 3000);
    });
    
/*
    setTimeout(function() {
	    startCover();
    }, 1000);
*/
    
    if (set_type == 3) {
		resize();
		$(window).on('resize', $.proxy(resize, this));
	} else {
		$('.show-zoom').click(function() {
			setZoom();
		});
	}
	
	$(window).on("beforeunload", function(e){
		console.log('beforeunload');
		// sendLearnAll();
		if (isChange) {
			return "학습결과를 저장하지 않았습니다. 종료할까요?";
		}
	});

    $(document).unbind('keydown').keydown(function(e) {
        console.log(e.keyCode);
        
        if ($('.short-cut-info').hasClass('active')) {
        	$('.short-cut-info').removeClass('active');
        	$(window).unbind('click');
    	}
        
		var interceptKey = false;
		if (is_data_loading) {
			interceptKey = true;
		}
		if (interceptKey) { return; }
		if ($('.round-body').hasClass('active')) {
			interceptKey = true;
		}
		if (interceptKey) { return; }
        if ($('#confirmModal').length > 0 && $('#confirmModal').css('display') == 'block') {
			interceptKey = true;
		}
		if (interceptKey) { return; }
		interceptKey = false;
        if ($('#alertModal').length > 0 && $('#alertModal').css('display') == 'block') {
			interceptKey = true;
		}
		if (interceptKey) { return; }
		
        if (e.target && e.target.nodeName == 'TEXTAREA') {
	        var name = e.target.name;
	        if (name == 'front[]' || name == 'back[]' || name == 'example[]') {
		        interceptKey = true;
	        }
        }
        if (interceptKey) { return; }
        
        var cutormModal = $('#customCenterModal');
        if (cutormModal.length > 0) {
// 	        console.log(cutormModal.css('display'));
	        if (cutormModal.css('display') == 'block') {
		        interceptKey = true;
	        }
        }
        if (interceptKey) { return; }
        
        var endModal = $('#study_end');
        if (endModal.length > 0) {
	        if (endModal.hasClass('active')) {
		        interceptKey = true;
		        var end_step = $('#study_end .step').not('.hidden');
				if (end_step.length == 0) {
					return;
				}

				var btn = [];
		        if (e.keyCode === 13) {
					btn = end_step.find('.study-bottom .btn-text:eq(1)').not('.hidden').find('.btn');
		        } else if (e.keyCode === 32) {
					btn = end_step.find('.study-bottom .btn-text:eq(0)').not('.hidden').find('.btn');
				} else if (e.keyCode === 39) {
					btn = end_step.find('.study-bottom .btn-text:eq(2)').not('.hidden').find('.btn');
				}

				if (btn.length == 0) {
					return;
				}
				btn.first().click();
	        }
		}
		if (interceptKey) { return; }

		if (e.keyCode === 39) {             // right arrow : next button
			// isAuto = false;
            // $('.btnNextCard').first().click();
			// e.preventDefault();
		} else if (e.keyCode === 13 || e.keyCode === 32) {             // enter : next button
			if ($('.btn-short-change-next').closest('.study-bottom').hasClass('down') == true) {
				isAuto = false;
				$('.btnNextCard').first().click();
			}
			e.preventDefault();
        } else if (e.keyCode === 37) {      // left arrow : previous button
	        // isAuto = false;
            // $('.btnPrevCard').first().click();
            // e.preventDefault();
        } else if (e.keyCode === 40) {
	        coverDown(true);
		} else if (e.keyCode === 27 || e.keyCode === 66) {      // Esc or B key : favor button
			slider.find('.CardItem.current .btn_favor i').click();
            e.preventDefault();
        } else if (e.keyCode === 69) {		// e key : Eidt button
	        $('.btn-opt-edit').click();
	        e.preventDefault();
        } else if ((e.keyCode === 32 && (e.ctrlKey == true || e.metaKey == true)) || e.keyCode === 86) {      // ctrl + space key or v key : audio button
// 		} else if (e.keyCode === 32) {      // space key : audio button
            playAudio();
            e.preventDefault();
        } else if (e.keyCode === 32 && set_type == 5) {
	        coverDown(true);
        // } else if (e.keyCode === 78 && (e.ctrlKey == true || e.metaKey == true)) {      // ctrl + n key : unknow button
		// 	choiceAnswer(3);
        //     e.preventDefault();
		} else if (e.keyCode === 49 || e.keyCode === 97) {
			if (slider.find('.CardItem.current .card-cover').hasClass('down')) {
				choiceAnswer(0);
			}
            e.preventDefault();
		} else if (e.keyCode === 50 || e.keyCode === 98) {
			if (slider.find('.CardItem.current .card-cover').hasClass('down')) {
				choiceAnswer(1);
			}
            e.preventDefault();
		} else if (e.keyCode === 51 || e.keyCode === 99) {
			if (slider.find('.CardItem.current .card-cover').hasClass('down')) {
				choiceAnswer(2);
			}
            e.preventDefault();
        } else if (e.keyCode === 52 || e.keyCode === 100) {
			if (slider.find('.CardItem.current .card-cover').hasClass('down')) {
				choiceAnswer(3);
			}
            e.preventDefault();
        }
    });
});