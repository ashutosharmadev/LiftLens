from handler import run, tag_filters


class FakePaginator:
    def __init__(self, resources):
        self.resources = resources
        self.calls = []

    def paginate(self, TagFilters, ResourceTypeFilters):
        self.calls.append((TagFilters, ResourceTypeFilters))
        wanted = ResourceTypeFilters[0]
        matches = [
            {"ResourceARN": arn}
            for arn, rtype, tags in self.resources
            if rtype == wanted
            and all(tags.get(f["Key"]) in f["Values"] for f in TagFilters)
        ]
        yield {"ResourceTagMappingList": matches}


class FakeTagging:
    def __init__(self, resources):
        self.paginator = FakePaginator(resources)

    def get_paginator(self, name):
        assert name == "get_resources"
        return self.paginator


class FakeLambda:
    def __init__(self, fail_on=()):
        self.concurrency = {}
        self.fail_on = set(fail_on)

    def put_function_concurrency(self, FunctionName, ReservedConcurrentExecutions):
        if FunctionName in self.fail_on:
            raise RuntimeError("AccessDenied")
        self.concurrency[FunctionName] = ReservedConcurrentExecutions


class FakeCloudFront:
    def __init__(self, enabled_by_id):
        self.enabled = dict(enabled_by_id)
        self.updates = []

    def get_distribution_config(self, Id):
        return {"ETag": f"etag-{Id}", "DistributionConfig": {"Enabled": self.enabled[Id]}}

    def update_distribution(self, Id, IfMatch, DistributionConfig):
        self.updates.append((Id, IfMatch))
        self.enabled[Id] = DistributionConfig["Enabled"]


APP = {"Project": "LiftLens", "Stack": "app"}
GUARDRAILS = {"Project": "LiftLens", "Stack": "guardrails"}

API_FN = "arn:aws:lambda:ap-south-1:111111111111:function:liftlens-api"
KILL_FN = "arn:aws:lambda:ap-south-1:111111111111:function:liftlens-kill-switch"
OTHER_FN = "arn:aws:lambda:ap-south-1:111111111111:function:someone-else"
SITE = "arn:aws:cloudfront::111111111111:distribution/E1SITE"


def make(regional, global_, lambda_fail=(), cf_enabled=None):
    return dict(
        regional_tagging=FakeTagging(regional),
        global_tagging=FakeTagging(global_),
        lambda_client=FakeLambda(lambda_fail),
        cloudfront=FakeCloudFront(cf_enabled or {}),
        project="LiftLens",
        stack="app",
    )


def test_nothing_deployed_reports_zero():
    deps = make(regional=[], global_=[])
    result = run(**deps)
    assert result["lambdas_found"] == 0
    assert result["distributions_found"] == 0
    assert result["errors"] == []


def test_stops_only_app_lambdas_never_itself_or_others():
    deps = make(
        regional=[
            (API_FN, "lambda:function", APP),
            (KILL_FN, "lambda:function", GUARDRAILS),
            (OTHER_FN, "lambda:function", {}),
        ],
        global_=[],
    )
    result = run(**deps)
    assert result["lambdas_stopped"] == [API_FN]
    assert deps["lambda_client"].concurrency == {API_FN: 0}


def test_disables_enabled_app_distribution_with_etag():
    deps = make(
        regional=[],
        global_=[(SITE, "cloudfront:distribution", APP)],
        cf_enabled={"E1SITE": True},
    )
    result = run(**deps)
    assert result["distributions_disabled"] == [SITE]
    assert deps["cloudfront"].enabled["E1SITE"] is False
    assert deps["cloudfront"].updates == [("E1SITE", "etag-E1SITE")]


def test_already_disabled_distribution_is_skipped():
    deps = make(
        regional=[],
        global_=[(SITE, "cloudfront:distribution", APP)],
        cf_enabled={"E1SITE": False},
    )
    result = run(**deps)
    assert result["distributions_already_disabled"] == [SITE]
    assert deps["cloudfront"].updates == []


def test_one_failure_does_not_stop_the_rest():
    second = API_FN + "-2"
    deps = make(
        regional=[
            (API_FN, "lambda:function", APP),
            (second, "lambda:function", APP),
        ],
        global_=[],
        lambda_fail=[API_FN],
    )
    result = run(**deps)
    assert result["lambdas_stopped"] == [second]
    assert len(result["errors"]) == 1


def test_cloudfront_is_searched_in_the_global_client():
    deps = make(regional=[], global_=[])
    run(**deps)
    assert deps["global_tagging"].paginator.calls[0][1] == ["cloudfront:distribution"]
    assert deps["regional_tagging"].paginator.calls[0][1] == ["lambda:function"]
    assert deps["regional_tagging"].paginator.calls[0][0] == tag_filters("LiftLens", "app")
