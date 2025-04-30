import os, csv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from mutagen.id3 import ID3

# Configuration
UPLOAD_DIR = os.path.join(os.getcwd(), 'uploads')
MEDIA_TYPES = ['music', 'videos', 'photos']
USER_FILE = 'users.csv'
LISTS_FILE = 'lists.csv'

app = Flask(__name__)
CORS(app)

# Ensure folders and user CSV exist
def ensure_setup():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    for t in MEDIA_TYPES:
        os.makedirs(os.path.join(UPLOAD_DIR, t), exist_ok=True)
    if not os.path.exists(USER_FILE):
        with open(USER_FILE, 'w', newline='') as f:
            csv.writer(f).writerow(['username','email','password'])
    if not os.path.exists(LISTS_FILE):
        with open(LISTS_FILE, 'w', newline='') as f:
            csv.writer(f).writerow(['list','name'])

ensure_setup()

# Extract embedded cover art into a .jpg
def extract_thumbnail(mp3_path, media_type, filename):
    try:
        tags = ID3(mp3_path)
        pics = tags.getall('APIC')
        if pics:
            img_data = pics[0].data
            thumb_path = os.path.join(UPLOAD_DIR, media_type, filename + '.jpg')
            with open(thumb_path, 'wb') as img:
                img.write(img_data)
    except Exception as e:
        print('Thumbnail extraction error:', e)

# User registration
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    u, e, p = data['username'], data['email'], data['password']
    with open(USER_FILE, newline='') as f:
        for row in csv.DictReader(f):
            if row['username'] == u:
                return jsonify({'error':'User exists'}), 400
    with open(USER_FILE, 'a', newline='') as f:
        csv.writer(f).writerow([u, e, p])
    return jsonify({'success': True})

# User login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    u, p = data.get('username'), data.get('password')
    try:
        with open(USER_FILE) as f:
            lines = f.read().splitlines()[1:]
    except:
        return jsonify({'error': 'Server error'}), 500
    for line in lines:
        user, email, pwd = [x.strip() for x in line.split(',')]
        if user == u and pwd == p:
            return jsonify({'success': True, 'username': u})
    return jsonify({'error': 'Invalid'}), 401

# List media (excluding thumbnails)
@app.route('/api/<media_type>', methods=['GET'])
def list_media(media_type):
    if media_type not in MEDIA_TYPES:
        return jsonify({'error':'Bad type'}), 400
    files = os.listdir(os.path.join(UPLOAD_DIR, media_type))
    return jsonify([f for f in files if not f.lower().endswith('.jpg')])

# Upload media and extract thumbnail if MP3
@app.route('/api/<media_type>/upload', methods=['POST'])
def upload_media(media_type):
    file = request.files['file']
    fn = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_DIR, media_type, fn)
    file.save(save_path)
    if media_type == 'music':
        extract_thumbnail(save_path, media_type, fn)
    return jsonify({'success': True, 'filename': fn})

# Serve media files
@app.route('/api/<media_type>/<filename>', methods=['GET'])
def serve_media(media_type, filename):
    return send_from_directory(os.path.join(UPLOAD_DIR, media_type), filename)

# Serve corresponding thumbnail if exists
@app.route('/api/<media_type>/thumbnail/<filename>', methods=['GET'])
def serve_thumbnail(media_type, filename):
    thumb = filename + '.jpg'
    return send_from_directory(os.path.join(UPLOAD_DIR, media_type), thumb)

def get_all_lists():
    with open(LISTS_FILE) as f:
        return sorted({row['list'] for row in csv.DictReader(f)})

@app.route('/api/lists', methods=['GET'])
def get_lists():
    return jsonify(get_all_lists())

@app.route('/api/list/<list_name>', methods=['GET'])
def list_list(list_name):
    result = []
    with open(LISTS_FILE) as f:
        for row in csv.DictReader(f):
            if row['list'] == list_name:
                result.append(row['name'])
    return jsonify(result)

@app.route('/api/list/<list_name>/<filename>', methods=['POST'])
def add_to_list(list_name, filename):
    entries = []
    with open(LISTS_FILE) as f:
        entries = list(csv.DictReader(f))
    if not any(e['list']==list_name and e['name']==filename for e in entries):
        with open(LISTS_FILE, 'a', newline='') as f:
            csv.writer(f).writerow([list_name, filename])
    return jsonify({'success': True})

@app.route('/api/list/<list_name>/<filename>', methods=['DELETE'])
def remove_from_list(list_name, filename):
    rows = []
    with open(LISTS_FILE) as f:
        rows = [r for r in csv.DictReader(f) if not (r['list']==list_name and r['name']==filename)]
    with open(LISTS_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['list','name'])
        for r in rows:
            writer.writerow([r['list'], r['name']])
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)