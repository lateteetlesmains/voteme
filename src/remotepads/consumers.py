from time import sleep
from channels.generic.websocket import AsyncWebsocketConsumer
from threading import Thread, Event
import json

from remotepads.leds import Color

debug = False
waiting = False
if not debug:
    from . import leds
pads = []
if not debug:
    d = leds.Display(leds.board.D18, 35)

class ScreensThread(Thread):
    def __init__(self, event):
        Thread.__init__(self)
        self.stopped = event
        self.currentPlayer = 0
        self.daemon = True
        d.clear()

    def run(self):
        while not self.stopped.wait(2.0):
            if waiting:
                d.draw(2,'.',leds.Color.Purple)
                d.draw(3,'.',leds.Color.Purple)
                d.draw(4,'.',leds.Color.Purple)
            elif (len(pads) > 0):
                if not debug:
                    d.draw(1,pads[self.currentPlayer].name,leds.Color.Blue)
                    d.draw(5,pads[self.currentPlayer].score,leds.Color.Green)
                    # sleep(.5)
                self.currentPlayer += 1
                if self.currentPlayer > len(pads) - 1:
                    self.currentPlayer = 0
                print('hello %s, %s' % (self.currentPlayer, len(pads)))
            


stopFlag = Event()
thread = ScreensThread(stopFlag)
thread.start()



class Pad():
    def __init__(self, id, message) -> None:
        self.id = id
        self.name = ""
        self.message = message
        self.playerid = ""
        self.score = 0

    def __repr__(self) -> str:
        return self.name + '(' + self.id + ') ' + str(self.score)

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
        text_data_json = json.loads(text_data)
        # print(text_data_json)
        incoming = Pad(text_data_json['id'], text_data_json['message'])
        incoming.score = text_data_json['score']
        incoming.playerid = text_data_json['player_id']

        # print('message : %s' % incoming.message)
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
                
            elif incoming.message == "reset":
                self.started = False
                self.ingame = False
                waiting = False
                pads = []
                d.clear()
                

        elif not incoming in pads:
            pads.append(incoming)
            idx = pads.index(incoming)
            pads[idx].name = 'p' + str((idx + 1))

        if self.ingame:
            if incoming.message == 'good' or incoming.message == 'faster':
                for pad in pads:
                    if pad.id == incoming.playerid:
                        pad.score = incoming.score
                        break
                print(pads)

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'pad_message',
                'message': text_data_json['message'],
                'id': text_data_json['id'],
                'player_id': text_data_json['player_id'],
                'score': text_data_json['score']
            }
        )

    async def pad_message(self, event):
        message = event['message']
        player_id = event['player_id']
        score = event['score']
        id = event['id']
        await self.send(text_data=json.dumps({
            'message': message,
            'id': id,
            'player_id': player_id,
            'score': score
        }))

