from email import message
import json
from tkinter import N
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

# class PadConsumer(WebsocketConsumer):
#     def connect(self):
#         self.accept()

#     def disconnect(self, close_code):
#         pass

#     def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message = text_data_json['message']

#         self.send(text_data=json.dumps({
#             'message': message
#         }))


class PadConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        print(self.room_name)
        self.romm_group_name = 'chat_%s' % self.room_name
        # Joint le groupe
        async_to_sync(self.channel_layer.group_add)(
            self.romm_group_name,
            self.channel_name
        )
        
        self.accept()
        
       

    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self.romm_group_name,
            self.channel_name
        )

    def receive(self, text_data=None):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

    
        async_to_sync(self.channel_layer.group_send)(
            self.romm_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )
    def chat_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps({
            'message': message
        }))