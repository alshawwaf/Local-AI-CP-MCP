# open-webui/pipes/n8n_pipe.py

"""
This module defines a Pipe class that utilizes N8N for an Agent
"""

from typing import Optional, Callable, Awaitable
from pydantic import BaseModel, Field
import time
import requests


class Pipe:
    class Valves(BaseModel):
        n8n_url: str = Field(
            default="http://n8n:5678/webhook/your-webhook-path",
            description="Internal n8n URL on the Docker network",
        )
        n8n_bearer_token: str = Field(default="changeme")
        input_field: str = Field(default="chatInput")
        response_field: str = Field(default="output")
        emit_interval: float = Field(
            default=2.0, description="Interval in seconds between status emissions"
        )
        enable_status_indicator: bool = Field(
            default=True, description="Enable or disable status indicator emissions"
        )

    def __init__(self):
        self.type = "pipe"
        self.id = "n8n_pipe"
        self.name = "N8N Pipe"
        self.valves = self.Valves()
        self.last_emit_time = 0

    async def emit_status(
        self,
        __event_emitter__: Callable[[dict], Awaitable[None]],
        level: str,
        message: str,
        done: bool,
    ):
        current_time = time.time()
        if (
            __event_emitter__
            and self.valves.enable_status_indicator
            and (
                current_time - self.last_emit_time >= self.valves.emit_interval or done
            )
        ):
            await __event_emitter__(
                {
                    "type": "status",
                    "data": {
                        "status": "complete" if done else "in_progress",
                        "level": level,
                        "description": message,
                        "done": done,
                    },
                }
            )
            self.last_emit_time = current_time

    async def pipe(
        self,
        body: dict,
        __user__: Optional[dict] = None,
        __event_emitter__: Callable[[dict], Awaitable[None]] = None,
        __event_call__: Callable[[dict], Awaitable[dict]] = None,
    ) -> Optional[dict]:
        await self.emit_status(
            __event_emitter__, "info", "Calling n8n workflow...", False
        )

        messages = body.get("messages", [])
        if not messages:
            msg = "No messages found in the request body"
            await self.emit_status(__event_emitter__, "error", msg, True)
            body.setdefault("messages", []).append(
                {"role": "assistant", "content": msg}
            )
            return {"error": msg}

        question = messages[-1]["content"]

        try:
            headers = {
                "Authorization": f"Bearer {self.valves.n8n_bearer_token}",
                "Content-Type": "application/json",
            }
            payload = {
                "sessionId": (__user__ or {}).get("id", "anonymous"),
                self.valves.input_field: question,
            }

            resp = requests.post(
                self.valves.n8n_url, json=payload, headers=headers, timeout=30
            )
            if resp.status_code != 200:
                raise Exception(f"{resp.status_code}: {resp.text}")

            data = resp.json()
            n8n_response = data.get(self.valves.response_field, "")
            body["messages"].append({"role": "assistant", "content": n8n_response})

            await self.emit_status(__event_emitter__, "info", "Complete", True)
            return n8n_response
        except Exception as e:
            err = f"Error calling n8n: {e}"
            await self.emit_status(__event_emitter__, "error", err, True)
            return {"error": err}
