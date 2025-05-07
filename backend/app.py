# app.py

import os
import csv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from mutagen.id3 import ID3

# Configuration
UPLOAD_DIR = os.path.join(os.getcwd(), 'uploads')
MEDIA_TYPES = ['music', 'videos', 'photos']
USER_FILE = os.path.join('data', 'users.csv')
LISTS_FILE = os.path.join('data', 'lists.csv')
BOOKMARKS_FILE = os.path.join('data', 'bookmarks.csv')

app = Flask(__name__)
CORS(app)

# Ensure folders and CSVs exist
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
    if not os.path.exists(BOOKMARKS_FILE):
        with open(BOOKMARKS_FILE, 'w', newline='') as f:
            csv.writer(f).writerow(['media_type', 'filename'])

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
    if media_type == 'photos':
        return jsonify(files)
    else:
        return jsonify([f for f in files if not f.lower().endswith('.jpg')])

@app.route('/api/<media_type>/upload', methods=['POST'])
def upload_media(media_type):
    file = request.files['file']
    # just strip any path components—keep spaces and original characters
    fn = os.path.basename(file.filename)
    save_path = os.path.join(UPLOAD_DIR, media_type, fn)
    file.save(save_path)
    # for music, still extract the thumbnail (the .jpg will also keep spaces)
    if media_type == 'music':
        extract_thumbnail(save_path, media_type, fn)
    return jsonify({'success': True, 'filename': fn})

# Serve media files
@app.route('/api/<media_type>/<filename>', methods=['GET'])
def serve_media(media_type, filename):
    return send_from_directory(os.path.join(UPLOAD_DIR, media_type), filename)

# DELETE media file + thumbnail
@app.route('/api/<media_type>/<path:filename>', methods=['DELETE'])
def delete_media(media_type, filename):
    if media_type not in MEDIA_TYPES:
        return jsonify({'error': 'Bad media type'}), 400

    # delete the main file
    file_path = os.path.join(UPLOAD_DIR, media_type, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            return jsonify({'error': f'Could not remove file: {e}'}), 500

    # delete thumbnail for music
    if media_type == 'music':
        thumb_path = os.path.join(UPLOAD_DIR, media_type, filename + '.jpg')
        if os.path.exists(thumb_path):
            try:
                os.remove(thumb_path)
            except:
                pass

    return jsonify({'success': True})

# Serve corresponding thumbnail if exists
@app.route('/api/<media_type>/thumbnail/<filename>', methods=['GET'])
def serve_thumbnail(media_type, filename):
    thumb = filename + '.jpg'
    return send_from_directory(os.path.join(UPLOAD_DIR, media_type), thumb)

# Helper to read all list names
def get_all_lists():
    with open(LISTS_FILE) as f:
        return sorted({row['list'] for row in csv.DictReader(f)})

# GET all lists
@app.route('/api/lists', methods=['GET'])
def get_lists():
    return jsonify(get_all_lists())

# POST to create a new list
@app.route('/api/lists', methods=['POST'])
def create_list():
    data = request.get_json()
    list_name = data.get('list')
    if not list_name:
        return jsonify({'error': 'Missing list name'}), 400
    existing = get_all_lists()
    if list_name in existing:
        return jsonify({'error': 'List exists'}), 400
    with open(LISTS_FILE, 'a', newline='') as f:
        csv.writer(f).writerow([list_name, ''])
    return jsonify({'success': True}), 201

# DELETE an entire list
@app.route('/api/lists/<list_name>', methods=['DELETE'])
def delete_list(list_name):
    # filter out all entries matching this list_name
    with open(LISTS_FILE) as f:
        rows = [r for r in csv.DictReader(f) if r['list'] != list_name]
    with open(LISTS_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['list','name'])
        for r in rows:
            writer.writerow([r['list'], r['name']])
    return jsonify({'success': True})

# GET items in one list (ignore blank names)
@app.route('/api/list/<list_name>', methods=['GET'])
def list_list(list_name):
    result = []
    with open(LISTS_FILE) as f:
        for row in csv.DictReader(f):
            if row['list'] == list_name and row['name'].strip():
                result.append(row['name'])
    return jsonify(result)

# POST to add to a list
@app.route('/api/list/<list_name>/<filename>', methods=['POST'])
def add_to_list(list_name, filename):
    entries = []
    with open(LISTS_FILE) as f:
        entries = list(csv.DictReader(f))
    if not any(e['list']==list_name and e['name']==filename for e in entries):
        with open(LISTS_FILE, 'a', newline='') as f:
            csv.writer(f).writerow([list_name, filename])
    return jsonify({'success': True})

# DELETE from a list
@app.route('/api/list/<list_name>/<filename>', methods=['DELETE'])
def remove_from_list(list_name, filename):
    rows = []
    with open(LISTS_FILE) as f:
        rows = [r for r in csv.DictReader(f)
                if not (r['list']==list_name and r['name']==filename)]
    with open(LISTS_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['list','name'])
        for r in rows:
            writer.writerow([r['list'], r['name']])
    return jsonify({'success': True})

# GET all bookmarks
@app.route('/api/bookmarks', methods=['GET'])
def get_bookmarks():
    with open(BOOKMARKS_FILE) as f:
        # returns [{ media_type: "...", filename: "..."}, ...]
        return jsonify(list(csv.DictReader(f)))

# POST to add a bookmark
@app.route('/api/bookmarks', methods=['POST'])
def add_bookmark():
    data = request.get_json()
    mt, fn = data.get('mediaType'), data.get('filename')
    if not mt or not fn:
        return jsonify({'error': 'Missing mediaType or filename'}), 400

    # avoid duplicates
    with open(BOOKMARKS_FILE) as f:
        if any(r['media_type']==mt and r['filename']==fn for r in csv.DictReader(f)):
            return jsonify({'error':'Already bookmarked'}), 400

    with open(BOOKMARKS_FILE, 'a', newline='') as f:
        csv.writer(f).writerow([mt, fn])
    return jsonify({'success': True}), 201

# DELETE to remove a bookmark
@app.route('/api/bookmarks/<media_type>/<path:filename>', methods=['DELETE'])
def remove_bookmark(media_type, filename):
    rows = []
    with open(BOOKMARKS_FILE) as f:
        rows = [r for r in csv.DictReader(f)
                if not (r['media_type']==media_type and r['filename']==filename)]
    with open(BOOKMARKS_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['media_type','filename'])
        for r in rows:
            writer.writerow([r['media_type'], r['filename']])
    return jsonify({'success': True})


if __name__ == '__main__':
    app.run(debug=True)
