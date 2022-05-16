var audio = new Audio();
var audio_para = new Audio();
var slider;
var is_data_loading = false;
var is_change_status = false;
var arr_word = [];
var study_mode = 'mem_sentence';
var current_card_total = 0;
var auido_para_update_timer;
var audio_para_end_time = 0;
var is_show_guide = true;

document.onclick = function() {
	console.log('document click');
	var cur_card = slider.find('.CardItem.current');
	if (cur_card.hasClass('step2')) {
		$('.study-popup-guide2').addClass('hidden');
	} else {
		$('.study-popup-guide1').addClass('hidden');
	}
};

function getCards(all_cnt) 
{
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

function resetAllLog(is_study) {
	if (is_study === undefined) {
		is_study = false;
	}
	var data = {
		set_idx:set_idx, 
		activity:1,
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
		activity:1, 
		last_section:current_section,
		user_idx: c_u
	};

    console.log(getLogTime(), data);

    jQuery.ajax({
		url: "/ViewSetAsync/deleteLog",
        global: false,
        type: "POST",
        data: data,
        dataType: "json",
        async: true,
        success: function(data) {
            console.log(getLogTime(), data);
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
            console.log(getLogTime(), 'response : ' + response);
        }
    });
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
    console.log(getLogTime(), arr_send_card_idx);
	console.log(getLogTime(), arr_send_score);
    if (arr_send_card_idx.length == 0 || arr_send_card_idx.length != arr_send_score.length)
    {
	    arr_send_card_idx = [];
		arr_send_score = [];
	    // return;
    }
    
	var send_section = (current_section > 999) ? 1 : current_section;
	var is_know_card = ($('.selScope:checked').val() == "1") ? 0 : 1;
	var is_w_pro = ($('.is_pro_mode').is(':checked') == true) ? 1 : 0;
	
	var data = new FormData();
	data.append("set_idx_2", set_idx);
	arr_send_card_idx.forEach(function (item, index, array) {
		data.append("card_idx[]", item);
	});
	arr_send_score.forEach(function (item, index, array) {
		data.append("score[]", item);
	});
	data.append("activity", 1);
	data.append("last_section", send_section);
	data.append("last_round", current_round);
	data.append("is_know_card", is_know_card);
	data.append("is_w_pro", is_w_pro);
	data.append("view_cnt", arr_send_view_idx.length);
	data.append("user_idx", c_u);

	var is_beacon = false;
	var event_type = this.event && this.event.type;
	if (event_type === 'unload' || event_type === 'beforeunload' || event_type === 'pagehide') {
		if ('sendBeacon' in navigator) {
			is_beacon = true;
		}
	}
	// 당분간 beacon 사용 안함 (좀더 조사 필요....)
	is_beacon = false;
	if (is_beacon) { 
		console.log('sendBeacon.....'); 
		navigator.sendBeacon('/ViewSetAsync/learnAll', data);
	} else { 
		console.log('send ajax');
		$.ajax('/ViewSetAsync/learnAll', {
            type: 'post',
			data: data,
            dataType: 'json',
            processData: false,
			contentType: false,
			async: checkAjaxAsync(),

            success: function (data) {
                console.log(getLogTime(), data);
				if (data.result == 'ok') {
					
				}
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
				console.log(XMLHttpRequest);
				console.log(textStatus);
				console.log(errorThrown);
            },
            complete: function () {
                arr_send_card_idx = [];
				arr_send_score = [];
				arr_send_view_idx = [];
				setSendLog(0, 0);
            }
        });
	}
}

function getCardCnt(all_cnt) {
    return getCards(all_cnt).length;
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
}

function setButtonSpace() {
	var card = slider.find('.CardItem.current');

	if (card.data('status') == 'k' || is_change_status == true) {
		// $('#wrapper-learn .study-bottom').removeClass('down').addClass('invisible');
	} else if (card.hasClass('step1')) {
		$('#wrapper-learn .study-bottom').removeClass('down invisible');
	} else {
		$('#wrapper-learn .study-bottom').removeClass('invisible').addClass('down');
		$('#wrapper-learn .study-bottom .btn-short-change-next').text('나중에 다시');
	}
}

function playAudio(is_force) {
	var btn_audio = slider.find('.CardItem.current .btn_audio');

	if (is_force !== undefined && is_force == true) {
		btn_audio.removeClass('disabled');
	}

	if (btn_audio.hasClass('disabled')) {
		return;
	}

	var audio_src = btn_audio.data('src');
	console.log(getLogTime(), audio_src);
	if (audio_src === undefined) {
		if (is_change_status == true) {
			setNextStatus();
		}
		return;
	}

	console.log('%%%%%%%%%%%%%%%%', audio.src, audio_src);
	if (audio.src.indexOf(audio_src) > -1 && btn_audio.hasClass('text-success')) {
		if (is_change_status == true) {
			return;
		}
		console.log('%%%%%%%%%%%%%%%%', 'match');
		btn_audio.removeClass('text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
		audio.pause();
		return;
	}

	audio.pause();

	audio.src = audio_src;
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
					setNextStatus();
				}, 300);
				
			});
		}
	} catch (error) {
		console.log(error);
	}
}
function stopAudio() {
	console.log('123');
	audio.pause();
	console.log('456');
	slider.find('.btn_audio').removeClass('text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
}
function playAudioPara(idx) {
	var audio_info = slider.find('.CardItem.current').data('audio');
	console.log(audio_info);
	audio_para_end_time = 0;
	if (audio_info !== undefined && audio_info !== null) {
		console.log('###end###', audio_para_end_time);
		var btn_audio = slider.find('.CardItem.current .btn_audio');

		var audio_src = btn_audio.data('src');
		console.log(audio_src);
		if (audio_src === undefined) {
			return;
		}

		console.log('%%%%%%%%%%%%%%%%', audio.src, audio_src);
		audio_para.pause();

		audio_para.src = audio_src;
		audio_para.load();
		if (idx < audio_info.length) {
			audio_para_end_time = audio_info[idx].e - 0.1;
		}
		if (idx > 0 && (idx - 1) < audio_info.length) {
			audio_para.currentTime = audio_info[(idx - 1)].e - 0.1
		}
		audio_para.play();
	}
}

var arr_slide_data = [];
function setSentenceEvent(el, is_show) {
	console.log('##sentence11111##', el, is_show);

	if (el == null) {
		el = slider.find('.ly-sentence .item');
	}

	if (is_show) {
		el.addClass('active force');
	} else {
		el.unbind('click').click(function(e) {
			var t = $(this);
			if (t.hasClass('slash') || t.hasClass('disabled') || t.hasClass('active')) {
				return;
			}
			
			var cur_card = t.closest('.CardItem');
			t.addClass('active');
			playEffect('click');
			// var parent = t.parent();
			// if (parent.children().length != parent.find('.item').not('.slash').length) {
			// 	t = parent.find('.item[data-idx="' + t.data('idx') + '"]');
			// }

			// t.addClass('active');
			// setTimeout(function() { 
			// 	t.removeClass('active'); 
			// }, 2000);
		})
		.removeClass('active force');
	}
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

function setWord() {
	arr_word = [];
	study_data.forEach(function(item, index) {
		var words = item.front_data.toArray(' ');
		words.forEach(function(w, i) {
			var w2 = w.toLocaleLowerCase().trim();
			w2 = w2.replace(/[!?,.;]+$/gi, '');
			if (w2.length > 0 && arr_word.indexOf(w2) == -1) {
				arr_word.push(w2);
			}
		});
	});
	setRandomWord();
}

function setRandomWord() {
	arr_word.sort(function(a, b) {
		var rtn = a.length - b.length;
		if (rtn == 0) {
			rtn = (Math.round(Math.random()) -.05);
		}
		return rtn;
	});
}

function fy(a,b,c,d) {
	c = a.length;
	while(c) 
		b = Math.random()*(--c+1)|0
		, d = a[c]
		, a[c] = a[b]
		, a[b] = d
}

function setCard() {
	if (arr_word.length == 0) {
		setWord();
	}

	is_data_loading = true;
	if (slider.hasClass('in') == true) {
		slider.removeClass('in');
		setTimeout(function() {
			setCard();
		}, 150);
		return;
	}

	current_card_total = getCardCnt(true);

	var is_all = ($('.selScope:checked').val() == "1") ? true : false;
	console.log(getLogTime(), 'get slider all');
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

	// shuffle 기능 추가
	if ($('.is_shuffle').is(':checked')) {
		fy(arr_slide_data);
	}
			
	slider.empty();
	var template = $('.template .CardItem');
	var quest_len = 4;
	
	arr_slide_data.forEach(function(item, index) {
		var row = template.clone();
		
		row.data('idx', item.card_idx).attr('data-idx', item.card_idx)
			.data('favor', item.favor_yn).attr('data-favor', item.favor_yn)
			.data('audio', item.audio_info);
		if (item.known_yn > 0) {
			row.addClass('active').data('status', 'k').attr('data-status', 'k');
			row.find('.card-cover').addClass('hidden');
		} else if (item.known_yn == 0) {
			row.addClass('deactive').data('status', 'u').attr('data-status', 'u');
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
		
		row.find('.front').val(item.front_data);
		row.find('.back').val(item.back_data);
		row.find('.example_sentence').val(item.example_sentence);
		row.find('.card_order').val(item.card_order);
		row.find('.img_path').val(media_domain + item.img_path);

		if (item.audio_path != null && item.audio_path.length > 0 && item.audio_path != '0') {
			row.find('.icon-left .btn_audio').data('src', media_domain + item.audio_path).attr('data-src', media_domain + item.audio_path).append('<i class="cc vol_on"></i>');
		}
		
		row.find('.icon-middle .btn_favor i').data('idx', item.card_idx).attr('data-idx', item.card_idx);
		if (item.favor_yn > 0) {
			row.find('.icon-middle .btn_favor i').addClass('star text-warning');
		} else {
			row.find('.icon-middle .btn_favor i').addClass('star_o');
		}
		
		row.find('.btn_know').data('idx', item.card_idx).attr('data-idx', item.card_idx);
		
		var arr_front = item.front.split(' / ');
		var arr_back = item.back.split(' / ');
		console.log('###SEN###', arr_front, arr_back);

		if (item.audio_info != null && arr_front.length > 0) {
			row.find('.sentence-back-body').remove();
			row.find('.txt-front').remove();
			row.find('.txt-back').remove();
			row.find('.ly-sentence').remove();

			var s1 = row.find('.ly-step1 .cc-scroll-y');
			var s1_content = $('<div class="m-t-lg para_list"></div>');
			s1.append(s1_content);

			var s2 = row.find('.ly-step2');
			s2.css('padding-left', '0px');
			s2.empty();

			var table_el = $('<div style="display: table; width: 100%; height: 100%;"></div>');
			s2.append(table_el);

			var table_row_top = $('<div style="display: table-row; height: 100%;"><div class="scamble-top-cell" style="display: table-cell; border-bottom: 1px solid #ccc; padding-left: 50px;"><div style="padding-right: 50px;" class="cc-scroll-y fill-parent-h success"><div class="text-lighter font-18 txt-scramble-guide">의미를 보고 단어를 순서대로 선택하세요.<br>틀려도 계속할 수 있습니다.</div></div></div></div>');
			table_el.append(table_row_top);

			var table_row_bottom = $('<div style="display: table-row;"><div style="display: table-cell; padding: 10px 0px 10px 50px;"><div class="cc-scroll-y success" style="max-height: 200px; padding-right: 50px;"><div class="txt-back" style="font-size: 16px;"></div><div class="user_input_blocks m-t"></div></div></div></div>');
			table_el.append(table_row_bottom);

			$.each(arr_front, function(idx, item) {
				var cur_back = '&nbsp;';
				if (idx < arr_back.length) {
					cur_back = arr_back[idx];
				}

				s1_content.append('<div class="para_item" data-idx="' + idx + '"><div class="front">' + item + '</div><div class="back">' + cur_back + '</div></div>');
				// s2_content.append('<div class="para_item2" data-idx="' + idx + '"><span class="front">' + item + '</span><span class="back">' + arr_back[idx] + '</span></div>');

				var arr_front_data = item.blank().toArray(' ');
				
				var para_div = $('<span class="para_item3" data-idx="' + idx + '">' + cur_back + '</span>');
				para_div.data('arr', arr_front_data);
				// setSuggestBlock(para_div);
				table_row_bottom.find('.txt-back').append(para_div);
				if (idx < (arr_back.length - 1)) {
					table_row_bottom.find('.txt-back').append(' / ');
				}

				table_row_top.find('.cc-scroll-y').append('<div class="user_answer_blocks" style="word-break: break-word;" data-idx="' + idx + '"></div>');
			});
			setSuggestBlock(table_row_bottom.find('.para_item3').first());
		} else {
			row.find('.txt-front').html(item.front.replace(/\n/gi, '<br>'));
			
			row.find('.txt-back').html(item.back.replace(/\n/gi, '<br>'));
			
			var s2 = row.find('.ly-step2');
			s2.css('padding-left', '0px');
			s2.empty();

			var table_el = $('<div style="display: table; width: 100%; height: 100%;"></div>');
			s2.append(table_el);

			var table_row_top = $('<div style="display: table-row; height: 100%;"><div class="scamble-top-cell" style="display: table-cell; border-bottom: 1px solid #ccc; padding-left: 50px;"><div style="padding-right: 50px;" class="cc-scroll-y fill-parent-h success"><div class="text-lighter font-18 txt-scramble-guide">의미를 보고 단어를 순서대로 선택하세요.<br>틀려도 계속할 수 있습니다.</div></div></div></div>');
			table_el.append(table_row_top);

			var table_row_bottom = $('<div style="display: table-row;"><div style="display: table-cell; padding: 10px 50px"><div class="txt-back" style="font-size: 16px;"></div><div class="user_input_blocks m-t"></div></div></div>');
			table_el.append(table_row_bottom);

			// $.each(arr_front, function(idx, item) {
				var arr_front_data = item.front.blank().toArray(' ');
				var cur_back = item.back;
				
				var para_div = $('<span class="para_item3" data-idx="0">' + cur_back + '</span>');
				para_div.data('arr', arr_front_data);
				// setSuggestBlock(para_div);
				table_row_bottom.find('.txt-back').append(para_div);

				table_row_top.find('.cc-scroll-y').append('<div class="user_answer_blocks" style="word-break: break-word;" data-idx="0"></div>');
			// });
			setSuggestBlock(table_row_bottom.find('.para_item3').first());
				
			// var el = row.find('.ly-sentence');
			// var arr = item.front.toArray(' ');
			// console.log(item.front, arr);
			
			// var txt = '';
			// var split_idx = 0;
			// $.each(arr, function (idx) {
			// 	if (this.trim().length == 0) {
			// 		return;
			// 	}
			// 	if (this == '/') {
			// 		txt += '<span class="item slash">' + this + '</span>';
			// 		split_idx++;
			// 	} else {
			// 		txt += '<span class="item" data-idx="' + split_idx + '">' + this + '</span>';
			// 	}
			// });
			
			// el.html(txt);
			// console.log('##sentence##', 'setCard');
			// setSentenceEvent(el.find('.item'), false);
	
			// var quest_el = row.find('.ly-step3 .ly-sentence .item');
			// quest_el.addClass('disabled');
			// quest_el = quest_el.not('.slash');
			// if (quest_el.length > 0) {
			// 	var random_idx = Math.floor(Math.random() * quest_el.length);
			// 	var quest_item = $(quest_el.get(random_idx));
			// 	quest_item.addClass('quest');
	
			// 	var answer = quest_item.text().trim().toLocaleLowerCase().replace(/[!?,.;]+$/gi, '');
			// 	var answer_idx = arr_word.indexOf(answer);
			// 	var answer_ran_idx = answer_idx - Math.floor(Math.random() * quest_len);
			// 	if (answer_ran_idx > (arr_word.length - quest_len)) { answer_ran_idx = arr_word.length - quest_len; }
			// 	if (answer_ran_idx < 0) { answer_ran_idx = 0; }
			// 	console.log('###ABC###', answer, answer_idx, answer_ran_idx);
	
			// 	var arr_quest_item = [];
			// 	for (var i = answer_ran_idx; i < (answer_ran_idx + quest_len); i++) {
			// 		arr_quest_item.push(arr_word[i]);
			// 	}
			// 	fy(arr_quest_item);
			// 	console.log('###ABC###', arr_quest_item);
	
			// 	var quest_list = row.find('.ly-sentence-quest');
			// 	quest_list.empty();
			// 	for (var i = 0; i < quest_len; i++) {
			// 		if (i < arr_quest_item.length) {
			// 			quest_list.append('<div class="sentence-quest-item cc-ellipsis l1">' + arr_quest_item[i] + '</div>');
			// 		} else {
			// 			quest_list.append('<div class="sentence-quest-item cc-ellipsis l1"></div>');
			// 		}
			// 	}
			// }
		}

		

		slider.append(row);		
	});
	    
    // // shuffle 기능 추가
    // if ($('.is_shuffle').is(':checked')) {
	//     $new = slider.children().clone();
	//     slider.empty();
	//     $new.sort(function() {return (Math.round(Math.random()) -.05)});
	// 	slider.append($new);
	// 	setSentenceEvent(null, false);
    // }
	
	if (set_type == 5) {
		slider.find('.btn-auto-play').addClass('hidden');
	}
	if (is_auto_play == 1) {
	    slider.find('.btn-auto-play').addClass('active');
	}

	if (is_show_guide == true) {
		if (slider.find('.CardItem').first().find('.ly-step1 .para_item').length == 0) {
			slider.append('<div class="study-popup-guide study-popup-guide1"><div>문장을 여러번 읽고 뜻을 파악하세요.</div></div>');
		} else {
			slider.append('<div class="study-popup-guide study-popup-guide1"><div>터치하여 뜻을 파악하면서 여러번 읽어보세요.</div></div>');
		}
	}

	// slider.find('.txt-front').unbind('click').click(function(el) {
	// 	playAudio();
    //     $('.btn_audio').tooltip('hide');
        
    //     el.preventDefault();
    //     return false;
	// });

	slider.find('.para_item').unbind('click').click(function(e) {
		$(document).click();

		$(this).parent().find('.para_item').removeClass('active');
		$(this).addClass('active');

		playAudioPara($(this).data('idx'));
	});

	slider.find('.para_item2').unbind('click').click(function(e) {
		$(document).click();

		$(this).toggleClass('active');
		if ($(this).hasClass('active')) {
			playAudioPara($(this).data('idx'));
		}
	});
	
	slider.find('.sentence-quest-item').unbind('click').click(function(e) {
		$(document).click();

		console.log('###ABC###', 'sentence-quest-item click');
		if ($(this).hasClass('disabled')) {
			return;
		}

		var user_input = $(this).text();
		user_input = filterVal(user_input, false);
		var cur_card = $(this).closest('.CardItem');
		cur_card.find('.ly-step3 .ly-sentence .item').removeClass('disabled');
		var answer = cur_card.find('.ly-step3 .ly-sentence .item.quest').text();
		answer = filterVal(answer, false);
		console.log('###ABC###', user_input, answer);
		if (user_input.toLocaleLowerCase() == answer.toLocaleLowerCase()) {
			$(this).addClass('correct');
			cur_card.find('.btn_kown_o').first().click();
		} else {
			$(this).addClass('wrong');
			cur_card.find('.sentence-quest-item').each(function() {
				var u = $(this).text();
				u = filterVal(u, false);
				if (u.toLocaleLowerCase() == answer.toLocaleLowerCase()) {
					$(this).addClass('correct');
				}
			});
			cur_card.find('.btn_kown_x').first().click();
		}
		cur_card.find('.sentence-quest-item').addClass('disabled');
	});

    $('.btn_audio', slider).unbind('click').click(function(el) {
		console.log('btn_audio click');

		$(document).click();
	    
        playAudio();
        $('.btn_audio').tooltip('hide');
        
        el.preventDefault();
        return false;
    });

    $('.btn_favor', slider).unbind('click').click(function(el) {
		$(document).click();

		target = $(el.target);
        var card_idx = target.data('idx');
        var favor_yn = (target[0].className == 'cc star_o') ? 1 : 0;

        $data = {set_idx:set_idx, card_idx:card_idx, favor_yn:favor_yn};

        jQuery.ajax({
            url: "/Memorize/favor",
            global: false,
            type: "POST",
            data: $data,
            dataType: "json",
            async: true,
            success: function(data) {
                console.log(getLogTime(), data);
                if (data.result == 'ok') {
                    if (favor_yn == 1) {
                        target[0].className = 'cc star text-warning';
                    } else {
                        target[0].className = 'cc star_o';
                    }

					var arr_data = study_data.filter(function(obj) { return obj.card_idx == card_idx; });
					arr_data.forEach(function(item, index) {
						item.favor_yn = favor_yn;
					});
                }
            },
            error: function(response, textStatus, errorThrown) {
                console.log(getLogTime(), 'response : ' + response);
            }
        });
        el.preventDefault();
        return false;
    });

    $('.btn_know', slider).unbind('click').click(function(e) {
		$(document).click();

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
	    
        $obj = $(this);
        $card_box_current = $obj.closest('.CardItem');
        console.log(getLogTime(), $card_box_current);
		
		$card_idx = $card_box_current.data('idx');
        console.log(getLogTime(), $card_idx);
        $score = ($card_box_current.data('status') == 'k') ? -1 : 1;
        console.log(getLogTime(), $score);

		var card_all = arr_slide_data.find(function(obj) { return obj.card_idx == $card_box_current.data('idx'); });

		var send_section = (current_section > 999) ? 1 : current_section;
		setSendLog($card_idx, $score);

		if ($score == -1) {
            $card_box_current.data('status', 'u').attr('data-status', 'u');
            card_all.known_yn = -1;
			if (set_type == 5 && current_round > 0) {
				console.log('##sentence##', 'btn-know', true);
				// setSentenceEvent($card_box_current.find('.ly-sentence .item'), true);
			}
        } else {
	        console.log('@@setButtonSpace@@', 4);
			$('.bottom-btns').css({'opacity': 0, 'pointer-events': 'none'});
            $card_box_current.data('status', 'k').attr('data-status', 'k');
            card_all.known_yn = 1;
            
			if (set_type == 5 && current_round > 0) {
				console.log($card_box_current);
				console.log('##sentence##', 'btn-know', false);
				// setSentenceEvent($card_box_current.find('.ly-sentence .item'), true);
			}
        }
		showCardStatus($card_box_current);
		setButtonSpace();

	    e.preventDefault();
	    return false;
    });
    
    $('.btn_kown_o', slider).unbind('click').click(function(e) {
		console.log(getLogTime(), 'btn_o click');
	    
	    var temp_btn = $(this).parent();
	    var idx = temp_btn.data('idx');
	    var card = slider.find('.CardItem[data-idx="' + idx + '"]');
	    card.data('status', 'u').attr('data-status', 'u');
	    temp_btn.click();
	    
	    e.preventDefault();
	    return false;
	});
	$('.btn_kown_x', slider).unbind('click').click(function(e) {
		console.log(getLogTime(), 'btn_x click');
	    
	    var temp_btn = $(this).parent();
	    var idx = temp_btn.data('idx');
	    var card = slider.find('.CardItem[data-idx="' + idx + '"]');
	    card.data('status', 'k').attr('data-status', 'k');;
	    temp_btn.click();
	    
	    e.preventDefault();
	    return false;
	});
	$('.btn-toggle-back', slider).unbind('.click').click(function(e) {
		$(document).click();

		var el = $(this).closest('.CardItem').find('.txt-toggle-back');
		if (el.length == 0) { return; }
		if (el.hasClass('hidden')) {
			$(this).text('뜻 감추기').addClass('active');
		} else {
			$(this).text('뜻 보기').removeClass('active');
		}
		el.toggleClass('hidden');
	});
	$('.btn-toggle-front', slider).unbind('.click').click(function(e) {
		$(document).click();

		var els = $(this).closest('.CardItem').find('.ly-step2 .ly-sentence .item');
		if (els.length == 0) { return; }
		if ($(this).hasClass('active')) {
			$(this).text('문장 보기').removeClass('active');
			setSentenceEvent(els, false);
		} else {
			$(this).text('문장 감추기').addClass('active');
			setSentenceEvent(els, true);
		}
	});

	if (slider.find('.CardItem').length > 0) {
		cur_idx = 0;
		animateCards();
		
		if (set_type == 5 && current_round == 1) {
			console.log('######################## sentenct tooltip ##########################');
			$('#slider .CardItem .card-bottom .text-normal').first()
				.attr({'data-toggle': 'tooltip', 'data-placement': 'top', 'title': '모르는 부분만 클릭하여 확인하세요.'}).tooltip({container: 'body'})
				.tooltip('show');
		}
	} else {
		console.log('end1');
		if ($('.tooltip').length > 0) {
			$('.btn_audio').tooltip('hide');
		}

		showStudyEnd();
	}
	
	console.log(getLogTime(), 'tooltip start');
	$('[data-toggle="tooltip"]').tooltip({container: 'body'});
	
	$('.btnNextCard').removeClass('hidden');
	$('.btnPrevCard').removeClass('hidden');
	
	slider.addClass('in');
	
	if (is_first_load) {
		is_first_load = false;
		var params = getQueryParams();
		if (params.c != undefined) {
			for (i = 1; i < params.c; i++) {
				$('.btnNextCard').first().click();
			}
		}
		
		if (set_type == 1) {
			$('#slider .btn_audio').not('.hidden').first().tooltip('show');
		}
	}
	
	refreshProgress();
	
	setTimeout(function() {
		animateCards();
		is_data_loading = false;
	}, 500);
}

function setSuggestBlock(el) {
	var arr_front = el.data('arr');
	if (arr_front === undefined) {
		return;
	}

	var answer_arr = [];
	for (var i = 0; i < arr_front.length; i++) {
		if (arr_front[i] == '/') {
			continue;
		}
		if (arr_front[i].replace(/[!?,.;]+$/gi, '').trim().length == 0) {
			answer_arr.push(arr_front[i].trim());
		} else {
			answer_arr.push(arr_front[i].replace(/[!?,.;]+$/gi, '').trim());
		}
	}

	var parent_el = el.closest('.ly-step2');
	var user_input_el = parent_el.find('.user_input_blocks');
	var user_answer_el = parent_el.find('.user_answer_blocks[data-idx="' + el.data('idx') + '"]');

	parent_el.find('.para_item3').removeClass('active default');
	el.addClass('active');

	var current_scramble_idx = user_answer_el.find('span').length;
	var suggest_cnt = 5;
	var limit_len = current_scramble_idx + suggest_cnt;
	if (limit_len + 2 >= arr_front.length) {
		limit_len += 2;
	}
	var bottom_arr = [];
	for (var i = current_scramble_idx; (i < answer_arr.length && i < limit_len); i++) {
		bottom_arr.push(answer_arr[i]);
	}

	if (current_scramble_idx >= answer_arr.length) {
		el.addClass('correct');
		$('#wrapper-learn .study-bottom .btn-short-change-next').text('다음 카드');

		if (parent_el.find('.para_item3').length == parent_el.find('.para_item3.correct').length) {
			playEffect('correct');
			parent_el.find('.user_answer_blocks').addClass('text-success');
			user_input_el.addClass('hidden');
			parent_el.find('.para_item3').removeClass('active').addClass('default');
			parent_el.find('.scamble-top-cell').css('border-bottom', '');

			$('.btn-retry').removeClass('disabled');

			$('.btn-short-change-card').first().click();
		} else if (el.next().length > 0) {
			setSuggestBlock(el.next());
		}

		return;
	}
	fy(bottom_arr);

	user_input_el.empty();
	user_input_el.removeClass('hidden');
	console.log('#############', bottom_arr);
	$.each(bottom_arr, function (index) {
		var block_el = $('<a class="btn btn-sentence-word bottom animated"></a>');
		block_el.html(this).data('input', this);
		user_input_el.append(block_el);
	});
	if (limit_len < answer_arr.length) {
		user_input_el.append('<span style="position: relative; bottom: 3px; margin-left: 5px; color: #666;">⋯</span>').css('position', 'relative');
	}

	user_input_el.find('.btn-sentence-word').unbind('click').click(function(e) {
		var cur_idx = user_answer_el.find('span').length;
		var input = $(this).data('input');
		// console.log('click', $(this).text(), input, answer_arr[cur_idx]);
		if (input == answer_arr[cur_idx]) {
			parent_el.find('.txt-scramble-guide').remove();
			$(this).addClass('clicked').removeClass('shake wrong');
			user_answer_el.append('<span>' + $(this).data('input') + '</span> ');
		} else {
			playEffect('wrong');
			var _this = this;
			$(this).addClass('shake wrong');
			setTimeout(function() {
				$(_this).removeClass('shake wrong');
			}, 500);
		}

		if (user_input_el.find('.btn-sentence-word').length == user_input_el.find('.btn-sentence-word.clicked').length) {
			playEffect('correct');
			setSuggestBlock(el);
		}
	});
}

function fy(a,b,c,d) {
	c = a.length;
	while(c) 
		b = Math.random()*(--c+1)|0
		, d = a[c]
		, a[c] = a[b]
		, a[b] = d
}

function showAllCard() {
	$('.btn-opt-scope').first().click();
}

var is_first_load = true;
var cur_idx = 0;
var audioTimer = null;
function animateCards() {
	is_change_status = false;
	stopAudio();
	audio_para.pause();

	$cards = slider.find('.CardItem');
	
	if ($cards.length == 0) {
		return;
	}
	
	$('.btnNextCard').removeClass('invisible');
	$('.btnPrevCard').removeClass('invisible');
	if (cur_idx < 1) {
		$('.btnPrevCard').addClass('invisible');
	}

	console.log(getLogTime(), cur_idx);
	console.log(getLogTime(), 'animatedCard 1');
	if (cur_idx > 1) {
		$($cards.get(cur_idx - 2)).removeClass('previous current next showing').addClass('hidden');
	}
	console.log(getLogTime(), 'animatedCard 2');
	if (cur_idx > 0) {
		$($cards.get(cur_idx - 1)).removeClass('hidden current next').addClass('previous showing');
		
		if (set_type == 5 && current_round == 1) {
			$('#slider .CardItem .card-bottom .text-normal').first().tooltip('destroy');
		}
	}
	console.log(getLogTime(), 'animatedCard 3');
	if (cur_idx > -1) {
		$($cards.get(cur_idx)).removeClass('hidden previous next').addClass('current showing');
		setSendView($($cards.get(cur_idx)).data('idx'));
		setTimeout(function() {
			console.log('###########################################', $($cards.get(cur_idx)));
		
			setButtonSpace();
		}, 50);
	}
	console.log(getLogTime(), 'animatedCard 4');
	if (cur_idx < $cards.length - 1) {
		$($cards.get(cur_idx + 1)).removeClass('hidden previous current').addClass('next showing');
	}
	console.log(getLogTime(), 'animatedCard 5');
	if (cur_idx < $cards.length - 2) {
		$($cards.get(cur_idx + 2)).removeClass('previous current next showing').addClass('hidden');
	}
	console.log(getLogTime(), 'animatedCard 6');

	if (audioTimer) {
		clearTimeout(audioTimer);
		audioTimer = null;
	}
	audioTimer = setTimeout(function() {
		// 단어세트인 경우 옵션에서 재생버튼 활성화 일때 1회 재생함.
		// 2015.12.22 버전 1.62에 따라 단어제시일 경우에만 재생처리
		console.log('onload auto', '111');
	    if (set_type == 1 && $('.is_auto_play').is(':checked') && $('.show_type:checked').val() == 1) {
		    console.log('onload auto', '222');
	        playAudio(true);
	    } else if (set_type == 5) {
			playAudio();
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

var showCardStatusTimer = null;
function showCardStatus($el) {	
	// setTimeout(function() {
		if ($el.data('status') == 'k') {
			$el.addClass('correct');
			$el.addClass('active').removeClass('deactive');
		} else {
			$el.addClass('wrong');
			$el.removeClass('active');
		}
	// }, 30);
	
	showCardStatusTimer = setTimeout(function() {
		if ($el.hasClass('correct') == true) {
			$el.addClass('active');
			$el.removeClass('deactive');
		} else if ($el.hasClass('wrong') == true) {
			$el.addClass('deactive');
			$el.removeClass('active');
		}
		$el.removeClass('correct wrong');
		
		$el.find('.ly-step2').first().find('.btn-toggle-front').addClass('hidden');
		// 맞았을때 애니메이션 처리
	    if ($el.hasClass('active') == true) {
		    var ani_el = $el.find('.ly-step2').first().clone();
		    ani_el.addClass('ani');
		    $el.first().find('.card-bottom').append(ani_el);
		    setTimeout(function() {
			    ani_el.addClass('start');
			    setTimeout(function() {
				    $el.find('.ly-step2.ani').remove();
					refreshProgress();

					// setTimeout(function() {
					// 	$('.btnNextCard').first().click();
					// }, 1000);
			    }, 610);
		    }, 50);
		    
	    } else {
		    var ani_el = $el.find('.ly-step2>div').first();
			ani_el.addClass('ani');
			setTimeout(function() {
				ani_el.addClass('animated shake');
				setTimeout(function() {
					$el.find('.ly-step2.ani').removeClass('ani animated shake')
					refreshProgress();
				}, 850);
			}, 10);
	    }
	}, 100);
}

function setNextStatus() {
	if (is_change_status == false) { return; }
	is_change_status = false;

	var cur_card = slider.find('.current.showing');
	if (cur_card.length == 0) { return; }

	console.log('###STATUS###', cur_card.hasClass('step1'), cur_card.hasClass('step2'));
	if (cur_card.hasClass('step1')) {
		console.log('###STATUS###', '111');
		cur_card.removeClass('step1 step3').addClass('step2');
		$('.btn-retry').addClass('disabled');
		if (cur_idx == 0 && is_show_guide == true) {
			if (slider.find('.CardItem').first().find('.ly-step2 .ly-sentence').length == 0) {
				slider.append('<div class="study-popup-guide study-popup-guide2 hidden" style="top: auto; bottom: 30px;"><div>단어를 순서대로 선택하세요</div></div>');
			} else {
				slider.append('<div class="study-popup-guide study-popup-guide2"><div>모르는 부분만 확인하면서 말로 영작하세요.<br>잘 기억나지 않으면 정답 확인 후 통과하세요.</div></div>');
			}
			is_show_guide = false;
		}
	} else if (cur_card.hasClass('step2')) {
		console.log('###STATUS###', '222');
		// cur_card.find('.btn_kown_o').first().click();
		cur_card.removeClass('step1 step2').addClass('step3');
	}
	setButtonSpace();
}

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
		setNextStatus();
	})
	.bind('play', function() {
		audio_para.pause();
	})
	.bind('ended', function() {
		console.log('audio ended');
		var ad = $('.btn_audio[data-src="' + $(this).attr('src') + '"]');
	    if (ad.length > 0) {
		    ad.removeClass('text-danger text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
		}
		setNextStatus();
	});

	$(audio_para)
    .bind('loadstart', function() {
		console.log('audio_para loadstart');
    })
    .bind('error', function() {
		console.log('audio_para error');
		clearInterval(auido_para_update_timer);
	})
	.bind('ended', function() {
		console.log('audio_para ended');
		clearInterval(auido_para_update_timer);
	})
	.bind('play', function() {
		console.log('audio_para play');
		stopAudio();
		clearInterval(auido_para_update_timer);
        auido_para_update_timer = setInterval(function() {
            var cur_time = audio_para.currentTime;
			console.log(cur_time, audio_para_end_time);
			if (audio_para_end_time > 0 && audio_para_end_time < cur_time) {
				audio_para.pause();
			}
        }, 50);
    })
    .bind('pause', function() {
        clearInterval(auido_para_update_timer);
    });

	$('.btn-cover-down').click(function(e) {
		$(document).click();
		var cur_card = slider.find('.CardItem.current');
		stopAudio();
		audio_para.pause();
		if (cur_card.hasClass('step1')) {
			is_change_status = true;
			// playAudio();
			// setButtonSpace();
			setNextStatus();
		} else if (cur_card.hasClass('step2')) {
			is_change_status = true;
			setNextStatus();
			is_change_status = true;
			setButtonSpace();
			is_change_status = false;
		}
		e.preventDefault();
		return false;
	});

	$('.btn-short-change-card').click(function(e) {
		$(document).click();

		if ($(this).hasClass('disabled') == true) {
			e.preventDefault();
			return false;
		}

		var cur_card = slider.find('.CardItem.current');
		cur_card.find('.btn_kown_o').first().click();
		// var els = slider.find('.CardItem.current .ly-sentence .item');
		// if (els.length > 0) {
		// 	setSentenceEvent(els, true);
		// }

		// is_change_status = true;
		// playAudio();
		// setButtonSpace();
		e.preventDefault();
		return false;
	});

	$('.btn-short-change-next').click(function(e) {
		$(document).click();
		$('.btnNextCard').first().click();

		e.preventDefault();
		return false;
	});

	$('.btn-retry').click(function(e) {
		var cur_card = slider.find('.CardItem.showing.current');
		if (cur_card.length == 0) { return; }

		var card_idx = cur_card.data('idx');
		if (card_idx === undefined) { return; }

		if ($(this).hasClass('disabled') == true) { return; }

		var card_all = arr_slide_data.find(function(obj) { return obj.card_idx == card_idx; });
		if (card_all != null) {
			card_all.known_yn = 0;
		}
		setSendLog(card_idx, 0);

		cur_card.data('status', '').attr('data-status', '');
		cur_card.removeClass('input active deactive');
		cur_card.find('.card-bottom .ly-step2 .scamble-top-cell').css('border-bottom', '1px solid #ccc');
		cur_card.find('.card-bottom .ly-step2 .scamble-top-cell .cc-scroll-y').prepend('<div class="text-lighter font-18 txt-scramble-guide">의미를 보고 단어를 순서대로 선택하세요.<br>틀려도 계속할 수 있습니다.</div>');
		cur_card.find('.card-bottom .ly-step2 .scamble-top-cell .cc-scroll-y .user_answer_blocks').empty();
		cur_card.find('.para_item3').removeClass('correct');
		$('#wrapper-learn .study-bottom .btn-short-change-next').text('나중에 다시');

		setSuggestBlock(cur_card.find('.para_item3').first());

		$(this).addClass('disabled');
		refreshProgress();
	});
	
	var current_show_type = $('.show_type:checked');
    $('.show_type').change(function(e) {
		console.log(getLogTime(), 'start card');
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

		console.log('show_type : ' + this.value);
		if (set_type == 1) {
			setUserPref('show_w_m', this.value);
		} else if (set_type == 2) {
			setUserPref('show_t_m', this.value);
		}
		
		current_show_type = $(this);
		setShowTypeText(current_show_type.next());
        setCard();
	});
	setShowTypeText(current_show_type.next());
	function setShowTypeText(el) {
		$('.txt-show-type').text(el.text());
	}

    $('.selScope').change(function() {
	    console.log(getLogTime(), 'start card');
        setCard();
    });
    
    $('.is_shuffle').change(function(e) {
		setUserPref('learn_shuffle_s', (this.checked ? 1 : 0));

	    console.log(getLogTime(), 'start card');
        setCard();
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
        
    $('.btnPrevCard').click(function(e) {
	    if (cur_idx == 0) {
			return false;
		}
		
		if ($('.tooltip').length > 0) {
			$('.btn_audio').tooltip('hide');
		}

		cur_idx--;
		animateCards();

		e.preventDefault();
		return false;
	});

	$('.btnNextCard').click(function(e) {
		if (cur_idx >= ($cards.length - 1)) {
			console.log('end2');
			showStudyEnd();
			return false;
		}
		
		if ($('.tooltip').length > 0) {
			$('.btn_audio').tooltip('hide');
		}
		
		cur_idx++;
		animateCards();
		
		e.preventDefault();
		return false;
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

    setRound();

    if (set_type == 3) {
		$(window).on('resize', $.proxy(resize, this));
		setTimeout(function() {
			resize();
		}, 100);
	} else {
		$('.show-zoom').click(function() {
			setZoom();
		});
	}
	
	$(window).on("beforeunload", function(e) {
		console.log(getLogTime(), 'beforeunload');
		// sendLearnAll();
		if (isChange) {
			return "학습결과를 저장하지 않았습니다. 종료할까요?";
		}
	});
	// window.addEventListener('pagehide', sendLearnAll, false);
	// window.addEventListener('beforeunload', sendLearnAll, false);
	
	$('.is_pro_mode').change(function(e) {
		if (this.checked) {
			$('#wrapper-learn .study-bottom').addClass('hidden');
		} else {
			$('#wrapper-learn .study-bottom').removeClass('hidden');
		}
	});
	
	var is_prevent_key = false;
    $(document).unbind('keyup').keyup(function(e) {
        console.log(getLogTime(), e.keyCode);
		if ($('.short-cut-info').hasClass('active')) {
        	$('.short-cut-info').removeClass('active');
        	$(window).unbind('click');
    	}
    	
//     	console.log(e.target);
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
		if ($('#alertModal').length > 0 && $('#alertModal').css('display') == 'block') {
			interceptKey = true;
		}
		if (interceptKey) { return; }

		if ($('.setting-body').css('display') == 'block') {
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
// 	        console.log(getLogTime(), cutormModal.css('display'));
	        if (cutormModal.css('display') == 'block') {
		        interceptKey = true;
	        }
        }
		if (interceptKey) { return; }
		
		// 2017-11-02 SB 3.37에서 최초 가이드가 있으면 단축키 동작 하지 않게 처리
        if ($('.show_m_guide').length > 0 && $('.show_m_guide').hasClass('active') == true) {
	        interceptKey = true;
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

		if (is_prevent_key == true) { console.log('skip : is_prevent_key'); return; }
		is_prevent_key = true;
		setTimeout(function() { console.log('is_prevent_key false'); is_prevent_key = false; }, 500);

		if (document.onclick) { document.onclick(); }

		if (e.keyCode === 39 || e.keyCode === 34) {             // right arrow : next button
            // coverUp();
            // $('.btnNextCard').first().click();
            // e.preventDefault();
        } else if (e.keyCode === 37 || e.keyCode === 33) {      // left arrow : previous button
            // coverUp();
            // $('.btnPrevCard').first().click();
            // e.preventDefault();
        } else if (e.keyCode === 13) {
			if ($('.btn-retry').closest('.study-bottom').hasClass('down') == true) {
				$('.btn-retry').first().click();
			}
			e.preventDefault();
		} else if (e.keyCode === 27 || e.keyCode === 66) {      // ESC or B key : favor button
			slider.find('.CardItem.current .btn_favor i').click();
            e.preventDefault();
        // } else if (e.keyCode === 65 && (e.ctrlKey == true || e.metaKey == true)) {      // ctrl + a key : audio button
        } else if ((e.keyCode === 32 && (e.ctrlKey == true || e.metaKey == true)) || e.keyCode === 86) {      // ctrl + space key or v key: audio button
            // console.log(getLogTime(), 'shortcurt play audio');
            playAudio();
            e.preventDefault();
		} else if (e.keyCode === 32) {      // space : 의미보기/몰라요/다음 버튼 동작
			var study_bottom = $('.btn-cover-down').closest('.study-bottom');
			if (study_bottom.hasClass('invisible') == false && study_bottom.hasClass('down') == false) {
				$('.btn-cover-down').first().click();
			} else if (study_bottom.hasClass('invisible') == false) {
				$('.btn-short-change-next').first().click();
			}
            e.preventDefault();
        } else if (e.keyCode === 69) {		// e key : Eidt button
	        $('.btn-opt-edit').click();
	        e.preventDefault();
		} else if (e.keyCode === 72) {		// h key : hint
			var card = slider.find('.CardItem.current');
			if (card.length == 0) {
				return;
			}
			if (card.hasClass('step2')) {
				card.find('.btn-toggle-front').first().click();
			} else {
				card.find('.btn-toggle-back').first().click();
			}
			e.preventDefault();
		}
	});


});