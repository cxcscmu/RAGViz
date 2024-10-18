import torch
import time

def embedding_function(tokenizer, model, query):
    start_time = time.perf_counter()
    input_ids = tokenizer(query, return_tensors="pt").input_ids
    print(f"TOKEN_COUNT: {len(input_ids[0])}")
    decoder_input_ids = tokenizer(query, return_tensors="pt").input_ids

    # Forward pass through the model to obtain embeddings
    with torch.no_grad():
        outputs = model(input_ids=input_ids, decoder_input_ids=decoder_input_ids)

    # Extract the embeddings
    embeddings = outputs.last_hidden_state  # Last layer hidden states

    embeddings_np = embeddings.numpy()
    res = embeddings_np[0,0].tolist()
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time
    print(f"EMBEDDING TIME: {elapsed_time} seconds")
    return res