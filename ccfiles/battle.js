var battle = {
    major_ver: 8,
    minor_ver: 0,
    socket: null,
    host: document.location.host,
    port: 800,
    url: '',
    is_connect: false,
    battle_id: 0,
    user_name: '',
    pathname: '',
    socket_id: '',
    is_auto: false,
    pong_timer: null,

    init: function (battle_id) {
        console.log('start', battle_id);
        this.battle_id = battle_id;
        this.pathname = document.location.pathname;
    },

    set_socket: function (auto) {
        // 		$(window).on('beforeunload', $.proxy(this.exit, this));

        if (this.host.indexOf('devb.') > -1) {
            this.host = this.host.replace('devb.', 'stg.');
        } else if (this.host.indexOf('stgb.') > -1) {
            this.host = this.host.replace('stgb.', 'stg.');
        } else {
            this.host = this.host.replace('b.', 'www.');
        }

        if (auto !== undefined && auto == true) {
            this.is_auto = true;
        } else {
            this.is_auto = false;
        }

        this.port = 800;
        if (this.battle_id > 18999 && this.battle_id < 28000) {
            this.port = 801;
        } else if (this.battle_id > 27999 && this.battle_id < 37000) {
            this.port = 802;
        } else if (this.battle_id > 36999 && this.battle_id < 46000) {
            this.port = 803;
        } else if (this.battle_id > 45999 && this.battle_id < 55000) {
            this.port = 804;
        } else if (this.battle_id > 54999 && this.battle_id < 64000) {
            this.port = 805;
        } else if (this.battle_id > 63999 && this.battle_id < 73000) {
            this.port = 806;
        } else if (this.battle_id > 72999 && this.battle_id < 82000) {
            this.port = 807;
        } else if (this.battle_id > 81999 && this.battle_id < 91000) {
            this.port = 808;
        } else if (this.battle_id > 90999 && this.battle_id < 100000) {
            this.port = 809;
        }

        if (this.host == 'www.classcard.net') {
            // if (location.protocol == 'https:') {
            this.url = 'wss://mobile3.classcard.net/wss_' + this.port;
            // } else {
            // 	this.url = 'ws://' + ws_server[this.battle_id % ws_server.length] + ':' + this.port + '/websockets/ws_server.php';
            // }
        } else {
            // this.url = 'ws://' + this.host + ':' + this.port + '/websockets/ws_server.php';
            this.url = 'wss://mobile3.classcard.net/stgwss_' + this.port;
        }
        console.log('start socket');
        this.start_socket();
    },

    start_socket: function () {
        try {
            if (this.battle_id == 0) { console.log('skip socket : battle_id 0'); return; }

            // 이미 접속된게 있으면 서버에 쌓이기 때문에 종료 해야 한다.
            if (this.socket != null) {
                this.socket.onclose = null;
                this.socket.onerror = null;
                battle.close_socket();
            }

            this.is_connect = false;

            this.socket = new WebSocket(this.url);
            this.socket.onopen = function (msg) {
                battle.send_pong();
                console.log("Welcome - status", this.readyState);
                battle.is_connect = true;

                var delay = 0;
                if (battle.socket_id.length > 0) {
                    delay = 500;

                    var sendObj = {
                        cmd: 'b_force_out',
                        id: battle.socket_id
                    };
                    var msg = JSON.stringify(sendObj);
                    battle.send_msg(msg);
                }
                battle.socket_id = '';

                setTimeout(function () {
                    var sendObj = {
                        cmd: 'b_check',
                        battle_id: battle.battle_id,
                        is_auto: battle.is_auto,
                        major_ver: battle.major_ver,
                        minor_ver: battle.minor_ver
                    };
                    var msg = JSON.stringify(sendObj);
                    battle.send_msg(msg);
                }, delay);

            };
            this.socket.onmessage = function (msg) {
                battle.send_pong();
                console.log(msg);
                battle.receive_msg(msg.data);
            };
            this.socket.onclose = function (msg) {
                console.log(msg);
                $.isLoading("hide");

                battle.close_socket();

                // 자동 로그인 없이 종료팝업 처리
                console.log('is_connect', battle.is_connect);
                console.log('boolBattleNetwork', (typeof battle_interface.boolBattleNetwork));
                if (typeof battle_interface.boolBattleNetwork == 'function') {
                    console.log('boolBattleNetwork()', battle_interface.boolBattleNetwork());
                }
                if (battle.is_connect || (typeof battle_interface.boolBattleNetwork == 'function' && battle_interface.boolBattleNetwork())) {
                    // 					$('body').addClass('error');
                    setTimeout(function () {
                        if (typeof battle_interface.checkBattleNetwork == 'function') {
                            battle_interface.checkBattleNetwork();
                        } else {
                            // 						battle.start_socket();
                            console.log('1');
                            showAlert('모바일 또는 Wi-Fi 네트웍이 불안정하여 연결이 끊어졌습니다. 다음 배틀에 참여하세요.');
                            battle.exit();
                        }
                    }, 1000);
                } else if (typeof battle_interface.getRetryCnt == 'function' && battle_interface.getRetryCnt() > 2) {
                    console.log('2');
                    showAlert('모바일 또는 Wi-Fi 네트웍이 불안정하여 연결이 끊어졌습니다. 다음 배틀에 참여하세요.');
                    battle.exit();
                }
            };
            this.socket.onerror = function (e) {
                console.error("WebSocket error observed:", e);
                $.isLoading("hide");

                battle.close_socket();

                // 자동 로그인 없이 종료팝업 처리
                console.log('is_connect', battle.is_connect);
                console.log('boolBattleNetwork', (typeof battle_interface.boolBattleNetwork));
                if (typeof battle_interface.boolBattleNetwork == 'function') {
                    console.log('boolBattleNetwork()', battle_interface.boolBattleNetwork());
                }
                if (battle.is_connect || (typeof battle_interface.boolBattleNetwork == 'function' && battle_interface.boolBattleNetwork())) {
                    // 					$('body').addClass('error');
                    setTimeout(function () {
                        if (typeof battle_interface.checkBattleNetwork == 'function') {
                            battle_interface.checkBattleNetwork();
                        } else {
                            // 						battle.start_socket();
                            console.log('1');
                            showAlert('모바일 또는 Wi-Fi 네트웍이 불안정하여 연결이 끊어졌습니다. 다음 배틀에 참여하세요.');
                            battle.exit();
                        }
                    }, 1000);
                } else if (typeof battle_interface.getRetryCnt == 'function' && battle_interface.getRetryCnt() > 2) {
                    console.log('2');
                    showAlert('모바일 또는 Wi-Fi 네트웍이 불안정하여 연결이 끊어졌습니다. 다음 배틀에 참여하세요.');
                    battle.exit();
                }
            };
        } catch (ex) {
            console.log(ex);
        }
    },

    close_socket: function () {
        try {
            this.is_connect = false;

            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
        } catch (ex) {
            console.log(ex);
        }
    },

    send_msg: function (msg) {
        try {
            if (this.socket) {
                console.log('socket.readyState : ' + this.socket.readyState);
                this.socket.send(msg);
                console.log(msg);

                battle.send_pong();
            }
        } catch (ex) {
            console.log(ex);
        }
    },

    send_tmp: function (msg) {
        setTimeout(function () {
            console.log('tmp send........', msg);
            battle.send_msg(msg);
        }, 100);

    },

    receive_msg: function (msg) {
        try {
            var obj = JSON.parse(msg);
            console.log(obj);
            if (obj.cmd == 'b_join') {
                /*
                                if (obj.is_end !== undefined && obj.is_end == true) {
                                    location.reload();
                                } else
                */
                if (obj.result == 'ok' || obj.result == 'ok_dup') {
                    if (typeof battle_interface.setTestReady == 'function') {
                        battle_interface.setTestReady(obj);
                    }
                } else {
                    showAlert(obj.msg);
                    this.exit();
                }
            } else if (obj.cmd == 'b_test_start') {
                if (typeof battle_interface.setBattle == 'function') {
                    battle_interface.setBattle(2);
                }
            } else if (obj.cmd == 'b_out') {
                if (obj.is_today !== undefined && obj.is_today == true) {
                    // 					showAlert('선생님이 오늘 자정까지 접속을 차단하였습니다.');
                    if (typeof setCookieAt00 == 'function') {
                        setCookieAt00('b_bani_today', 'done', 1);
                        is_banish_today = 1;
                    }
                } else if (typeof battle_interface.boolBattleNetwork2 == 'function' && battle_interface.boolBattleNetwork2()) {
                    console.log('boolBattleNetwork2 skip');
                    if (this.is_connect && this.socket) {
                        this.close_socket();
                    }
                    this.is_connect = false;
                    return;
                } else {
                    showAlert('', '선생님이 배틀에 접속을 막았습니다. 배틀코드를 확인하세요.', function () { location.reload(); });
                }
                this.exit();
            } else if (obj.cmd == 'b_test_end') {
                if (typeof battle_interface.setBattleEnd == 'function') {
                    b_etc = 'teacher end';
                    battle_interface.setBattleEnd();
                }
            } else if (obj.cmd == 'b_send_rank') {
                if (typeof battle_interface.showBattleRank == 'function') {
                    battle_interface.showBattleRank(obj);
                }
            } else if (obj.cmd == 'b_check') {
                if (obj.result == 'ok') {
                    if (obj.is_ver === undefined || obj.is_ver == true) {
                        console.log('b_check insert');
                        this.socket_id = obj.id;
                    } else {
                        showAlert('', '페이지를 다시 로딩 합니다.', function () { location.reload(); });
                        this.exit();
                    }
                }

                if (typeof battle_interface.checkBattle == 'function') {
                    battle_interface.checkBattle(obj);
                }
            } else if (obj.cmd == 'b_test_stop') {
                showAlert('', '선생님이 배틀을 종료하였습니다.', function () { location.reload(); });
                this.exit();
            } else if (obj.cmd == 'b_give_up_ok') {
                if (b_is_end !== undefined) {
                    b_is_end = true;
                }
                location.reload();
            } else if (obj.cmd == 'b_team') {
                if (typeof battle_interface.setTeam == 'function') {
                    battle_interface.setTeam(obj);
                }
            } else if (obj.cmd == 'b_return_team_input') {
                if (typeof battle_interface.getTeamScore == 'function') {
                    battle_interface.getTeamScore(obj);
                }
            } else if (obj.cmd == 'b_test_join_end') {
                if (typeof battle_interface.setJoinEnd == 'function') {
                    battle_interface.setJoinEnd();
                }
            } else if (obj.cmd == 'send_to_std_rank') {
                if (typeof battle_interface.showRankMe == 'function') {
                    battle_interface.showRankMe(obj.top_rank, obj.me_rank);
                }
            }
        } catch (ex) {
            console.log(ex);
        }
    },

    send_join: function (battle_id, user_name, is_add, client_platform, client_browser) {
        this.battle_id = battle_id;
        this.user_name = user_name;

        var sendObj = {
            cmd: 'b_join',
            battle_id: this.battle_id,
            user_name: this.user_name,
            is_add: is_add,
            is_auto: battle.is_auto,
            platform: client_platform,
            browser: client_browser,
            major_ver: this.major_ver,
            minor_ver: this.minor_ver
        };
        var msg = JSON.stringify(sendObj);
        this.send_msg(msg);
    },

    send_answer: function (card_idx, score, user_opt) {
        var sendObj = {
            cmd: 'b_user_answer',
            card_idx: card_idx,
            score: score,
            user_opt: user_opt
        };
        var msg = JSON.stringify(sendObj);
        this.send_msg(msg);
    },

    send_ready: function () {
        var sendObj = {
            cmd: 'b_user_ready'
        };
        var msg = JSON.stringify(sendObj);
        this.send_msg(msg);
    },

    send_giveup: function () {
        var sendObj = {
            cmd: 'b_give_up_std'
        };
        var msg = JSON.stringify(sendObj);
        this.send_msg(msg);
    },

    get_rank: function (score, cnt, quest) {
        var sendObj = {
            cmd: 'b_get_rank',
            total_score: score,
            unknown: cnt,
            quest: quest
        };
        var msg = JSON.stringify(sendObj);
        this.send_msg(msg);
    },

    send_team_input: function (user_name, user_team, user_answer) {
        var sendObj = {
            cmd: 'b_send_team_input',
            user_name: user_name,
            user_team: user_team,
            user_answer: user_answer
        };
        var msg = JSON.stringify(sendObj);
        this.send_msg(msg);
    },

    send_change_team: function (user_name, user_team) {
        var sendObj = {
            cmd: 'b_send_change_team',
            user_name: user_name,
            team: user_team
        };
        var msg = JSON.stringify(sendObj);
        this.send_msg(msg);
    },

    exit: function (e) {
        if (this.is_connect && this.socket) {
            this.close_socket();
        }

        this.is_connect = false;
        battle.socket_id = '';
        if (typeof battle_interface.setBattle == 'function') {
            console.log('socket exit setBattle(0)');
            battle_interface.setBattle(0);
        }
    },

    send_pong: function () {
        if (this.pong_timer != null) {
            clearTimeout(this.pong_timer);
            this.pong_timer = null;
        }

        this.pong_timer = setTimeout(function () {
            var sendObj = {
                cmd: 'pong'
            };
            var msg = JSON.stringify(sendObj);
            battle.send_msg(msg, true);
        }, 10000);

    }
}