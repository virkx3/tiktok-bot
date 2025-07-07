FROM python:3.11-slim

WORKDIR /app
COPY . .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN python -m playwright install

CMD ["python", "index.py"]
