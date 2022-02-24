// const roomName = JSON.parse($("#room-name").text())
// const roomName = JSON.parse(document.getElementById('room-name').textContent);
const log = console.log;
var waiting_players = false;
var gameStarted = false;
var soundPaths = [
    { soundName: "Phone", path: "/static/audio/phonecall.wav" },
    { soundName: "Up", path: "/static/audio/smb_1-up.wav" },
    { soundName: "Coin", path: "/static/audio/smb_coin.wav" },
    { soundName: "Jump", path: "/static/audio/smb_jump-super.wav" },
    { soundName: "powerUp", path: "/static/audio/smb_powerup_appears.wav" }
]

const webSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/pads/'

);

class Player {
    constructor(id, rank) {
        this.id = id;
        this.number = -1;
        this.answer;
        this.has_answered = false;
        this.rank = rank;
        this.score = 0;
    }
    update() {
        $(`#player_${this.number}_score`).text(this.score +
            (this.score > 1 ? " Points" : " Point"));
    }
}

class GameModes {
    // Create new instances of the same class as static attributes
    static QCM = new GameModes("qcm")
    static Quick = new GameModes("quick")

    constructor(mode) {
        this.mode = mode;
    }
}

class ExpectedAnswer {
    static A = new ExpectedAnswer("a");
    static B = new ExpectedAnswer("b");
    static C = new ExpectedAnswer("c");
    static D = new ExpectedAnswer("d");

    constructor(answer) {
        this.answer = answer;
    }
}


var currentGameMode = GameModes.QCM;
var expected_answer = ExpectedAnswer.A
var players = [];
var quick_players = [];
var soundList = []

webSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    log(data)
    if (data.id != "admin") {

        if (waiting_players) {
            if (players.find(elt => elt.id == data.id)) return; //On s'assure que c'est pas le même joueur qui s'inscrit
            $('#waiting_players').addClass('hidden');
            $('#players_container').removeClass('hidden');
            var incomingPlayer = new Player(data.id, undefined);

            players.push(incomingPlayer);


            incomingPlayer.number = players.indexOf(incomingPlayer) + 1;


            $('#players_container').append(`
            
            <div class='box-Buzzer' id='box_Buzzer_${incomingPlayer.number}'>
               
                    <div class="player_name_score_container">
                        <div class='player_name'>
                            <h2>Joueur ${incomingPlayer.number}</h2>
                        </div>
                        <div class='score_container'>
                            <div>
                                <label class='score' >SCORE : </label>
                                <label id='player_${incomingPlayer.number}_score' class='score' >${incomingPlayer.score} Point</label>  
                            </div>
                                           
                            <input class='btn btn-primary' id='btn_buzzer_${incomingPlayer.number}_minus' type='submit' name='btn-Buzzer_${incomingPlayer.number}_+' value='-1'>
                            <input class='btn btn-primary' id='btn_buzzer_${incomingPlayer.number}_reset' type='submit' name='btn-Buzzer_reset' value='Remise à zéro'>
                            <input class='btn btn-primary' id='btn_buzzer_${incomingPlayer.number}_plus' type='submit' name='btn-Buzzer_${incomingPlayer.number}_-' value='+1'>
                        </div>
                    </div>
                                      
                <div class='audio_container'>
                    <audio src="/static/audio/smb_jump-super.wav" type="audio/mpeg">
                            Your browser does not support the audio element.
                    </audio>
                 
                </div>
                
            </div>

            `);

        }

        else if (gameStarted) {

            var player = players.find(elt => elt.id == data.id);
            if (player == undefined)
                return; //Si le joueur n'est pas en lice on ignore

            if (!player.has_answered) {
                //On evite de pouvoir changer sa réponse 
                if (currentGameMode == GameModes.QCM) {
                    player.answer = new ExpectedAnswer(data.message);
                    // player.answer = !player.has_answered ? new ExpectedAnswer(data.message) : player.answer;
                    log(expected_answer)
                    $(`#${player.number}_answer`).text(player.answer);
                    let msg = { "id": "admin","player_id": player.id, "message":""};
                    
                    if (player.answer.answer == expected_answer.answer) {
                        $(`#box_Buzzer_${player.number}`).addClass('good_answer');
                        player.score += 1;
                        player.update();
                        msg.message = "good";
                        // $('#player_' + player.number + '_score').text(player.score +
                        //     (player.score > 1 ? " Points" : " Point"));
                    }

                    else {
                        $(`#box_Buzzer_${player.number}`).addClass('bad_answer');
                        msg.message = "bad";
                    }
                    log(msg)
                    webSocket.send(JSON.stringify(msg));


                }
                else {
                    quick_players.push(player);
                    player.rank = quick_players.indexOf(player);
                    player.score += 1;

                    if (!$(`#box_Buzzer_${quick_players[0].number}`).hasClass('good_answer'))
                        $(`#box_Buzzer_${quick_players[0].number}`).addClass('good_answer');
                    player.update();
                    // $('#player_' + player.number + '_score').text(player.score +
                    //     player.score > 1 ? " Points" : " Point");



                }
                player.has_answered = true;
            }





        }

    }

};

webSocket.onclose = function (e) {
    console.error('Chat socket closed unexpectedly');
};



$(() => {

    $('#question_type_form').on('change', function (e) {
        currentGameMode = e.target.id == "qcm" ? GameModes.QCM : GameModes.Quick;
        if (currentGameMode == GameModes.Quick)
            $('#answer_form').addClass('hide');
        else
            $('#answer_form').removeClass('hide');
    });
    $('#answer_form').on('change', function (e) {
        expected_answer = new ExpectedAnswer(e.target.id);
    })

    $('#start_btn').on('click', function (e) {
        message = { 'id': 'admin','player_id':"", 'message': "start" };
        log($(e.target).val());
        if ($(e.target).val() == "Démarrer") {
            //Attente des joueurs
            $(e.target).val('Lancer la partie');
            $('#start_text').addClass("hidden");
            $('#waiting_players').removeClass('hidden');
            $('.form').removeClass('hidden');
            message.message = "start"
            waiting_players = true;
            gameStarted = false;
        }

        else if ($(e.target).val() == 'Lancer la partie') {
            //lancement de partie
            if (players.length < 1)
                return;
            players.forEach(player => {
                $(`#btn_buzzer_${player.number}_plus`).on('click', function (e) {
                    player.score += 1;
                    player.update();

                });
                $(`#btn_buzzer_${player.number}_minus`).on('click', function (e) {
                    player.score -= 1;
                    player.update();
                });
                $(`#btn_buzzer_${player.number}_reset`).on('click', function (e) {
                    player.score = 0;
                    player.update();
                });
            });
            $(e.target).val("Réinitialiser");
            message.message = "game"
            waiting_players = false;
            gameStarted = true;
            $('.ingame').removeClass("hidden");

        }
        else {
            //reset
            $('#start_text').removeClass("hidden");
            $('.form').addClass('hidden');
            $('#waiting_players').addClass('hidden');
            $(e.target).val("Démarrer");
            $('#players_container').text('');
            $('.ingame').addClass("hidden");
            message.message = "reset"
            waiting_players = false;
            gameStarted = false;
            players = [];


        }
        log(message);
        webSocket.send(JSON.stringify(message));
    });

    $('#new_question_btn').click(function (e) {
        players.forEach(elt => {
            $(`#box_Buzzer_${elt.number}`).hasClass('good_answer') ?
                $(`#box_Buzzer_${elt.number}`).removeClass('good_answer') :
                $(`#box_Buzzer_${elt.number}`).removeClass('bad_answer');
            elt.has_answered = false;
        });
        quick_players = []
    });


})