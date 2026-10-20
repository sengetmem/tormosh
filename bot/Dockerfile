# Тот же базовый образ, что у бота бюджета на этом сервере, — слои общие, место не тратится
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY bot.py .

CMD ["python", "-u", "bot.py"]
