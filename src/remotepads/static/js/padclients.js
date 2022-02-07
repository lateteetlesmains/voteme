// const roomName = JSON.parse($("#room-name").text())
// const roomName = JSON.parse(document.getElementById('room-name').textContent);
const log = console.log;
const webSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/pads/'

);

webSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    log(data)
    if (data.id != "admin")
        $('#pad_container').append("<div class='pads'>" + data.message + "</div>");
    // document.querySelector('#chat-log').value += (data.message + '\n');
};

webSocket.onclose = function (e) {
    console.error('Chat socket closed unexpectedly');
};



$(() => {
    $('#start_btn').click(function (e) {
        message = { 'id': 'admin', 'message': "start" }
        if ($(e.target).val() == "Démarrer"){
            $(e.target).val('Réinitialiser');
            message.message = "start"
        }
           
        else{
            $(e.target).val('démarrer');
            message.message = "reset"
            
        }
            
        webSocket.send(JSON.stringify(message));
    });
})