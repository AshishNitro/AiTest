"""Workflow execution engine - orchestrates the component pipeline."""
from typing import Dict, List, Any, Optional, Tuple
from app.services.llm_service import llm_service
from app.services.vector_store import vector_store
from app.services.web_search import web_search_service
import logging

logger = logging.getLogger(__name__)


class WorkflowEngine:
    """Executes a workflow by processing nodes in topological order."""

    def validate_workflow(self, nodes: List[dict], edges: List[dict]) -> Tuple[bool, List[str], List[str]]:
        """Validate a workflow for correctness."""
        errors = []
        warnings = []

        if not nodes:
            errors.append("Workflow must have at least one node.")
            return False, errors, warnings

        # Check required component types
        node_types = [n.get("type") for n in nodes]

        has_input = "userQuery" in node_types
        has_output = "output" in node_types
        has_llm = "llmEngine" in node_types

        if not has_input:
            errors.append("Workflow must have a User Query component.")
        if not has_output:
            errors.append("Workflow must have an Output component.")
        if not has_llm:
            errors.append("Workflow must have an LLM Engine component.")

        # Check LLM configuration
        for node in nodes:
            if node.get("type") == "llmEngine":
                data = node.get("data", {})
                config = data.get("config", {})
                if not config.get("apiKey"):
                    errors.append("LLM Engine must have an API key configured.")
                if not config.get("model"):
                    warnings.append("LLM Engine model not specified, will use default.")

        # Check connectivity
        if edges:
            source_ids = {e.get("source") for e in edges}
            target_ids = {e.get("target") for e in edges}
            node_ids = {n.get("id") for n in nodes}

            for source in source_ids:
                if source not in node_ids:
                    errors.append(f"Edge references non-existent source node: {source}")
            for target in target_ids:
                if target not in node_ids:
                    errors.append(f"Edge references non-existent target node: {target}")

        if not has_input or not has_output or not has_llm:
            warnings.append("A complete workflow requires: User Query → LLM Engine → Output")

        is_valid = len(errors) == 0
        return is_valid, errors, warnings

    def _build_adjacency(self, nodes: List[dict], edges: List[dict]) -> Dict[str, List[dict]]:
        """Build adjacency list from edges (inbound connections for each node)."""
        adjacency = {}
        for edge in edges:
            target = edge.get("target")
            if target not in adjacency:
                adjacency[target] = []
            adjacency[target].append(edge)
        return adjacency

    def _get_execution_order(self, nodes: List[dict], edges: List[dict]) -> List[dict]:
        """Determine execution order using topological sort."""
        node_map = {n["id"]: n for n in nodes}
        in_degree = {n["id"]: 0 for n in nodes}
        adj = {n["id"]: [] for n in nodes}

        for edge in edges:
            source = edge["source"]
            target = edge["target"]
            if source in adj and target in in_degree:
                adj[source].append(target)
                in_degree[target] += 1

        # Kahn's algorithm
        queue = [nid for nid, deg in in_degree.items() if deg == 0]
        order = []

        while queue:
            nid = queue.pop(0)
            order.append(node_map[nid])
            for neighbor in adj.get(nid, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        return order

    async def execute(
        self,
        query: str,
        nodes: List[dict],
        edges: List[dict],
        stack_id: str
    ) -> Dict[str, Any]:
        """Execute the workflow pipeline."""
        execution_order = self._get_execution_order(nodes, edges)
        adjacency = self._build_adjacency(nodes, edges)

        # Results store: node_id -> output
        results: Dict[str, Any] = {}
        sources: List[str] = []
        context_text = ""

        for node in execution_order:
            node_id = node["id"]
            node_type = node.get("type")
            data = node.get("data", {})
            config = data.get("config", {})

            logger.info(f"Executing node: {node_id} ({node_type})")

            if node_type == "userQuery":
                results[node_id] = {"query": query}

            elif node_type == "knowledgeBase":
                # Get the query from connected input
                incoming_query = query
                kb_config = config

                # Determine embedding provider and get query embedding
                embedding_model = kb_config.get("embeddingModel", "text-embedding-3-small")
                api_key = kb_config.get("apiKey", "")
                provider = kb_config.get("provider", "openai")

                if api_key:
                    try:
                        query_embedding = await llm_service.get_query_embedding(
                            incoming_query, api_key, embedding_model, provider
                        )

                        # Query the vector store
                        search_results = vector_store.query_similar(
                            stack_id, query_embedding, n_results=5
                        )

                        # Extract context
                        docs = search_results.get("documents", [[]])[0]
                        metas = search_results.get("metadatas", [[]])[0]

                        if docs:
                            context_text = "\n\n---\n\n".join(docs)
                            sources = list(set(
                                m.get("filename", "Unknown") for m in metas if m
                            ))

                        results[node_id] = {
                            "context": context_text,
                            "sources": sources
                        }
                    except Exception as e:
                        logger.error(f"KnowledgeBase error: {e}")
                        results[node_id] = {"context": "", "sources": []}
                else:
                    results[node_id] = {"context": "", "sources": []}

            elif node_type == "webSearch":
                ws_config = config
                search_provider = ws_config.get("provider", "serpapi")
                search_api_key = ws_config.get("apiKey", "")

                try:
                    web_results = await web_search_service.search(
                        query, search_provider, search_api_key or None
                    )
                    web_context = web_results
                    if context_text:
                        context_text += f"\n\n--- Web Search Results ---\n\n{web_context}"
                    else:
                        context_text = web_context

                    results[node_id] = {"context": web_context}
                except Exception as e:
                    logger.error(f"WebSearch error: {e}")
                    results[node_id] = {"context": ""}

            elif node_type == "llmEngine":
                llm_config = config
                api_key = llm_config.get("apiKey", "")
                model = llm_config.get("model", "gpt-4o-mini")
                provider = llm_config.get("provider", "openai")
                prompt_template = llm_config.get("promptTemplate", "")
                temperature = float(llm_config.get("temperature", 0.7))
                enable_web_search = llm_config.get("enableWebSearch", False)

                # If web search is enabled on the LLM node itself
                if enable_web_search:
                    ws_key = llm_config.get("webSearchApiKey", "")
                    ws_provider = llm_config.get("webSearchProvider", "serpapi")
                    try:
                        web_results = await web_search_service.search(
                            query, ws_provider, ws_key or None
                        )
                        if context_text:
                            context_text += f"\n\n--- Web Search Results ---\n\n{web_results}"
                        else:
                            context_text = web_results
                    except Exception as e:
                        logger.error(f"LLM WebSearch error: {e}")

                # Generate response
                try:
                    if provider == "openai":
                        response = await llm_service.generate_openai_response(
                            query=query,
                            api_key=api_key,
                            model=model,
                            context=context_text if context_text else None,
                            prompt_template=prompt_template if prompt_template else None,
                            temperature=temperature
                        )
                    else:
                        response = await llm_service.generate_gemini_response(
                            query=query,
                            api_key=api_key,
                            model=model,
                            context=context_text if context_text else None,
                            prompt_template=prompt_template if prompt_template else None,
                            temperature=temperature
                        )

                    results[node_id] = {"response": response}
                except Exception as e:
                    logger.error(f"LLM error: {e}")
                    results[node_id] = {"response": f"Error generating response: {str(e)}"}

            elif node_type == "output":
                # Collect the final response from the LLM
                incoming = adjacency.get(node_id, [])
                final_response = ""
                for edge in incoming:
                    source_result = results.get(edge["source"], {})
                    if "response" in source_result:
                        final_response = source_result["response"]
                        break

                results[node_id] = {
                    "response": final_response,
                    "sources": sources
                }

        # Find the output node's result
        output_result = None
        for node in nodes:
            if node.get("type") == "output":
                output_result = results.get(node["id"])
                break

        if output_result:
            return {
                "response": output_result.get("response", "No response generated."),
                "sources": output_result.get("sources", [])
            }

        return {
            "response": "Workflow execution completed but no output was generated.",
            "sources": []
        }


workflow_engine = WorkflowEngine()
