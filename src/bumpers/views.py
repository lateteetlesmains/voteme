from django.http import HttpResponse
from django.shortcuts import render
from .models import Bumpers
# Create your views here.

def index(request):
    return render(request, "index.html")

def bumpers(request):
    players = Bumpers.objects.all()
    return render(request, "bumpers.html", context={'players': players})

def bumper(request):

    print(request.GET["id"])
    b = Bumpers()
    b.rank = request.GET["id"]
    b.save()
    return HttpResponse('ok')

def reset(request):
    Bumpers.objects.all().delete()
    return index(request)