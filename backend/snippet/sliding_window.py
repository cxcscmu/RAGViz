
import sys
sys.path.append("/home/tevinw/ragviz/backend")

from snippet.snippet import Snippet
import torch
import time

class SlidingWindowSnippet(Snippet):
    def __init__(self, tokenizer, model, stride, window_size):
        self.tokenizer = tokenizer
        self.model = model
        self.stride = stride
        self.window_size = window_size
    
    def get_snippet(self, query, article):
        start_time = time.perf_counter()
        tokens = self.tokenizer.tokenize(article)
        input_ids = self.tokenizer(article, return_tensors="pt").input_ids
        decoder_input_ids = input_ids.detach().clone()

        best_tokens = []
        best_sim = -torch.inf

        for i in range(0, len(input_ids[0]), self.stride):
            cur_input_ids = input_ids[:, i:i+self.window_size]
            cur_decoder_input_ids = decoder_input_ids[:, i:i+self.window_size]

            with torch.no_grad():
                outputs = self.model(input_ids=cur_input_ids, decoder_input_ids=cur_decoder_input_ids)
            
            embeddings = outputs.last_hidden_state

            snippet_embedding = embeddings[0,0]

            query_tensor = torch.tensor(query)

            sim = float(torch.dot(torch.nn.functional.normalize(query_tensor, dim=0), torch.nn.functional.normalize(snippet_embedding, dim=0)))
            if i == 0:
                print(f"NAIVE FIRST SIMILARITY: {sim}")
            if sim > best_sim:
                best_sim = sim
                best_tokens = tokens[i:i+self.window_size]
        print(f"SLIDING WINDOW SIMILARITY: {best_sim}")
        res = self.tokenizer.convert_tokens_to_string(best_tokens)
        end_time = time.perf_counter()
        elapsed_time = end_time - start_time
        print(f"SLIDING WINDOW SNIPPET TIME: {elapsed_time} seconds")
        return res