var audio = new Audio();
var slider;
var guide_timer;
var coverTimeout;
var is_data_loading = false;
var study_mode = 'spell';
var current_card_total = 0;

document.onclick = function() {
	console.log('document click');
	$('.ly-spell-guide').addClass('hidden');
};

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
		activity:3, 
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
			console.log(response);
			console.log(textStatus);
			console.log(errorThrown);
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
		activity:3,
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
		activity:3, 
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

function changeStatusCard(target_idx) {
	if (target_idx > -1) {
		var idx = target_idx;
	} else {
		var idx = $('.CardItem.current').data('idx');
	}
	console.log('.......... : ' + idx, target_idx);
	var card_box = $('.CardItem[data-idx="' + idx + '"]');
    var cover = card_box.find('.card-cover');

    var send_yn = false;
    if (cover.data('status') == 'button') {
        send_yn = true;
    }

    if (send_yn) {
        var card_idx = card_box.data('idx');
        var status = card_box.data('status');
        var score = (status == 'k') ? 1 : 0;

		var send_section = (current_section > 999) ? 1 : current_section;
		setSendLog(card_idx, score);
    }
    
	cover.data('status', 'cover');
}

function refreshProgress() {
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

function coverChange() {
    var cover = $('.CardItem.current .card-cover', slider);
    cover.data('status', 'button');
}

function coverDown() {
    var cover = $('.CardItem.current .card-cover', slider);
    if (cover.length == 0 || cover.hasClass('hidden')) {
	    return;
    }
    $cover_height = cover.parent().height();

    cover.addClass('down').animate({top:$cover_height}, 250);
}

function coverUp() {
	coverTimeout = null;
	
    var cover = $('.CardItem.current .card-cover', slider);
    if (cover.length == 0 || cover.hasClass('hidden')) {
	    return;
    }
    var top_min = cover.parent().children().first().outerHeight();
    
    changeStatusCard(-1);
    refreshProgress();
    cover.removeClass('down').animate({top:top_min}, 250);
}

function setAnswer(is_show) {
	console.log('setAnswer', is_show);
	var el = slider.find('.CardItem.current.showing');	
	var card_height_2 = el.height() / 2;
	var fill_height_top = card_height_2 - eval(el.find('.card-top').css('padding-top').replace('px', '')) - eval(el.find('.card-top').css('padding-bottom').replace('px', ''));
	var fill_height_bottom = card_height_2 - eval(el.find('.card-bottom').css('padding-top').replace('px', '')) - eval(el.find('.card-bottom').css('padding-bottom').replace('px', ''));
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
	
	$spell_answer = el.find('.card-bottom .spell-answer');
	$spell_input = el.find('.card-bottom .spell-input');
	
	// console.log('setAnswer', $spell_answer, $spell_input);
    
    if (is_show) {
		if (set_type == 5 && $('.show_type:checked').val() == 2) {
			$('.btn-retry').removeClass('disabled');
			// if (el.data('status') != 'k') {
			// 	var answer_el = $spell_answer.clone();
			// 	answer_el.removeClass('hidden').addClass('m-t-lg');
			// 	answer_el.find('.answer-box').removeClass('font-70p').css({'display': 'block', 'font-size': '16px'});
			// 	el.find('.card-top .spell-input').append(answer_el);
			// }

			if (el.data('status') == 'k') {
				el.find('.card-top .spell-input').addClass('text-success');
			}

			setTimeout(function() {
				// el.find('.card-top').css('height', '100%');
				// el.find('.card-bottom').addClass('hidden');
				$spell_input.addClass('hidden');
				var bottom_height = el.find('.card-bottom .txt-back').height() + 49;
				el.find('.card-top').css('height', 'calc(100% - ' + bottom_height + 'px)');
				el.find('.card-bottom').css({'height': bottom_height, 'border-color':'transparent'});
				el.find('.card-bottom .para_item3').removeClass('active').addClass('default');
			}, 100);
		} else if (set_type == 5) {
			$('.btn-retry').removeClass('disabled');
		    var show_answer = slider.find('.CardItem.current.showing .card-bottom .spell-answer > span:first-child').text().trim();
		    var show_first = ' ';
			show_first = '<span class="text-info">' + slider.find('.CardItem.current.showing .card-bottom .spell-answer > span:first-child .first-word').text().trim() + '</span> ';
			show_answer = slider.find('.CardItem.current.showing .card-bottom .spell-answer > span:first-child').text().trim();
		    var user_answer = filterVal($('.CardItem.current.showing .card-bottom .input-answer').val(), false);
		    
		    // console.log(show_answer, user_answer);

		    var pos = 0;
		    var is_chk_stop = false;
		    for (var i = 0; i < user_answer.length; i++) {
			    if (pos >= show_answer.length || is_chk_stop == true) {
				    break;
			    }
			    
			    is_chk_stop = true;
			    var cur_char = user_answer.charAt(i).toLowerCase();
			    // console.log('##check cur##', cur_char);
			    for (var j = pos; j < show_answer.length; j++) {
				    var pos_char = show_answer.charAt(j).toLowerCase();
				    var skip_char = '~!@\#$%<>^&*\()\-=+_\’\”\'"?<>,.\/\[\]\{\}\t\r\n\\ ';
				    // console.log('##check pos##', pos_char);
				    if (skip_char.indexOf(pos_char) > -1) {
					    console.log('##check skip##');
					    continue;
				    }
				    
				    if (cur_char == pos_char) {
					    pos = j + 1;
					    is_chk_stop = false;
				    }
				    break;
			    }
		    }
		    
		    console.log('##check##', pos);
		    if (pos > 0) {
// 			    show_answer = show_first + '<span class="text-info">' + show_answer.substring(0, pos) + '</span>' + show_answer.substring(pos);
			    show_answer = '<span class="text-info">' + show_answer.substring(0, pos) + '</span>' + show_answer.substring(pos);
			    // console.log('##check##', pos, show_answer);
			    slider.find('.CardItem.current.showing .card-bottom .spell-answer > span:first-child').html(show_answer);
		    }
	    }	
	}

	// console.log('####### setAnswer', $spell_answer, $spell_input);
	if (set_type == 5) {
		if ($('.show_type:checked').val() == 2) {

		} else {
			$spell_answer.removeClass('hidden');
			$spell_input.addClass('hidden');
		}
	} else {
		var temp_val = $spell_input.find('.input-answer').val();
		console.log('### textfill222 ###', fill_height_bottom);
		el.find('.card-bottom > div').textfill({
			explicitHeight: fill_height_bottom,
			maxFontPixels: max_font_ex,
			minFontPixels: min_font_ex,
			innerTag: 'div',
			is_force: true
		}).ccalign();
		$spell_answer.css('height', '').dotdotdot({height: fill_height_bottom});
		$spell_input.css('height', '').dotdotdot({height: fill_height_bottom});
		$spell_input.find('.input-answer').val(temp_val);
		
		// 발음제시에서 의미 보여주기
		if ($('.show_type:checked').val() == 4) {
			el.find('.card-top .spell-answer').removeClass('hidden');
		}
	}
	
	el.find('.btn-show-hint').parent().addClass('hidden');

	setNextButton(true);
}

function setAutoFont(el) {
	// if (set_type == 5) {
		return;
	// }

	var fill_height_top = el.find('.card-top').height();
	var fill_height_bottom = el.find('.card-bottom').height();
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

	$spell_input = el.find('.card-bottom .spell-input');
	var temp_val = $spell_input.find('.input-answer').val();
	
	el.find('.card-top>div>div>div div').dotdotdot().trigger( 'destroy.dot' ).css({'height': ''});
	el.find('.card-bottom>div>div>div div').dotdotdot().trigger( 'destroy.dot' ).css({'height': ''});
	if (set_type == 5) {
		var top_rate = 0.6;
		if ($('.show_type:checked').val() == '2') {
			el.find('.card-top>div>div>div').textfill({
				explicitHeight: fill_height_top,
				maxFontPixels: Math.floor(max_font_ex * top_rate),
				minFontPixels: min_font_ex,
				innerTag: 'div',
				is_force: true
			}).ccalign();
		} else {
			el.find('.card-top>div>div>div').textfill({
				explicitHeight: fill_height_top,
				maxFontPixels: Math.floor(max_font * top_rate),
				minFontPixels: min_font,
				innerTag: 'div',
				is_force: true
			}).ccalign();
		}
	} else {
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
	}
	
	console.log('### textfill111 ###', fill_height_bottom);
	el.find('.card-bottom>div>div>div').textfill({
		explicitHeight: fill_height_bottom,
		maxFontPixels: max_font,
		minFontPixels: min_font,
		innerTag: 'div',
		is_force: true
	}).ccalign();
	el.find('.card-top>div>div>div div').css('height', '').dotdotdot({height: fill_height_top});
	el.find('.card-bottom>div>div>div div').css('height', '').dotdotdot({height: fill_height_bottom});

	if (set_type == 5) {
		el.find('.input-answer').val('');
	} else {
		$spell_input.find('.input-answer').val(temp_val);
	}

	setNextButton();
}

function playAudio(is_force) {
	var btn_audio = slider.find('.CardItem.current .btn_audio');
	
	if (is_force !== undefined && is_force == true) {
		btn_audio.removeClass('disabled').tooltip({container: 'body'});
	}

	if (btn_audio.hasClass('disabled')) {
		if (set_type == 5) {
			var show_type = $('.show_type:checked').val();
			console.log(show_type);
			if (show_type == 2) {
				showAlert('어순배열로 문장을 완성 후 들을 수 있습니다. 문장을 듣고 입력하는 딕테이션 학습을 하려면, 학습설정 &gt; 딕테이션을 선택하세요.');
			} else {
				showAlert('문장을 입력한 후 들을 수 있습니다. 문장을 듣고 입력하는 딕테이션 학습을 하려면, 학습설정 &gt; 딕테이션을 선택하세요.');
			}
			
		}
		return;
	}

	audio.pause();
	
	console.log(getLogTime(), btn_audio.data('src'));

	if (btn_audio.data('src') === undefined || btn_audio.data('src') == '') {
		// if (isAutoNextCard) {
		// 	$('.btnNextCard').first().click();
		// }	
		// isAutoNextCard = false;
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
    if (current_section == 2000 || current_section == 3000 || current_section == 4000 || current_section == 0) {
//         is_all = false;
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

	// shuffle 기능 추가
	if ($('.is_shuffle').is(':checked')) {
		fy(arr_slide_data);
	}

	setCookieAt00('l_sec', current_section, 1);
	
    slider.empty();
	if (set_type == 5 && show_type == 2) {
		slider.addClass('scramble');
		$('.study-bottom').addClass('scramble');
	} else {
		slider.removeClass('scramble');
		$('.study-bottom').removeClass('scramble');
	}
    var template = $('.template .CardItem');
    
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
		
		if (item.recall_known_yn > 0) {
			row.data('recall', 'k').attr('data-recall', 'k');
		} else {
			row.data('recall', 'u').attr('data-recall', 'u');
		}
		
		if (item.spell_known_yn > 0) {
			row.data('spell', 'k').attr('data-spell', 'k');
		} else {
			row.data('spell', 'u').attr('data-spell', 'u');
		}
		
		row.find('.card_order').val(item.card_order);
		row.find('.img_path').val(media_domain + item.img_path);
		
		if (set_type == 2) {
			console.log('333');
			row.find('.card-top .spell-content').html(item.front.replace(/\r\n|\r|\n/gi, ' <br>'));
		} else {
			console.log('222');
			row.find('.card-top .spell-content').html(removeBracket(item.front).replace(/\r\n|\r|\n/gi, ' <br>'));
		}
		if (item.front.length == 1) {
			row.find('.card-top .spell-answer .spell-content').css({'font-size':'80px', 'line-height':'50px'});
		}
		if (item.front.indexOf('\n') > -1) {
			row.find('.card-top .spell-answer').addClass('text-left');
		}
		
		if (set_type != 5 && item.img_path != null && item.img_path.length > 0) {
			row.find('.card-bottom');
			row.find('.card-bottom>div>div')
				.prepend('<span class="el-vertical img-span learn-small"><img src="' + media_domain + item.img_path + '"></span>');
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
		
		row.find('.card-bottom .spell-content').addClass('font-32').html(item.back.replace(/\r\n|\r|\n/gi, ' <br>'));
		if (item.back.length == 1 && (item.example_sentence == null || item.example_sentence.length == 0)) {
			row.find('.card-bottom .spell-answer .spell-content').removeClass('font-32').css({'font-size':'80px', 'line-height':'50px'});
		}
		if (item.back.indexOf('\n') > -1) {
			row.find('.card-bottom .spell-answer').addClass('text-left');
		}
		
		if (set_type == 5) {
			if (show_type == 2) {
				console.log('##################################################', item.front);
				var answer = removeBracket(item.front).blank().replace(/\s\/\s/gi, ' <br>');
				row.find('.card-top .spell-input').html('');
				row.find('.card-top .spell-answer .spell-content').html(answer);
				console.log('##################################################', answer);

				console.log('##################################################', item.back);
				answer = removeBracket(item.back).blank().replace(/\s\/\s/gi, ' <br>');
				row.find('.card-bottom .spell-input').html('');
				row.find('.card-bottom .spell-answer .spell-content').html(answer);
				console.log('##################################################', answer);
			} else {
				if ($('.is_first_typing').is(':checked')) {
					var str_hint = '단어의 첫 글자만 입력하세요.';
				} else {
					var str_hint = '문장을 입력하세요.';
					// if (front_lang == 'en' || front_lang == 'ko') {
					// 	str_hint += '\n첫 글자만 입력하려면 학습설정 하세요.';
					// }
				}
	
				var input_html = '<textarea placeholder="' + str_hint + '" class="form-control input-answer" name="input_answer" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" onpaste="return false;" style="font-size: 16px; font-weight: 600; resize: none;" rows="5"></textarea><div class="font-16 m-t-xs text-center"><a class="btn-show-hint text-primary" data-toggle="tooltip" data-placement="right" title="Press Ctrl+H">힌트보기</a></div>';
				var arr_front = removeBracket(item.front).toArray(' ');
				var txt = '';
				var answer = '';
				if (arr_front.length < 2) {
					txt = '____';
					answer = '<span class="blank-word">' + removeBracket(item.front) + '</span>';
					if (arr_front.length > 0) {
						answer = '<span class="first-word">' + arr_front[0] + '</span>';
					}
				} else {
					answer = '<span class="first-word">' + arr_front[0] + '</span>';
					answer += '<span class="blank-word">';
					$.each(arr_front, function (idx) {
						if (idx == 0) { txt += this; } 
						else { txt += ' ____'; answer += ' ' + this; }
					});
					answer += '</span>';
				}
				
	// 			row.find('.card-top .spell-input').html(txt);
				row.find('.card-top .spell-input').html(input_html);
				row.find('.card-top .spell-answer .spell-content').html(answer);
				
				var arr_back = item.back.toArray(' ');
				txt = '';
				answer = '';
				if (arr_back.length < 2) {
					txt = '____';
					answer = '<span class="blank-word">' + item.back + '</span>';
					if (arr_back.length > 0) {
						answer = '<span class="first-word">' + arr_back[0] + '</span>';
					}
				} else {
					answer = '<span class="first-word">' + arr_back[0] + '</span>';
					answer += '<span class="blank-word">';
					$.each(arr_back, function (idx) {
						if (idx == 0) { txt += this; } 
						else { txt += ' ____'; answer += ' ' + this; }
					});
					answer += '</span>';
				}
				
	// 			row.find('.card-bottom .spell-input').html(txt);
				row.find('.card-bottom .spell-input').html(input_html);
				row.find('.card-bottom .spell-answer .spell-content').html(answer);
			}
		}
		
		if (item.example_sentence == null || item.example_sentence.length == 0) {
			row.find('.card-bottom .text-example')
				.addClass('text-center')
				.html('<span style="color: #dfdfdf; border-bottom-width: 0px;">예문이 없는 카드입니다.</span>');
			
			if (show_type == '2') {
				row.find('.card-top .text-example').addClass('hidden');
				row.find('.card-content').css('border', 'none');
			}
		} else {
			if (set_type == 1 && $('.show_type:checked').val() == '2') {
				row.find('.card-top .text-example').append('<span class="exam-data hidden">' + item.example_back + '</span>');
			}
			
			row.find('.card-bottom .text-example').css({'font-size': '24px', 'font-weight': 'normal', 'letter-spacing': '-0.7px'}).html(item.example_front.replace(/\r\n|\r|\n/gi, ' <br>'));
		}
		
		if (show_type == '0') {
			$top_html = $('.card-top', row).html();
			$bottom_html = $('.card-bottom', row).html();
			$('.card-top', row).html($bottom_html);
			$('.card-bottom', row).html($top_html);
		} else if (show_type == '2') {
			$top_html = $('.card-top', row).html();
			$bottom_html = $('.card-bottom', row).html();
			$('.card-top', row).html($bottom_html);
			$('.card-bottom', row).html($top_html);

			if (set_type != 5) {
				row.find('.card-top').addClass('example').removeClass('img');
				row.find('.card-top .img-span').addClass('hidden');
				row.find('.card-bottom').removeClass('left');
			}
		} else if (show_type == '4'){
			$top_html = $('.card-top', row).html();
			$bottom_html = $('.card-bottom', row).html();
			$('.card-top', row).html($bottom_html);
			$('.card-bottom', row).html($top_html);
		} else {
			row.find('.card-top .spell-answer').removeClass('text-success');
			row.find('.card-bottom .spell-answer').addClass('text-success');
			row.find('.card-bottom .img-span').addClass('hidden');
		}
		
		$('.card-top .spell-answer', row).removeClass('hidden');
		if (set_type == 5 && show_type == 2) {
			$('.card-top .spell-input', row).removeClass('hidden');
		} else {
			$('.card-top .spell-input', row).addClass('hidden');
		}
		$('.card-bottom .spell-answer', row).addClass('hidden');
		$('.card-bottom .spell-input', row).removeClass('hidden');

		if (show_type == 4) {
			
			if (row.find('.btn_audio>i').length == 0) {
				row.find('.card-top>div>div>div>*').addClass('hidden');
				row.find('.card-top>div>div>div').append('<div class="text-center"><span class="text-lighter">오디오가 없습니다.<span></div>')
			} else {
				console.log('###11###', '111');
				row.find('.card-top>div>div>div>*').addClass('hidden');
				row.find('.btn_audio').addClass('font-64').tooltip('destroy');
				row.find('.btn_audio').appendTo(row.find('.card-top>div>div>div'));
				row.find('.card-top>div>div>div').css({'vertical-align':'middle', 'text-align':'center'});
			}
		} else if (show_type != '1') {
			console.log('###11###', '222');
			row.find('.btn_audio').addClass('disabled').tooltip('destroy');
		}

		// if (set_type == 5) {
		// 	row.find('.btn_audio').removeClass('disabled');
		// }
		row.find('.card-bottom .spell-content').data('answer', row.find('.card-bottom .spell-content').html());
		row.find('.card-bottom .spell-content').html('');
		// console.log(row.find('.card-bottom .spell-content').html(), row.find('.card-bottom .spell-content').data('answer'));
		if (set_type == 5 && show_type == 2) {
			row.find('.card-top .spell-content').data('answer', row.find('.card-top .spell-content').html());
			row.find('.card-top .spell-content').html('<div class="text-lighter font-18 txt-scramble-guide">의미를 보고 단어를 순서대로 선택하세요.<br>틀리면 나중에 한번 더 학습하세요.</div>');
		}
		slider.append(row);
	});
    
    // shuffle 기능 추가
    // if ($('.is_shuffle').is(':checked')) {
	//     $new = slider.children().clone();
	//     slider.empty();
	//     $new.sort(function() {return (Math.round(Math.random()) -.05)});
	//     slider.append($new);
    // }

    console.log($('input[name=selAudioType]:checked').val());

    $('.btn_audio', slider).unbind('click').click(function(el) {
        console.log('btn_audio click');
		$(document).click();
	    
        playAudio();
        $('.btn_audio').tooltip('hide');
        
        el.preventDefault();
        return false;
	});
	
	$('.btn-show-hint', slider).unbind('click').click(function(e) {
		$(document).click();
		var card = $(this).closest('.CardItem');
		if (card.length > 0) {
			showHint(card);
		}

		e.preventDefault();
		return false;
	});
    
	$('.btn_know', slider).unbind('click').click(function(e) {
		$(document).click();
        $obj = $(this);
        $card_box = $obj.parent().parent().parent();
        console.log($card_box);
/*
        $card_idx = $obj.data('idx');
        console.log($card_idx);
*/
        
        $idx = $('#cardPageInfo').data('index');
        if (set_type == 5) {
	        $card_answer = $($('.card-bottom .spell-answer > span:first-child', slider)[$idx]);
	        console.log($card_answer);
	        var answer = ($card_box.data('status') == 'k') ? '|unknow|' : $card_answer.find('.spell-content').data('answer').trim();
	        // console.log(answer);
	        $('.CardItem.current.showing .card-bottom .input-answer').val(answer);
        } else {
	        $card_answer = $($('.card-top .spell-answer > span:first-child', slider)[$idx]);
	        console.log($card_answer);
	        var answer = ($card_box.data('status') == 'k') ? '|unknow|' : $card_answer.text().trim();
	        // console.log(answer);
	        $('.CardItem.current.showing .card-bottom .input-answer').val(answer);
        }
        
		$('.btn-confirm').click();
    });
    
    $('.btn_kown_o', slider).unbind('click').click(function(e) {
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
	    console.log('btn_x click');
	    
	    var temp_btn = $(this).parent();
	    var idx = temp_btn.data('idx');
	    var card = slider.find('.CardItem[data-idx="' + idx + '"]');
	    card.data('status', 'k').attr('data-status', 'k');
	    temp_btn.click();
	    
	    e.preventDefault();
	    return false;
	});

    $('.btn_favor', slider).unbind('click').click(function(el) {
		$(document).click();
		console.log(el);
        $target = $(el.target);
        var card_idx = $target.data('idx');
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
    });
    
    $('.card-cover', slider).unbind('click').click(function(e) {
	    clearTimeout(coverTimeout);
        coverTimeout = setTimeout(function(){
            coverUp();
        }, 3000);
        coverDown();
        e.preventDefault();
    });
	$('.card-cover', slider).addClass('hidden');
    
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
    
    $('.input-answer').unbind('keydown').keydown(function(e) {
// 	    console.log('##keydown1##', e.keyCode);
		console.log(e.keyCode, e.key, this.value);
		if (e.keyCode === 13) {      // Enter : check answer
            $('.btn-confirm').click();
            e.preventDefault();
            return false;
        } else if (e.keyCode === 32 && (e.ctrlKey == true || e.metaKey == true)) {      // ctrl + space key : audio button
            playAudio();
            e.preventDefault();
		} else if (e.keyCode === 72 && (e.ctrlKey == true || e.metaKey == true)) {      // ctrl + h key : show hint
			slider.find('.CardItem.current .btn-show-hint').first().click();
			e.preventDefault();
			return false;
	    } else if ($('.is_first_typing').is(':checked')) {
			if (e.key.trim().length != 1) {
				e.preventDefault();
				return false;
			}
			// console.log(e.keyCode, e.key, this.value);
			// console.log(e);
			// if (e.key.trim().length == 1) {
			// 	var user_input = this.value;
			// 	var search_idx = 0;
			// 	if (user_input.length > 0) {
			// 		search_idx = user_input.blank().toArray(' ').length;
			// 	}
			// 	var arr_answer = slider.find('.CardItem.current.showing .card-bottom .spell-answer .spell-content').text().trim().blank().toArray(' ');

			// 	var is_insert = false;
			// 	if (search_idx < arr_answer.length) {
			// 		for (var i = search_idx; i < arr_answer.length; i++) {
			// 			if (user_input.length > 0) { user_input += ' '; }

			// 			var removeValue = filterVal(arr_answer[i], false);
			// 			console.log(removeValue, arr_answer[i]);
			// 			if (removeValue.length == 0) {
			// 				user_input += arr_answer[i];
			// 				continue;
			// 			}

			// 			var arr_hangul_cho = Hangul.disassemble(removeValue, true);
			// 			if (arr_hangul_cho.length > 0) {
			// 				removeValue = arr_hangul_cho[0][0];
			// 			}

			// 			if (removeValue.substring(0, 1) == e.key) {
			// 				user_input += arr_answer[i];
			// 				is_insert = true;
			// 			}
			// 			break;
			// 		}
			// 		this.value = user_input;
			// 		if (is_insert == false) {
			// 			this.value += e.key;
			// 		}
			// 	}
			// }
			// e.preventDefault();
			// return false;
		}
    });

    if (set_type == 5) {
	    $('.input-answer').unbind('keyup').keyup(function(e) {
			var user_input = this.value;
			var old_input = this.value;
			if (user_input.length > 0 && user_input.substring(user_input.length - 1) != ' ') {
				user_input = user_input.substring(0, user_input.length - 1);
			}
			// console.log('user_input : ', user_input);
			var search_idx = 0;
			if (user_input.length > 0) {
				search_idx = user_input.blank().toArray(' ').length;
			}
			// console.log('@#$@#$@#$@#$@#$@#$', search_idx);
			var answer = $(slider.find('.CardItem.current.showing .card-bottom .spell-answer .spell-content').data('answer').trim()).text().trim();
			var answer2 = filterVal(answer, false, false, true);
			var arr_answer = answer.blank().toArray(' ');
			answer = filterVal(answer, false);

			if ($('.is_first_typing').is(':checked')) {
				answer = answer2;
				// console.log(e.keyCode, e.key, this.value);
				// console.log(e);
				// console.log(e.key.trim(), this.value.substring(this.value.length - 1, this.value.length));

				var cur_char = this.value.substring(this.value.length - 1, this.value.length);
				// if (e.key.trim().length == 1 && this.value.substring(this.value.length - 1, this.value.length) != ' ') {
				if (cur_char != ' ') {
					var is_insert = false;
					// console.log(search_idx, arr_answer.length);
					if (search_idx < arr_answer.length) {
						for (var i = search_idx; i < arr_answer.length; i++) {
							// if (user_input.length > 0) { user_input += ' '; }
	
							var removeValue = filterVal(arr_answer[i], false, false, true);
							// console.log('###AAA###', removeValue, arr_answer[i]);
							if (removeValue.length == 0) {
								user_input += arr_answer[i] + ' ';
								continue;
							}
	
							var arr_hangul_cho = Hangul.disassemble(removeValue, true);
							if (arr_hangul_cho.length > 0) {
								removeValue = arr_hangul_cho[0][0];
							}
	
							// if (removeValue.substring(0, 1).toLowerCase() == e.key.toLowerCase()) {
								// console.log('###AAA###', removeValue.substring(0, 1).toLowerCase(), cur_char.toLowerCase());
							if (removeValue.substring(0, 1).toLowerCase() == cur_char.toLowerCase()) {
								user_input += arr_answer[i] + ' ';
								is_insert = true;
							}
							break;
						}
						// console.log('###AAA###', user_input);
						this.value = user_input;
						if (is_insert == false) {
							// this.value += e.key;
							this.value += cur_char;
						}
					}
				}
			}
		    // console.log(this.value);
			var user_input = filterVal(this.value, false);
			var user_input2 = filterVal(this.value, false, false, true);
			
			// console.log('%%%%%%%%%%%%%%%', user_input, answer);
			// console.log('%%%%%%%%%%%%%%%', user_input2, answer2);

			var chk_answer = false;
		    if (front_lang == 'ko') {
				if (user_input.length > 0) {
					var user_input_1 = '';
					var user_input_2 = [];
					if (user_input.length == 1) {
						user_input_2 = Hangul.disassemble(user_input, true);
					} else {
						user_input_1 = user_input.substring(0, user_input.length - 1);
						user_input_2 = Hangul.disassemble(user_input.substring(user_input.length - 1), true);
					}

					if (user_input_1.length == 0 || answer.indexOf(user_input_1) == 0) {
						if (user_input_1.length < answer.length) {
							var answer_last = Hangul.disassemble(answer.substring(user_input.length - 1, user_input.length), true);
							// console.log(user_input_2, answer_last);
							if (user_input_2.length == answer_last.length) {
								// console.log('chk', '11');
								user_input_2.forEach(function(u, i) {
									var a = answer_last[i];
									// console.log(a, u);
									if (a.length < u.length) {
										return false;
									}

									// console.log('chk', '22');
									chk_answer = true;
									u.forEach(function(u2, i2) {
										// console.log(u2, a[i2]);
										if (u2 != a[i2]) {
											chk_answer = false;
											return false;
										}
									});
								});
							}
						}
					}
				} else {
					chk_answer = true;
				}
			} else {
				// if (answer.indexOf(user_input) == 0) {
				if (answer.indexOf(user_input) == 0 || answer2.indexOf(user_input2) == 0) {
					chk_answer = true;
				}
			}
		    if (chk_answer) {
			    $(this).removeClass('text-danger');
		    } else {
				$(this).addClass('text-danger');
				
				// 첫단어 입력이여도 바로 오답 처리 안함.
				if ($('.is_first_typing').is(':checked')) {
					// $('.btn-confirm').click();
					// e.preventDefault();
					// return false;
					$(this).removeClass('text-danger');
					var re_val = '';
					// if (search_idx < arr_answer.length) { search_idx--; }
					// else { search_idx = arr_answer.length - 1; }
					// if (search_idx < 0) { search_idx = 0; }
					// console.log('old_input : ', old_input);
					search_idx = old_input.toArray(' ').length - 1;
					if (search_idx < 0) { search_idx = 0; }
					// console.log('$$$$$$$$$$$$$$', search_idx);
					for (var i = 0; i < search_idx; i++) {
						re_val += arr_answer[i] + ' ';
					}
					this.value = re_val;
					playEffect('wrong');
				}
				
			}
			
			if ($('.is_first_typing').is(':checked')) {
				var cur_input = this;
				cur_input.blur();
				setTimeout(function() {
					cur_input.focus();
				}, 50);
			}
	    });
    }

	if (slider.find('.CardItem').length > 0) {
	    cur_idx = 0;
		animateCards();
		setAutoFont(slider.find('.CardItem.showing'));
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
	
	// 2015.12.22 버전 1.62에 따라 의미제시일 경우 audio auto 토글을 제거한다.
	if ($('.show_type:checked').val() == 1) {
		$('.btn_audio').removeClass('hidden');
		// 2018-07-12 메뉴로 이동하면서 감추기 제거
// 		$('.btn-auto-play').removeClass('hidden');
	} else if ($('.show_type:checked').val() == 2) {
		$('.btn_audio').removeClass('hidden');
		// 2018-07-12 메뉴로 이동하면서 감추기 제거
// 		$('.btn-auto-play').addClass('hidden');
	} else {
		$('.btn_audio').removeClass('hidden');
		// 2018-07-12 메뉴로 이동하면서 감추기 제거
// 		$('.btn-auto-play').addClass('hidden');
	}
	
	console.log('fade in');
	slider.addClass('in');
	
	if (is_first_load) {
		is_first_load = false;
		var params = getQueryParams();
		if (params.c != undefined) {
			for (i = 1; i < params.c; i++) {
				console.log('btnNextCard click 4');
				$('.btnNextCard').first().click();
			}
		}
	}
	
	refreshProgress();
	setTimeout(function() {
		animateCards();
	}, 500);

	is_data_loading = false;
}

var current_para_idx = 0;
var current_scramble_idx = 0;
var scrambleBottomResetTimer = null;
var answer_arr = [];
function setScrambleBottom(el) {
	// var answer = el.find('.answer').text();
	answer_arr = [];
	var answer = el.find('.card-bottom .spell-answer .spell-content').data('answer');
	console.log('###############################################', answer);
	var back = el.find('.card-top .spell-answer .spell-content').data('answer');
	console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@', back);

	var arr_br = answer.split('<br>');
	var arr_back = back.split('<br>');

	// if (arr_br.length != arr_back.length) {
	// 	arr_br = [answer.replace(/<br>/gi, ' ')];
	// 	arr_back = [back.replace(/<br>/gi, ' ')];
	// }

	

	var bottom_el = el.find('.card-bottom .spell-input');
	bottom_el.empty().removeClass('hidden');
	bottom_el.parent().find('.txt-back').remove();
	var back_el = $('<div class="txt-back m-b-sm" style="font-size: 16px;"></div>');
	bottom_el.parent().prepend(back_el);
	$.each(arr_br, function(ii, val) {
		// console.log(ii, val);
		if (val.trim().length == 0) {
			console.log(ii, val);
			return;
		}
		answer_arr.push(val.toArray(' '));

		if (ii < arr_back.length && arr_back[ii].trim().length > 0) {
			if (back_el.children().length > 0) {
				back_el.append(' / ');
			}
			back_el.append('<span class="para_item3" data-idx="' + ii + '">' + arr_back[ii] + '</span>');
		} else {
			back_el.append('<span class="para_item3" data-idx="' + ii + '"></span>');
		}
	});
	// answer_arr = answer.toArray(' ');
	console.log(answer_arr);
	
	if (current_para_idx >= answer_arr.length) {
		$('.btn-confirm').first().click();
		return;
	}

	back_el.find('.para_item3[data-idx="' + current_para_idx + '"]').addClass('active');

	var suggest_cnt = 5;
	var limit_len = current_scramble_idx + suggest_cnt;
	if (limit_len + 2 >= answer_arr[current_para_idx].length) {
		limit_len += 2;
	}
	var bottom_arr = [];
	for (var i = current_scramble_idx; (i < answer_arr[current_para_idx].length && i < limit_len); i++) {
		if (answer_arr[current_para_idx][i].replace(/[!?,.;]+$/gi, '').trim().length == 0) {
			bottom_arr.push(answer_arr[current_para_idx][i].trim());
		} else {
			bottom_arr.push(answer_arr[current_para_idx][i].replace(/[!?,.;]+$/gi, '').trim());
		}
	}
	fy(bottom_arr);

	bottom_el.empty();
	$.each(bottom_arr, function (index) {
		bottom_el.append('<a class="btn btn-sentence-word bottom animated">' + this + '</a>');
	});
	console.log('################################', limit_len, answer_arr[current_para_idx].length);
	if (limit_len < answer_arr[current_para_idx].length) {
		bottom_el.append('<span style="position: relative; bottom: 3px; margin-left: 5px; color: #666;">⋯</span>').css('position', 'relative');
	} else if (current_para_idx + 1 < answer_arr.length) {
		bottom_el.append('<span style="position: relative; bottom: 3px; margin-left: 5px; color: #666;">/</span>').css('position', 'relative');
	}

	console.log('@@@@@@@@@@@@@@@', bottom_el.height(), back_el.height());
	var bottom_height = bottom_el.height() + back_el.height() + 39;
	el.find('.card-top').css('height', 'calc(100% - ' + bottom_height + 'px)');
	el.find('.card-bottom').css({'height': bottom_height, 'border-color': ''});

	bottom_el.find('.btn-sentence-word').unbind('click').click(function(e) {
		playEffect('click');
		var card = $(this).closest('.flip-card');
		var card_back = card.find('.flip-card-back-drill');
		var box = card_back.find('.drill-box');
		if (card.hasClass('active') || card.hasClass('deactive')) {
			e.preventDefault();
			return false;
		}

		var user_input_el = el.find('.card-top .spell-input');
		// var answer_text = card.find('.answer').text();
		
		if (current_scramble_idx < answer_arr[current_para_idx].length) {
			// 정/오답 체크...
			var pre_user_answer = filterVal($(this).text(), true);
			var pre_answer = filterVal(answer_arr[current_para_idx][current_scramble_idx], true);

			console.log('###IDX###', current_scramble_idx);
			console.log('############################################################', pre_user_answer, pre_answer, $(this).text(), answer_arr[current_para_idx][current_scramble_idx]);

			el.find('.card-top .txt-scramble-guide').remove();
			if (pre_user_answer == pre_answer) {
				user_input_el.append('<span class="user-sentence-word">' + answer_arr[current_para_idx][current_scramble_idx] + '</span>');
				$(this).addClass('clicked');

				current_scramble_idx++;
				console.log('###IDX###', current_scramble_idx);
				if (current_scramble_idx >= answer_arr[current_para_idx].length) {
					current_para_idx++;
					current_scramble_idx = 0;
					console.log('###IDX###', current_scramble_idx);
					user_input_el.append('<div></div>');
				}
				if (bottom_el.find('.btn-sentence-word').not('.clicked').length == 0) {
					if (current_para_idx > 0 && current_para_idx < answer_arr.length && current_scramble_idx == 0) {
						playEffect('correct');
					}

					if (scrambleBottomResetTimer != null) {
						clearTimeout(scrambleBottomResetTimer);
						scrambleBottomResetTimer = null;
					}
					scrambleBottomResetTimer = setTimeout(function() {
						setScrambleBottom(el);
					} , 800);
				}
			} else {
				// 틀림....
				console.log('틀림 처리');

				user_input_el.append('<span class="text-danger hidden">' + $(this).text() + '</span>');
				for (var para_idx = current_para_idx; para_idx < answer_arr.length; para_idx++) {
					for (var scram_idx = current_scramble_idx; scram_idx < answer_arr[para_idx].length; scram_idx++) {
						var text_class = 'text-lighter';
						if (para_idx == current_para_idx) {
							text_class = 'text-danger';
						}
						user_input_el.append('<span class="user-sentence-word ' + text_class + '">' + answer_arr[para_idx][scram_idx] + '</span>');
					}
					user_input_el.append('<div></div>');
					current_scramble_idx = 0;
				}


				bottom_el.find('.btn-sentence-word').addClass('disabled');
				$(this).addClass('wrong');

				$('.btn-confirm').first().click();
			}
		} else {
			$('.btn-confirm').first().click();
		}
		
		e.preventDefault();
		return false;
	});
}

var hintTimer = null;
function showHint(card) {
	card.data('status', 'xk').attr('data-status', 'xk');
	var bottom = card.find('.card-bottom');
	bottom.find('.spell-content').html(bottom.find('.spell-content').data('answer'));
	if (bottom.length == 0) { return; }
	if (bottom.find('.spell-input').hasClass('hidden') == true) { return; }
	bottom.find('.spell-answer').removeClass('hidden');
	bottom.find('.spell-input').addClass('hidden');
	setAutoFont(card);
	bottom.find('.spell-answer').css('color', 'inherit');
	$('.study-bottom').addClass('show-hint');
	hideHintTimer(bottom, 0);

	if ((set_type == 1 || set_type == 5) && $('.is_auto_play').is(':checked')) {
		// 오디오 재생 이후 자동 이동 없음.
		isAuto = false;
		playAudio(true);
	}
}
function hideHintTimer(el, sec) {
	console.log('sec', sec);
	var max_sec = 5;
	if (sec < max_sec) {
		// $('.study-bottom .show-hint-box span').text((max_sec - sec));
		hintTimer = setTimeout(function() {
			hideHintTimer(el, (sec + 1));
		}, 500);
	} else {
		$('.study-bottom').removeClass('show-hint');
		el.find('.spell-answer').addClass('hidden');
		el.find('.spell-input').removeClass('hidden').find('.input-answer').focus();
	}
}

function showAllCard() {
	$('.btn-opt-scope').first().click();
}

var is_first_load = true;
var cur_idx = 0;
var audioTimer = null;
function animateCards() {
	stopAudio();

	$('.spell-cap-msg').addClass('hidden');
	$cards = slider.find('.CardItem');
	
	if ($cards.length == 0) {
		return;
	}
	
	$('.btnPrevCard').removeClass('invisible');
	if (cur_idx < 1) {
		$('.btnPrevCard').addClass('invisible');
	}

	$('.btn-retry').addClass('disabled').text('지금 재시도');
	
	console.log(cur_idx);
	console.log('animatedCard 1');
	if (cur_idx > 1) {
		$($cards.get(cur_idx - 2)).removeClass('previous current next showing').addClass('hidden');
	}
	console.log('animatedCard 2');
	if (cur_idx > 0) {
		$($cards.get(cur_idx - 1)).removeClass('hidden current next').addClass('previous showing');
	}
	console.log('animatedCard 3');
	if (cur_idx > -1) {
		$($cards.get(cur_idx)).removeClass('hidden previous next').addClass('current showing');
		setSendView($($cards.get(cur_idx)).data('idx'));
		setTimeout(function() {
			setAutoFont($($cards.get(cur_idx)));
		}, 50);
	}
	console.log('animatedCard 4');
	if (cur_idx < $cards.length - 1) {
		$($cards.get(cur_idx + 1)).removeClass('hidden previous current').addClass('next showing');
	}
	console.log('animatedCard 5');
	if (cur_idx < $cards.length - 2) {
		$($cards.get(cur_idx + 2)).removeClass('previous current next showing').addClass('hidden');
	}
	console.log('animatedCard 6');

	clearTimeout(hintTimer);
	$('.study-bottom').removeClass('show-hint');

	if (audioTimer) {
		clearTimeout(audioTimer);
		audioTimer = null;
	}
	audioTimer = setTimeout(function() {
		// 단어세트인 경우 옵션에서 재생버튼 활성화 일때 1회 재생함.
		// 2015.12.22 버전 1.62에 따라 단어제시일 경우에만 재생처리
	    if (set_type == 1 && $('.is_auto_play').is(':checked') && ($('.show_type:checked').val() == 1 || $('.show_type:checked').val() == 4)) {
	        playAudio(true);
	    }
	}, 600);

	if (set_type == 5) {
		var cur_card = slider.find('.current.showing');
		var find_idx = cur_card.data('idx');
		var find_obj = study_data.find(function(obj) { return eval(obj.card_idx) === eval(find_idx); });
		if (find_obj == null) {
			$('.txt-card-no').text('');
		} else {
			$('.txt-card-no').text(find_obj.card_order.toString().zf(3));
		}

		var show_type = $('.show_type:checked').val();
		if (show_type == 2) {
			current_para_idx = 0;
			current_scramble_idx = 0;
			setScrambleBottom(cur_card);
		}
	}

	setNextButton();
}

var showCardStatusTimer = null;
function showCardStatus($el) {
	console.log($el);
	
	setTimeout(function() {
		if ($el.data('status') == 'k' || $el.data('status') == 'xk') {
// 			$el.find('.card-correct-info').html('<i class="fa fa-circle-o"></i>');
			$el.find('.card-correct-info').html('아는 카드');
			$el.addClass('correct');
			$el.addClass('active').removeClass('deactive');
		} else {
// 			$el.find('.card-correct-info').html('<i class="fa fa-times"></i>');
			$el.find('.card-correct-info').html('모르는 카드');
			$el.addClass('wrong');
			$el.addClass('deactive').removeClass('active');
			
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
	
	var idx = $('#cardPageInfo').data('index');
	
	changeStatusCard(idx);
	showCardStatusTimer = setTimeout(function() {
		if ($el.hasClass('correct') == true) {
			$el.addClass('active');
			$el.removeClass('deactive');
		} else if ($el.hasClass('wrong') == true) {
			$el.addClass('deactive');
			$el.removeClass('active');
		}
		$el.removeClass('correct wrong');
// 		            coverUp();
// 			setAnswer(false);

		// 맞았을때 애니메이션 처리
		if (set_type == 5 && $('.show_type:checked').val() == 2) {
			refreshProgress();
		} else {
			if ($el.hasClass('active') == true) {
				var ani_el = $el.find('.card-bottom').first().clone();
				ani_el.addClass('ani');
				$el.append(ani_el);
				
				setTimeout(function() {
					ani_el.addClass('start');
					setTimeout(function() {
						$el.find('.card-bottom.ani').remove();
						refreshProgress();
					}, 625);
				}, 25);
			} else {
				var ani_el = $el.find('.card-bottom').first();
				
				ani_el.addClass('ani animated shake');
				setTimeout(function() {
					setTimeout(function() {
						$el.find('.card-bottom').removeClass('ani animated shake');
						refreshProgress();
					}, 700);
				}, 10);
			}
		}
	}, 100);
}

function setNextButton(is_delay_button) {
	var card = slider.find('.CardItem.current.showing');
	console.log('^^^^^^^^^^^^^^', card);
	var input_el = card.find('.card-bottom .input-answer');

	if (set_type == 5) {
		if (card.data('status') == 'k') {
			$('.btn-short-change-next').text('와우! 대단해요! 다음카드');
			$('.btn-retry').text('한번 더 할까요?');
		} else {
			$('.btn-short-change-next').text('나중에 다시');
			$('.btn-retry').text('지금 재시도');
		}
	} else {
		if (card.data('status') == 'k') {
			$('.btn-short-change-next').text('다음 카드');
		} else if (card.data('status') == 'xk') {
			$('.btn-short-change-next').text('나중에 힌트없이 한번 더');
		} else {
			$('.btn-short-change-next').text('나중에 한번 더');
		}
	}

	if (card.hasClass('input')) {
		input_el.attr('disabled', true);

		if (set_type == 5 && $('.show_type:checked').val() == 2) {
			console.log('no set btns');
		} else {
			if (is_delay_button == true) {
				$('.study-bottom').addClass('invisible');
				setTimeout(function() {
					if ($('.study-bottom').hasClass('invisible')) {
						$('.study-bottom').removeClass('invisible').addClass('down');
					}
				}, 1500);
			} else {
				$('.study-bottom').addClass('down');
			}
		}
	} else {
		input_el.attr('disabled', false).focus();
		$('.study-bottom').removeClass('down invisible');
	}
}

var blockCover = false;
var isAuto = false;
var nextButtonTimer = null;
jQuery(function($){
    slider = $('#wrapper-learn .study-body');
    
    setSendLog(0, 0);
    
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
        
        isAuto = false;
	})
	.bind('ended', function() {
		console.log('audio ended : ' + isAuto);
		var ad = $('.btn_audio[data-src="' + $(this).attr('src') + '"]');
	    if (ad.length > 0) {
		    ad.removeClass('text-danger text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
	    }
        
        if (isAuto) {
            $('.btnNextCard').first().click();
        }

        isAuto = false;
        
        if ($('body').hasClass('page-small') == false) {
	        var input_el = $('.CardItem.current.showing .card-bottom .input-answer');
	        input_el.focus();
        }
    });

    $('.btn-confirm').click(function(e) {
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
			showCardStatusTimer = null;
		}

		$card_box_current = slider.find('.CardItem.current');
		$card_box_current.addClass('input');

		var value = '';
		var show_type = $('.show_type:checked').val();

		if (set_type == 5 && show_type == 2) {
			var input_el = $('.CardItem.current.showing .card-top .spell-input span');
			input_el.each(function() {
				if (value.length > 0) { value += ' '; }
				value += $(this).text().trim();
			});
		} else {
			var input_el = $('.CardItem.current.showing .card-bottom .input-answer');
			value = input_el.val().trim();
		}
		$card_answer = $card_box_current.find('.card-bottom .spell-answer .spell-content');
		var card_all = arr_slide_data.find(function(obj) { return obj.card_idx == $card_box_current.data('idx'); });
		$card_box_current.find('.card-bottom .spell-content').removeClass('font-32').html($card_answer.data('answer').replace(/<br>/gi, '\r\n'));
        var answer = $card_answer.text().trim();
        
        // 모름을 클릭하면 1회 틀리고 다시 맞춘것 처리 로직을 처리
        if (value == '|unknow|') {
	        value = answer;
	        $card_box_current.data('status', 'x').attr('data-status', 'x');
        } else {
			if ($card_box_current.data('status') != 'xk') {
				$card_box_current.data('status', 'u').attr('data-status', 'u');
			}
        }
        
		console.log($card_box_current.data('status'));

		console.log('####CHK_ANSWER####', answer, '####CHK_INPUT####', value);
		var check_result = checkAnswer(answer, value, false, true, false, (set_type == 2));
		var check_result2 = checkAnswer(removeCategory(answer, (set_type != 2)), removeCategory(value, (set_type != 2)), false, true, false, (set_type == 2));
		// 단어세트이고 예문제시일때 예문의 {}의 문자열을 정답으로 처리한다.
		var is_exam = false;
		if (set_type == 1 && $('.show_type:checked').val() == '2') {
			console.log('11111111');
			is_exam = true;
			var exam_el = $card_box_current.find('.card-bottom .text-example .exam-data');
			console.log(exam_el);
			if (exam_el.length == 0) {
				console.log('22222222');
				check_result = false;
			} else {
				console.log('3333333');
				answer = exam_el.text().trim();
				check_result = checkAnswer(exam_el.text(), value, false, true, false, (set_type == 2));
				check_result2 = checkAnswer(removeCategory(exam_el.text(), true), removeCategory(value, true), false, true, false, (set_type == 2));
			}
		}

		// 오답 + 단어/용어 세트 + 단어/용어 제시 : 뜻 1개 정답인정 일때 처리
		if ((check_result == false && check_result2 == false) && (set_type == 1 || set_type == 2) && $('.show_type:checked').val() == '1') {
			var arr_ans = answer.split(/\r\n|\r|\n|;|,/gi);
			var arr_value = value.split(/;|,/gi);
			console.log('####ASDF####', arr_ans, arr_value);

			var correct_cnt = 0;
            for (var j = 0; j < arr_value.length; j++) {
				for (var i = 0; i < arr_ans.length; i++) {
					if (arr_ans[i].trim().length == 0) {
						continue;
					}
					var current_result = checkAnswer(arr_ans[i], arr_value[j], false, true, false, (set_type == 2));
					var current_result2 = checkAnswer(removeCategory(arr_ans[i], (set_type != 2)), removeCategory(arr_value[j], (set_type != 2)), false, true, false, (set_type == 2));
	
					if (current_result || current_result2) {
						correct_cnt++;
						break;
					}
				}
			}
			
			if (correct_cnt > 0 && correct_cnt == arr_value.length) {
				check_result = true;
			} else {
				check_result = false;
			}
		}
	
		// console.log('###ANS###', check_result, check_result2);
		if (check_result || check_result2) {
			console.log('###ANS###', $card_box_current.data('status'));
            if ($card_box_current.data('status') == 'x' || $card_box_current.data('status') == 'xk') {
				console.log('###ANS###', 'answer ok');
                $card_box_current.data('status', 'xk').attr('data-status', 'xk');
                card_all.known_yn = 0;
            } 
            else {
				console.log('###ANS###', 'answer correct');
                $card_box_current.data('status', 'k').attr('data-status', 'k');
                card_all.known_yn = 1;
            }
        } else {
			console.log('###ANS###', 'answer wrong');
            $card_box_current.data('status', 'x').attr('data-status', 'x');
            card_all.known_yn = 0;
        }
        
        // console.log('................. : ' + $card_box_current.data('quest'));
        if ($card_box_current.data('quest') != -1) {
	        $card_box_current.data('quest', 0);
        }

        coverDown();
		coverChange();
		setAnswer(true);
        showCardStatus($card_box_current);
        
        if (is_exam) {
			// $card_box_current.find('.card-top .text-example').html(answer);
			setAutoFont(slider.find('.CardItem.current.showing'));
			$card_box_current.find('.card-bottom .answer-box .spell-content').html(answer);
		}
        if (check_result == false) {
        	if (checkAnswer(answer, value, true, true, false, (set_type == 2))) {
/*
				$cap = $card_box_current.find('.card-top .spell-cap');
				console.log($cap);
				$cap.removeClass('hidden');
				
				if (is_exam) {
					$card_box_current.find('.card-top .text-example').html(answer + '<div style="font-size: 12px;" class="spell-cap">대소문자를 틀리게 입력했습니다.</div>');
				}
*/
				$card_box_current.find('.spell-cap-msg').removeClass('hidden');
			}
		}

		e.preventDefault();
		
		if (set_type == 1 || set_type == 5) {
			var show_type = $('.show_type:checked').val();
			if (show_type == 4) {
				if (set_type == 5) {
					$card_box_current.find('.card-top>div>.spell-answer').addClass('text-left');
				}
				$card_box_current.find('.card-top>div>.spell-answer').removeClass('hidden');
				$card_box_current.find('.btn_audio').removeClass('font-64').appendTo($card_box_current.find('.icon-left'));
			}
		}

		if (check_result || check_result2) {
			console.log('12123123123123123');
			if (set_type == 5 && $('.show_type:checked').val() == 2) {
				playEffect('correct');
			}

			if ($card_box_current.data('status') == 'xk') {
				if ((set_type == 1 || set_type == 5) && $('.is_auto_play').is(':checked')) {
					// 오디오 재생 이후 자동 이동 없음.
					isAuto = false;
					if (set_type == 5 && $('.show_type:checked').val() == 2) {
						slider.find('.CardItem.current .btn_audio').removeClass('disabled').tooltip({container: 'body'});
					} else {
						playAudio(true);
					}
				}
			} else {
				if ((set_type == 1 || set_type == 5) && $('.is_auto_play').is(':checked')) {
					// console.log('set isAuto true');
					isAuto = false;
					if (set_type == 5 && $('.show_type:checked').val() == 2) {
						slider.find('.CardItem.current .btn_audio').removeClass('disabled').tooltip({container: 'body'});
					} else {
						playAudio(true);
					}

					var correct_data = study_data.filter(function(obj) { return obj.known_yn == 1; });
					var unknow_data = study_data.filter(function(obj) { return obj.known_yn != 1; });
					if (correct_data.length == study_data.length && unknow_data.length == 0) {
						setTimeout(function() { showStudyEnd(); }, 1300);
					}
				} else {
					setTimeout(function() {
						$('.btnNextCard').first().click();
					}, 1000);
				}
			}			
		} else {
			if (set_type == 5 && $('.show_type:checked').val() == 2) {
				playEffect('wrong');
			}

			if ((set_type == 1 || set_type == 5) && $('.is_auto_play').is(':checked')) {
				// 오디오 재생 이후 자동 이동 없음.
				isAuto = false;
				if (set_type == 5 && $('.show_type:checked').val() == 2) {
					slider.find('.CardItem.current .btn_audio').removeClass('disabled').tooltip({container: 'body'});
				} else {
					playAudio(true);
				}
			}
		}



    });

	var current_show_type = $('.show_type:checked');
    $('.show_type').change(function(e) {
// 		console.log('show_type : ' + this.value);
		if (this.value == 2 && set_type != 5) {
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
			setUserPref('show_w_s', this.value);
		} else if (set_type == 2) {
			setUserPref('show_t_s', this.value);
		} else if (set_type == 5) {
			setUserPref('show_s_s', this.value);
		}
		
		current_show_type = $(this);
		setShowTypeText(current_show_type.next());
        setCard();
//         refreshProgress();
	});
	setShowTypeText(current_show_type.next());
	function setShowTypeText(el) {
		$('.txt-show-type').text(el.text());
	}

    $selScope = $('.selScope');
    $selScope.change(function() {
        setCard();
//         refreshProgress();
	});
	
	$('.is_first_typing').change(function(e) {
		if (front_lang != 'en' && front_lang != 'ko' && this.checked == true) {
			showAlert('현재 선택 언어 (' + front_lang_text + ')는 지원하지 않습니다');
			$(this).prop('checked', false);
			return;
		}

		setUserPref('is_first_typing', (this.checked ? 1 : 0));
		setCard();
	});

    $('.is_shuffle').change(function() {
		if (set_type == 5){
			setUserPref('learn_shuffle_s', (this.checked ? 1 : 0));
		}else{
			setUserPref('learn_shuffle', (this.checked ? 1 : 0));
		}
        setCard();
//         refreshProgress();
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
	
	$('.btn-short-change-next').click(function(e) {
		coverUp();
        $('.btnNextCard').first().click();

		e.preventDefault();
		return false;
	});

	$('.btn-retry').click(function(e) {
		var cur_card = slider.find('.CardItem.showing.current');
		if (cur_card.length == 0) { return; }

		var card_idx = cur_card.data('idx');
		if (card_idx === undefined) { return; }

		var card_all = arr_slide_data.find(function(obj) { return obj.card_idx == card_idx; });
		if (card_all != null) {
			card_all.known_yn = 0;
		}
		setSendLog(card_idx, 0);

		$(this).addClass('disabled');
		$('.btn-retry').text('지금 재시도');
		$('.btn-short-change-next').text('나중에 다시');

		if (set_type == 5 && $('.show_type:checked').val() == 2) {
			cur_card.data('status', '').attr('data-status', '');
			cur_card.removeClass('input active deactive');
			cur_card.find('.card-top .spell-content').html('<div class="text-lighter font-18 txt-scramble-guide">의미를 보고 단어를 순서대로 선택하세요.<br>틀리면 나중에 한번 더 학습하세요.</div>');
			cur_card.find('.card-top .spell-input').empty();
			cur_card.find('.btn_audio').addClass('disabled').tooltip('destroy');
	
			current_scramble_idx = 0;
			current_para_idx = 0;
			setScrambleBottom(cur_card);
		} else {
			cur_card.data('status', '').attr('data-status', '');
			cur_card.removeClass('input active deactive');
			stopAudio();

			if ($('.show_type:checked').val() == 4) {
				cur_card.find('.btn_audio').addClass('font-64').tooltip('destroy');
				cur_card.find('.btn_audio').appendTo(cur_card.find('.card-top>div>div>div'));
			} else {
				cur_card.find('.btn_audio').addClass('disabled');
			}

			cur_card.find('.card-bottom .spell-answer').addClass('hidden');
			cur_card.find('.card-bottom .spell-input').removeClass('hidden');
			cur_card.find('.card-bottom .spell-input .input-answer').attr('disabled', false).val('').focus();
			cur_card.find('.card-bottom .spell-input .btn-show-hint').parent().removeClass('hidden');
			$('.study-bottom').removeClass('down');
		}
	});
            
    $('.btnPrevCard').click(function(e) {
		console.log('btnPrevCard Click');
		
// 		coverUp();
		
		if (cur_idx == 0) {
			return;
		}
		
		isAuto = false;
		if (nextButtonTimer) {
			clearTimeout(nextButtonTimer);
			nextButtonTimer = null;
		}

		cur_idx--;
		$('.answer-o').addClass('hidden');
		$('.answer-x').addClass('hidden');
		animateCards();
// 		setAutoFont(slider.find('.CardItem.current.showing'));
		e.preventDefault();
	});

	$('.btnNextCard').click(function(e) {
		console.log('btnNextCard Click');
		
		isAuto = false;
		if (nextButtonTimer) {
			clearTimeout(nextButtonTimer);
			nextButtonTimer = null;
		}

// 		coverUp();

		if (cur_idx >= ($cards.length - 1)) {
			showStudyEnd();
			return;
		}

		cur_idx++;
		animateCards();
// 		setAutoFont(slider.find('.CardItem.current.showing'));
		e.preventDefault();
	});

    // Toastr options
    toastr.options = {
        "debug": false,
        "newestOnTop": false,
        "positionClass": "toast-top-center",
        "closeButton": true,
        "timeOut": "3000",
        "showDuration": "200",
        "toastClass": "animated fadeInDown",
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
    
    $('.show-zoom').click(function() {
		setZoom();
	});
	
	$(window).on("beforeunload", function(e){
		console.log('beforeunload');
		// sendLearnAll();
		if (isChange) {
			return "학습결과를 저장하지 않았습니다. 종료할까요?";
		}
	});
    
    $(document).unbind('keydown').keydown(function(e) {
		console.log('##keydown2##', e.keyCode, e.ctrlKey == true, e.metaKey == true);
		
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
		if (interceptKey) { console.log('1'); return; }
		if ($('#alertModal').length > 0 && $('#alertModal').css('display') == 'block') {
			interceptKey = true;
		}
		if (interceptKey) { console.log('2'); return; }
		
		// console.log(e.target, e.target.name);
        if (e.target && e.target.nodeName == 'TEXTAREA') {
	        var name = e.target.name;
	        if (name == 'front[]' || name == 'back[]' || name == 'example[]' || name == 'input_answer') {
		        interceptKey = true;
	        }
        }
        if (interceptKey) { console.log('3'); return; }
        
        if (e.target && e.target.nodeName == 'INPUT') {
		    interceptKey = true;
        }
        if (interceptKey) { console.log('4'); return; }
        
        var cutormModal = $('#customCenterModal');
        if (cutormModal.length > 0) {
// 	        console.log(cutormModal.css('display'));
	        if (cutormModal.css('display') == 'block') {
		        interceptKey = true;
	        }
        }
        if (interceptKey) { console.log('5'); return; }
        
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
		if (interceptKey) { console.log('6'); return; }

		console.log('123123');
		if (e.keyCode === 39) {             // right arrow : next button
			// console.log('btnNextCard click 3');
            // $('.btnNextCard').first().click();
			// e.preventDefault();
		} else if (e.keyCode === 32) {
			if (set_type == 5 && $('.show_type:checked').val() == 2) {
				$('.btn-short-change-next').first().click();
			} else {
				if ($('.btn-short-change-next').closest('.study-bottom').hasClass('down') == true) {
					$('.btn-short-change-next').first().click();
				}
			}
			e.preventDefault();
		} else if (e.keyCode === 13) {
			console.log('1111');
			if (set_type == 5 && $('.btn-retry').hasClass('disabled') == false) {
				$('.btn-retry').first().click();
			}
			// if (set_type == 5 && $('.show_type:checked').val() == 2 && $('.btn-confirm').closest('.study-bottom').hasClass('invisible') == false) {
			// 	console.log('2222');
			// 	if ($('.btn-confirm').closest('.study-bottom').hasClass('invisible') == false && $('.btn-confirm').closest('.study-bottom').hasClass('down') == false) {
			// 		console.log('333');
			// 		$('.btn-confirm').click();
			// 		e.preventDefault();
			// 		return false;
			// 	}
			// }
			e.preventDefault();
        } else if (e.keyCode === 37) {      // left arrow : previous button
            // $('.btnPrevCard').first().click();
            // e.preventDefault();
        // 2015.12.18 커버를 제거했기 때문에 아래키 동작 중지 처리 
		} else if (e.keyCode === 40) {			// down arrow : cover down
			if (coverTimeout) {
                clearTimeout(coverTimeout);
                coverTimeout = setTimeout(function(){
                    coverUp();
                }, 3000);
            } else {
	            clearTimeout(coverTimeout);
                coverTimeout = setTimeout(function(){
                    coverUp();
                }, 3000);
                coverDown();
            }
// 		} else if (e.keyCode === 27) {      // Esc key : favor button
		} else if (e.keyCode === 27 || (e.keyCode === 66 && (e.ctrlKey == true || e.metaKey == true))) {      // ESC or ctrl + b key : favor button
            slider.find('.CardItem.current .btn_favor i').click();
            e.preventDefault();
        // } else if (e.keyCode === 65 && (e.ctrlKey == true || e.metaKey == true)) {      // ctrl + a key : audio button
        } else if ((e.keyCode === 32 && (e.ctrlKey == true || e.metaKey == true)) || e.keyCode === 86) {      // ctrl + space key or v key: audio button
            playAudio();
            e.preventDefault();
        } else if (e.keyCode === 69 && (e.ctrlKey == true || e.metaKey == true)) {      // ctrl + e key : edit button
	        $('.btn-opt-edit').click();
	        e.preventDefault();
		} else if (e.keyCode === 72 && (e.ctrlKey == true || e.metaKey == true)) {      // ctrl + h key : show hint
			slider.find('.CardItem.current .btn-show-hint').first().click();
			e.preventDefault();
			return false;
	    } else if (e.keyCode === 90) {
		    if (e.target && e.target.nodeName == 'INPUT') {
			} else {
				setZoom();
			}
	    }
    });
});

function setZoom() {
	if ($('.study-mode').hasClass('X2')) {
		$('.study-mode').removeClass('X2');
		$('.study-mode').addClass('X3');
		$('.txt-zoom').text('3X');
	} else if ($('.study-mode').hasClass('X3')) {
		$('.study-mode').removeClass('X3');
		$('.txt-zoom').text('1X');
	} else {
		$('.study-mode').addClass('X2');
		$('.txt-zoom').text('2X');
	}
	
	coverUp(true);
	
	setAutoFont(slider.find('.CardItem.showing'));
}

function fy(a,b,c,d) {
	c = a.length;
	while(c) 
		b = Math.random()*(--c+1)|0
		, d = a[c]
		, a[c] = a[b]
		, a[b] = d
}

var arr_effect = [];
function setEffect() {
	if (arr_effect.length == 0) {
		arr_key = ['click', 'wrong', 'correct'];
		arr_src = ['/images/effect/tick_2.mp3', '/images/effect/ding.mp3', '/images/effect/correct_fade.mp3'];
		for (var i = 0; i < arr_key.length; i++) {
			var obj = new Object();
			var audio = new Audio();
			audio.src = arr_src[i];
			audio.volume = 0.4;
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
			arr_effect[i].audio.currentTime = 0;
			arr_effect[i].audio.play();
			break;
		}
	}
}

try {
	if (!this.audioContext) {
		this.audioContext = new(window.AudioContext || window.webkitAudioContext)();
	}
} catch (error) {
	console.log(error);
}
setEffect();