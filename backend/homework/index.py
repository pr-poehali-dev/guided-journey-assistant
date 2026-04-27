"""
Бэкенд для сервиса помощи с ДЗ. v2 — добавлен subject.
POST / — создать заявку (загрузить фото, сохранить в S3, создать запись в БД)
GET /?id=... — получить статус и решение по заявке
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3
from datetime import datetime


def get_db():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={schema}')
    return conn


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )


def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        photo_b64 = body.get('photo')
        if not photo_b64:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'photo required'})}

        # Сохраняем фото в S3
        photo_data = base64.b64decode(photo_b64.split(',')[-1])
        file_key = f"homework/{uuid.uuid4()}.jpg"
        s3 = get_s3()
        s3.put_object(Bucket='files', Key=file_key, Body=photo_data, ContentType='image/jpeg')
        photo_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"

        # Создаём заявку в БД
        conn = get_db()
        cur = conn.cursor()
        request_id = str(uuid.uuid4())
        cur.execute(
            "INSERT INTO homework_requests (id, photo_url, status) VALUES (%s, %s, %s)",
            (request_id, photo_url, 'pending')
        )
        conn.commit()
        conn.close()

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'id': request_id, 'status': 'pending'})
        }

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        request_id = params.get('id')
        if not request_id:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id required'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, photo_url, status, solution, created_at FROM homework_requests WHERE id = %s",
            (request_id,)
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'not found'})}

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'id': str(row[0]),
                'photo_url': row[1],
                'status': row[2],
                'solution': row[3],
                'created_at': row[4].isoformat() if row[4] else None
            })
        }

    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'method not allowed'})}