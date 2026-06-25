from django.urls import path
from .views import get_groups, create_group,add_expense,get_expense,group_balances,delete_group,get_all_users,add_member_to_group

urlpatterns = [
    path("groups/",get_groups,name="get_group"),
    path("groups/create/",create_group,name="create_group"),
    path("expenses/",get_expense,name="get_expense"),
    path("expenses/add/",add_expense,name="create_expense"),
    path("groups/<int:group_id>/balances/",group_balances,name="group_balances"),
    path("groups/<int:id>/delete/",delete_group,name="delete_group"),
    path('groups/<int:group_id>/add-member/',add_member_to_group),
    path('users/', get_all_users), # Saare users pane ke liye

]


# flow of the data
# 1.browser ma link open karo to phela middleware ma jay and check Logs,Security,CORS
# 2.pachi te urls.py ma jay and url check thay
# 3.pachi view function hoy ae call thay
# 4.view ni uper decorators hoy ae run thay and permission_Classes check thay
# 5.pachi view function chalse
# 6.pachi db mathi badha data lese aetle db mathi lo aetle ae python object ma hoy. tene serializer ne apvama ave 
# 7.serializer py obj ne ---> JSON ma and JSON --> Py
# 8.pachi Response return thay frontend jode and react dwra data show thay.


# why 2 var json ma convert in view and react
# in view aa complex db na output ne python object ma convert kari de and and response.data karine frontend ma mokli de
# in react aa jayare pelo lifafo ave tyare aema HTTP Response packet ma HTTP status code,Header,Body jeni ander JSON hoy 
# have react ma response.json() ae inbuilt method che je akha packet mathi Body mathi JSON output kade che.

# fetch Chitti mokle.