"""
Админ-функция для управления заявками ДЗ. v2 — добавлен subject.
GET / — список всех заявок
PUT / — обновить статус и решение заявки { id, status, solution }
"""
import json
import os
import psycopg2


def get_db():
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f'-c search_path={schema}')
    return conn


def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, photo_url, status, solution, created_at FROM homework_requests ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        conn.close()

        requests = [
            {
                'id': str(r[0]),
                'photo_url': r[1],
                'status': r[2],
                'solution': r[3],
                'created_at': r[4].isoformat() if r[4] else None
            }
            for r in rows
        ]
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps(requests)}

    if method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        request_id = body.get('id')
        status = body.get('status')
        solution = body.get('solution')

        if not request_id:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'id required'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "UPDATE homework_requests SET status = %s, solution = %s, updated_at = NOW() WHERE id = %s",
            (status, solution, request_id)
        )
        conn.commit()
        conn.close()

        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'method not allowed'})}