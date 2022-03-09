from remotepads.leds import Color, Colors, Display, board
from time import sleep
from channels.generic.websocket import AsyncWebsocketConsumer
from threading import Thread, Event
import json

waiting = False

pads = []

d = Display(board.D18, 35)

# /!\ Maintenir l'ordre des couleurs car lié aux idx du tableau client /!\
colors = [
    Colors.RedRuby,
    Colors.BlueLavender,
    Colors.Turquoise,
    Colors.Purple,
    Colors.PurpleDark
]


class ScreensThread(Thread):
    def __init__(self):
        Thread.__init__(self)
        # self.stopped = event
        self.currentPlayer = 0
        self.lastNbPlayers = -1
        self.daemon = True
        d.clear()

    def run(self):
        while True:
            if waiting and len(pads) == 0:
                self.currentPlayer = 0
                if(self.lastNbPlayers == -1):
                    d.draw(2, '.', Colors.Purple.color())
                    d.draw(3, '.', Colors.Purple.color())
                    d.draw(4, '.', Colors.Purple.color())
                    self.lastNbPlayers = 0
            elif waiting:
                if(self.lastNbPlayers != len(pads)):
                    d.draw(1, 'p', Colors.Blue.color())
                    d.draw(5, len(pads), colors[len(pads) - 1].color())
                    self.lastNbPlayers = len(pads)
            elif (len(pads) > 0):
                d.clear()
                d.draw(1, pads[self.currentPlayer].name,
                       pads[self.currentPlayer].color.color())
                d.draw(5, pads[self.currentPlayer].score,
                       pads[self.currentPlayer].color.color())
                self.currentPlayer += 1
                if self.currentPlayer > len(pads) - 1:
                    self.currentPlayer = 0
                sleep(1.9)
            sleep(.1)


thread = ScreensThread()
thread.start()


class Pad():
    def __init__(self, id, message) -> None:
        self.id = id
        self.name = ""
        self.message = message
        self.playerid = ""
        self.score = 0
        self.color = Colors.Black

    def __repr__(self) -> str:
        return F"{self.name} ({self.id} envoie : '{self.message}'\n Couleur : {str(self.color.color())}, score : {self.score}"

    def __eq__(self, __o: object) -> bool:
        return self.id == __o.id


class PadConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        self.started = False
        self.ingame = False
        super().__init__(*args, **kwargs)

    async def connect(self):
        self.group_name = 'pads'
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def receive(self, text_data=None):
        global pads, waiting
        idx = 0
        text_data_json = json.loads(text_data)
        # print(text_data_json)
        incoming = Pad(text_data_json['id'], text_data_json['message'])
        incoming.score = text_data_json['score']
        incoming.playerid = text_data_json['player_id']

        if incoming.id == 'admin':
            if incoming.message == 'start':
                self.started = True
                waiting = True
                d.clear()
            elif incoming.message == 'game':
                self.ingame = True
                waiting = False
                d.clear()

            elif incoming.message == 'new_quest':
                self.ingame = True
                waiting = False

            elif incoming.message == 'score update':
                for pad in pads:
                    if incoming.playerid == pad.id:
                        pads[pads.index(pad)].score = incoming.score
                        break

            elif incoming.message == "reset":
                self.started = False
                self.ingame = False
                waiting = False
                pads = []
                d.clear()
                thread.lastNbPlayers = -1
            elif incoming.message == "OK":
                # on renvoie la bonne couleur au pad à qui on dit ok
                for pad in pads:
                    if pad.id == incoming.playerid:
                        idx = pads.index(pad)
                        break
                # idx = pads.index(
                #     next((pad for pad in pads if pad.id == incoming.playerid), None))

        elif not incoming in pads:
            # on définit les valeurs des pads entrant apres "press"
            pads.append(incoming)
            idx = pads.index(incoming)
            incoming.color = colors[idx]
            # print('idx in apprend : %d' % idx)
            pads[idx].name = 'p' + str((idx + 1))

            # print(incoming.color.color())

        if self.ingame:
            if incoming.message == 'good' or incoming.message == 'faster':
                for pad in pads:
                    if pad.id == incoming.playerid:
                        pad.score = incoming.score
                        break
        # print('idx before send : %d' % idx)
        # print(text_data_json)
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'pad_message',
                'message': text_data_json['message'],
                'id': text_data_json['id'],
                'player_id': text_data_json['player_id'],
                'score': text_data_json['score'],
                'color_r': pads[idx].color.r if len(pads) > 0 else 0,
                'color_g': pads[idx].color.g if len(pads) > 0 else 0,
                'color_b': pads[idx].color.b if len(pads) > 0 else 0

            }
        )

    async def pad_message(self, event):
        message = event['message']
        player_id = event['player_id']
        score = event['score']
        id = event['id']

        await self.send(text_data=json.dumps({
            'message': event['message'],
            'id': event['id'],
            'player_id': event['player_id'],
            'score':  event['score'],
            'color_r': event['color_r'],
            'color_g': event['color_g'],
            'color_b': event['color_b']
        }))
