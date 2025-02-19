const log = console.log;
var waiting_players = false;
var gameStarted = false;

var soundPaths = [
    { soundName: "1-Up",        path: "/static/audio/UP.wav" },
    { soundName: "Bronzés",     path: "/static/audio/bronzés.mp3" },
    { soundName: "Homer",       path: "/static/audio/homer.mp3" },
    { soundName: "Cheval",      path: "/static/audio/cheval.mp3" },
    { soundName: "Klaxon",      path: "/static/audio/klaxon.mp3" },
    { soundName: "Glaude",      path: "/static/audio/glaude.mp3" },
    { soundName: "Saut",        path: "/static/audio/saut.wav" },
    { soundName: "Boulette",    path: "/static/audio/boulette.mp3" },
    { soundName: "Vache",       path: "/static/audio/vache.mp3" },
    // Ajoutez d'autres sons ici si nécessaire
];


document.addEventListener("DOMContentLoaded", function () {
  // Initialiser l'affichage en fonction de l'option sélectionnée
  toggleAnswerChoices();

  // Écouteur d'événements pour les changements sur le menu déroulant
  document.getElementById("questionType").addEventListener("change", toggleAnswerChoices);
});

function toggleAnswerChoices() {
  var questionType = document.getElementById("questionType").value;
  var answerChoices = document.getElementById("answerChoices");

  if (questionType === 'qcm') {
    answerChoices.style.display = 'flex';
    answerChoices.classList.add("flex-layout"); // Ajoute une classe lors de la sélection de QCM
  } else {
    answerChoices.style.display = 'none';
    answerChoices.classList.remove("flex-layout"); // Retire la classe si "Rapidité" est sélectionné
  }
}

// Appeler updateGameMode au chargement de la page
$(document).ready(function() {
    updateGameMode();
});

function updateGameMode() {
    	currentGameMode = $('#questionType').val() === 'qcm' ? GameModes.QCM : GameModes.Quick;
	console.log("Mode de jeu actuel :", currentGameMode.mode); // Débogage
}

let msg = { "id": "admin", "game_mode": '', "expected_answers":[], "player_number":"0", "player_id": '', "message": "", 'score': '0', 'color_r': 0, 'color_g': 0, 'color_b': 0 };

const webSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/pads/'
);

class Player {
    constructor(id, rank) {
        this.id = id;
        this.number = -1;
        this.answer = [];
        this.has_answered = false;
        this.rank = rank;
        this.score = 0;
        this.color_r = 0;
        this.color_g = 0;
        this.color_b = 0;
        this.sound = "";
        this.sameSound = false;
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

var expectedAnswers = [];
var currentGameMode = GameModes.Quizz;
var players = [];
var quick_players = [];
var soundList = []


function getSoundIndex(currentindex) {
    let hasSoundPlayerIdx = players.findIndex(player => player.sound.path == soundPaths[currentindex].path);
    if (hasSoundPlayerIdx < 0)
        return currentindex;
    else {
        return getSoundIndex((currentindex + 1) % soundPaths.length);
    }
}


webSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    if (data.id != "admin") {

        if (waiting_players) {
            //On s'assure que c'est pas le même joueur qui s'inscrit
            let currentPlayer = players.find(elt => elt.id == data.id);
            if (currentPlayer) {
                //Si c'est le cas, on joue le son qui lui est associé
                $(`#${currentPlayer.number}_audio`)[0].play();
                return;
            }

            $('#waiting_players').addClass('hidden');
            $('#players_container').removeClass('hidden');
            var incomingPlayer = new Player(data.id, undefined);
            if (data.message == "Press") {
                incomingPlayer.color_r = data.color_r;
                incomingPlayer.color_g = data.color_g;
                incomingPlayer.color_b = data.color_b;
            }

            players.push(incomingPlayer);
console.log(incomingPlayer);
            incomingPlayer.number = players.indexOf(incomingPlayer) + 1;

            incomingPlayer.sound = soundPaths[getSoundIndex(incomingPlayer.number - 1)];

            $('#players_container').append(`

            <div class='box_buzzer' id='box_buzzer_${incomingPlayer.number}'>

                    <div class="player_name_audio_container">
                        <div class='player_name'>
                            <div class="player_color" id=player_${incomingPlayer.number}_color></div>
                            <h2>Joueur ${incomingPlayer.number}</h2>

                        </div>
                        <div class='audio_container'>
                            <audio id=${incomingPlayer.number}_audio src=" ${incomingPlayer.sound.path}" type="audio/mpeg">
                                    Your browser does not support the audio element.
                            </audio>
                        </div>
                        <div class="drop_sound_and_button_container">

                            <div class="dropdown">
                                <button class="btn btn-secondary dropdown-toggle sound_list_drop" type="button" id="dropdownMenuButtonSound_${incomingPlayer.number}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    ${incomingPlayer.sound.soundName}
                                </button>
                                <div id="sound_drop_${incomingPlayer.number}" class="dropdown-menu" aria-labelledby="dropdownMenuButtonSound">
                                    <!-- <a class="dropdown-item" href="#">Action</a>
                                    <a class="dropdown-item" href="#">Another action</a>
                                    <a class="dropdown-item" href="#">Something else here</a> -->
                                </div>
                            </div>
                            <div>
                                <button title="Jouer le son" class="btn btn-primary btn_play" id="${incomingPlayer.number}_play"><i class="fa-solid fa-play"></i></button>
                           </div>

                        </div>


                    </div>
                    <div class='score_container'>
                        <div>
                            <label class='score' >SCORE : </label>
                            <label id='player_${incomingPlayer.number}_score' class='score' >${incomingPlayer.score} Point</label>  
                        </div>
                        <div class="score_btn_container" >

                            <input class='btn btn-primary' id='btn_buzzer_${incomingPlayer.number}_minus' type='submit' name='btn-Buzzer_${incomingPlayer.number}_+' value='-1'>
                            <input class='btn btn-primary' id='btn_buzzer_${incomingPlayer.number}_plus' type='submit' name='btn-Buzzer_${incomingPlayer.number}_-' value='+1'>            

                        </div>


                    </div>

            </div>

            `);

            //Audio
            soundPaths.forEach(sound => {
                $(`#sound_drop_${incomingPlayer.number}`).append(`

                    <button id=${incomingPlayer.number}_${sound.soundName} class="dropdown-item" data-path=${sound.path} >${sound.soundName}</button>

                `);

                $(`#${incomingPlayer.number}_${sound.soundName}`).on('click', function (_e) {
                    // on met à jour le joueur dont on change la valeur du son
                    incomingPlayer.sound = sound;
                    // on met à jour le même joueur dans la liste des joueurs
                    players[players.indexOf(incomingPlayer)].sound = sound
                    $(`#${incomingPlayer.number}_audio`).attr('src', incomingPlayer.sound.path);
                    //on vérifie que 1 ou pls joueur n'a pas déjà le son
                    //pour cela on crée un set vide
                    let foundSounds = new Set()
                    //on itère sur la liste des joueurs
                    players.forEach(player => {
                        // on ajoute le chemin du son dans le set
                        if (foundSounds.size === foundSounds.add(player.sound.path).size) {
                            // si une fois l'ajout fait, le set n'a pas changé de taille alors doublon
                            // Dans ce cas je récupère tous les joueurs ayant le même son
                            players.filter(plr => plr.sound.path === player.sound.path).forEach(plr => {
                                //et je les flag à true
                                plr.sameSound = true;
                            })
                        }
                        // sinon pas de doublon, on flag à false
                        else {
                            player.sameSound = false;
                        }


                    });


                    players.forEach(player => {
                        if (player.sameSound)
                            $(`#dropdownMenuButtonSound_${player.number}`).addClass("same_sound");
                        else
                            $(`#dropdownMenuButtonSound_${player.number}`).removeClass("same_sound");

                    });

                    $(`#dropdownMenuButtonSound_${incomingPlayer.number}`).text(`${sound.soundName}`)

                });
            });


            $(`#${incomingPlayer.number}_play`).on('click', function () {
                $(`#${incomingPlayer.number}_audio`)[0].play();
            });

            //msg web socket

            msg.player_id = incomingPlayer.id;
            msg.player_number = incomingPlayer.number;
            msg.id = 'admin';
            msg.message = 'OK';

            //On ne renvoie les couleurs que si le candidature
            msg.color_r = incomingPlayer.color_r;
            msg.color_g = incomingPlayer.color_g;
            msg.color_b = incomingPlayer.color_b;

            $(`#player_${incomingPlayer.number}_color`).css(
            {
                "background-color": `rgb(${incomingPlayer.color_r}, ${incomingPlayer.color_g},${incomingPlayer.color_b})`,
                "width": "80px",
                "height": "20px",
            });

          /*  switch(msg.player_number)
                switch (msg.player_number)
                    {
                        case "1":
console.log("Buzz 1 couleur jaune ");
                        break;
                        case "2":
console.log("Buzz 2 couleur bleu ");
                        break;
                        case "3":
console.log("Buzz 3 couleur turquoise ");
                        break;
                        case "4":
console.log("Buzz 4 couleur violet ");
                        break;
                        case "5":
console.log("Buzz 5 couleur rouge ruby ");
                        break;
           
           
*/
console.log("voici le contenu de msg");
console.log(msg);
            webSocket.send(JSON.stringify(msg));

        }

        else if (gameStarted) {

            var player = players.find(elt => elt.id == data.id);
            if (player == undefined)
                return; //Si le joueur n'est pas en lice on ignore

            if (!player.answer.includes(data.message)) {
                //On evite de pouvoir changer sa réponse 
                if (currentGameMode == GameModes.QCM) {
                     log(data.message)
                    player.answer.push(data.message);
console.log("answer");

log(player.answer);
                    msg.id = 'admin';
                    msg.player_id = player.id;
                    if (expectedAnswers.length == 1 && !player.has_answered) {

console.log("reponse du buzzer");
console.log(player.answer[0] );
console.log("expectedAnswers");
console.log(expectedAnswers[0]);

                        if (player.answer[0] == expectedAnswers[0]) {
                            $(`#box_buzzer_${player.number}`).addClass('good_answer');
                            player.score += 1;
                            player.update();
                            msg.message = "good";
                            msg.score = player.score;
console.log(msg);


                        }

                        else {
                            $(`#box_buzzer_${player.number}`).addClass('bad_answer');
                            msg.message = "bad";
console.log(msg);

                        }
                        player.has_answered = true;


                    }
                    else if (expectedAnswers.length > 1) {
                        if (player.answer.length < expectedAnswers.length) {
                            msg.message = "then";
                        }
                        else {
                            let goodanswers = expectedAnswers.filter(answer => player.answer.includes(answer));
                            log(goodanswers);
                            player.score += goodanswers.length;
                            player.update();
                            msg.score = player.score;

                            if (goodanswers.length == expectedAnswers.length) {
                                msg.message = "good";
console.log(msg);

                                $(`#box_buzzer_${player.number}`).addClass('good_answer');
                            }
                            else if (goodanswers.length > 0 && goodanswers.length < expectedAnswers.length) {
                                msg.message = "partial";
console.log(msg);

                                $(`#box_buzzer_${player.number}`).addClass('partial_answer');
                            }
                            else if (goodanswers.length == 0) {
console.log(msg);
                                msg.message = "bad";
                                $(`#box_buzzer_${player.number}`).addClass('bad_answer');
                            }
                            player.has_answered = true;
                        }
                    }
                    webSocket.send(JSON.stringify(msg));

                }
                else {
                    quick_players.push(player);
                    player.rank = quick_players.indexOf(player);

                    if (!$(`#box_buzzer_${quick_players[0].number}`).hasClass('good_answer'))
                        $(`#box_buzzer_${quick_players[0].number}`).addClass('good_answer');

                    quick_players[0].update();
                    if (player.id == quick_players[0].id && ! player.has_answered)
                        $(`#${quick_players[0].number}_audio`)[0].play();

                    msg.player_id = quick_players[0].id;
                    msg.score = quick_players[0].score
                    msg.message = 'faster';
                    msg.id = 'admin';
                    player.has_answered = true;
                    webSocket.send(JSON.stringify(msg));

                }
                player.has_answered = true;
            }

        }

    }

};

webSocket.onopen = function (_e) {
    msg.message = "reset";
    msg.player_id = '';
    webSocket.send(JSON.stringify(msg));
}
webSocket.onclose = function (_e) {
    console.error("le socket s'est fermé inopinément");
};


$(() => {
    $('#top_button').on('click', function () {
        $(document).scrollTop(0);
    });
    $(window).on('scroll', function () {

        if ($(document).scrollTop() > 75) {
            $("#top_button").removeClass('hidden');
        }
        else {
            $('#top_button').addClass('hidden');
        }
    });

$('#questionType').on('change', function () {
    currentGameMode = this.value === 'qcm' ? GameModes.QCM : GameModes.Quick;
    msg.game_mode = currentGameMode === GameModes.QCM ? 'QCM' : 'quick';
    msg.message = 'OK';
	console.log(currentGameMode);
    if (currentGameMode === GameModes.Quick) {
        $('#answerChoices').hide(); // Cache les choix de réponse pour le mode Rapidité
    } else {
        $('#answerChoices').show(); // Affiche les choix de réponse pour le mode QCM
    }
//    webSocket.send(JSON.stringify(msg));

});
$('input[name="answer"]').on('change', function () {
    const answerId = this.id;
    if ($(this).is(':checked')) {
        expectedAnswers.push(answerId);
    } else {
        expectedAnswers.splice(expectedAnswers.indexOf(answerId), 1);
    }
console.log("expectedAnswers");
console.log(expectedAnswers);

    msg.expected_answers = expectedAnswers;
    msg.message = 'OK';
    webSocket.send(JSON.stringify(msg));
});
    $('#start_btn').on('click', function (e) {

        if ($(e.target).val() == "Démarrer") {
            //Attente des joueurs
            $(e.target).val('Lancer la partie');
            $('#start_text').addClass("hidden");
            $('#waiting_players').removeClass('hidden');
            $('.form').removeClass('hidden');
            msg.message = "start"
            msg.player_id = '';
            msg.id = 'admin';
            msg.player_id = '';

            waiting_players = true;
            gameStarted = false;
            $('#question_modal').modal({ show: true, keyboard: false, backdrop: 'static' });

		// Supprimez la classe "hidden" du div parent
    		$('#questionType').parent().removeClass("hidden");

    		// Retirez l'attribut "disabled" du sélecteur
    		$('#questionType').removeAttr("disabled");        

}

        else if ($(e.target).val() == 'Lancer la partie') {
            //lancement de partie
            msg.game_mode = currentGameMode == GameModes.QCM ? "QCM" : "quick";
if (players.length > 1) {$(e.target).hide();}

if (players.length < 1)
                return;
            players.forEach(player => {
                $(`#btn_buzzer_${player.number}_plus`).on('click', function (_e) {
                    player.score += 1;
                    player.update();
                    msg.player_id = player.id;
                    msg.score = player.score;
                    msg.message = "score update";
                    webSocket.send(JSON.stringify(msg));

                });
                $(`#btn_buzzer_${player.number}_minus`).on('click', function (_e) {
                    player.score -= 1;
                    if (player.score < 0)
                        player.score = 0;
                    player.update();
                    msg.player_id = player.id;
                    msg.score = player.score;
                    msg.message = "score update";
                    webSocket.send(JSON.stringify(msg));
                });
                $(`#btn_buzzer_${player.number}_reset`).on('click', function (_e) {
                    player.score = 0;
                    player.update();
                    msg.player_id = player.id;
                    msg.score = player.score;
                    msg.message = "score update";
                    webSocket.send(JSON.stringify(msg));
                });
            });
            $(e.target).val("Réinitialiser");
            msg.message = "game"
            msg.player_id = '';
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
            msg.message = "reset";
            msg.score = 0;
            msg.player_id = '';
            waiting_players = false;
            gameStarted = false;
            players = [];
            quick_players = [];
        }

        webSocket.send(JSON.stringify(msg));
    });

    $('#new_question_btn').click(function (_e) {
        players.forEach(elt => {
            $(`#box_buzzer_${elt.number}`).hasClass('good_answer') ?
                $(`#box_buzzer_${elt.number}`).removeClass('good_answer') :
                $(`#box_buzzer_${elt.number}`).removeClass('bad_answer');
            $(`#box_buzzer_${elt.number}`).removeClass('partial_answer');
            elt.has_answered = false;
            elt.answer = [];
        });
        quick_players = [];
        msg.id = "admin";

        msg.player_id = '';
        msg.message = '';
        msg.message = 'new_quest';
        $('#question_modal').modal({ show: true, keyboard: false, backdrop: 'static' });

        webSocket.send(JSON.stringify(msg));
    });
})
