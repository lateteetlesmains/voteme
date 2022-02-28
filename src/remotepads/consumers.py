import json
from . import leds
from channels.generic.websocket import AsyncWebsocketConsumer

class Pad():
    def __init__(self, id, message) -> None:
        self.id = id
        self.rank = None
        self.message = message
    def __repr__(self) -> str:
        return self.id + " : " + str(self.rank)
    def __eq__(self, __o: object) -> bool:
        return self.id == __o.id

pads = []
d = leds.Display(leds.board.D18, 35)


class PadConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        self.started = False
        super().__init__(*args, **kwargs)
    async def connect(self):
        # self.room_name = self.scope['url_route']['kwargs']['room_name']
        #print(self.start)
        # print(self.room_name)
        # self.group_name = 'chat_%s' % self.room_name
        self.group_name = 'pads'
        d.draw(5, 'p1', leds.Color.Blue)
        # Joint le groupe
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
        print(text_data)
        text_data_json = json.loads(text_data)
        incoming = Pad(text_data_json['id'],text_data_json['message'])
        print('message : %s' % incoming.message)
        if incoming.id == 'admin':
            if incoming.message == 'start':
                self.started = True
            else:
                self.started = False

        elif not incoming in pads :
            pads.append(incoming)
            idx = pads.index(incoming)
            pads[idx].rank = idx + 1
            # print(pads)
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'pad_message',
                'message': text_data_json['message'],
                'id':text_data_json['id'],
                'player_id':text_data_json['player_id']
            }
        )
    async def pad_message(self, event):
        message = event['message']
        player_id = event['player_id']
        id = event['id']
        await self.send(text_data=json.dumps({
            'message': message,
            'id':id,
            'player_id':player_id
        }))