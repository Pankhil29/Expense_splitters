from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import AllowAny
from .models import Group,Expense
from .serializers import GroupSerializer,ExpenseSerializer
from rest_framework import status
from django.contrib.auth.models import User
# Create your views here.

@api_view(['GET'])
@permission_classes([AllowAny])
def get_groups(request):
    groups = Group.objects.all()
    serializer = GroupSerializer(groups,many=True)
    print(serializer)
    print("--------------------------")
    print(serializer.data)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_group(request):

    serializer = GroupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data,status=status.HTTP_201_CREATED)
    print(serializer.errors)
    print(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_expense(request):
    expense = Expense.objects.all()
    serializer = ExpenseSerializer(expense,many=True)
    print(serializer.data)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def add_expense(request):
    serializer = ExpenseSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        # print(serializer.data)
        return Response(serializer.data,status=status.HTTP_201_CREATED)
    return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def group_balances(request, group_id):
    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return Response({"error": "Group nahi mila!"}, status=status.HTTP_404_NOT_FOUND)

    expenses = Expense.objects.filter(group=group)
    total_spending = sum(exp.amount for exp in expenses)

    # 🔥 DYNAMIC MEMBERS COUNT (Chahe 3 hon ya 15, ye automatic count karega)
    group_members = group.members.all()
    total_members = group_members.count()
    
    share_per_person = total_spending / total_members if total_members > 0 else 0

    how_much_each_paid = {}
    for exp in expenses:
        username = exp.paid_by.username
        how_much_each_paid[username] = how_much_each_paid.get(username, 0) + exp.amount

    user_status = []
    
    # 🔥 Ab loop sirf unhi users par chalega jo is group ke members hain
    for user in group_members:
        paid = how_much_each_paid.get(user.username, 0)
        net_balance = paid - share_per_person
        
        if net_balance > 0:
            status_text = f"Ko ₹{round(net_balance, 2)} milenge."
        elif net_balance < 0:
            status_text = f"Ko ₹{round(abs(net_balance), 2)} dene hain."
        else:
            status_text = "Ka hisab barabar hai."
            
        user_status.append({
            "id": user.id,
            "username": user.username,
            "paid": paid,
            "net_balance": net_balance,
            "status": status_text
        })

    # Frontend ki help ke liye hum group ke members ki list bhi response me bhej rahe hain
    members_list = [{"id": u.id, "username": u.username} for u in group_members]

    data = {
        "group_name": group.name,
        "total_expense": total_spending,
        "share_per_person": round(share_per_person, 2),
        "users_breakdown": user_status,
        "members": members_list,
        "total_members" : total_members # 🔥 Frontend dropdown me dikhane ke liye
    }

    return Response(data)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_group(request, id):
    try:
        group = Group.objects.filter(id=id)
        group.delete()
        return Response({"message" : "Group Deleted Succesfully"},status=status.HTTP_200_OK)
    except Group.DoesNotExist:
        return Response({"error": "Group nahi mila!"}, status=status.HTTP_404_NOT_FOUND)
    

@api_view(['POST'])
@permission_classes([AllowAny])
def add_member_to_group(request, group_id):
    # Frontend se hum user_id bhejenge: {"user_id": 2}
    user_id = request.data.get('user_id')
    
    try:
        group = Group.objects.get(id=group_id)
        user = User.objects.get(id=user_id)
        
        # 🔥 Many-to-Many ka magic: user ko group me add kar diya
        group.members.add(user) 
        
        return Response({"message": f"{user.username} group me add ho gaya!"}, status=status.HTTP_200_OK)
    except Group.DoesNotExist:
        return Response({"error": "Group nahi mila!"}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({"error": "User nahi mila!"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_users(request):
    users = User.objects.all()
    # Ek simple list banakar bhej di
    users_data = [{"id": u.id, "username": u.username} for u in users]
    return Response(users_data)