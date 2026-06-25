# Expense Splitter (Mini Splitwise) - Full Stack

A dynamic expense splitting application built with **Django Rest Framework (DRF)** and **React (Vite)**. The entire ecosystem is fully containerized using **Docker** and managed via **Docker Compose** for seamless deployment.

## 🚀 Features

- **Dynamic Group Management:** Create, view, and delete expense groups live without page refreshes.
- **Member Association:** Dynamically add existing users to specific groups.
- **Real-time Splitwise Logic:** Automated debt settlement engine that calculates exactly who owes whom based on group members.
- **Full-Stack Dockerization:** Isolated container environments for both backend and frontend services.

## 🛠️ Tech Stack

- **Backend:** Python, Django, Django Rest Framework (DRF)
- **Frontend:** JavaScript, React.js (Vite), Context/State management
- **DevOps:** Docker, Docker Compose

---

## 💻 Local Setup & Installation

### Prerequisites

Make sure you have **Docker Desktop** installed and running on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/Pankhil29/Expense_splitters.git(https://github.com/Pankhil29/Expense_splitters.git)
cd Expense-Splitter-FullStack
```

### 2. Configure Environment Variables
Create a .env file inside the backend/ directory:

DEBUG=True
SECRET_KEY=your_django_secret_key

### 3. Run the Application with Docker
Execute the following command in the root directory to build and spin up the containers:

docker-compose up --build

### 4. Database Migrations (Inside Docker Container)
To create tables and setup the admin panel, run these commands in a new terminal:

Bash
# Run Migrations
docker-compose exec backend python manage.py migrate

# Create Superuser
docker-compose exec backend python manage.py createsuperuser