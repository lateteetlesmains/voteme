const roomName = JSON.parse($("#room-name").text())
// const roomName = JSON.parse(document.getElementById('room-name').textContent);
const chatSocket = new WebSocket(
    'ws://'
    + window.location.host
    + '/ws/chat/'
    + roomName
    + '/'

);

chatSocket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    $('#pad_container').append("<div class='pads'>"+ data.message +"</div>");
    // document.querySelector('#chat-log').value += (data.message + '\n');
};

chatSocket.onclose = function(e) {
    console.error('Chat socket closed unexpectedly');
};