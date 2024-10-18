import json
import re
import os
from fastapi import HTTPException, FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
import time

from search.pile.search import PileSearch
from snippet.naive_first import NaiveFirstSnippet
from snippet.sliding_window import SlidingWindowSnippet
from helpers.embedding import embedding_function
from rag.client import rag_client

from transformers import AutoTokenizer, AutoModel
import torch

if __name__ == "__main__":
    tokenizer = AutoTokenizer.from_pretrained("yiqingx/AnchorDR")
    model = AutoModel.from_pretrained("yiqingx/AnchorDR")
    pile_search = PileSearch()
    naive_first = NaiveFirstSnippet(tokenizer)
    sliding_window = SlidingWindowSnippet(tokenizer, model, 64, 128)
    app = FastAPI()

@app.post("/query")
def query_function(item: dict) -> JSONResponse:
    """
    Query RAGViz and returns the response.

    The query can have the following fields:
        - query: the user query.
    """
    start_time = time.perf_counter()
    query = item['query'] or _default_query
    # Basic attack protection: remove "[INST]" or "[/INST]" from the query
    query = re.sub(r"\[/?INST\]", "", query)
    k = int(item['k'])
    snippet_type = item['snippet']

    embeddings = embedding_function(tokenizer, model, query)

    if snippet_type == "first":
        results = pile_search.get_search_results(embeddings, k, query, naive_first)
    else:
        results = pile_search.get_search_results(embeddings, k, query, sliding_window)

    rag_response = rag_client(query, results)

    res = JSONResponse(content=json.dumps(rag_response), media_type="application/json")
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time
    print(f"TOTAL QUERY TIME: {elapsed_time} seconds")
    return res

# Define your API keys
API_KEYS = {
    "key": os.getenv("API_KEY"),
}

@app.middleware("http")
async def check_api_key(request: Request, call_next):
    api_key = request.headers.get("X-API-Key")

    if api_key not in API_KEYS.values():
        return JSONResponse(status_code=401, content={"error": "Invalid API key"})

    response = await call_next(request)
    return response

@app.post("/rewrite")
async def rewrite(item: dict):
    return JSONResponse(content=json.dumps(rag_client(item['query'], item['results'])), media_type="application/json")

if __name__ == "__main__":
    uvicorn.run(app, host=os.getenv("BACKEND_ADDR"), port=int(os.getenv("BACKEND_PORT")))