var crash = {
	set_type: 1,
	total_score: 0,
	send_data: [],
	speed: 1,
	is_hurry: false,
	play_timeout: 1000 / 20,
	is_pause: false,
	show_time: 0,
	pause_time: 0,
	show_delay: 10000,
	show_type: 1,		// 0:단어제시, 1:의미제시
	loop_timer: null,
	game_body: null,
	all_body: null,
	score_body: null,
	progress_body: null,
	all_cnt: 0,
	audio: new Audio(),
	
	
	init: function(set_type) {
		this.pause();
		
		this.game_body = $('.crash-body');
		this.all_body = $('#slider_all');
		this.score_body = $('#score');
		this.progress_body = $('#progress');
		this.set_type = set_type;
		this.total_score = 0;
		this.send_data = [];
		if (set_type == 5) {
			this.speed = 0.333;
		} else {
			this.speed = 1;
		}
		this.is_hurry = false;
		this.is_pause = false;
		this.show_time = 0;
		this.pause_time = 0;
// 		this.all_cnt = $('.crash-item', this.all_body).length;
		this.score_body.text(0);
		this.progress_body.text(this.all_cnt);
	},
	
	start: function(set_type) {
		this.init(set_type);
		
		// 출력된 문제들을 모두 지운다.
		$('.crash-item', this.game_body).remove();
		
		// 데이터에 있는 모든 문제를 처음부터 풀수 있도록 초기화 한다.
		$('.crash-item', this.all_body).data('status', 'r');
		
		this.loop_timer = setInterval(function() {
            crash.loop();
        }, this.play_timeout);
		this.is_pause = false;
	},
	
	add: function() {
		var play_item_cnt = $('.crash-item', this.game_body).length;
		var end_item_cnt = 0;
		$('.crash-item', this.all_body).each(function() {
			$obj = $(this);
			if ($obj.data('status') == 'e') {
				end_item_cnt++
			}
		});
		if (this.all_cnt <= (play_item_cnt + end_item_cnt)) {
			return;
		}
		
		// 새로운 아이템을 추가한 시간 기록
		this.show_time = (new Date).getTime();
		
		// 출력이 가능한 아이템을 모두 찾기
		$all_items = [];
		$('.crash-item', this.all_body).sort(function() {return (Math.round(Math.random()) -.05)}).each(function() {
			$obj = $(this);
			if ($obj.data('status') == 'r') {
				$all_items.push(this);
			}
		});
		
		// 출력할 아이템이 없을 경우 취소처리
		if ($all_items.length == 0) {
			return;
		}
		
		// 첫번째 아이템을 게임상에 등록
		$insert = $($all_items[0]);
		$insert.data('status', 's');
		this.game_body.append($insert.clone());
		
		// 게임상의 모든 아이템 찾기
		$game_items = $('.crash-item', this.game_body);
		
		// 현재 추가한 아이템의 x, y 좌표 세팅 및 제시어 세팅
		if ($game_items.length ==  0) {
			return;
		}
		$cur_item = $($game_items[$game_items.length - 1]);
// 		$cur_item.find('.crash-answer').addClass('hidden');
		
		$('.item-front', $cur_item).dotdotdot().trigger( 'destroy.dot' );
		$('.item-back', $cur_item).dotdotdot().trigger( 'destroy.dot' );
		console.log(this.show_type);
		if (this.show_type == 0) {
			$('.item-front', $cur_item).removeClass('hidden');
			$('.item-front', $cur_item).dotdotdot();
			$('.item-back', $cur_item).addClass('hidden');
			$('.item-answer-front', $cur_item).addClass('hidden');
			$('.item-answer-back', $cur_item).removeClass('hidden');
		} else {
			$('.item-front', $cur_item).addClass('hidden');
			$('.item-back', $cur_item).removeClass('hidden');
			$('.item-back', $cur_item).dotdotdot();
			$('.item-answer-front', $cur_item).removeClass('hidden');
			$('.item-answer-back', $cur_item).addClass('hidden');
		}
		var left_pos = Math.floor(Math.random() * (this.game_body.width() - $cur_item.outerWidth(true)));
		$cur_item.css({'left': left_pos, 'top': 0}).data('l', left_pos).data('w', $cur_item.outerWidth(true));
	},
	
	pause: function() {
		if (this.loop_timer) {
			console.log('loop_timer clear');
			this.pause_time = (new Date).getTime();
			clearInterval(this.loop_timer);
			this.loop_timer = null;
			this.is_pause = true;
		}
	},
	
	resume: function() {
		this.pause();
		
		console.log(this.pause_time);
		if (this.pause_time > 0) {
			this.show_time += ((new Date).getTime() - this.pause_time);
		}
		this.pause_time = 0;
		
		this.loop_timer = setInterval(function() {
            crash.loop();
        }, this.play_timeout);
		this.is_pause = false;
	},
	
	move: function() {
		var game_height = this.game_body.height();
		var game_width = this.game_body.width();
		var speed = this.speed;
		
		// 게임상의 모든 아이템의 위치 이동 처리
		$('.crash-item', this.game_body).each(function() {
			$obj = $(this);
			
			// 반응형 웹을 지원하도록 left를 조정한다.
			var ori_left = $obj.data('l');
			var max_left = game_width - $obj.data('w');
			var cur_left = ori_left;
			if (max_left < ori_left) {
				cur_left = max_left;
			}
			
			// 바닥에서 5초동안 머무는 아이템은 스킵처리
			if ($obj.data('status') == 'h') {
				$obj.css({'left': cur_left});
				return;
			}
			
			// 정답이 입력된 아이템은 스킵처리
			if ($obj.data('move') == '0') {
				return;
			}
			
			var next_top = $obj.position().top + speed;
			var max_top = game_height - ($obj.height() + 16);
			if (max_top < next_top) {
				next_top = max_top;
			}
			
			$obj.css({'top': next_top, 'left': cur_left});
			
			if (next_top == max_top) {
				// 정답을 보여준다.
				// console.log($obj);
				
				// 바닥에 도착하면 5초가 머물고 사라진다.
				$obj.data('status', 'h').addClass('show');
// 				$obj.find('.crash-answer').removeClass('hidden');
				$obj.stop();
				$obj.animate({opacity: 0.5}, 500).animate({opacity: 1}, 500)
					.animate({opacity: 0.5}, 500).animate({opacity: 1}, 500)
					.animate({opacity: 0.5}, 500).animate({opacity: 1}, 500)
					.animate({opacity: 0.5}, 500).animate({opacity: 1}, 500)
					.animate({opacity: 0.5}, 500).animate({opacity: 1}, 500)
					.animate({opacity: 0.5}, 500).animate({opacity: 1}, 500)
					.animate({opacity: 0.5}, 500).animate({opacity: 1}, 500, null, function() {
						crash.remove_item(this, true);
					});
			}
		});
	},
	
	remove_item: function(el, is_end) {
		$item = $(el);
					
		// 데이터 갱신
		$re = $('.crash-item[data-idx="' + $item.data('idx') + '"]', crash.all_body);
		$re.data('status', 'e');
// 		console.log($re);
		console.log($item.position().top);
		
		// 점수 계산
		if (is_end) {
			crash.set_score(-1, $item);
		} else {
			crash.set_score($item.position().top, $item);
		}
		
		// 해당 아이템 삭제
		$item.remove();
	},
	
	check: function(user_answer) {
		// 게임상의 모든 아이템의 정답 체크
		var is_cap = false;
// 		$('.crash-item', this.game_body).removeClass('hint');
		$('.crash-item', this.game_body).each(function() {
			$obj = $(this);
			
			// 이동이 정지된 상태이면 스킵한다. (애니메이션 중으로 인식)
			if ($obj.data('move') == '0') {
				return;
			}
			
			var answer = '';
			var user = user_answer.trim();
			if (crash.show_type == 0) {
				answer = $('.item-back', $obj).text().trim();
			} else {
				answer = $('.item-front', $obj).text().trim();
			}
			
			// console.log('user : ' + user + ', answer : ' + answer);
			
			if (checkAnswer(user, answer, false, true, false, (set_type == 2))) {
				$obj.addClass('active');
				$obj.data('move', '0');
				
				for (var i = 0; i < 20; i++) {
					$obj.stop();
				}
				// 오디오가 있으면 재생
				if ($obj.data('audio').length > 0) {
					crash.play_audio($obj.data('audio'));
				}

				var cur_score = crash.get_score($(this).position().top, $(this));
				if (cur_score == 20) {
					$('.crash-lv-bg.lv1').addClass('score');
				} else if (cur_score == 15) {
					$('.crash-lv-bg.lv2').addClass('score');
				} else if (cur_score == 10) {
					$('.crash-lv-bg.lv3').addClass('score');
				}
				$obj.animate({
					opacity: 0
				}, 1000, 'swing', function() {
					$('.crash-lv-bg').removeClass('score');
					crash.remove_item(this, false);
				});
			} else if (checkAnswer(user, answer, true, true, false, (set_type == 2))) {
				is_cap = true;
				var cap_div = document.createElement('div');
				$cap_div = $(cap_div);
				$cap_div.addClass('show-score');
				$cap_div.text('대소문자 구분이 틀렸어요!');
				$cap_div.addClass('text-danger');
				$cap_div.css({'font-size': '25px'});
				crash.game_body.append($cap_div);
				
				$cap_div.delay(800).animate({
					top: $cap_div.position().top - 40, opacity: 0
				}, 300, 'swing', function() {
					$(this).remove();
				});
			} else if (user.length > 1) {
				var arr = answer.split(user);
				var hint = '';
				if (arr.length > 1) {
					is_cap = true;
					for (var i = 0; i < arr.length; i++) {
						if (i > 0) {
							hint += user;
						}
						
						for (var j = 0; j < arr[i].length; j++) {
							if (arr[i].charAt(j) == ' ' || arr[i].charAt(j) == ',' || arr[i].charAt(j) == '.') {
								hint += arr[i].charAt(j);
							} else {
								hint += '☐';
							}
						}
					}
					
					console.log('hint ------------- ', hint);
					$obj.addClass('hint').find('.crash-hint').text(hint);
				}
			} else {
				$(this).removeClass('hint');
			}
		});
		return is_cap;
	},

	get_score: function(pos_top, $obj) {
		var score = 0;
		var game_height = this.game_body.height();
		var max_top = game_height - ($obj.height() + 16);
		
		console.log('max_top : ' + max_top + ', pos_top : ' + pos_top + ', data : ' + $obj.data('status'));
		
		if (pos_top < 0) {
			score = -5;
		} else if (pos_top < (game_height * 1 / 3)) {
			score = 20;
		} else if (pos_top < (game_height * 2 / 3)) {
			score = 15;
		} else if (pos_top == max_top || $obj.data('status') == 'h') {
			score = 5;
		} else {
			score = 10;
		}
		return score;
	},
	
	set_score: function(pos_top, $obj) {
		var score = this.get_score(pos_top, $obj);

		if (score < 0) { this.send_data.push(ggk.d(score * -1, 0)); } else { this.send_data.push(ggk.d(score, 1)); }

		this.total_score += score;
		if (this.total_score < 0) {
			this.total_score = 0;
		}
		
// 		console.log('score : ' + score);
		if (score < 10) {
			var score_div = document.createElement('div');
			$score_item = $(score_div);
			$score_item.addClass('show-score');
			$score_item.text(score);
			if (score > 0) {
				$score_item.addClass('text-info');
			} else {
				$score_item.addClass('text-danger');
			}
			$score_item.css({'left': $obj.position().left, 'top': $obj.position().top, 'right': 'auto'});
			this.game_body.append($score_item);

			$score_item.animate({
				top: $score_item.position().top - 40, opacity: 0
			}, 600, 'swing', function() {
				// $(this).remove();
				crash.check_game();
			});
		} else {
			crash.check_game();
		}
	},
	
	check_game: function() {
		// 종료된 아이템을 모두 찾기
		$end_items = [];
		$('.crash-item', this.all_body).each(function() {
			$obj = $(this);
			if ($obj.data('status') == 'e') {
				$end_items.push(this);
			}
		});
		
		this.score_body.text(this.total_score);
		this.progress_body.text(this.all_cnt - $end_items.length);
		
		if (this.all_cnt <= $end_items.length) {
			this.game_over();
		} else if ((this.all_cnt * 2 / 3) < $end_items.length && this.is_hurry == false) {
			this.is_hurry = true;
			this.pause();
			
			if (this.set_type == 5) {
				this.speed = 0.666;
			} else {
				this.speed = 1.1;
			}
			this.show_delay = 6000;
			
			var hurry_div = document.createElement('div');
			$huryy_item = $(hurry_div);
			$huryy_item.addClass('show-score');
			$huryy_item.text('Hurry Up !!!!');
			$huryy_item.addClass('text-danger');
			this.game_body.append($huryy_item);
			
			$huryy_item.delay(1000).animate({
				top: $huryy_item.position().top - 40, opacity: 0
			}, 500, 'swing', function() {
				$(this).remove();
				crash.resume();
			});
		}
	},
	
	game_over: function() {
		console.log('game over.......');
		
		$('#btn_end').click();
		
		this.pause();
	},
		
	loop: function() {
// 		console.log($('.crash-item', this.game_body).length);
		// 최근 등록한 아이템과 시간차가 show_delay 값을 넘으면 새로운 아이템 등록 처리
		if (((new Date).getTime() - this.show_time) > this.show_delay || $('.crash-item', this.game_body).length == 0) {
			this.add();
		}
		
		this.move();
	},
	
	play_audio: function(src) {
		this.audio.pause();
		this.audio.src = src;
        this.audio.load();
        this.audio.play();
	}
};

var current_score = 0;
function sendScore(is_first) {
	if (is_first) {
		current_score = crash.total_score;
		getRank(is_first, false);
	} else {
		current_score = crash.total_score;
		$data = {set_idx:set_idx, arr_key:ggk.a(), arr_score:crash.send_data, activity:5, tid:tid};
		// $data = {set_idx:set_idx, score:crash.total_score, activity:5, tid:tid};

	    jQuery.ajax({
	        url: "/Match/save",
	        global: false,
	        type: "POST",
	        data: $data,
	        dataType: "json",
	        async: true,
	        success: function(data) {
	            console.log(data);
	            if (data.result == 'ok') {
					if (data.tid !== undefined) {
						tid = data.tid;
					}

		            if (is_skip == 1) {
			            if (is_teacher) {
			            	showRankPopup(0, class_idx, set_idx, 5, 10, current_score);
			            } else {
				            showRankPopup(c_u, class_idx, set_idx, 5, 10, current_score);
			            }
		            } else {
			            getRank(is_first, false);
		            }
	            } else {
					showAlert('오류', data.msg);
				}
	        },
	        error: function(response, textStatus, errorThrown) {
	            console.log('response : ' + response);
	        }
	    });
	}
}

function sendPlayScore(user_name) {
	$data = {set_idx:set_idx, score:crash.total_score, activity:5, class_idx:class_idx, user_name:user_name, tid:tid};

    console.log($data);

    jQuery.ajax({
        url: "/Match/save",
        global: false,
        type: "POST",
        data: $data,
        dataType: "json",
        async: true,
        success: function(data) {
            console.log(data);
            if (data.result == 'ok') {
				if (data.tid !== undefined) {
					tid = data.tid;
				}
				
                getRank(false, true);
            }
        },
        error: function(response, textStatus, errorThrown) {
            console.log('response : ' + response);
        }
    });
}

var server_score = -1;
function getRank(is_first, is_end_play) {
	current_score = crash.total_score;
	if (is_class) {
		$data = {set_idx:set_idx, activity:5, class_idx:class_idx};
	} else {
		$data = {set_idx:set_idx, activity:5};
	}

    jQuery.ajax({
        url: "/Match/rank",
        global: false,
        type: "POST",
        data: $data,
        dataType: "json",
        async: true,
        success: function(data) {
            console.log(data);
            if (data.result == 'ok') {
	            if (is_first) {
		            for (var i = 0; i < data.msg.length; i++) {
			            var row = data.msg[i];
			            if (row.is_me == 1) {
				            server_score = eval(row.score);
				            break;
			            }
					}
					sendScore(false);
	            } else {
		            setRankModal2(data.msg, is_end_play);
	            }
            }
        },
        error: function(response, textStatus, errorThrown) {
            console.log('response : ' + response);
        }
    });
}

function setRankModal(arr, is_end_play) {
	$modal = $('#sectionEndModal');
	
	// console.log(arr);
	
	$('table', $modal).empty();
	$('table', $modal).parent().css({height: 240});
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
		
		if (row.profile_img != null && row.profile_img.length > 0) {
			tr += '<td class="text-right" width="50"><img class="img-circle" src="' + row.profile_img + '" width="35" height="35" /></td>';
		} else {
			tr += '<td class="text-right" width="50"><img class="img-circle" src="/images/default_photo.png" width="35" height="35" /></td>';
		}
        tr += '<td class="text-center text-warning" width="40">' + row.rank + '</td>';
        tr += '<td>' + row.user_name + '</td>';
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
    
    $('.btn-studyend-restart', $modal).removeClass('hidden').unbind('click').click(function() {
	    $('.btn-start').click();
    });
    
//     console.log(server_score, user_score, is_first);
    if (user_name.length > 0) {
	    if (server_score == -1) {
			$('.study-end-info div', $modal).text('첫 도전을 축하드립니다. 1등에 도전해 보세요.');
		} else if (is_first) {
			$('.study-end-info div', $modal).text('축하합니다. ' + user_name + '님이 새로운 1등 이예요.');
		} else if (server_score > user_score) {
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
		    
			$('.play-end-info', $modal).find('.play-score').text(crash.total_score);
			$('.btn-studyend-restart', $modal).addClass('hidden');
			
			$modal.find('.btn-send-score').unbind('click').click(function(e) {
				if (isEmpty($modal.find('[name="user_name"]').val())) {
					showAlert('이름을 입력하세요.');
					return;
				}
				
				sendPlayScore($modal.find('[name="user_name"]').val());
			});
			$modal.find('.btn-pass-score').unbind('click').click(function(e) {
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
	$modal.find('.title').text('TOP CRASH PLAYER');
	
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
        
        tr.find('.btn-send-score').unbind('click').click(function(e) {
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
	
	// console.log(is_empty_rank);
	
	for (var i = 0; i < arr.length; i++) {
		var row = arr[i];
		
		if (is_class && is_end_play == false && is_empty_rank == false && current_score >= row.score) {
			var tr = $modal.find('.template .game-result-row').clone();
        
	        tr.addClass('me');
			tr.find('.game-result-img').attr('src', '/images/default_photo.png');
			tr.find('.num').text(row.rank);
			tr.find('.name').html('<div class="input-group"><input type="text" class="form-control input-sm" name="user_name" placeholder="이름을 입력하세요"><span class="input-group-btn"><a class="btn-send-score btn btn-info btn-sm">저장</a></span></div>');
			
			tr.find('.score').text(current_score);
	
	        $('.rank-list', $modal).append(tr);
	        is_empty_rank = true;
	        
	        tr.find('.btn-send-score').unbind('click').click(function(e) {
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
		
		tr.find('.score').text(row.score);

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
        
        tr.find('.btn-send-score').unbind('click').click(function(e) {
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
    $('.btn-studyend-restart', $modal).unbind('click').click(function() {
// 	    initQuestion(true);
		$('.btn-start').click();
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
	    console.log(is_end_play);
	    if (is_end_play) {
		    $('.play-end-info', $modal).addClass('hidden');
	    }
	    
	    console.log(is_class);
	    console.log(document.referrer);
	    if (is_class && is_end_play == false) {
/*
		    $('.play-end-info', $modal).removeClass('hidden');
		    
			$('.play-end-info', $modal).find('.play-score').text(crash.total_score);
			
			$modal.find('.btn-send-score').unbind('click').click(function(e) {
				if (isEmpty($modal.find('[name="user_name"]').val())) {
					showAlert('이름을 입력하세요.');
					return;
				}
				
				sendPlayScore($modal.find('[name="user_name"]').val());
				$modal.find('[name="user_name"]').val('');
			});
			$modal.find('.btn-pass-score').unbind('click').click(function(e) {
				sendPlayScore('이름 없음');
				$modal.find('[name="user_name"]').val('');
			});
*/
			
// 	    } else if (document.referrer.length == 0 || document.referrer.indexOf('/Embeded') > -1 || document.referrer.indexOf('/set') > -1) {
		} else if (eval(c_u) == 0) {
		    $('.login-info', $modal).removeClass('hidden');
	    }
    }
    
    $('#sectionEndModal2').css({'display': 'block'});
	$('#sectionEndModal2').modal({
		backdrop: 'static'
	});
    $('#sectionEndModal2').modal('show');
    
    if ($modal.find('[name="user_name"]').length > 0) {
	    setTimeout(function() {
		    $modal.find('[name="user_name"]').focus();
	    }, 500);
    }
}

function isEmpty(val) {
    console.log(val);
    if (val == null || typeof val == 'undefind' || val.trim().length < 1) {
        return true;
    }
    return false;
}

let q = false;
function setStart() {
	if(q) location.reload();
    q = true;
    crash.all_cnt = max_card_cnt;
	crash.pause();
	crash.start(set_type);
	crash.pause();
    $('.user-answer').focus();
}

jQuery(function($){
	setStart();

	$('#btn_end').click(function(e) {
        $('.section-end-title').text('크래쉬타임 스코어보드');
        $('.section-end-title').removeClass('hidden');
        
        crash.pause();
        if (is_class && is_skip != 1) {
	        getRank(false, false);
        } else {
	        if (is_skip == 1) {
		        sendScore(false);
	        } else {
		        sendScore(true);
	        }
        }
		
        e.preventDefault();
    });
    	
	$('.btn-crash-pause').click(function(e) {
		$(this).find('i').removeClass('fa-pause fa-play');
		if (crash.is_pause == true) {
			crash.resume();
			$(this).find('i').addClass('fa-pause');
		} else {
			crash.pause();
			$(this).find('i').addClass('fa-play');
		}
	});

	$('.btn-crash-replay').click(function(e) {
		location.reload();
	});
	
    $('.btn-answer').click(function(e) {
	    $user_answer = $('.user-answer');
	    console.log('btn-answer click  111');
	    if (crash.check($user_answer.val())) {
		    $user_answer.focus();
	    } else {
		    $user_answer.val('');
		    $user_answer.focus();
			$user_answer.select();
	    }
    });
    
    $('.user-answer').keydown(function(e) {
	    if (e.keyCode === 13) {
		    $('.btn-answer').first().click();
	    }
    });
});