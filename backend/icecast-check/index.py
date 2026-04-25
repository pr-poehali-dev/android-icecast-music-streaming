import json
import socket
import base64
import urllib.request
import urllib.error


def handler(event, context):
    """
    Проверяет соединение с Icecast-сервером: TCP-доступность,
    статус через /status-json.xsl и Basic-авторизацию для source-аккаунта.
    """
    method = event.get('httpMethod', 'GET')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Method not allowed'}),
        }

    try:
        body = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Invalid JSON'}),
        }

    host = (body.get('host') or '').strip()
    port = int(body.get('port') or 8000)
    username = (body.get('username') or 'source').strip()
    password = body.get('password') or ''
    mount = body.get('mountPoint') or '/live.mp3'

    if not host:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'ok': False, 'error': 'Не указан хост'}),
        }

    result = {
        'ok': False,
        'tcp': False,
        'serverInfo': None,
        'authOk': False,
        'mountAvailable': True,
        'error': None,
    }

    try:
        with socket.create_connection((host, port), timeout=5):
            result['tcp'] = True
    except (socket.gaierror, socket.timeout, ConnectionRefusedError, OSError) as e:
        result['error'] = f'Сервер недоступен: {e.__class__.__name__}'
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps(result, ensure_ascii=False),
        }

    status_url = f'http://{host}:{port}/status-json.xsl'
    try:
        req = urllib.request.Request(status_url, headers={'User-Agent': 'AIRWAVE/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8', errors='ignore'))
            icestats = data.get('icestats', {})
            result['serverInfo'] = {
                'admin': icestats.get('admin'),
                'host': icestats.get('host'),
                'serverId': icestats.get('server_id'),
                'serverStart': icestats.get('server_start_iso8601'),
            }
            sources = icestats.get('source', [])
            if isinstance(sources, dict):
                sources = [sources]
            mounts = [s.get('listenurl', '') for s in sources]
            result['mountAvailable'] = not any(mount in m for m in mounts)
    except urllib.error.URLError as e:
        result['error'] = f'Не получили статус Icecast: {e}'

    if password:
        admin_url = f'http://{host}:{port}/admin/stats'
        token = base64.b64encode(f'{username}:{password}'.encode()).decode()
        try:
            req = urllib.request.Request(
                admin_url,
                headers={
                    'Authorization': f'Basic {token}',
                    'User-Agent': 'AIRWAVE/1.0',
                },
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status == 200:
                    result['authOk'] = True
        except urllib.error.HTTPError as e:
            if e.code == 401:
                result['authOk'] = False
                result['error'] = 'Неверный логин или пароль'
            else:
                result['authOk'] = True
        except urllib.error.URLError:
            pass

    result['ok'] = result['tcp'] and (result['authOk'] or not password)

    return {
        'statusCode': 200,
        'headers': cors_headers,
        'body': json.dumps(result, ensure_ascii=False),
    }
