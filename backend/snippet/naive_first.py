import sys
import time
sys.path.append("/home/tevinw/ragviz/backend")

from snippet.snippet import Snippet

class NaiveFirstSnippet(Snippet):
    def __init__(self, tokenizer):
        self.tokenizer = tokenizer
    
    def get_snippet(self, query, article):
        start_time = time.perf_counter()
        tokens = self.tokenizer.tokenize(article)
        first_128_tokens = tokens[:128]
        first_128_tokens_string = self.tokenizer.convert_tokens_to_string(first_128_tokens)
        end_time = time.perf_counter()
        elapsed_time = end_time - start_time
        print(f"NAIVE FIRST SNIPPET TIME: {elapsed_time}")
        return first_128_tokens_string