// const roomName = JSON.parse($("#room-name").text())
// const roomName = JSON.parse(document.getElementById('room-name').textContent);
const log = console.log;
var waiting_players = false;
var gameStarted = false;

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
    static ONE = new ExpectedAnswer("1");
    static TWO = new ExpectedAnswer("2");
    static THREE = new ExpectedAnswer("3");
    static FOUR = new ExpectedAnswer("4");

    constructor(answer) {
        this.answer = answer;
    }
}

var currentGameMode = GameModes.QCM;
var expected_answer = ExpectedAnswer.ONE
var players = [];
var quick_players = [];

webSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    // log(data)
    if (data.id != "admin") {

        if (waiting_players) {
            if (players.find(elt => elt.id == data.id)) return; //On s'assure que c'est pas le même joueur qui s'inscrit
            $('#waiting_players').addClass('hidden');
            var incomingPlayer = new Player(data.id, undefined);
            players.push(incomingPlayer);
            incomingPlayer.number = players.indexOf(incomingPlayer) + 1;

            $('#pad_container').append(`
            
                <div class='pads' id="player_${incomingPlayer.number}">
                    <div class="center" id="${incomingPlayer.number}">Joueur ${incomingPlayer.number}</div>
                                        
                </div>
            `);
            // <div id="${incomingPlayer.number}_answer">${incomingPlayer.answer == undefined ? "" : incomingPlayer.answer}</div>
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

                    $('#' + player.number + '_answer').text(player.answer);

                    if (player.answer.answer == expected_answer.answer)
                        $('#player_' + player.number).addClass('good_answer');
                    else
                        $('#player_' + player.number).addClass('bad_answer');

                }
                else {
                    quick_players.push(player);
                    player.rank = quick_players.indexOf(player);
                    // if (quick_players.length == players.length) {
                        //tout le monde a joué
                    if(!$('#player_' + quick_players[0].number).hasClass('good_answer'))
                        $('#player_' + quick_players[0].number).addClass('good_answer');
                    // }
                    log(quick_players);

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
    $('#question_type_form').on('change',function (e) {
        currentGameMode = e.target.id == "qcm" ? GameModes.QCM : GameModes.Quick;
        if (currentGameMode == GameModes.Quick)
            $('#answer_form').addClass('hidden');
        else
            $('#answer_form').removeClass('hidden');
    });
    $('#answer_form').on('change',function (e) {
        expected_answer = new ExpectedAnswer(e.target.id);
        log(expected_answer);
    })

    $('#start_btn').on('click',function (e) {
        message = { 'id': 'admin', 'message': "start" }
        if ($(e.target).val() == "Démarrer") {
            //Attente des joueurs
            $(e.target).val('Lancer la partie');
            $('#init_container').addClass("hidden");
            $('.form').removeClass('hidden');
            $('#waiting_players').removeClass('hidden');
            message.message = "start"
            waiting_players = true;
            gameStarted = false;
        }

        else if ($(e.target).val() == 'Lancer la partie') {
            //lancement de partie
            if (players.length < 1)
                return;
            $(e.target).val("Réinitialiser");
            message.message = "game"
            waiting_players = false;
            gameStarted = true;
            $('.game').removeClass("hidden");

        }
        else {
            //reset
            $('#init_container').removeClass("hidden");
            $('.form').addClass('hidden');
            $('#waiting_players').addClass('hidden');
            $(e.target).val("Démarrer");
            message.message = "reset"
            waiting_players = false;
            gameStarted = false;
            players = [];
            $('#pad_container').text('');
            $('.game').addClass("hidden");

        }
        log(message);
        webSocket.send(JSON.stringify(message));
    });

    $('#new_question_btn').click(function (e) {
        players.forEach(elt => {
            $('#player_' + elt.number).hasClass('good_answer') ?
                $('#player_' + elt.number).removeClass('good_answer') :
                $('#player_' + elt.number).removeClass('bad_answer');
            elt.has_answered = false;
        });
        quick_players = []
    });
})