import base64
import hashlib
import logging

from fastapi import Depends, FastAPI, HTTPException
from pydantic import ValidationError

from .extract import extract_text
from .portal import PortalClient
from .recipe_extractor import RecipeExtractor
from .schemas import IngestPayload, UploadPayload
from .security import require_upload_secret
from .settings import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()
app = FastAPI(title="Fuego Real File Import", version="1.1.0")


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "extractor_configured": bool(settings.llm_model and (settings.llm_provider == "ollama" or settings.openai_api_key)),
        "llm_provider": settings.llm_provider,
        "portal_configured": bool(settings.portal_api_base and settings.portal_import_secret),
    }


@app.post("/upload", dependencies=[Depends(require_upload_secret)])
async def upload_file(payload: UploadPayload) -> dict:
    try:
        raw = base64.b64decode(payload.contentBase64, validate=True)
        if len(raw) > settings.max_file_bytes:
            raise HTTPException(status_code=413, detail="El archivo supera el límite permitido.")
        content_hash = hashlib.sha256(raw).hexdigest()
        text = extract_text(payload.fileName, payload.mimeType, raw, settings)
        extracted = await RecipeExtractor(settings).extract(payload.fileName, text, payload.contentType)
        kwargs = {"recipes": extracted} if payload.contentType == "receta" else {"items": extracted}
        ingest = IngestPayload(
            driveFileId=f"upload:{content_hash}", contentHash=content_hash,
            fileName=payload.fileName, mimeType=payload.mimeType,
            contentType=payload.contentType, **kwargs,
        )
        result = await PortalClient(settings).ingest(ingest)
        return {"ok": True, "contentType": payload.contentType, "count": len(extracted), "result": result}
    except HTTPException:
        raise
    except (ValueError, ValidationError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        logger.exception("File upload processing failed")
        raise HTTPException(status_code=502, detail="No se pudo procesar o guardar el archivo.") from error


