import json
import base64
import urllib.request
import urllib.error
import urllib.parse


def handler(event, context):
    """
    Отправляет ICY-метаданные (название трека) на Icecast через /admin/metadata.
    Использует Basic auth source-аккаунта.
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
    title = body.get('title') or ''
    artist = body.get('artist') or ''

    if not host or not password or not title:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'ok': False, 'error': 'host/password/title обязательны'}),
        }

    song = f'{artist} - {title}' if artist else title
    params = urllib.parse.urlencode({
        'mount': mount,
        'mode': 'updinfo',
        'song': song,
    })

    url = f'http://{host}:{port}/admin/metadata?{params}'
    auth = base64.b64encode(f'{username}:{password}'.encode()).decode()

    try:
        req = urllib.request.Request(
            url,
            headers={
                'Authorization': f'Basic {auth}',
                'User-Agent': 'AIRWAVE/1.0',
            },
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            text = resp.read().decode('utf-8', errors='ignore')
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps(
                    {'ok': resp.status == 200, 'song': song, 'response': text[:300]},
                    ensure_ascii=False,
                ),
            }
    except urllib.error.HTTPError as e:
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps(
                {'ok': False, 'error': f'HTTP {e.code}', 'song': song},
                ensure_ascii=False,
            ),
        }
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'ok': False, 'error': str(e)}, ensure_ascii=False),
        }
