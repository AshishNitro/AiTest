"""LLM service - handles interactions with OpenAI and Google Gemini models."""
import openai
import google.generativeai as genai
from typing import List, Optional
from app.core.config import settings


class LLMService:
    """Service for interacting with various LLM providers."""

    async def get_openai_embeddings(self, texts: List[str], api_key: str, model: str = "text-embedding-3-small") -> List[List[float]]:
        """Generate embeddings using OpenAI."""
        client = openai.AsyncOpenAI(api_key=api_key)
        
        # Process in batches of 100
        all_embeddings = []
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await client.embeddings.create(
                input=batch,
                model=model
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
        
        return all_embeddings

    async def get_gemini_embeddings(self, texts: List[str], api_key: str, model: str = "models/text-embedding-004") -> List[List[float]]:
        """Generate embeddings using Gemini."""
        genai.configure(api_key=api_key)
        
        all_embeddings = []
        for text in texts:
            result = genai.embed_content(
                model=model,
                content=text,
                task_type="retrieval_document"
            )
            all_embeddings.append(result['embedding'])
        
        return all_embeddings

    async def get_query_embedding(self, query: str, api_key: str, model: str = "text-embedding-3-small", provider: str = "openai") -> List[float]:
        """Get embedding for a single query."""
        if provider == "openai":
            embeddings = await self.get_openai_embeddings([query], api_key, model)
            return embeddings[0]
        else:
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model=model if model.startswith("models/") else f"models/{model}",
                content=query,
                task_type="retrieval_query"
            )
            return result['embedding']

    async def generate_openai_response(
        self,
        query: str,
        api_key: str,
        model: str = "gpt-4o-mini",
        context: Optional[str] = None,
        prompt_template: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Generate a response using OpenAI."""
        client = openai.AsyncOpenAI(api_key=api_key)
        
        # Build the prompt
        if prompt_template:
            system_prompt = prompt_template
            if context:
                system_prompt = system_prompt.replace("{context}", context)
            system_prompt = system_prompt.replace("{query}", query)
        elif context:
            system_prompt = (
                "You are a helpful AI assistant. Use the following context to answer the user's question.\n\n"
                f"Context:\n{context}\n\n"
                "If the context doesn't contain relevant information, say so but still try to help."
            )
        else:
            system_prompt = "You are a helpful AI assistant. Answer the user's question to the best of your ability."

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]

        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=2000
        )

        return response.choices[0].message.content

    async def generate_gemini_response(
        self,
        query: str,
        api_key: str,
        model: str = "gemini-1.5-flash",
        context: Optional[str] = None,
        prompt_template: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Generate a response using Google Gemini."""
        genai.configure(api_key=api_key)
        
        # Build the prompt
        if prompt_template:
            full_prompt = prompt_template
            if context:
                full_prompt = full_prompt.replace("{context}", context)
            full_prompt = full_prompt.replace("{query}", query)
        elif context:
            full_prompt = (
                f"Use the following context to answer the question.\n\n"
                f"Context:\n{context}\n\n"
                f"Question: {query}"
            )
        else:
            full_prompt = query

        gen_model = genai.GenerativeModel(model)
        response = gen_model.generate_content(
            full_prompt,
            generation_config=genai.GenerationConfig(temperature=temperature)
        )

        return response.text


llm_service = LLMService()
