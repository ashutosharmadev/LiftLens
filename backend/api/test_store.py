from decimal import Decimal

from store import DynamoStore


class FakeTable:
    """Mimics the two boto3 Table calls DynamoStore uses, including paging."""

    def __init__(self, page_size=2):
        self.items, self.page_size = [], page_size

    def put_item(self, Item):
        assert not any(isinstance(v, float) for v in Item.values()), "boto3 rejects floats"
        self.items.append(Item)

    def query(self, KeyConditionExpression, ScanIndexForward, ExclusiveStartKey=None):
        start = ExclusiveStartKey["index"] if ExclusiveStartKey else 0
        page = self.items[start : start + self.page_size]
        result = {"Items": page}
        if start + self.page_size < len(self.items):
            result["LastEvaluatedKey"] = {"index": start + self.page_size}
        return result


class FakeResource:
    def __init__(self, table):
        self.table = table

    def Table(self, name):
        return self.table


def test_floats_become_decimals_and_back():
    table = FakeTable()
    store = DynamoStore("t", FakeResource(table))
    store.put({"userId": "u", "timestamp": "t1", "shoulderToWaist": 1.783})
    assert table.items[0]["shoulderToWaist"] == Decimal("1.783")
    assert store.list_for_user("u")[0]["shoulderToWaist"] == 1.783


def test_reads_every_page():
    table = FakeTable(page_size=2)
    store = DynamoStore("t", FakeResource(table))
    for i in range(5):
        store.put({"userId": "u", "timestamp": f"t{i}", "shoulderToWaist": 1.7})
    assert [i["timestamp"] for i in store.list_for_user("u")] == ["t0", "t1", "t2", "t3", "t4"]
