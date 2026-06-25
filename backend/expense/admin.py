from django.contrib import admin
from .models import Expense,Group
# Register your models here.
admin.site.register(Group)
admin.site.register(Expense)