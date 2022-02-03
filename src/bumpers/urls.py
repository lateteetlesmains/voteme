from django.urls import path
from .views import bumper, bumpers, index, reset

urlpatterns = [
    path('', index, name='bumpers-index'),
    path('bumpers/', bumpers, name='bumpers-management'),
    path('bumper/', bumper, name='bumper-management'),
    path('reset/', reset, name='bumper-reset')
]