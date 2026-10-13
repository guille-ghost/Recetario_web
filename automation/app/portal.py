import httpx

from .schemas import IngestPayload
from .settings import Settings


class PortalClient:
    def __init__(self, settings: Settings) -> None:
        if not settings.portal_api_base or not settings.portal_import_secret:
            raise RuntimeError("Set PORTAL_API_BASE and PORTAL_IMPORT_SECRET")
        self.base_url = settings.portal_api_base.rstrip("/")
        self.secret = settings.portal_import_secret

    async def ingest(self, payload: IngestPayload) -> dict:
        headers = {"Authorization": f"Bearer {self.secret}"}
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            register = await client.post(
                f"{self.base_url}/api/importaciones/registrar",
                headers=headers,
                json={
                    "driveFileId": payload.driveFileId,
                    "contentHash": payload.contentHash,
                    "fileName": payload.fileName,
                    "mimeType": payload.mimeType,
                },
            )
            register.raise_for_status()
            results = []
            entries = payload.recipes if payload.contentType == "receta" else payload.items
            for imported in entries:
                response = await client.post(
                    f"{self.base_url}/api/importaciones/borradores",
                    headers=headers,
                    json={
                        "driveFileId": payload.driveFileId,
                        "contentHash": payload.contentHash,
                        "contentType": payload.contentType,
                        "recipeKey": f"{payload.contentType}:{getattr(imported, 'recipeKey', getattr(imported, 'itemKey', '1'))}",
                        "recipe": getattr(imported, "recipe", getattr(imported, "item", None)).model_dump(),
                    },
                )
                response.raise_for_status()
                results.append(response.json())
        return {"registered": register.json(), "drafts": results}
