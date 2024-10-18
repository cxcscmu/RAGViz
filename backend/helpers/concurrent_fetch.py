import requests
import concurrent.futures
import time

def fetch(i, url, jsonquery):
    start_time = time.perf_counter()
    response = requests.post(url, json=jsonquery)
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time
    print(f"ANNS TIME: {elapsed_time} seconds")
    return i, response.json()

def fetch_all(urls, jsonquery):
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Submit requests for all URLs concurrently
        future_to_url = {executor.submit(fetch, i, url, jsonquery): url for i, url in urls}
        responses = []
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            try:
                data = future.result()
                responses.append(data)
            except Exception as exc:
                print(f"Error fetching data from {url}: {exc}")
    return responses