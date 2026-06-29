# 1. Base image chuni (Python ka official version virtual box me)
FROM python:3.11-slim

# 2. Container ke andar ek folder banaya jahan code rahega
WORKDIR /app

# 3. Code me koi rukawat na aaye isliye python buffering band ki
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 4. Requirements file ko copy kiya aur install kiya
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 5. Pura backend ka code container ke andar copy kar diya
COPY . /app/

# 6. Command batayi ki container start hote hi server kaise chalega
# Puraani CMD line ko hata kar ye daal do:
CMD ["sh", "-c", "python manage.py migrate && python -c \"from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'SuperPassword123')\" && python manage.py runserver 0.0.0.0:8000"]
