from rest_framework import serializers
from .models import Group,Expense

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name","created_by", "created_at"]

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["id", "group", "title","amount", "paid_by","created_at"]