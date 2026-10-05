"""Cost kill switch.

Invoked by the guardrail SNS topic when the monthly budget is crossed.
Finds LiftLens app resources by tag and stops them:
  - Lambda functions: reserved concurrency set to 0 (no invocations, no cost)
  - CloudFront distributions: disabled (site stops serving)

Data (DynamoDB) and the guardrails stack itself are never touched.
Restoring service is a deliberate manual step.
"""

import json
import logging
import os

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

LAMBDA_TYPE = "lambda:function"
CLOUDFRONT_TYPE = "cloudfront:distribution"


def tag_filters(project, stack):
    return [
        {"Key": "Project", "Values": [project]},
        {"Key": "Stack", "Values": [stack]},
    ]


def find_arns(tagging, resource_type, filters):
    """Return ARNs of resources of one type that carry all the given tags."""
    arns = []
    paginator = tagging.get_paginator("get_resources")
    for page in paginator.paginate(TagFilters=filters, ResourceTypeFilters=[resource_type]):
        arns.extend(item["ResourceARN"] for item in page["ResourceTagMappingList"])
    return arns


def stop_lambdas(lambda_client, arns):
    stopped, errors = [], []
    for arn in arns:
        try:
            lambda_client.put_function_concurrency(
                FunctionName=arn, ReservedConcurrentExecutions=0
            )
            stopped.append(arn)
        except Exception as exc:  # keep going so one failure doesn't block the rest
            errors.append(f"{arn}: {exc}")
    return stopped, errors


def disable_distributions(cloudfront, arns):
    disabled, skipped, errors = [], [], []
    for arn in arns:
        dist_id = arn.rsplit("/", 1)[-1]
        try:
            current = cloudfront.get_distribution_config(Id=dist_id)
            config = current["DistributionConfig"]
            if not config["Enabled"]:
                skipped.append(arn)
                continue
            config["Enabled"] = False
            cloudfront.update_distribution(
                Id=dist_id, IfMatch=current["ETag"], DistributionConfig=config
            )
            disabled.append(arn)
        except Exception as exc:
            errors.append(f"{arn}: {exc}")
    return disabled, skipped, errors


def run(regional_tagging, global_tagging, lambda_client, cloudfront, project, stack):
    filters = tag_filters(project, stack)

    lambda_arns = find_arns(regional_tagging, LAMBDA_TYPE, filters)
    # CloudFront is a global service; its tags are only searchable from us-east-1.
    distribution_arns = find_arns(global_tagging, CLOUDFRONT_TYPE, filters)

    stopped, lambda_errors = stop_lambdas(lambda_client, lambda_arns)
    disabled, skipped, cf_errors = disable_distributions(cloudfront, distribution_arns)

    return {
        "lambdas_found": len(lambda_arns),
        "lambdas_stopped": stopped,
        "distributions_found": len(distribution_arns),
        "distributions_disabled": disabled,
        "distributions_already_disabled": skipped,
        "errors": lambda_errors + cf_errors,
    }


def handler(event, context):
    logger.info("Kill switch triggered: %s", json.dumps(event)[:2000])

    result = run(
        regional_tagging=boto3.client("resourcegroupstaggingapi"),
        global_tagging=boto3.client("resourcegroupstaggingapi", region_name="us-east-1"),
        lambda_client=boto3.client("lambda"),
        cloudfront=boto3.client("cloudfront"),
        project=os.environ["TARGET_PROJECT"],
        stack=os.environ["TARGET_STACK"],
    )
    logger.info("Kill switch result: %s", json.dumps(result))

    if result["errors"]:
        # Failing the invocation makes Lambda retry the async event.
        raise RuntimeError(f"Kill switch finished with errors: {result['errors']}")
    return result
