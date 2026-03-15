import uuid
from datetime import datetime, timedelta

from azure.storage.blob import BlobSasPermissions, BlobServiceClient, generate_blob_sas
from azure.storage.blob._models import CorsRule
from sqlalchemy.orm import Session
from core.config import CONFIG
from schemas.schema import ProfileUploadSASRequest
from models.model import User

STORAGE_ACCOUNT_NAME = CONFIG.STORAGE_ACCOUNT_NAME
STORAGE_ACCOUNT_KEY = CONFIG.STORAGE_ACCOUNT_KEY
STORAGE_CONTAINER_NAME = CONFIG.CONTAINER_NAME

ALLOWED_FILE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
}


def configure_storage_cors():
    """Set CORS rules on the Azure Storage account so browsers can upload directly."""
    connection_string = (
        f"DefaultEndpointsProtocol=https;"
        f"AccountName={STORAGE_ACCOUNT_NAME};"
        f"AccountKey={STORAGE_ACCOUNT_KEY};"
        f"EndpointSuffix=core.windows.net"
    )
    service_client = BlobServiceClient.from_connection_string(
        connection_string)
    cors_rule = CorsRule(
        allowed_origins=[CONFIG.FRONTEND_URL],
        allowed_methods=["PUT"],
        allowed_headers=["Content-Type", "x-ms-blob-type"],
        exposed_headers=["ETag"],
        max_age_in_seconds=3600,
    )
    service_client.set_service_properties(cors=[cors_rule])


def _build_blob_url(account: str, container: str, blob_path: str) -> str:
    return f"https://{account}.blob.core.windows.net/{container}/{blob_path}"


async def _generate_blob_sas(payload: ProfileUploadSASRequest, user_name: str):
    if payload.content_type not in ALLOWED_FILE_TYPES:
        raise ValueError("Unsupported file type")

    ext = ALLOWED_FILE_TYPES[payload.content_type]
    blob_name = f"users/{user_name}/profle_{uuid.uuid4().hex}.{ext}"

    start_time = datetime.utcnow() - timedelta(minutes=1)
    expiry_time = datetime.utcnow() + timedelta(minutes=5)

    if not STORAGE_ACCOUNT_KEY:
        raise ValueError("Storage account key is not configured")

    sas = generate_blob_sas(
        account_name=STORAGE_ACCOUNT_NAME,
        container_name=STORAGE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=STORAGE_ACCOUNT_KEY,
        permission=BlobSasPermissions(write=True, create=True),
        start=start_time,
        expiry=expiry_time,
        content_type=payload.content_type
    )

    sas_url = _build_blob_url(STORAGE_ACCOUNT_NAME,
                              STORAGE_CONTAINER_NAME, blob_name) + "?" + sas

    return {
        "sas_url": sas_url,
        "blob_url": blob_name,
        "expires_at": expiry_time
    }


def _generate_read_sas(user_id: str, db: Session):
    user = db.query(User).filter(User.username == user_id).first()
    if not user or not user.image_url:
        raise ValueError("User or profile image not found")

    blob_name = _extract_blob_name(user.image_url)

    expiry = datetime.utcnow() + timedelta(minutes=5)

    sas = generate_blob_sas(
        account_name=STORAGE_ACCOUNT_NAME,
        container_name=STORAGE_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=STORAGE_ACCOUNT_KEY,
        permission=BlobSasPermissions(read=True),
        expiry=expiry
    )

    return {
        "sas_url": _build_blob_url(STORAGE_ACCOUNT_NAME, STORAGE_CONTAINER_NAME, blob_name) + "?" + sas,
        "expires_at": expiry
    }


def _extract_blob_name(blob_url: str) -> str:
    """Extract the blob name from a full Azure Blob Storage URL or return as-is if already a name."""
    prefix = f"https://{STORAGE_ACCOUNT_NAME}.blob.core.windows.net/{STORAGE_CONTAINER_NAME}/"
    if blob_url.startswith(prefix):
        return blob_url[len(prefix):].split("?")[0]
    return blob_url.split("?")[0]


async def delete_blob(blob_name: str):
    try:
        blob_name = _extract_blob_name(blob_name)
        connection_string = (
            f"DefaultEndpointsProtocol=https;"
            f"AccountName={STORAGE_ACCOUNT_NAME};"
            f"AccountKey={STORAGE_ACCOUNT_KEY};"
            f"EndpointSuffix=core.windows.net"
        )
        service_client = BlobServiceClient.from_connection_string(
            connection_string)
        blob_client = service_client.get_blob_client(
            container=STORAGE_CONTAINER_NAME, blob=blob_name)
        blob_client.delete_blob()
    except Exception as e:
        print(f"Failed to delete blob: {e}")
