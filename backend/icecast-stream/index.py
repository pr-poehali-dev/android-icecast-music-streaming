import json
import base64
import socket


def handler(event, context):
    """
    Принимает аудио-чанк (base64) и отправляет на Icecast через TCP SOURCE-протокол.
    Каждый вызов - отдельный SOURCE PUT с авторизацией. Подходит для последовательной
    отправки коротких MP3/OGG/AAC чанков от MediaRecorder.
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
    fmt = (body.get('format') or 'MP3').upper()
    bitrate = int(body.get('bitrate') or 128)
    sample_rate = int(body.get('sampleRate') or 44100)
    channels = 2 if (body.get('channels') or 'Stereo') == 'Stereo' else 1
    station_name = body.get('stationName') or 'AIRWAVE'
    description = body.get('description') or ''
    genre = body.get('genre') or 'Various'
    url = body.get('url') or ''
    audio_b64 = body.get('audio') or ''

    if not host or not password or not audio_b64:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'ok': False, 'error': 'host/password/audio обязательны'}),
        }

    try:
        audio_bytes = base64.b64decode(audio_b64)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'ok': False, 'error': f'bad base64: {e}'}),
        }

    content_type_map = {
        'MP3': 'audio/mpeg',
        'OGG': 'application/ogg',
        'AAC': 'audio/aac',
    }
    content_type = content_type_map.get(fmt, 'audio/mpeg')

    auth = base64.b64encode(f'{username}:{password}'.encode()).decode()

    headers_lines = [
        f'PUT {mount} HTTP/1.1',
        f'Host: {host}:{port}',
        f'Authorization: Basic {auth}',
        f'User-Agent: AIRWAVE/1.0',
        f'Content-Type: {content_type}',
        f'Ice-Public: 1',
        f'Ice-Name: {station_name}',
        f'Ice-Description: {description}',
        f'Ice-Genre: {genre}',
        f'Ice-URL: {url}',
        f'Ice-Bitrate: {bitrate}',
        f'Ice-Audio-Info: ice-samplerate={sample_rate};ice-bitrate={bitrate};ice-channels={channels}',
        f'Content-Length: {len(audio_bytes)}',
        f'Expect: 100-continue',
        '',
        '',
    ]
    request_head = '\r\n'.join(headers_lines).encode()

    sock = None
    try:
        sock = socket.create_connection((host, port), timeout=10)
        sock.settimeout(10)
        sock.sendall(request_head)

        try:
            sock.recv(1024)
        except socket.timeout:
            pass

        chunk_size = 4096
        for i in range(0, len(audio_bytes), chunk_size):
            sock.sendall(audio_bytes[i:i + chunk_size])

        sock.shutdown(socket.SHUT_WR)
        try:
            response = sock.recv(2048).decode('utf-8', errors='ignore')
        except socket.timeout:
            response = ''

        ok = '200 OK' in response or '100 Continue' in response or response == ''
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps(
                {'ok': ok, 'bytes': len(audio_bytes), 'response': response[:300]},
                ensure_ascii=False,
            ),
        }
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'ok': False, 'error': str(e)}, ensure_ascii=False),
        }
    finally:
        if sock:
            try:
                sock.close()
            except Exception:
                pass
