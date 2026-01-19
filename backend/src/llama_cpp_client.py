import os
from llama_cpp import Llama

MODEL_PATH = os.getenv(
    "LLAMA_MODEL_PATH",
    "./models/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
)

N_CTX = int(os.getenv("LLAMA_N_CTX", "4096"))
N_THREADS = int(os.getenv("LLAMA_N_THREADS", "8"))

# Load model ONCE (important for performance)
_llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=N_CTX,
    n_threads=N_THREADS,
    verbose=False,
)

def call_llama_cpp(prompt: str, temperature=0.0, max_tokens=512):
    """
    Single-shot text generation for RAG.
    """
    output = _llm(
        prompt,
        max_tokens=max_tokens,
        temperature=temperature,
        stop=["</s>"],
    )

    return output["choices"][0]["text"].strip()
