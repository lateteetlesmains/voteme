from django.db import models

# Create your models here.
class Bumpers(models.Model):
    rank = models.IntegerField()
    mac_address = models.CharField( max_length=50)

    def __str__(self):
        return str(self.rank)