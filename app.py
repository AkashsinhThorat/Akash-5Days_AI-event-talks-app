import os
import xml.etree.ElementTree as ET
import html
import re
import datetime
import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache for parsed release notes
cache = {
    "last_fetched": None,
    "entries": []
}

def clean_html_content(html_content):
    """
    Cleans up HTML content for representation or plaintext search.
    """
    text = html_content
    # Replace header with type prefix
    text = re.sub(r'<h3>(.*?)</h3>', r'\1: ', text)
    # Replace links with text (url)
    text = re.sub(r'<a[^>]*href=["\'](.*?)["\'][^>]*>(.*?)</a>', r'\2 (\1)', text)
    # Replace paragraphs and line breaks with spacing
    text = re.sub(r'</p>', '\n\n', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    # Strip remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode HTML entities
    text = html.unescape(text)
    # Normalize whitespaces
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_feed_xml(xml_content):
    """
    Parses the Atom XML feed.
    Returns a list of entry dicts.
    An entry (a date) can contain multiple h3 blocks. We split them so the user can tweet about a specific update.
    """
    namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
    
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        print(f"XML Parsing Error: {e}")
        return []
        
    entries_list = []
    
    # Iterate through each atom:entry element
    for entry in root.findall('atom:entry', namespaces):
        date_title = entry.find('atom:title', namespaces)
        date_str = date_title.text if date_title is not None else "Unknown Date"
        
        link_elem = entry.find('atom:link', namespaces)
        alternate_url = ""
        if link_elem is not None:
            alternate_url = link_elem.attrib.get('href', '')
            
        content_elem = entry.find('atom:content', namespaces)
        if content_elem is None or content_elem.text is None:
            continue
            
        content_html = content_elem.text.strip()
        
        # Split HTML content by <h3> headers to isolate sub-updates
        pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL)
        matches = pattern.findall(content_html)
        
        if not matches:
            clean_text = clean_html_content(content_html)
            entry_id = entry.find('atom:id', namespaces)
            id_str = entry_id.text if entry_id is not None else date_str
            entries_list.append({
                "id": f"{id_str}_0",
                "date": date_str,
                "type": "Update",
                "content_html": content_html,
                "content_text": clean_text,
                "url": alternate_url
            })
        else:
            for idx, (update_type, update_body) in enumerate(matches):
                update_type = update_type.strip()
                update_body = update_body.strip()
                
                item_html = f"<h3>{update_type}</h3>{update_body}"
                clean_text = clean_html_content(item_html)
                
                entry_id = entry.find('atom:id', namespaces)
                id_str = entry_id.text if entry_id is not None else date_str
                # Clean up tag:google.com... id schema
                clean_id = id_str.split('#')[-1] if '#' in id_str else id_str
                
                entries_list.append({
                    "id": f"{clean_id}_{idx}",
                    "date": date_str,
                    "type": update_type,
                    "content_html": item_html,
                    "content_text": clean_text,
                    "url": f"{alternate_url}"
                })
                
    return entries_list

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        entries = parse_feed_xml(response.content)
        if entries:
            cache["last_fetched"] = datetime.datetime.now().strftime("%I:%M:%S %p")
            cache["entries"] = entries
            return True, None
        return False, "No entries found in feed"
    except Exception as e:
        return False, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes', methods=['GET'])
def get_notes():
    if not cache["entries"]:
        success, error = fetch_and_parse_feed()
        if not success:
            return jsonify({"success": False, "error": error}), 500
            
    return jsonify({
        "success": True,
        "last_fetched": cache["last_fetched"],
        "entries": cache["entries"]
    })

@app.route('/api/refresh', methods=['POST'])
def refresh_notes():
    success, error = fetch_and_parse_feed()
    if not success:
        return jsonify({"success": False, "error": error}), 500
        
    return jsonify({
        "success": True,
        "last_fetched": cache["last_fetched"],
        "entries": cache["entries"]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
