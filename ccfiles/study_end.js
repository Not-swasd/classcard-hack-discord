function setRound() {
	console.log(getLogTime(), 'start setRound');
	
	var round_text = '';
	if (current_round == 1) {
		round_text = (current_section % 4000 == 0) ? '<i class="cc star"></i> 표시' : (current_section % 1000 == 0) ? '전체구간' : '제 ' + current_section+'구간';
		round_text += ' <span class="font-64 font-bold">' + getCardCnt(false) + '</span> 카드 학습 시작';
	} else {
		round_text = (current_section % 4000 == 0) ? '<i class="cc star"></i> 표시' : (current_section % 1000 == 0) ? '전체구간' : '모르는 카드';
		round_text += ' <span class="font-64 font-bold">' + getCardCnt(false) + ' </span> 개 다시 학습';
	}
	$('.round-text').html(round_text);
	$('.round-body').addClass('active');
	$('#wrapper-learn .study-body').empty();

	round_text = (current_section % 4000 == 0) ? '<i class="cc star text-warning"></i> 표시' : (current_section % 1000 == 0) ? '전체구간' : '제 ' + current_section+'구간';
	$('.step.step1 .study-end-text').html(round_text + ' ' + getCardCnt(false) + ' 카드');
	$('.step.step2 .study-end-text').html(round_text + ' ' + getCardCnt(true) + ' 카드');

	round_text = (current_section % 4000 == 0) ? '<i class="cc star text-warning"></i> 표시 카드' : (current_section % 1000 == 0) ? '전체구간' : current_section+'구간';
	$('.btn-reset-section').html(round_text + ' 새로 학습하기');
	if (current_section % 4000 == 0) {
		$('.btn-reset-section').parent().removeClass('hidden');
	}
	
	setTimeout(function() {
		$('.round-body').removeClass('active');
		console.log(getLogTime(), 'start card');
		setCard();
	}, 1000);
}

function showStudyEnd() {
	console.log('end3', document.onclick);
	if (document.onclick) { console.log('end4'); document.onclick(); }

	console.log(getLogTime(), 'end - sec : ' + current_section);
        
	if (audioTimer != null) {
		clearTimeout(audioTimer);
		audioTimer = null;
	}

	var total_count = slider.find('.CardItem').length;
	var known_count = slider.find('.CardItem[data-status="k"]').length;
	var is_show_end = true;
	var is_repeat = false;

	if (total_count == known_count) {
		// 현재구간의 카드를 모두 알았을 때 처리
		setStudyEnd(2);

		var correct_data = study_data.filter(function(obj) { return obj.known_yn == 1; });
		var unknow_data = study_data.filter(function(obj) { return obj.known_yn != 1; });

		// 모두 완료했으면 반복화면(200%, 300% 반복)으로 이동
		if (correct_data.length == study_data.length && unknow_data.length == 0) {
			$('#study_end .current-repeat-percent').text((repeat_cnt + 1) * 100);
			$('#study_end .next-repeat-percent').text((repeat_cnt + 2) * 100);
			setStudyEnd(3);
			is_repeat = true;

			// 모두 아는 카드이고 북마크가 아닌 상태에서
			// 구간수가 1개 이면 바로 반복화면으로 이동 한다.
		} else if (current_section % 4000 != 0) {
			if ((section_size >= study_data.length) || current_section % 1000 == 0) {
				$('#study_end .current-repeat-percent').text((repeat_cnt + 1) * 100);
				$('#study_end .next-repeat-percent').text((repeat_cnt + 2) * 100);
				setStudyEnd(3);
				is_repeat = true;
			}
		}
	} else {
		if (study_data.length == 0) {
			// 현재 구간에서 모르는 카드가 있을 경우 처리
			setStudyEnd(1);
		} else {
			is_show_end = false;
			setCard();
		}
	}

	if (is_show_end) {
		$('#study_end').addClass('active');
	}

	if (is_repeat == true) {
		if (typeof resetAllLog == 'function') {
			resetAllLog(false);
		}
	} else {
		sendLearnAll();
	}
}

// 1: 모르는 카드가 있는 결과 화면
// 2: 현재 구간 완료 화면
// 3: 세트 완료 화면 (반복 학습)
function setStudyEnd(val) {
	$('#study_end .step').addClass('hidden');
	$('#study_end .step' + val).removeClass('hidden');

	if (val == 1) {
		$('.study-end').addClass('active');
		if (typeof reloadADS == 'function') {
			reloadADS();
		}
		// setTimeout(function() {
		// 	var ads = $('#study_end .step1 .adsbygoogle');
		// 	if (ads.length > 0) {
		// 		$('#study_end .step1 .study-top').css('height', 110);
		// 		ads.empty().data('adsbygoogle-status', '').attr('data-adsbygoogle-status', '').css('height', 90);
		// 		(adsbygoogle = window.adsbygoogle || []).push({});
		// 		$('.adsbygoogle').append('<div class="upgrade-box" onclick="showAlert(\'안내 페이지로 이동\');"><div class="cc-table fill-parent middle"><div>학생들의<br>광고를<br>제거해<br>주세요</div></div></div>');
		// 	}
		// }, 100);
	} else {
		$('.study-end').removeClass('active');
	}
}

function hideStudyEnd() {
	$('#study_end').removeClass('active');
	$('.study-end').removeClass('active');
	setRound();
}

function setStudyEndRepeat() {
	if (typeof resetAllLog == 'function') {
		resetAllLog(true);
	}
}

jQuery(function($){
    $('#study_end .btn-study-end-unknow').click(function(e) {
		current_round += 1;

		// 모든 카드 보기로 되어 있으면 모르는 카드만으로 변경 해야 한다.
		if ($('.selScope').is(':checked')) {
			$('.selScope').prop('checked', false);
		}

		if (typeof hideStudyEnd == 'function') {
			hideStudyEnd();
		}

		e.preventDefault();
		return false;
	});

	$('#study_end .btn-reset-section').click(function(e) {
		var round_text = (current_section % 4000 == 0) ? '<i class="cc star text-warning"></i> 표시한' : (current_section % 1000 == 0) ? '전체구간' : current_section+'구간';
		// showConfirm(round_text + ' 카드를 모르는 카드로 변경하여<br>다시 학습합니다.', null, null, deleteLog, null, true, '취소', '새로학습');
		var msg = round_text + ' ' + getCardCnt(true) + '개 카드는 모두 아는 카드입니다. 모르는 카드로 변경하고 다시 학습할까요?';
		showConfirm('현재 구간 새로 학습', msg, deleteLog, null, null, true, '다시 학습하기', '취소', null, null, null, null, null, 'btn-danger');

		e.preventDefault();
		return false;
	})

	$('#study_end .btn-study-end-repeat').click(function(e) {
		// showConfirm(((repeat_cnt + 1) * 100)+'% 도전을 1구간부터 시작 하시겠습니까?', null, setStudyEndRepeat, null, null, null, ((repeat_cnt + 1) * 100)+'% 도전', '아니요');

		setStudyEndRepeat();
    
		e.preventDefault();
		return false;
	});

	// 현재구간 모르는 카드가 있는 경우에서 다음구간 이동 할때
	$('#study_end .btn-study-end-next-section1').click(function(e) {
		var correct_data = study_data.filter(function(obj) { return obj.known_yn == 1; });
		var unknow_data = study_data.filter(function(obj) { return obj.known_yn != 1; });

		// 모두 완료했으면 반복화면(200%, 300% 반복)으로 이동
		if (correct_data.length == study_data.length && unknow_data.length == 0) {
			$('#study_end .current-repeat-percent').text((repeat_cnt + 1) * 100);
			$('#study_end .next-repeat-percent').text((repeat_cnt + 2) * 100);
			setStudyEnd(3);
			if (typeof resetAllLog == 'function') {
				resetAllLog(false);
			}
		} else {
			var next_data = study_data.filter(function(obj) { return obj.section_num === (current_section + 1); });

			// 지금이 마지막 구간일때
			// 모르는 카드가 있는 경우 해당 구간으로 이동
			if (next_data.length == 0) {
				current_round = 1;
				current_section = unknow_data[0].section_num;
				hideStudyEnd();
			} 
			// 마지막 구간이 아니면
			// 기본적으로 다음구간으로 이동
			// 다음 구간도 완료상태면 그 다음 구간으로 이동
			else {
				for (i = 0; i < unknow_data.length; i++) {
					if (current_section < unknow_data[0].section_num) {
						current_section = unknow_data[0].section_num;
						break;
					}
					current_section = unknow_data[0].section_num;
				}
				current_round = 1;
				hideStudyEnd();
			}
		}

		e.preventDefault();
		return false;
	});

	// 현재구간 모두 아는 카드이고 다음구간 이동 할때
	$('#study_end .btn-study-end-next-section2').click(function(e) {
		var correct_data = study_data.filter(function(obj) { return obj.known_yn == 1; });
		var unknow_data = study_data.filter(function(obj) { return obj.known_yn != 1; });

		// 모두 완료했으면 반복화면(200%, 300% 반복)으로 이동
		if (correct_data.length == study_data.length && unknow_data.length == 0) {
			$('#study_end .current-repeat-percent').text((repeat_cnt + 1) * 100);
			$('#study_end .next-repeat-percent').text((repeat_cnt + 2) * 100);
			setStudyEnd(3);
			if (typeof resetAllLog == 'function') {
				resetAllLog(false);
			}
		} else {
			var next_data = study_data.filter(function(obj) { return obj.section_num === (current_section + 1); });

			// 지금이 마지막 구간일때
			// 모르는 카드가 있는 경우 해당 구간으로 이동
			if (next_data.length == 0) {
				current_round = 1;
				current_section = unknow_data[0].section_num;
				hideStudyEnd();
			} 
			// 마지막 구간이 아니면
			// 기본적으로 다음구간으로 이동
			// 다음 구간도 완료상태면 그 다음 구간으로 이동
			else {
				for (i = 0; i < unknow_data.length; i++) {
					if (current_section < unknow_data[0].section_num) {
						current_section = unknow_data[0].section_num;
						break;
					}
					current_section = unknow_data[0].section_num;
				}
				current_round = 1;
				hideStudyEnd();
			}
		}

		e.preventDefault();
		return false;
	});
});