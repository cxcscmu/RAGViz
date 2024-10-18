import requests
import os

def rag_client(query: str, results):
    jsonquery = {
        "query": query,
        "docs": results
    }

    response = requests.post(f'http://{os.getenv("RAG_ADDR")}:{os.getenv("RAG_PORT")}/generate', json=jsonquery)
    for i, result in enumerate(results):
        result['attn'] = response.json()['attn'][i]
        result['nameTokens'] = response.json()['docs'][i]['name']
        result['snippetTokens'] = response.json()['docs'][i]['snippet']
    return {'docs': results, 'answer': response.json()['tokens']}