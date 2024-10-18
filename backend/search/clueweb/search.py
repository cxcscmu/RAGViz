import sys
sys.path.append("/home/tevinw/ragviz/backend")

import requests
from helpers.ClueWeb22Api import ClueWeb22Api
from helpers.concurrent_fetch import fetch_all
from helpers.range_dictionary import create_range_dictionary, query_range_dictionary
from search.search import Search
import concurrent.futures
from threading import Lock

class CluewebSearch(Search):
def __init__(self):
directory = f'{os.getenv("PROJECT_DIR")}/backend/search/clueweb/ranges/'
self.range_dictionaries = {}

for filename in os.listdir(directory):
    if filename.endswith('.tsv'):
        file_path = os.path.join(directory, filename)
        index = filename.split('.')[0]
        range_list = create_range_dictionary(file_path)
        self.range_dictionaries[index] = range_list
self.lock = Lock()
self.query_id = 0


def get_search_results(self, embedding, k, query, snippet_object):
    with self.lock:
        jsonquery = {"Ls": 256,
            "query_id": self.query_id,
            "query": embedding,
            "k": k}
        self.query_id += 1

    urls = [
        (0, f'http://{os.getenv("CLUEWEB_ADDR_0")}:{os.getenv("CLUEWEB_PORT_0")}'),
        (1, f'http://{os.getenv("CLUEWEB_ADDR_1")}:{os.getenv("CLUEWEB_PORT_1")}'),
        (2, f'http://{os.getenv("CLUEWEB_ADDR_2")}:{os.getenv("CLUEWEB_PORT_2")}'),
        (3, f'http://{os.getenv("CLUEWEB_ADDR_3")}:{os.getenv("CLUEWEB_PORT_3")}'),
    ]

    responses = fetch_all(urls, jsonquery)
    
    merged_indices = []
    merged_distances = []
    for response in responses:
        indices = [ind + response[0] * 21517546 for ind in response[1]['indices']]
        distances = response[1]['distances']
        merged_indices.extend(indices)
        merged_distances.extend(distances)

    # Sort indices based on distances
    sorted_indices = [index for _, index in sorted(zip(merged_distances, merged_indices))]
    indices = sorted_indices[:k]

    results = []
    def process_index(i):
        subfolder, index = query_range_dictionary(self.range_dictionaries['clueweb'], i)
        ranged = self.range_dictionaries[str(subfolder)]
        jsongz_id, doc_id = query_range_dictionary(ranged, index)

        jjsongz_id = str(jsongz_id).zfill(2)
        ddoc_id = str(doc_id).zfill(5)

        subfolder_id = str(subfolder).zfill(2)

        cweb_doc_id = f"clueweb22-en00{subfolder_id}-{jjsongz_id}-{ddoc_id}"
        path_clueweb = os.getenv("CLUEWEB_PATH")
        clueweb_api = ClueWeb22Api(cweb_doc_id, path_clueweb)

        clean_txt = eval(clueweb_api.get_clean_text())
        title = clean_txt["Clean-Text"].split('\n')[0].replace("\n", "").replace("\t", "").replace("\r", "").replace("\'", "").replace("\"", "").strip()
        snippet = snippet_object.get_snippet(query, '\n'.join(clean_txt["Clean-Text"].split('\n')[1:]))

        return {"name": title, "url": clean_txt["URL"].replace("\n", ""), "snippet": snippet}

    # Use ThreadPoolExecutor for parallel processing
    results = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Map tasks for each index
        futures = executor.map(process_index, indices)

        # Iterate over results and append them in the original order of indices
        for result in futures:
            results.append(result)
    
    return results