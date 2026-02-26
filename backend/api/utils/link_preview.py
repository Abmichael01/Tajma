import re
import requests
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

def extract_url(text):
    """Simple regex to find the first URL in a text"""
    url_pattern = r'(https?://[^\s]+)'
    match = re.search(url_pattern, text)
    return match.group(0) if match else None

def get_link_preview(url):
    """Fetch metadata for a given URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Open Graph tags
        title = soup.find('meta', property='og:title')
        description = soup.find('meta', property='og:description')
        image = soup.find('meta', property='og:image')
        
        # Fallback to standard tags
        if not title:
            title = soup.find('title')
            title = title.string if title else None
        else:
            title = title.get('content')
            
        if not description:
            description = soup.find('meta', attrs={'name': 'description'})
            description = description.get('content') if description else None
        else:
            description = description.get('content')
            
        if image:
            image = image.get('content')
        else:
            # Maybe look for link rel="icon" or similar if needed
            image = None
            
        return {
            'title': title[:255] if title else None,
            'description': description[:500] if description else None,
            'image': image if image and image.startswith('http') else None,
            'url': url
        }
    except Exception as e:
        logger.error(f"Error fetching link preview for {url}: {e}")
        return None
