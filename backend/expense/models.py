from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Group(models.Model):
    name = models.CharField(max_length=150)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    members = models.ManyToManyField(User, related_name="app_groups")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Expense(models.Model):
    group = models.ForeignKey(Group,on_delete=models.CASCADE)
    title = models.CharField(max_length=250)
    amount = models.IntegerField()
    paid_by = models.ForeignKey(User,on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.title} - {self.amount}"
        



