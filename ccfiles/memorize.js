var audio = new Audio();
var slider;
var guide_timer;
var is_data_loading = false;
var study_mode = 'mem';
var current_card_total = 0;

document.onclick = function() {
	console.log('end5', $('.study-popup-guide'));
	console.log('####################################### document click!!!!');
	var guide = $('.study-popup-guide');
	if (guide.length > 0 && guide.hasClass('active')) {
		guide.removeClass('active');
		document.onclick = null;
		console.log('####################################### document del.......');
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
    
    blockCover = false;
}

function setButtonSpace() {
	var card = slider.find('.CardItem.current');

	if (card.data('status') == 'k') {
		$('#wrapper-learn .study-bottom').removeClass('down').addClass('invisible');
	} else if (card.find('.card-cover').hasClass('down') || card.find('.card-cover').hasClass('hidden')) {
		$('#wrapper-learn .study-bottom').removeClass('invisible').addClass('down');
	} else {
		$('#wrapper-learn .study-bottom').removeClass('down invisible');
	}

	if (is_prevnext) {
		if (card.hasClass('active')) {
			$('.ly-unknow').removeClass('hidden');
		} else {
			$('.ly-unknow').addClass('hidden');
		}
	}
}

var coverTimeout;
function coverDown(time) {
	if (time === undefined) {
		time = 0;
	}
    var cover = slider.find('.CardItem.current .card-cover');
    if (cover.length == 0 || cover.hasClass('hidden')) {
	    return;
    }
    $cover_height = cover.parent().height();
    
	var cur_cover_top = cover.position().top;
	var top_min = cover.parent().children().first().outerHeight();
	console.log('coverDown', cur_cover_top, top_min);
	if (cur_cover_top > (top_min + 1.5)) {
/*
		coverUp(true);
		return;
*/
	}
	
	is_first_cover_info = false;
    
    // 커버 안내문구 제거
//     $('#slider .card-cover-info').addClass('hidden').first().removeClass('hidden');

    // 커버 내림으로 아는거야/모르는거야 상태 변경을 원할 경우 아래 주석 제거
    if (cover.data('status') == 'cover') {
        cover.data('status', 'ready');
    } else {
        // $(cover).data('status', 'button');
    }
    
    // 단어세트인 경우 옵션에서 재생버튼 활성화 일때 1회 재생함.
    // 2015.12.23 버전 1.62에 따라 의미제시일 경우 재생처리
	if (set_type == 1 && $('.is_auto_play').is(':checked')) {
        playAudio(true);
    }

    cover.addClass('down').animate({top:$cover_height}, 250);
    
    cover.parent().find('.text-img img').css({'opacity': 1});

    clearTimeout(coverTimeout);
    if (time > 0) {
	    coverTimeout = setTimeout(function(){
	        coverUp();
	    }, time);
    }
    
    console.log('@@setButtonSpace@@', 1);
    setButtonSpace();
}

function coverUp(no_ani) {
	is_cover_down = true;
	
    if (coverTimeout) {
	    clearTimeout(coverTimeout);
	    coverTimeout = null;
    }
    
    var cover = slider.find('.CardItem.current .card-cover');
    if (cover.length == 0 || cover.hasClass('hidden')) {
	    return;
    }
    $card_box = cover.parent();
    cover.data('status', 'cover');

    var top_min = cover.parent().children().first().outerHeight();
    var cover_top = cover.css('top');

    refreshProgress();
	console.log('coverUp', cover.css('top'), top_min, cover_top);
	cover.removeClass('down');
    if (no_ani) {
		cover.animate({top:top_min}, 0);
	} else {
		cover.animate({top:top_min}, 250);
	}
	
	cover.parent().find('.text-img img').css({'opacity': 0});
    
    console.log('@@setButtonSpace@@', 2);
    setButtonSpace();
}

function coverDel() {
    var cover = slider.find('.CardItem.current .card-cover');
    if (cover.length == 0 || cover.hasClass('hidden')) {
	    return;
    }
    
    cover.addClass('hidden');
}

function coverUpAndDown() {
	var cover = slider.find('.CardItem.current .card-cover');
    if (cover.length == 0) {
	    return;
    }
    
    if (cover.hasClass('hidden') || eval(cover.css('top').replace('px', '')) > 200) {
	    cover.removeClass('hidden')
	    coverUp(false);
    } else {
	    coverDown();
    }
}

function coverToggle() {
    var cover = slider.find('.CardItem.current .card-cover');
    if (cover.length == 0) {
	    return;
    }
    
    if (cover.closest('.CardItem').data('status') == 'k') {
	    cover.addClass('hidden');
    } else {
	    if (set_type == 5 && current_round > 0) { } else {
			cover.removeClass('hidden');
		}
	    coverUp(false);
    }
}

function playAudio(is_force) {
	var btn_audio = slider.find('.CardItem.current .btn_audio');

	if (is_force !== undefined && is_force == true) {
		btn_audio.removeClass('disabled').tooltip({container: 'body'});
	}

	if (btn_audio.hasClass('disabled')) {
		return;
	}

	console.log(getLogTime(), btn_audio.data('src'));

	if (btn_audio.data('src') === undefined || btn_audio.data('src') == '') {
		if (isAutoNextCard) {
			audio.pause();
			if (nextCardTimeout != null) {
				clearTimeout(nextCardTimeout);
				nextCardTimeout = null;
			}
			nextCardTimeout = setTimeout(function() {
				$('.btnNextCard').first().click();
			}, 1000);
		}	
		isAutoNextCard = false;
		return;
	}

	console.log('%%%%%%%%%%%%%%%%', audio.src, btn_audio.data('src'));
	if (audio.src.indexOf(btn_audio.data('src')) > -1 && btn_audio.hasClass('text-success')) {
		console.log('%%%%%%%%%%%%%%%%', 'match');
		btn_audio.removeClass('text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
		return;
	}

	audio.pause();

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

function toggleKnow() {
	var cover = slider.find('.CardItem.current .btn_know').first().click();
}

function startCover() {
    $('.card-cover', slider)
        .drag(function( ev, dd ){
	        if (studyFlicking) {
		        studyFlicking.stop();
	        }
            if (blockCover) {
                return;
            }
            
            var card = $(this).parent();
            var top_min = card.height() / 2;
//             var top_val = Math.max( top_min, Math.min( card.height(), (top_min + (dd.deltaY * 1.65)) ) );
            var top_val = Math.max( top_min, Math.min( card.height(), (top_min + (dd.deltaY * 2)) ) );
            
//             console.log(getLogTime(), top_val, top_min);

            $( this ).css({
                top: top_val
            });
            
            if ($('body').hasClass('page-small') == true) {
	            var alpha = (top_val - top_min) / top_min;
// 	            console.log(getLogTime(), alpha);
	            if (alpha > 0.9) { alpha = 1.0; }
	            if (alpha > 0.5) {
// 		            console.log(getLogTime(), card.find('.text-img img'));
		            card.find('.text-img img').css({'opacity': alpha});
	            }
	            
	            if (top_val > (card.height() - 40)) {
// 	                console.log(getLogTime(), 'cover button active');
	                card.find('.card-choice').addClass('active');
	            } else {
		            card.find('.card-choice').removeClass('active');
	            }
            }
        })
        .drag("end",function( ev, dd ){
            if (blockCover) {
                return;
            }

			var card = $(this).parent();
            refreshProgress();

            var top_min = dd.drag.offsetParent.firstElementChild.clientHeight;
//             $cover = $(dd.drag);
            $(this).data('status', 'cover');
            $( this ).animate({
                top: top_min
            }, 250 );
            
            card.find('.text-img img').css({'opacity': 0});
            
            if ($('body').hasClass('page-small') == true) {
	            if (card.find('.card-choice').hasClass('active') == true) {
		            is_cover_down = false;
		            toggleKnow();
	            }
	            card.find('.card-choice').removeClass('active');
	        }
        });
}

function stopCover() {
    $('.card-cover', slider)
        .drag(function( ev, dd ){
            ev.preventDefault();
        })
        .drag("end",function( ev, dd ){
            ev.preventDefault();
        });
}

var arr_slide_data = [];
var is_cover_down = true;
var is_first_cover_info = true;
var is_action_know = false;
var sentence_timer = null;
var sentence_timer_over = null;
function setSentenceEvent(el, is_add) {
	console.log('##sentence11111##', el, is_add);
	if (is_add) {
		el.unbind('mouseenter mouseleave mousemove hover')
		// 마우스 오버 기능을 중지함.
// 		.hover(
// 			function(e) {
// 				console.log('##sentence##', 'hover', $(this), e);
				
// 				if (sentence_timer != null) {
// 					clearTimeout(sentence_timer);
// 					sentence_timer = null;
// 				}
// 				if (sentence_timer_over != null) {
// 					clearTimeout(sentence_timer_over);
// 					sentence_timer_over = null;
// 				}
				
// 				var t = $(this);
// 				var delay = 150;
// /*
// 				if (t.next().hasClass('active')) {
// 					delay = 0;
// 				}
// */
// 				sentence_timer_over = setTimeout(function() {
// 					t.parent().children().removeClass('active');
// 					t.prevAll().addClass('active');
// 					t.addClass('active');
// 				}, delay);
				
// 				$(this).parent().tooltip('destroy');
// 			},
// 			function() {
// 				console.log('##sentence##', 'out', $(this));
// 				if (sentence_timer != null) {
// 					clearTimeout(sentence_timer);
// 					sentence_timer = null;
// 				}
				
// 				if (sentence_timer_over != null) {
// 					clearTimeout(sentence_timer_over);
// 					sentence_timer_over = null;
// 				}
				
// 				var t = $(this);
// 				sentence_timer = setTimeout(function() {
// 	/*
// 					t.prevAll().removeClass('active');
// 					t.removeClass('active');
// 	*/
// 					t.parent().children().removeClass('active');
// 				}, 1000);								
// 			}
// 		)
// 		.mousemove(function(e) {
// // 			console.log('move', this);
			
// 			if (sentence_timer_over != null) {
// 				clearTimeout(sentence_timer_over);
// 				sentence_timer_over = null;
// 			}
			
// 			var t = $(this);
// 			var delay = 150;
// 			sentence_timer_over = setTimeout(function() {
// 				t.parent().children().removeClass('active');
// 				t.prevAll().addClass('active');
// 				t.addClass('active');
// 			}, delay);
// 		})
		.unbind('click').click(function(e) {
			var t = $(this);
			t.nextAll().removeClass('clicked');
			t.prevAll().addClass('clicked');
			t.toggleClass('clicked');
		})
		.removeClass('active');
	} else {
		console.log('######', el);
		el.unbind('mouseenter mouseleave mousemove click').addClass('clicked');
	}
}

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
	var show_front = '단어 보기';
	var show_back = '의미 보기';
	if (set_type == 2) {
		show_front = '용어 보기';
		show_back = '설명 보기';
	} else if (set_type == 4) {
		show_front = '정답 보기';
		show_back = '설명 보기';
	} else if (set_type == 5) {
		show_front = '정답 보기';
		show_back = '의미 보기';
	}
	var show_text = show_back;
	if (show_type == '0') {
		show_text = show_front;
	} else if (show_type == '2') {
		show_text = show_front;
	}
	$('.btn-cover-down').text(show_text);

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
	setCookieAt00('l_sec', current_section, 1);
			
	slider.empty();
	var template = $('.template .CardItem');
	
	arr_slide_data.forEach(function(item, index) {
		var row = template.clone();
		
		row.data('idx', item.card_idx).attr('data-idx', item.card_idx)
			.data('favor', item.favor_yn).attr('data-favor', item.favor_yn);
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
		
		row.find('.card_order').val(item.card_order);
		row.find('.img_path').val(media_domain + item.img_path);
		
		if (item.front.indexOf('\n') > -1) {
			row.find('.card-top .text-normal').addClass('text-left');
		}
		if (item.front.length == 1) {
			row.find('.card-top .text-normal').html('<span class="lg" style="font-size: 80px; line-height: 50px;">' + item.front + '</span>');
		} else {
			row.find('.card-top .text-normal').html(item.front.replace(/\n/gi, '<br>'));
		}
		
		if (item.example_sentence == null || item.example_sentence.length == 0) {
			row.find('.card-top .text-example').html('<span style="color: #dfdfdf; border-bottom-width: 0px;">예문이 없는 카드입니다.</span>').addClass('text-center');
		} else {
			row.find('.card-top .text-example').css({'font-size': '24px', 'font-weight': 'normal', 'letter-spacing': '-0.7px'}).html(item.example_front.replace(/\n/gi, '<br>'));
		}
		
		if (item.img_path != null && item.img_path.length > 0) {
			row.find('.card-top').addClass('img');
			row.find('.card-top>div>div')
				.append('<span class="text-img learn-small-show"><img src="' + media_domain + item.img_path + '"></span>');
			row.find('.card-bottom').addClass('img');
			row.find('.card-bottom>div>div')
				.prepend('<span class="el-vertical img-span learn-small"><img src="' + media_domain + item.img_path + '"></span>')
				.append('<span class="text-img learn-small-show"><img src="' + media_domain + item.img_path + '"></span>');
		}
		
		if (item.audio_path != null && item.audio_path.length > 0 && item.audio_path != '0') {
			row.find('.icon-left .btn_audio').data('src', media_domain + item.audio_path).attr('data-src', media_domain + item.audio_path).append('<i class="cc vol_on"></i>');
			// row.find('.icon-left').append('<a class="btn-auto-play font-16 font-bold pos-relative" style="top: -3px;" data-toggle="tooltip" data-placement="right" title="오디오 자동 재생">AUTO</a>');
		}
		
		row.find('.icon-middle .btn_favor i').data('idx', item.card_idx).attr('data-idx', item.card_idx);
		if (item.favor_yn > 0) {
			row.find('.icon-middle .btn_favor i').addClass('star text-warning');
		} else {
			row.find('.icon-middle .btn_favor i').addClass('star_o');
		}
		
		row.find('.btn_know').data('idx', item.card_idx).attr('data-idx', item.card_idx);
		
		if (item.back.length == 1 && (item.example_sentence == null || item.example_sentence.length == 0)) {
			row.find('.card-bottom .text-normal').html('<span class="lg" style="font-size: 80px; line-height: 50px;">' + item.back + '</span>');
		} else {
			row.find('.card-bottom .text-normal').addClass('font-32').html(item.back.replace(/\n/gi, '<br>'));
		}
		
		if (item.back.indexOf('\n') > -1) {
			row.find('.card-bottom .text-normal').addClass('text-left');
		}
		
		if (show_type == '0') {
			if (item.example_sentence == null || item.example_sentence.length == 0) {
				row.find('.card-top .text-example').html(item.front.replace(/\n/gi, '<br>'));
			} else {
				row.find('.card-top .text-normal')
					.css('text-align', 'left')
					.append('<div class="exam_text" style="font-size: 24px; font-weight: normal; letter-spacing: -0.7px;">' + item.example.replace(/\n/gi, "<br>") + '</div>');
				row.find('.card-top .text-example').css({'font-size': '24px', 'font-weight': 'normal', 'letter-spacing': '-0.7px'}).html(item.example_front.replace(/\n/gi, '<br>'));
			}
		} else {
			if (item.example_sentence == null || item.example_sentence.length == 0) {
				row.find('.card-bottom .text-example').html(item.front.replace(/\n/gi, '<br>'));
			} else {
				row.find('.card-bottom .text-normal')
					.css('text-align', 'left')
					.append('<div class="exam_text" style="font-size: 24px; font-weight: normal; letter-spacing: -0.7px;">' + item.example.replace(/\n/gi, "<br>") + '</div>');
				row.find('.card-bottom .text-example').html(item.example_back.replace(/\n/gi, '<br>'));
			}
		}
		
		
		if (show_type == "0") {
			$top_html = $('.card-top', row).html();
			$bottom_html = $('.card-bottom', row).html();
			$('.card-top', row).html($bottom_html);
			$('.card-bottom', row).html($top_html);
			if (row.find('.card-top').find('.exam_text').length > 0) {
				row.find('.card-top').addClass('left');
			}
			
			console.log('###set sentence card1###', set_type, current_round);
			if (set_type == 5) {
				if (current_round > 0) {
					console.log('###set sentence card2###');
					row.find('.card-cover').addClass('hidden');
					
					var el = $('.card-bottom .text-normal', row);
/*
					var arr = el.text().toArray(' ');
*/
					var arr = item.front.toArray(' ');
					console.log(item.front, arr);
					
					var txt = '';
					$.each(arr, function (idx) {
						if (idx == 0) {
							// 첫단어도 blank로 나오도록 변경 (첫단어 나오려면 addClass="force" 처리)
							// txt += '<span class="sentence-word force">';
							txt += '<span class="sentence-word">';
						} else {
							txt += '<span class="sentence-word">';
						}
						
// 							console.log('sentence : ' + this);
						
						if (idx > 0) { txt += ' '; }
						txt += '<span class="items">' + this + '</span>';
						txt += '<span class="items">' + this + '</span>';
						txt += '</span>';
					});
					
					el.html(txt);
					console.log('##sentence##', 'setCard');
					setSentenceEvent(el.find('.sentence-word'), true);
				}
			}
		} else if (show_type == '2') {
			row.find('.card-top').addClass('example');
			row.find('.card-bottom').addClass('example');
			// row.find('.btn_audio').addClass('hidden');
			row.find('.btn-auto-play').addClass('hidden')
			row.find('.card-top').addClass('left');
		} else {		        
			if (row.find('.card-bottom').find('.exam_text').length > 0) {
				row.find('.card-bottom').addClass('left');
			}
		}

		if (set_type != 5 && show_type != '1') {
			console.log('###11###', '111');
			row.find('.btn_audio').addClass('disabled').tooltip('destroy');
		}
		
		slider.append(row);		
	});
	    
    // shuffle 기능 추가
    if ($('.is_shuffle').is(':checked')) {
	    $new = slider.children().clone();
	    slider.empty();
	    $new.sort(function() {return (Math.round(Math.random()) -.05)});
	    slider.append($new);
    }
	
	if (set_type == 5) {
		slider.find('.btn-auto-play').addClass('hidden');
	}
	if (is_auto_play == 1) {
	    slider.find('.btn-auto-play').addClass('active');
    }

    $('.btn_audio', slider).unbind('click').click(function(el) {
		$(document).click();

	    console.log('btn_audio click');
	    
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
		
		// 예문제시인데 예문이 없어도 알아요 체크할 수 있도록 주석처리한다.
        // if ($('.show_type:checked').val() == '2') {
	    //    	// 예문제시 - 예문없음이면 동작하지 않게 처리한다.
	    //     if (
		//         $card_box_current.find('.card-top .text-example').children().length > 0
		//         && $card_box_current.find('.card-top .text-example').children()[0].tagName == 'SPAN'
	    //     ) {
		//         return false;
	    //     }
        // }
        
        $card_idx = $card_box_current.data('idx');
        console.log(getLogTime(), $card_idx);
        $score = ($card_box_current.data('status') == 'k') ? -1 : 1;
        console.log(getLogTime(), $score);

		var card_all = arr_slide_data.find(function(obj) { return obj.card_idx == $card_box_current.data('idx'); });

		var send_section = (current_section > 999) ? 1 : current_section;
		setSendLog($card_idx, $score);

		if ($score == -1) {
            $card_box_current.data('status', '').attr('data-status', '');
            card_all.known_yn = -1;
			if (set_type == 5 && current_round > 0) {
				console.log('##sentence##', 'btn-know', true);
				setSentenceEvent($card_box_current.find('.sentence-word'), true);
			}
        } else {
	        console.log('@@setButtonSpace@@', 4);
			$('.bottom-btns').css({'opacity': 0, 'pointer-events': 'none'});
            $card_box_current.data('status', 'k').attr('data-status', 'k');
            card_all.known_yn = 1;
            
			if (set_type == 5 && current_round > 0) {
				console.log($card_box_current);
				console.log('##sentence##', 'btn-know', false);
				setSentenceEvent($card_box_current.find('.sentence-word'), false);
			}
        }
		showCardStatus($card_box_current);
		setButtonSpace();

		if (isAutoNextCard == true) {
		    if (
		    	(set_type == 1 && $('.show_type:checked').val() == 1 && $('.is_auto_play').is(':checked'))
		    ) {
			    console.log('btn_know');
			    playAudio(true);
		    } else {
			    if (nextCardTimeout != null) {
				    clearTimeout(nextCardTimeout);
				    nextCardTimeout = null;
			    }
			    nextCardTimeout = setTimeout(function() {
			        $('.btnNextCard').first().click();
		        }, 1000);
		    }
	    }

		if ($('body').hasClass('page-small') == true) {
			if (is_cover_down) {
				console.log('$$$$$$$$ coverDown 2');
			    coverDown(2000);
		    }
		    is_cover_down = true;
		} else {
			coverToggle();
		}
		
		is_action_know = true;
	    
	    e.preventDefault();
	    return false;
    });
    
    $('.btn_kown_o', slider).unbind('click').click(function(e) {
		$(document).click();

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
		$(document).click();

	    console.log(getLogTime(), 'btn_x click');
	    
	    var temp_btn = $(this).parent();
	    var idx = temp_btn.data('idx');
	    var card = slider.find('.CardItem[data-idx="' + idx + '"]');
	    card.data('status', 'k').attr('data-status', 'k');;
	    temp_btn.click();
	    
	    e.preventDefault();
	    return false;
	});
    
    $('.card-cover', slider).unbind('click').click(function(e) {
		$(document).click();
		// if ($('body').hasClass('page-small') == true) {
		// 	e.preventDefault();
		// 	return false;
		// }
		
		setTimeout(function() {
			console.log('$$$$$$$$ coverDown 3');
			coverDown();
		}, 200);
        e.preventDefault();
        return false;
    })
    .unbind('dblclick').dblclick(function(e) {
	    coverDel();
	    e.preventDefault();
    });
    
    $('.btn-auto-play').unbind('click').click(function(e) {
		$(document).click();

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
		animateCards();
		
		setAutoFont(slider.find('.CardItem.showing'));
		
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
	$('[data-toggle="tooltip"]').not('.disabled').tooltip({container: 'body'});
	
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

		if (slider.find('.CardItem').length > 0) { 
			$('.study-popup-guide').addClass('active');
		}
	}
	
	refreshProgress();
	
	setTimeout(function() {
		startCover();
		
		coverUp(false);
				
		animateCards();

		// if (is_embed==0) {
		// 	$('.custom-center-body').removeClass('hidden');
		// 	$('.custom-center-body #customer_btn').unbind('click').click(function(e) {
		// 		if (set_type == 1) {
		// 			$('#wordCardGuideModal').modal('show');
		// 		} else {
		// 			$('#sentenceCardGuideModal').modal('show');
		// 		}
				
		// 		e.preventDefault();
		// 		return false;
		// 	});
		// }
		is_data_loading = false;
	}, 500);
}

function showAllCard() {
	$('.btn-opt-scope').first().click();
}

function setAutoFont(el) {
	return false;
	var fill_height_top = el.find('.card-top').height();
	var fill_height_bottom = el.find('.card-bottom').height();
	var max_font = 35;
	var min_font = 11;
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
	
	console.log(getLogTime(), 'setAutoFont 1');
	console.log('##sentence##', 'destroy.dot');
	el.find('.card-top>div>div>div div').dotdotdot().trigger( 'destroy.dot' ).css({'height': ''});
	el.find('.card-bottom>div>div>div div').dotdotdot().trigger( 'destroy.dot' ).css({'height': ''});
	console.log(getLogTime(), 'setAutoFont 2');
	
	if (set_type == 5) {
		var top_rate = 0.6;
		var bottom_rate = 1.25;
		if ($('.show_type:checked').val() == '2') {
			el.find('.card-top>div>div>div').textfill({
				explicitHeight: fill_height_top,
				maxFontPixels: Math.floor(max_font_ex * top_rate),
				minFontPixels: min_font_ex,
				innerTag: 'div',
				is_force: true
			}).ccalign();
			console.log(getLogTime(), 'setAutoFont 3');
		} else {
			el.find('.card-top>div>div>div').textfill({
				explicitHeight: fill_height_top,
				maxFontPixels: Math.floor(max_font * top_rate),
				minFontPixels: min_font,
				innerTag: 'div',
				is_force: true
			}).ccalign();
			console.log(getLogTime(), 'setAutoFont 4');
		}
		el.find('.card-bottom>div>div>div').textfill({
			debug: true,
			explicitHeight: fill_height_bottom,
			maxFontPixels: Math.floor(max_font * bottom_rate),
			minFontPixels: min_font * bottom_rate,
			innerTag: 'div',
			is_force: true
		}).ccalign();
		console.log(getLogTime(), 'setAutoFont 5');
		el.find('.card-top>div>div>div div').css('height', '').dotdotdot({height: fill_height_top});
		el.find('.card-bottom>div>div>div div').css('height', '').dotdotdot({height: fill_height_bottom});
		console.log(getLogTime(), 'setAutoFont 6');
	} else {
		if ($('.show_type:checked').val() == '2') {
			el.find('.card-top>div>div>div').textfill({
				explicitHeight: fill_height_top,
				maxFontPixels: max_font_ex,
				minFontPixels: min_font_ex,
				innerTag: 'div',
				is_force: true
			}).ccalign();
			console.log(getLogTime(), 'setAutoFont 3');
		} else {
			el.find('.card-top>div>div>div').textfill({
				explicitHeight: fill_height_top,
				maxFontPixels: max_font,
				minFontPixels: min_font,
				innerTag: 'div',
				is_force: true
			}).ccalign();
			console.log(getLogTime(), 'setAutoFont 4');
		}
		el.find('.card-bottom>div>div>div').textfill({
			explicitHeight: fill_height_bottom,
			maxFontPixels: max_font,
			minFontPixels: min_font,
			innerTag: 'div',
			is_force: true
		}).ccalign();
		console.log(getLogTime(), 'setAutoFont 5');
		el.find('.card-top>div>div>div div').css('height', '').dotdotdot({height: fill_height_top});
		el.find('.card-bottom>div>div>div div').css('height', '').dotdotdot({height: fill_height_bottom});
		console.log(getLogTime(), 'setAutoFont 6');
	}	
}

var is_first_load = true;
var cur_idx = 0;
var audioTimer = null;
function animateCards() {
	stopAudio();

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
			setAutoFont($($cards.get(cur_idx)));
			
			console.log('###########################################', $($cards.get(cur_idx)));
		
			if ($($cards.get(cur_idx)).data('status') == 'k') {
				setButtonSpace();
				
				if (set_type == 5 && current_round > 0) {
					console.log('##sentence##', 'animateCards', false);
					setSentenceEvent($($cards.get(cur_idx)).find('.sentence-word'), false);
				}
			} else {
				setButtonSpace();
				
				if (set_type == 5 && current_round > 0) {
					console.log('##sentence##', 'animateCards', true);
					setSentenceEvent($($cards.get(cur_idx)).find('.sentence-word'), true);
				}
			}
			
			if ($('.show_type:checked').val() == '2') {
		       	// 예문제시 - 예문없음이면 알아요 버튼을 안보이게 한다.
		        if (
			        $($cards.get(cur_idx)).find('.card-top .text-example').children().length > 0
			        && $($cards.get(cur_idx)).find('.card-top .text-example').children()[0].tagName == 'SPAN'
		        ) {
	// 		        return false;
					console.log('%%%%%%%%%%%%%%%%%% btn-short-change-card hide hidden 2');
					// $('.btn-short-change-card').parent().addClass('hidden');
		        } else {
					$('.btn-short-change-card').parent().removeClass('hidden');
				}
	        } else {
				$('.btn-short-change-card').parent().removeClass('hidden');
			}
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
	    if (set_type == 1 && $('.is_auto_play').is(':checked') && $('.show_type:checked').val() == 1) {
		    console.log('onload auto');
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

var showCardStatusTimer = null;
function showCardStatus($el) {	
	// setTimeout(function() {
		if ($el.data('status') == 'k') {
			$el.addClass('correct');
			$el.addClass('active').removeClass('deactive');
		} else {
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
		
		// 맞았을때 애니메이션 처리
	    if ($el.hasClass('active') == true) {
		    var ani_el = $el.find('.card-top').first().clone();
		    ani_el.addClass('ani');
		    $el.first().append(ani_el);
		    setTimeout(function() {
			    ani_el.addClass('start');
			    setTimeout(function() {
				    $el.find('.card-top.ani').remove();
				    refreshProgress();
			    }, 610);
		    }, 10);
		    
	    } else {
		    $el.find('.card-top.ani').remove();
		    refreshProgress();
	    }
	}, 100);
}

var blockCover = false;
var isAutoNextCard = false;
var nextCardTimeout = null;

jQuery(function($){
    slider = $('#wrapper-learn .study-body');
    
    setSendLog(0, 0);
    
    $(audio)
    .bind('loadstart', function() {
		console.log(getLogTime(), 'audio loadstart');
		var ad = $('.btn_audio[data-src="' + $(this).attr('src') + '"]');
	    if (ad.length > 0) {
		    ad.removeClass('text-danger').addClass('text-success').find('i').addClass('fa fa-pause').removeClass('cc vol_on');
	    }
    })
    .bind('error', function() {
		console.log(getLogTime(), 'audio error');
		var ad = $('.btn_audio[data-src="' + $(this).attr('src') + '"]');
	    if (ad.length > 0) {
		    ad.addClass('text-danger').removeClass('text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
	    }
		
        console.log('isAutoNextCard : ' + isAutoNextCard);
        if (isAutoNextCard) {
	        if (nextCardTimeout != null) {
		        clearTimeout(nextCardTimeout);
		        nextCardTimeout = null;
	        }
	        nextCardTimeout = setTimeout(function() {
		        $('.btnNextCard').first().click();
	        }, 1000);
        }

        isAutoNextCard = false;
	})
	.bind('ended', function() {
		console.log(getLogTime(), 'audio ended');
		var ad = $('.btn_audio[data-src="' + $(this).attr('src') + '"]');
	    if (ad.length > 0) {
		    ad.removeClass('text-danger text-success').find('i').removeClass('fa fa-pause').addClass('cc vol_on');
	    }
        
        if (isAutoNextCard) {
            $('.btnNextCard').first().click();
        }

        isAutoNextCard = false;
	});

	$('.btn-cancle-know').click(function(e) {
		console.log('cancel..............');
		slider.find('.CardItem.current .btn_kown_x').first().click();

		e.preventDefault();
		return false;
	});

	$('.btn-cover-down').click(function(e) {
		$('.CardItem.current.showing .card-cover', slider).click();
		e.preventDefault();
		return false;
	});

	$('.btn-short-change-card').click(function(e) {
		if (document.onclick) { document.onclick(); }

		isAutoNextCard = true;
		slider.find('.CardItem.current .btn_kown_o').first().click();

		e.preventDefault();
		return false;
	});

	$('.btn-short-change-next').click(function(e) {
		if (document.onclick) { document.onclick(); }

		coverUp();
        $('.btnNextCard').first().click();

		e.preventDefault();
		return false;
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
		setUserPref('learn_shuffle', (this.checked ? 1 : 0));

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
		if (document.onclick) { document.onclick(); }
		
	    if (nextCardTimeout != null) {
	        clearTimeout(nextCardTimeout);
	        nextCardTimeout = null;
        }
        isAutoNextCard = false;
		console.log(getLogTime(), 'btnPrevCard Click');
		coverUp();
		
		if (cur_idx == 0) {
			return false;
		}
		
		if ($('.tooltip').length > 0) {
			$('.btn_audio').tooltip('hide');
		}

		cur_idx--;
		animateCards();
// 		setAutoFont(slider.find('.CardItem.showing'));
		e.preventDefault();
		return false;
	});

	$('.btnNextCard').click(function(e) {
		if (document.onclick) { document.onclick(); }

		if (nextCardTimeout != null) {
	        clearTimeout(nextCardTimeout);
	        nextCardTimeout = null;
        }
        isAutoNextCard = false;
		console.log(getLogTime(), 'btnNextCard Click');
		coverUp();

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
		
// 		setAutoFont(slider.find('.CardItem.showing'));
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

	// 2016.01.22 차후 동영상 가이드로 대체하므로 가이드 팝업 제거처리
/*
    if ($('.learn-guide').data('init') == '1' && set_type != 3) {
        $('.learn-guide').removeClass('hidden');
        guide_timer = setTimeout(function(){
            $('.learn-guide').addClass('hidden');
            $('.learn-guide').data('init', '0');
            setRound(true);
        }, 3000);
    } 
    else 
*/
    {
        $('.learn-guide').addClass('hidden');
        // 암기학습 최초진입이 아닌 경우 토스트 표시 없음.
        setRound();
    }

    $('.learn-guide').click(function() {
        console.log(getLogTime(), 'learn-guide click');
        clearTimeout(guide_timer);
        $('.learn-guide').addClass('hidden');
        $('.learn-guide').data('init', '0');
        setRound();
    });

    $('.learn-nav-help').click(function() {
        $('.learn-guide').removeClass('hidden');
        clearTimeout(guide_timer);
        guide_timer = setTimeout(function(){
            $('.learn-guide').addClass('hidden');
            $('.learn-guide').data('init', '0');
        }, 3000);
    });
    
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
	
	$('#wrapper-learn').unbind('click').click(function(e) {
		console.log('document click');
		
		// console.log('$$$$$$$$ cover click 1');
		// $('.CardItem.current.showing .card-cover', slider).click();;
		// e.preventDefault();
		// return false;
	});

	$('.is_pro_mode').change(function(e) {
		if (this.checked) {
			$('#wrapper-learn .study-bottom').addClass('hidden');
		} else {
			$('#wrapper-learn .study-bottom').removeClass('hidden');
		}
	});
	
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

		if (document.onclick) { document.onclick(); }

		if (e.keyCode === 39 || e.keyCode === 34) {             // right arrow : next button
			if (is_prevnext) {
				coverUp();
				$('.btnNextCard').first().click();
				e.preventDefault();
			}
		} else if (e.keyCode === 37 || e.keyCode === 33) {      // left arrow : previous button
			if (is_prevnext) {
				coverUp();
				$('.btnPrevCard').first().click();
				e.preventDefault();
			}
        } else if (e.keyCode === 38) {      // up arrow : cover up
            coverUp();
            e.preventDefault();
        } else if (e.keyCode === 13) {
			if ($('.btn-short-change-card').closest('.study-bottom').hasClass('down') == true) {
				$('.btn-short-change-card').first().click();
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
			if ($('.btn-cover-down').parent().css('display') != 'none') {
				$('.btn-cover-down').first().click();
			} else if ($('.btn-short-change-next').parent().css('display') != 'none') {
				$('.btn-short-change-next').first().click();
			}
            e.preventDefault();
        } else if (e.keyCode === 40) {		// down arrow : cover down
	        coverDown();
	        e.preventDefault();
        } else if (e.keyCode === 69) {		// e key : Eidt button
	        $('.btn-opt-edit').click();
	        e.preventDefault();
		} else if (e.keyCode === 46) {
			coverDel();
		}
	});
});