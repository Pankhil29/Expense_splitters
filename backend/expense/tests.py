from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import Group

class SplitwiseAPITests(APITestCase):

    def setUp(self):
        # Test shuru hone se pehle dummy users bana lo
        self.user1 = User.objects.create_user(username="user1", password="testpassword123")
        self.user2 = User.objects.create_user(username="user2", password="testpassword123")
        
        # Login simulation for JWT
        self.client.force_authenticate(user=self.user1)

    def test_create_group_successfully(self):
        """Edge Case 1: Normal flow me group sahi password se banna chahiye"""
        url = reverse('create_group') # urls.py me name='create_group' hona chahiye
        data = {'name': 'Goa Trip', 'password': 'goa@secure123'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Group.objects.count(), 1)
        self.assertEqual(Group.objects.get().name, 'Goa Trip')

    def test_create_expense_with_negative_amount(self):
        """Edge Case 2: Negative expense block hona chahiye (400 Bad Request)"""
        # Pehle ek dummy group banao
        group = Group.objects.create(name="Mumbai Trip", password="123", created_by=self.user1)
        group.members.add(self.user1, self.user2)

        url = reverse('create_expense') # expenses/add/ waala endpoint name
        invalid_data = {
            "group": group.id,
            "title": "Wrong Entry",
            "amount": -500,  # 🚨 Negative Amount Edge Case
            "paid_by": self.user1.id
        }

        response = self.client.post(url, invalid_data, format='json')
        
        # Test check karega ki hamara backend is negative value ko reject kar raha hai ya nahi
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_expense_split_rounding_off(self):
        """Edge Case 3: Floating point rounding check (100 divided by 3)"""
        group = Group.objects.create(name="Rounding Group", password="123", created_by=self.user1)
        # 3 members add kiye
        group.members.add(self.user1, self.user2)
        
        # Manlo system me ek aur dummy user hai use bhi jodh dete hain
        user3 = User.objects.create_user(username="user3", password="123")
        group.members.add(user3)

        url = reverse('create_expense')
        data = {
            "group": group.id,
            "title": "Chai Bill",
            "amount": 100,  # 100 / 3 = 33.3333...
            "paid_by": self.user1.id
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Yahan tum apna balance calculation logic hit karke check kar sakte ho 
        # ki float data sahi se return ho raha hai ya nahi!

# prasang party plot janak puri soc. 