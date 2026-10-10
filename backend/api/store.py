"""DynamoDB access for measurement items. Tests use a fake with the same two methods."""

from decimal import Decimal
from typing import Protocol

from errors import ApiError

# The table is provisioned within the free tier (ADR-006); requests over its
# capacity are throttled rather than billed, and reported to the client as 503.
THROTTLE_CODES = {"ProvisionedThroughputExceededException", "ThrottlingException", "RequestLimitExceeded"}


def _raise_if_throttled(err: Exception) -> None:
    code = getattr(err, "response", {}).get("Error", {}).get("Code")
    if code in THROTTLE_CODES:
        raise ApiError(503, "Service busy, please try again shortly") from err


class MeasurementStore(Protocol):
    def put(self, card: dict) -> None: ...

    def list_for_user(self, user_id: str) -> list[dict]: ...


def _to_dynamo(card: dict) -> dict:
    # boto3 rejects Python floats; DynamoDB numbers must be Decimal.
    return {k: Decimal(str(v)) if isinstance(v, float) else v for k, v in card.items()}


def _from_dynamo(item: dict) -> dict:
    return {k: float(v) if isinstance(v, Decimal) else v for k, v in item.items()}


class DynamoStore:
    def __init__(self, table_name: str, dynamodb_resource=None):
        if dynamodb_resource is None:
            import boto3  # available in the Lambda runtime

            dynamodb_resource = boto3.resource("dynamodb")
        self._table = dynamodb_resource.Table(table_name)

    def put(self, card: dict) -> None:
        try:
            self._table.put_item(Item=_to_dynamo(card))
        except Exception as err:
            _raise_if_throttled(err)
            raise

    def list_for_user(self, user_id: str) -> list[dict]:
        from boto3.dynamodb.conditions import Key

        items, start_key = [], None
        while True:
            kwargs = {"KeyConditionExpression": Key("userId").eq(user_id), "ScanIndexForward": True}
            if start_key:
                kwargs["ExclusiveStartKey"] = start_key
            try:
                page = self._table.query(**kwargs)
            except Exception as err:
                _raise_if_throttled(err)
                raise
            items.extend(_from_dynamo(item) for item in page["Items"])
            start_key = page.get("LastEvaluatedKey")
            if not start_key:
                return items
