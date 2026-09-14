import base64
import json
import os
import sys
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
import app


class ApplicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = app.SQLiteStore(str(Path(self.temp.name) / 'test.db'))
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start()
        self.data = dict(name='試験 太郎', kana='シケン タロウ', birthDate='2000-01-01',
                         gender='回答しない', email='test@example.com', phone='090-1234-5678',
                         address='テスト用住所', startDate=datetime.now(app.JST).date().isoformat(),
                         department='開発部', job='エンジニア', employmentType='正社員', notes='架空データ')

    def tearDown(self):
        self.env.stop()
        self.temp.cleanup()

    def post(self, data):
        return app.handle('POST', '/api/applications', body=json.dumps(data), store=self.store)

    def test_create_list_detail_and_persistence(self):
        result = self.post(self.data)
        self.assertEqual(result['statusCode'], 201)
        item = json.loads(result['body'])
        reopened = app.SQLiteStore(self.store.path)
        listing = app.handle('GET', '/api/applications', store=reopened)
        rows = json.loads(listing['body'])
        self.assertEqual(rows[0]['id'], item['id'])
        self.assertNotIn('address', rows[0])
        detail = app.handle('GET', '/api/applications/' + item['id'], store=reopened)
        self.assertEqual(json.loads(detail['body'])['email'], self.data['email'])
        self.assertEqual(item['status'], '申請済み')

    def test_each_required_field(self):
        for field in app.REQUIRED:
            with self.subTest(field=field):
                result = self.post({**self.data, field: '  '})
                self.assertEqual(result['statusCode'], 400)
                self.assertIn(field, json.loads(result['body'])['errors'])
        self.assertEqual(self.store.all(), [])

    def test_bad_formats_dates_types_and_lengths(self):
        yesterday = (datetime.now(app.JST).date() - timedelta(days=1)).isoformat()
        for key, value in [('email','bad@'), ('phone','abc09012345678'), ('phone','123'),
                           ('startDate',yesterday), ('startDate','2026-02-30'),
                           ('birthDate','2999-01-01'), ('name',None), ('name','a'*101),
                           ('employmentType','管理者'), ('gender','invalid')]:
            with self.subTest(key=key, value=value):
                self.assertEqual(self.post({**self.data,key:value})['statusCode'], 400)

    def test_optional_fields_and_valid_international_phone(self):
        self.assertEqual(self.post({**self.data, 'gender':'', 'notes':'', 'phone':'+81 90 1234 5678'})['statusCode'],201)

    def test_id_and_status_are_server_owned(self):
        item = json.loads(self.post({**self.data, 'id':'fake','status':'承認済み'})['body'])
        self.assertNotEqual(item['id'],'fake')
        self.assertEqual(item['status'],'申請済み')

    def test_malformed_json_and_oversize(self):
        self.assertEqual(app.handle('POST','/api/applications',body='{',store=self.store)['statusCode'],400)
        self.assertEqual(self.post([])['statusCode'],400)
        self.assertEqual(app.handle('POST','/api/applications',body='a'*16385,store=self.store)['statusCode'],413)

    def test_access_control(self):
        with patch.dict(os.environ, {'APP_TOKEN':'test-secret'}):
            for method in ('GET','POST'):
                self.assertEqual(app.handle(method,'/api/applications',store=self.store)['statusCode'],401)
            self.assertEqual(app.handle('GET','/api/applications',{'Authorization':'Bearer test-secret'},store=self.store)['statusCode'],200)
        with patch.dict(os.environ, {'AWS_LAMBDA_FUNCTION_NAME':'function'}):
            self.assertEqual(app.handle('GET','/api/applications',store=self.store)['statusCode'],503)

    def test_missing_detail_and_static(self):
        self.assertEqual(app.handle('GET','/api/applications/ONB-20260911-'+'a'*32,store=self.store)['statusCode'],404)
        self.assertEqual(app.handle('GET','/../../app.py')['statusCode'],404)
        self.assertIn('text/html',app.handle('GET','/')['headers']['Content-Type'])

    def test_database_failure_is_not_success(self):
        with patch.object(self.store,'put',side_effect=RuntimeError('private data')):
            result = self.post(self.data)
        self.assertEqual(result['statusCode'],500)
        self.assertNotIn('private data',result['body'])

    def test_lambda_proxy_base64(self):
        event = {'requestContext':{'http':{'method':'POST'}}, 'rawPath':'/api/applications',
                 'body':base64.b64encode(json.dumps(self.data).encode()).decode(), 'isBase64Encoded':True}
        with patch.object(app,'get_store',return_value=self.store):
            self.assertEqual(app.lambda_handler(event,None)['statusCode'],201)

    def test_dynamo_scan_pagination(self):
        from unittest.mock import MagicMock
        store = object.__new__(app.DynamoStore)
        store.table = MagicMock()
        store.table.scan.side_effect = [{'Items':[{'id':'a','createdAt':'1'}],'LastEvaluatedKey':{'id':'a'}}, {'Items':[{'id':'b','createdAt':'2'}]}]
        self.assertEqual([row['id'] for row in store.all()], ['b','a'])
        store.table.scan.assert_called_with(ConsistentRead=True,ExclusiveStartKey={'id':'a'})


if __name__ == '__main__':
    unittest.main()
