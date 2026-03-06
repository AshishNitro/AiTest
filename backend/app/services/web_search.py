"""Web search service - supports SerpAPI and Brave Search."""
import httpx
from typing import Optional, List, Dict
from app.core.config import settings


class WebSearchService:
    """Service for performing web searches via SerpAPI or Brave Search."""

    async def search_serpapi(self, query: str, api_key: str, num_results: int = 5) -> str:
        """Search using SerpAPI."""
        async with httpx.AsyncClient() as client:
            params = {
                "q": query,
                "api_key": api_key,
                "engine": "google",
                "num": num_results
            }
            response = await client.get(
                "https://serpapi.com/search",
                params=params,
                timeout=30.0
            )
            data = response.json()

            results = []
            if "organic_results" in data:
                for result in data["organic_results"][:num_results]:
                    title = result.get("title", "")
                    snippet = result.get("snippet", "")
                    link = result.get("link", "")
                    results.append(f"**{title}**\n{snippet}\nSource: {link}")

            if "answer_box" in data:
                answer = data["answer_box"].get("answer", "")
                if answer:
                    results.insert(0, f"**Direct Answer:** {answer}")

            return "\n\n".join(results) if results else "No results found."

    async def search_brave(self, query: str, api_key: str, num_results: int = 5) -> str:
        """Search using Brave Search API."""
        async with httpx.AsyncClient() as client:
            headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": api_key
            }
            params = {
                "q": query,
                "count": num_results
            }
            response = await client.get(
                "https://api.search.brave.com/res/v1/web/search",
                headers=headers,
                params=params,
                timeout=30.0
            )
            data = response.json()

            results = []
            if "web" in data and "results" in data["web"]:
                for result in data["web"]["results"][:num_results]:
                    title = result.get("title", "")
                    description = result.get("description", "")
                    url = result.get("url", "")
                    results.append(f"**{title}**\n{description}\nSource: {url}")

            return "\n\n".join(results) if results else "No results found."

    async def search(self, query: str, provider: str = "serpapi", api_key: Optional[str] = None) -> str:
        """Perform a web search using the specified provider."""
        if not api_key:
            if provider == "serpapi":
                api_key = settings.SERPAPI_KEY
            elif provider == "brave":
                api_key = settings.BRAVE_API_KEY

        if not api_key:
            return "No API key configured for web search."

        try:
            if provider == "serpapi":
                return await self.search_serpapi(query, api_key)
            elif provider == "brave":
                return await self.search_brave(query, api_key)
            else:
                return f"Unknown search provider: {provider}"
        except Exception as e:
            return f"Web search error: {str(e)}"


web_search_service = WebSearchService()
