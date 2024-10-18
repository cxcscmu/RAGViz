from transformers import LlamaTokenizer, LlamaForCausalLM, BitsAndBytesConfig
import torch
import numpy as np
import os

from fastapi import FastAPI, Query
from pydantic import BaseModel

from vllm import LLM, SamplingParams
import torch

import uvicorn
import json

def load_model(model_name, tp_size=1):
    llm = LLM(model_name, tensor_parallel_size=tp_size, device=torch.device("cuda:0"), gpu_memory_utilization=0.5)
    return llm

os.environ["CUDA_VISIBLE_DEVICES"] = "0"

llama_path = os.get_env("RAG_MODEL")
tokenizer = LlamaTokenizer.from_pretrained(llama_path, local_files_only=True)
hf_model = LlamaForCausalLM.from_pretrained(llama_path, local_files_only=True, device_map="auto", quantization_config=BitsAndBytesConfig(load_in_4bit=True), max_memory={0: "12GB"})

torch.cuda.manual_seed(42)
torch.manual_seed(42)

model_name = os.get_env("RAG_MODEL")
model = load_model(model_name)

app = FastAPI()

def process_tokens(tokenized_docs):
    tokens = []

    special_tokens = []

    for i, token in enumerate(tokenized_docs):
        if token not in special_tokens:
            token = token.replace('▁', ' ')
            token = token.replace('<0x0A>', '\n')
            tokens.append(token)
    return tokens

def vllm(model, query, docs, max_new_tokens=100, user_prompt=None, top_p=0.9, temperature=0.8):
    context = ""
    doc_starts = []
    doc_tokens = []
    input_len = 0
    context_ids = tokenizer("Context: ", return_tensors='pt')['input_ids']
    input_ids = context_ids.clone()
    for i, doc in enumerate(docs):
        new_title = f"{doc['name']}: "
        title_ids = tokenizer(new_title, return_tensors='pt')['input_ids'][:, 1:]
        title_tokens = process_tokens(tokenizer.convert_ids_to_tokens(tokenizer(new_title)['input_ids']))[1:]
        title_start = input_ids.size(1)
        input_ids = torch.cat([input_ids, title_ids], dim=-1).clone()

        new_context = f"{doc['snippet']};" if i < len(docs) - 1 else f"{doc['snippet']}"
        context += new_context
        snippet_ids = tokenizer(new_context, return_tensors='pt')['input_ids'][:, 1:]
        snippet_tokens = process_tokens(tokenizer.convert_ids_to_tokens(tokenizer(new_context)['input_ids']))[1:]
        doc_starts.append((title_start, input_ids.size(1)))
        input_ids = torch.cat([input_ids, snippet_ids], dim=-1).clone()
        doc_tokens.append({'name': title_tokens, 'snippet': snippet_tokens})
    query_ids = tokenizer("\n Question: {query} Answer in less than 100 tokens:", return_tensors='pt')['input_ids']
    docs_len = input_ids.size(1)
    input_ids = torch.cat([input_ids, query_ids], dim=-1).clone()
    input_len = input_ids.size(1)

    sampling_param = SamplingParams(top_p=top_p, temperature=temperature, max_tokens=max_new_tokens)

    prompt = f"Context: {context}\n Question: {query} Answer in less than 100 tokens:"
    start_time = time.perf_counter()
    outputs = model.generate(prompt, sampling_params=sampling_param)
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time
    print(f"VLLM CHAT COMPLETION TIME: {elapsed_time} seconds")
    print(outputs)

    return input_ids, doc_starts, docs_len, input_len, outputs[0].outputs[0].text, doc_tokens

def format_attention(attention, layers=None, heads=None):
    if layers:
        attention = [attention[layer_index] for layer_index in layers]
    squeezed = []
    for layer_attention in attention:
        # 1 x num_heads x seq_len x seq_len
        if len(layer_attention.shape) != 4:
            raise ValueError("The attention tensor does not have the correct number of dimensions. Make sure you set "
                             "output_attentions=True when initializing your model.")
        layer_attention = layer_attention.squeeze(0)
        if heads:
            layer_attention = layer_attention[heads]
        squeezed.append(layer_attention)
    # num_layers x num_heads x seq_len x seq_len
    return torch.stack(squeezed)

def num_layers(attention):
    return len(attention)

def num_heads(attention):
    return attention[0][0].size(0)


def hf(model, input_ids, doc_starts, docs_len, input_len, generated_text):
    generated_ids = tokenizer(generated_text, return_tensors='pt')['input_ids']
    generated_tokens = tokenizer.convert_ids_to_tokens(tokenizer(generated_text)['input_ids'])
    output_ids = torch.cat([input_ids, generated_ids], dim=-1).clone()
    with torch.no_grad():
        start_time = time.perf_counter()
        outputs = model(output_ids, output_attentions=True)
        end_time = time.perf_counter()
        elapsed_time = end_time - start_time
        print(f"ATTENTION FORWARD PASS TIME: {elapsed_time} seconds")
    attentions = outputs.attentions
    n_heads = num_heads(attentions)
    include_layers = list(range(num_layers(attentions)))
    include_heads = list(range(n_heads))
    attention = format_attention(attentions, include_layers, include_heads)

    att_q = []
    att_d = [[] for doc in doc_starts]
    att = torch.mean(attention, dim=[0,1]).numpy()

    for t_num in range(input_len, output_ids.shape[1]): 
        for i, doc in enumerate(doc_starts):
            title_start, snippet_start = doc
            doc_end = doc_starts[i + 1][0] if i < len(doc_starts) - 1 else docs_len
            att_d[i].append({"name": att[t_num, title_start:snippet_start].tolist(), "snippet": att[t_num, snippet_start:doc_end].tolist(), "score": float(np.sum(att[t_num, title_start:doc_end]))}) # doc 

    return att_d, generated_tokens

def process_text(doc_tokens, tokenized_text, attn_d):
    processed_tokens = []

    special_tokens = ['<s>']

    attn = [[] for i in range (len(attn_d))]

    for i, token in enumerate(tokenized_text):
        if token not in special_tokens:
            token = token.replace('▁', ' ')
            token = token.replace('<0x0A>', '\n')
            processed_tokens.append(token)
            for j in range(len(attn)):
                attn[j].append(attn_d[j][i])
    return {'docs': doc_tokens, 'tokens': processed_tokens, 'attn': attn}

class RequestData(BaseModel):
    query: str
    docs: list

@app.post("/generate")
def generate(request_data: RequestData = None, max_new_tokens: int = Query(100), top_p: float = Query(0.9), temperature: float = Query(0.8)):
    if request_data:
        query = request_data.query
        docs = request_data.docs
    input_ids, doc_starts, docs_len, input_len, response_text, doc_tokens = vllm(model, query, docs)
    attn_d, tokenized_text = hf(hf_model, input_ids, doc_starts, docs_len, input_len, response_text)
    return process_text(doc_tokens, tokenized_text, attn_d)

uvicorn.run(app, host="0.0.0.0", port=8080)
