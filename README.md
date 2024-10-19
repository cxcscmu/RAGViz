# <img src="https://boston.lti.cs.cmu.edu/tevinw/ragviz/ui/ragviz-square.png" alt="drawing" width="50" height="50"/> <p>RAGViz</p>

RAGViz (Retrieval Augmented Generation Visualization) is a tool that visualizes both document and token-level attention on the retrieved context feeded to the LLM to ground answer generation.

- RAGViz provides an add/remove document functionality to compare the generated tokens when certain documents are not included in the context.
- Combining both functionalities allows for a diagnosis on the effectiveness and influence of certain retrieved documents or sections of text on the LLM's answer generation.

### Demo Video
A basic demonstration of RAGViz is available [here](https://www.youtube.com/embed/cTAbuTu6ur4?si=-uZ2AyNLx-5p8MZC). 

### Configuration 

The following are the system configurations of our RAGViz demonstration:
- The [Pile-CC](https://github.com/EleutherAI/pile-cc) English documents are used for retrieval
- Documents are partioned into 4 [DiskANN](https://github.com/microsoft/DiskANN/) indexes on separate nodes, each with ~20 million documents
- Documents are embedded into feature vectors using [AnchorDR](https://github.com/yiqingxyq/AnchorDR)
- [LLaMa2](https://huggingface.co/docs/transformers/v4.34.0/en/model_doc/llama2) generation/attention output done with [vLLM](https://github.com/vllm-project/vllm) and [HuggingFace](https://huggingface.co/) transformers library
- Frontend UI is adapted from [Lepton search engine](https://github.com/leptonai/search_with_lepton)

### Customization

#### Snippets:
You can modify the snippets used for context in RAG by adding a new file and class in `backend/snippet`, adding it to `backend/ragviz.py` and `frontend/src/app/components/search.tsx`. We currently offer the following snippets: 
  - Naive First:
    - Represent a document with its first 128 tokens
  - Sliding Window
    - Compute inner product similarity between windows of 128 tokens and the query; use the most similar window to the query to represent a document 

#### Datasets:
New datasets for retrieval can be added using a new file and class in `backend/search`, and modifying `backend/ragviz.py` accordingly. 

We currently have implemented both a implementation the following datasets: 
  - Clueweb22B english documents 
  - Pile-CC dataset

#### LLMs:
Any model supported by [HuggingFace](https://huggingface.co/) transformers library can be used as the LLM backbone. 

To apply vLLM for fast inference, the LLM backbone needs to be supported by vLLM. A list of vLLM supported model is available [here](https://docs.vllm.ai/en/latest/models/supported_models.html). 

You can set the model path of the model for RAG inside of `backend/.env.example`. We used `meta-llama/Llama-2-7b-chat-hf` for the demo.

