from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    return render(request, 'index.html', {'room_name': 'pads'})

def pads(request):
    return render(request, 'padclient.html')
