"""Shared application: local HTTP + SQLite, AWS Lambda + DynamoDB."""
import base64
import hmac
import json
import os
import re
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).parent
JST = timezone(timedelta(hours=9))
FIELDS = {'name': 100, 'kana': 100, 'birthDate': 10, 'gender': 20,
          'email': 254, 'phone': 25, 'address': 500, 'startDate': 10,
          'department': 100, 'job': 100, 'employmentType': 30, 'notes': 2000}
REQUIRED = set(FIELDS) - {'gender', 'notes'}
EMPLOYMENT = ['正社員', '契約社員', 'パート・アルバイト', '派遣社員']


def validate(data):
    if not isinstance(data, dict):
        return {}, {'form': 'JSONオブジェクトを送信してください。'}
    clean, errors = {}, {}
    for key, limit in FIELDS.items():
        value = data.get(key, '')
        if not isinstance(value, str):
            errors[key] = '文字列で入力してください。'
            continue
        clean[key] = value.strip()
        if key in REQUIRED and not clean[key]:
            errors[key] = '必須項目です。'
        elif len(clean[key]) > limit:
            errors[key] = f'{limit}文字以内で入力してください。'
    if clean.get('email') and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', clean['email']):
        errors['email'] = 'メールアドレスの形式を確認してください。'
    phone = clean.get('phone', '')
    if phone and (not re.fullmatch(r'\+?[0-9][0-9 -]*[0-9]', phone) or not 10 <= len(re.sub(r'\D', '', phone)) <= 15):
        errors['phone'] = '電話番号は10〜15桁の数字で入力してください（+・ハイフン・空白可）。'
    today = datetime.now(JST).date()
    for key in ('birthDate', 'startDate'):
        if not clean.get(key):
            continue
        try:
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', clean[key]):
                raise ValueError()
            value = date.fromisoformat(clean[key])
            if key == 'birthDate' and value >= today:
                errors[key] = '生年月日は今日より前の日付にしてください。'
            if key == 'startDate' and value < today:
                errors[key] = '入社予定日は今日以降（日本時間）にしてください。'
        except ValueError:
            errors[key] = '有効な日付を入力してください。'
    if clean.get('employmentType') and clean['employmentType'] not in EMPLOYMENT:
        errors['employmentType'] = '雇用形態を選択してください。'
    if clean.get('gender') not in ('', '男性', '女性', 'その他', '回答しない'):
        errors['gender'] = '選択肢から選択してください。'
    return clean, errors


class SQLiteStore:
    def __init__(self, path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.path = path
        with self.connect() as conn:
            conn.execute('CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, body TEXT NOT NULL)')

    @contextmanager
    def connect(self):
        conn = sqlite3.connect(self.path)
        try:
            with conn:
                yield conn
        finally:
            conn.close()

    def put(self, item):
        with self.connect() as conn:
            conn.execute('INSERT INTO applications VALUES (?, ?, ?)', (item['id'], item['createdAt'], json.dumps(item, ensure_ascii=False)))

    def all(self):
        with self.connect() as conn:
            return [json.loads(row[0]) for row in conn.execute('SELECT body FROM applications ORDER BY created_at DESC, id DESC')]

    def get(self, key):
        with self.connect() as conn:
            row = conn.execute('SELECT body FROM applications WHERE id = ?', (key,)).fetchone()
        return json.loads(row[0]) if row else None


class DynamoStore:
    def __init__(self, name):
        import boto3
        self.table = boto3.resource('dynamodb').Table(name)

    def put(self, item):
        self.table.put_item(Item=item, ConditionExpression='attribute_not_exists(id)')

    def all(self):
        # Small training dataset; paginate the scan so results over 1 MB are not lost.
        result = self.table.scan(ConsistentRead=True)
        items = result['Items']
        while 'LastEvaluatedKey' in result:
            result = self.table.scan(ConsistentRead=True, ExclusiveStartKey=result['LastEvaluatedKey'])
            items.extend(result['Items'])
        return sorted(items, key=lambda item: (item['createdAt'], item['id']), reverse=True)

    def get(self, key):
        return self.table.get_item(Key={'id': key}, ConsistentRead=True).get('Item')


_store = None


def get_store():
    global _store
    if _store is None:
        table = os.environ.get('TABLE_NAME')
        _store = DynamoStore(table) if table else SQLiteStore(os.environ.get('DB_PATH', str(ROOT.parent / 'data' / 'applications.db')))
    return _store


def response(status, body, content_type='application/json; charset=utf-8'):
    return {'statusCode': status, 'headers': {'Content-Type': content_type,
            'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
            'Referrer-Policy': 'no-referrer'},
            'body': json.dumps(body, ensure_ascii=False) if content_type.startswith('application/json') else body}


def handle(method, path, headers=None, body='', store=None):
    headers = {key.lower(): value for key, value in (headers or {}).items()}
    if method == 'GET' and path in ('/', '/app.js', '/style.css'):
        filename, kind = {'/': ('index.html', 'text/html'), '/app.js': ('app.js', 'text/javascript'), '/style.css': ('style.css', 'text/css')}[path]
        return response(200, (ROOT / 'static' / filename).read_text(encoding='utf-8'), kind + '; charset=utf-8')
    if path == '/api/config' and method == 'GET':
        return response(200, {'authRequired': bool(os.environ.get('APP_TOKEN')), 'storage': 'AWS DynamoDB' if os.environ.get('TABLE_NAME') else 'ローカル SQLite', 'today': datetime.now(JST).date().isoformat()})
    if not path.startswith('/api/applications'):
        return response(404, {'message': '見つかりません。'})
    token = os.environ.get('APP_TOKEN')
    if os.environ.get('AWS_LAMBDA_FUNCTION_NAME') and not token:
        return response(503, {'message': 'アクセス設定が必要です。'})
    if token and not hmac.compare_digest(headers.get('authorization', '').encode(), ('Bearer ' + token).encode()):
        return response(401, {'message': 'アクセスコードを確認してください。'})
    try:
        store = store or get_store()
        if path == '/api/applications' and method == 'POST':
            if len(body.encode('utf-8')) > 16384:
                return response(413, {'message': '入力内容が大きすぎます。'})
            try:
                data = json.loads(body)
            except (ValueError, TypeError):
                return response(400, {'message': 'JSON形式が不正です。'})
            clean, errors = validate(data)
            if errors:
                return response(400, {'message': '入力内容を確認してください。', 'errors': errors})
            now = datetime.now(JST)
            item = {**clean, 'id': 'ONB-' + now.strftime('%Y%m%d') + '-' + uuid.uuid4().hex, 'createdAt': now.isoformat(), 'status': '申請済み'}
            store.put(item)
            return response(201, item)
        if path == '/api/applications' and method == 'GET':
            columns = ('id', 'name', 'startDate', 'department', 'employmentType', 'createdAt', 'status')
            return response(200, [{key: item[key] for key in columns} for item in store.all()])
        if method == 'GET' and re.fullmatch(r'/api/applications/ONB-\d{8}-[a-f0-9]{32}', path):
            item = store.get(path.rsplit('/', 1)[1])
            return response(200, item) if item else response(404, {'message': '申請が見つかりません。'})
        return response(404, {'message': '見つかりません。'})
    except Exception as exc:
        # Do not put names, request bodies or credentials in CloudWatch.
        print('application_error:', type(exc).__name__)
        return response(500, {'message': '保存・取得に失敗しました。時間をおいて再度お試しください。'})


def lambda_handler(event, context):
    body = event.get('body') or ''
    if event.get('isBase64Encoded'):
        try:
            body = base64.b64decode(body, validate=True).decode('utf-8')
        except (ValueError, UnicodeError):
            return response(400, {'message': 'リクエストが不正です。'})
    return handle(event['requestContext']['http']['method'], event.get('rawPath', '/'), event.get('headers'), body)
