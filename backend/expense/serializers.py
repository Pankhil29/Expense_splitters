from rest_framework import serializers
from .models import Group, Expense


class GroupSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    class Meta:
        model = Group
        fields = ['id', 'name', 'created_by', 'created_by_username', 'members', 'created_at']
        read_only_fields = ["created_by", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None
        group = Group.objects.create(name=validated_data["name"], created_by=user)
        if user is not None:
            group.members.add(user)
        return group

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["id", "group", "title","amount", "paid_by","created_at"]