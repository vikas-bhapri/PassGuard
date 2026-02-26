from azure.communication.email import EmailClient
from core.config import CONFIG


AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING = CONFIG.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING
SENDER_EMAIL = CONFIG.SENDER_EMAIL


def send_email(subject: str, body: str, recipient_email: str):
    if not AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING or not SENDER_EMAIL:
        raise ValueError(
            "Azure Communication Service connection string or sender email is not set in environment variables.")
    # Create the EmailClient object that you use to send Email messages.
    message = {
        "content": {
            "subject": subject,
            "plainText": body,
            "html": f"{body}"
        },
        "recipients": {
            "to": [
                {
                    "address": recipient_email,
                }
            ]
        },
        "senderAddress": SENDER_EMAIL
    }
    POLLER_WAITING_TIME = 30  # seconds
    try:
        email_client = EmailClient.from_connection_string(
            AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING)

        poller = email_client.begin_send(message)
        time_elapsed = 0

        while not poller.done():
            print("Email send poller status: " + poller.status())
            poller.wait(POLLER_WAITING_TIME)
            time_elapsed += POLLER_WAITING_TIME

            if time_elapsed > 18 * POLLER_WAITING_TIME:
                raise RuntimeError("Polling timed out.")

        if poller.result()["status"] == "Succeeded":
            print(
                f"Successfully sent the email (operation id: {poller.result()['id']})")
        else:
            raise RuntimeError(str(poller.result()["error"]))

    except Exception as e:
        return f"Error sending email: {e}"
