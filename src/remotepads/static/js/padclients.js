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
    constructor(id, answer, rank) {
        this.id = id;
        this.number = -1;
        this.answer = answer;
        this.rank = rank;
    }
}

var players = [];

webSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    // log(data)
    if (data.id != "admin") {

        if (waiting_players) {
            var incomingPlayer = new Player(data.id, undefined, undefined);
            players.push(incomingPlayer);
            incomingPlayer.number = players.indexOf(incomingPlayer) + 1;

            $('#pad_container').append(`
            
                <div class='pads'>
                    <div id="${incomingPlayer.number}">Joueur ${incomingPlayer.number}</div>
                    <div id="${incomingPlayer.number}_answer">${incomingPlayer.id}</div>
                    
                </div>
                
            
            
            
            `);

        }

        else if (gameStarted) {
            // log(data)
            var player = players.find(elt => elt.id == data.id);
            if(player == undefined)
                return; //Si le joueur n'est pas en lice on ignore
            player.answer = data.message;
            log($('#'+player.number+'_answer'));
            $('#'+player.number+'_answer').text(player.answer);
            


        }

    }
    // log(players);

    // document.querySelector('#chat-log').value += (data.message + '\n');
};

webSocket.onclose = function (e) {
    console.error('Chat socket closed unexpectedly');
};



$(() => {
    $('#start_btn').click(function (e) {
        message = { 'id': 'admin', 'message': "start" }
        if ($(e.target).val() == "Démarrer") {
            $(e.target).val('Lancer la partie');
            $('#init_container').addClass("hidden");
            message.message = "start"
            waiting_players = true;
            gameStarted = false;
        }

        else if ($(e.target).val() == 'Lancer la partie') {
            $(e.target).val("Réinitialiser");
            message.message = "game"
            waiting_players = false;
            gameStarted = true;

        }
        else {
            $('#init_container').removeClass("hidden");
            $(e.target).val("Démarrer");
            message.message = "reset"
            waiting_players = false;
            gameStarted = false;
            players = [];
            $('#pad_container').text('');

        }
        // log(message);
        webSocket.send(JSON.stringify(message));
    });
})