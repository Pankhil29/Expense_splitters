from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Group, Expense
from .serializers import GroupSerializer, ExpenseSerializer
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# 1. GET ALL GROUPS (Isolated: Only show groups where user is a member)
@api_view(['GET'])
@permission_classes([IsAuthenticated]) 
def get_user_groups(request):
    # prefetch_related use karne se members ka data ek baar me memory me aa jata hai
    groups = Group.objects.filter(members=request.user).prefetch_related('members')
    serializer = GroupSerializer(groups, many=True)
    return Response(serializer.data)

# 2. CREATE GROUP (Auto-secure: Request user becomes creator and member)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    name = request.data.get('name')
    password = request.data.get('password') # Frontend se password liya
    
    if not name or not password:
        return Response({"error": "Name aur Password dono zaroori hain!"}, status=status.HTTP_400_BAD_REQUEST)
        
    group = Group.objects.create(name=name, password=password, created_by=request.user)
    group.members.add(request.user)
    
    return Response({
        "id": group.id,
        "name": group.name,
        "created_by": group.created_by.username
    }, status=status.HTTP_201_CREATED)


# 3. ADD EXPENSE (Secure: Check if user belongs to the group)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_expense(request):
    amount = request.data.get("amount")

    if amount is not None and int(amount) <= 0:
        return Response({"error" : "Amount hamesa 0 se bada hona chahiye"},status=status.HTTP_400_BAD_REQUEST)
    group_id = request.data.get('group')
    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return Response({"error": "Group nahi mila!"}, status=status.HTTP_404_NOT_FOUND)

    # 🎯 SECURITY CHECK: Kya kharcha jodne wala banda is group me hai?
    if request.user not in group.members.all():
        return Response({"error": "Aap is group ke member nahi hain!"}, status=status.HTTP_403_FORBIDDEN)

    serializer = ExpenseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 4. GROUP BALANCES (Secure & Optimized)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def group_balances(request, group_id):
    try:
        # select_related aur prefetch_related se queries kam ho jati hain (Scalability Fix)
        group = Group.objects.prefetch_related('members').get(id=group_id)
        if request.user not in group.members.all():
            return Response({"error": "Aap is group ke member nahi hain!"}, status=status.HTTP_403_FORBIDDEN)
        client_password = request.data.get('group_password')
        if group.password != client_password:
            return Response({"error": "WRONG_PASSWORD", "message": "Galat password! Access denied."}, status=status.HTTP_401_UNAUTHORIZED)
    except Group.DoesNotExist:
        return Response({"error": "Group nahi mila!"}, status=status.HTTP_404_NOT_FOUND)

    # 🎯 SECURITY CHECK: Koi bahar ka banda kisi aur ke group ka balance na dekh sake
    if request.user not in group.members.all():
        return Response({"error": "Aapko is group ka hisab dekhne ki ijazat nahi hai!"}, status=status.HTTP_403_FORBIDDEN)

    # select_related('paid_by') se database par load 90% kam ho jayega
    expenses = Expense.objects.filter(group=group).select_related('paid_by')
    total_spending = sum(exp.amount for exp in expenses)

    group_members = group.members.all()
    total_members = group_members.count()
    
    share_per_person = total_spending / total_members if total_members > 0 else 0

    how_much_each_paid = {}
    for exp in expenses:
        username = exp.paid_by.username
        how_much_each_paid[username] = how_much_each_paid.get(username, 0) + exp.amount

    user_status = []
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
            "net_balance": round(net_balance, 2),
            "status": status_text
        })

    members_list = [{"id": u.id, "username": u.username} for u in group_members]

    return Response({
        "group_name": group.name,
        "total_expense": total_spending,
        "share_per_person": round(share_per_person, 2),
        "users_breakdown": user_status,
        "members": members_list,
        "total_members" : total_members
    })

# 5. DELETE GROUP (Only creator can delete)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_group(request, id):
    try:
        group = Group.objects.get(id=id)
        # 🎯 SECURITY CHECK: Sirf group banane wala hi delete kar sake
        if group.created_by != request.user:
            return Response({"error": "Sirf admin/creator hi group delete kar sakta hai!"}, status=status.HTTP_403_FORBIDDEN)
        
        group.delete()
        return Response({"message" : "Group Deleted Successfully"}, status=status.HTTP_200_OK)
    except Group.DoesNotExist:
        return Response({"error": "Group nahi mila!"}, status=status.HTTP_404_NOT_FOUND)

# 6. ADD MEMBER TO GROUP (Secure)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_member_to_group(request, group_id):
    user_id = request.data.get('user_id')
    try:
        group = Group.objects.get(id=group_id)
        
        # 🎯 SECURITY CHECK: Kya add karne wala banda khud is group ka member hai?
        if request.user not in group.members.all():
            return Response({"error": "Aap is group me kisi ko add nahi kar sakte!"}, status=status.HTTP_403_FORBIDDEN)
            
        user = User.objects.get(id=user_id)
        group.members.add(user) 
        return Response({"message": f"{user.username} group me add ho gaya!"}, status=status.HTTP_200_OK)
    except Group.DoesNotExist:
        return Response({"error": "Group nahi mila!"}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({"error": "User nahi mila!"}, status=status.HTTP_404_NOT_FOUND)

# 7. GET ALL USERS (To search and add friends)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    users = User.objects.all().exclude(id=request.user.id) # Khud ko chodhkar baaki sabko dikhao
    users_data = [{"id": u.id, "username": u.username} for u in users]
    return Response(users_data)

# 8. REGISTER USER (Public endpoint with lowercase check)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    if not username or not password:
        return Response({"error" : "Username aur password khali nahi ho sakte"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validation improvement for production
    if User.objects.filter(username__iexact=username).exists():
        return Response({"error" : "Yeh username pehle se le rakha hai kisi ne."}, status=status.HTTP_400_BAD_REQUEST)

    if email and User.objects.filter(email__iexact=email).exists():
        return Response({"error" : "Yeh Email pehle se registered hai."}, status=status.HTTP_400_BAD_REQUEST) 

    user = User.objects.create_user(username=username, password=password, email=email)
    refresh = RefreshToken.for_user(user)

    return Response({
        'message' : 'User Registered Successfully',
        'refresh' : str(refresh),
        'access' : str(refresh.access_token),
        'username' : user.username
    }, status=status.HTTP_201_CREATED)