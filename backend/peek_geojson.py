import requests
import json

def peek_geojson(level):
    print(f"--- Peeking at ADM{level} ---")
    api_url = f"https://www.geoboundaries.org/api/current/gbOpen/NER/ADM{level}/"
    resp = requests.get(api_url)
    if resp.status_code == 200:
        data = resp.json()
        download_url = data.get('gjDownloadURL')
        print(f"Download URL: {download_url}")
        
        # Download a bit of the geojson
        geo_resp = requests.get(download_url)
        if geo_resp.status_code == 200:
            geojson = geo_resp.json()
            features = geojson.get('features', [])
            if features:
                print(f"Total features: {len(features)}")
                print("First feature properties:")
                print(json.dumps(features[0]['properties'], indent=2))
            else:
                print("No features found")
    else:
        print(f"Failed to fetch API: {resp.status_code}")

if __name__ == "__main__":
    peek_geojson(1)
    peek_geojson(2)
    # peek_geojson(3) # Might be large
