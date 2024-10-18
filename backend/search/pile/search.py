import sys
sys.path.append("/home/tevinw/ragviz/backend")

import requests
import os
import time
from helpers.concurrent_fetch import fetch_all
from helpers.range_dictionary import create_range_dictionary, query_range_dictionary
from search.search import Search
import csv
csv.field_size_limit(sys.maxsize)
import concurrent.futures
from threading import Lock

class PileSearch(Search):
  def __init__(self):
    directory = f'{os.getenv("PROJECT_DIR")}/backend/search/pile/ranges/'
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
        (0, f'http://{os.getenv("PILE_ADDR_0")}:{os.getenv("PILE_PORT_0")}'),
        (1, f'http://{os.getenv("PILE_ADDR_1")}:{os.getenv("PILE_PORT_1")}'),
        (2, f'http://{os.getenv("PILE_ADDR_2")}:{os.getenv("PILE_PORT_2")}'),
        (3, f'http://{os.getenv("PILE_ADDR_3")}:{os.getenv("PILE_PORT_3")}'),
    ]

    prefixes = [0, 13981871, 13981871 + 13986302, 13981871 + 13986302 + 12237291]

    start_time = time.perf_counter()
    responses = fetch_all(urls, jsonquery)
    
    merged_indices = []
    merged_distances = []
    for response in responses:
        indices = [ind + prefixes[response[0]] for ind in response[1]['indices']]
        distances = response[1]['distances']
        merged_indices.extend(indices)
        merged_distances.extend(distances)

    # Sort indices based on distances
    sorted_indices = [index for _, index in sorted(zip(merged_distances, merged_indices))]
    indices = sorted_indices[:k]
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time
    print(f"QUERY AND RERANK TIME: {elapsed_time} seconds")

    results = []

    # Define a function to process each index
    def process_index(i):
        start_time = time.perf_counter()
        subfolder, index = query_range_dictionary(self.range_dictionaries['pile'], i)

        subfolder_id = str(subfolder).zfill(2)

        if index != 0:
            index -= 1

        pile_part = str((index) // 25000 + 1)

        line_number = index % 25000 + 1

        corpus_path = f'{os.getenv("PILE_PATH")}/{subfolder_id}/full_corpus_{subfolder_id}_part_{pile_part}.tsv'
        
        title = None
        snippet = None

        # Read the specific line from the TSV file
        with open(corpus_path, 'r', encoding='utf-8') as tsv_file:
            reader = csv.reader(tsv_file, delimiter='\t')
            for current_line, row in enumerate(reader):
                if current_line == line_number:
                    title = row[1]  # Assuming the first column is the title
                    end_time = time.perf_counter()
                    elapsed_time = end_time - start_time
                    print(f"PILE FETCH DOCUMENT TIME: {elapsed_time} seconds")
                    snippet = snippet_object.get_snippet(embedding, row[2])
                    break
        res = {"name": title, "url": "http://google.com", "snippet": snippet}
        end_time = time.perf_counter()
        return res

    results = []
    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = executor.map(process_index, indices)
        for result in futures:
            results.append(result)
    
    return results