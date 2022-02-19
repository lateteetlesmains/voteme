from django.http import HttpResponse
from django.shortcuts import render


def pads(request):
    return render(request, 'padclients.html')
