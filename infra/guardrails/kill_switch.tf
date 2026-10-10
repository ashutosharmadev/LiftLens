locals {
  kill_switch_name = "liftlens-kill-switch"
}

data "archive_file" "kill_switch" {
  type        = "zip"
  source_file = "${path.module}/../../backend/kill_switch/handler.py"
  # Inside .terraform/, which is already gitignored.
  output_path = "${path.module}/.terraform/build/kill_switch.zip"
}

resource "aws_cloudwatch_log_group" "kill_switch" {
  name              = "/aws/lambda/${local.kill_switch_name}"
  retention_in_days = 7
}

resource "aws_lambda_function" "kill_switch" {
  function_name    = local.kill_switch_name
  description      = "Stops LiftLens app Lambdas and CloudFront when the budget limit is crossed."
  role             = aws_iam_role.kill_switch.arn
  runtime          = "python3.13"
  handler          = "handler.handler"
  filename         = data.archive_file.kill_switch.output_path
  source_code_hash = data.archive_file.kill_switch.output_base64sha256
  timeout          = 30
  memory_size      = 128

  # Guarantees the kill switch can always run, even if the app floods the account.
  reserved_concurrent_executions = 2

  environment {
    variables = {
      TARGET_PROJECT = "LiftLens"
      TARGET_STACK   = "app"
    }
  }

  depends_on = [aws_cloudwatch_log_group.kill_switch]
}

resource "aws_iam_role" "kill_switch" {
  name = "liftlens-kill-switch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "kill_switch" {
  name = "stop-app-resources"
  role = aws_iam_role.kill_switch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "WriteOwnLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.kill_switch.arn}:*"
      },
      {
        # Read-only tag search; this API has no resource-level permissions.
        Sid      = "FindTaggedResources"
        Effect   = "Allow"
        Action   = "tag:GetResources"
        Resource = "*"
      },
      {
        Sid      = "StopAppLambdas"
        Effect   = "Allow"
        Action   = "lambda:PutFunctionConcurrency"
        Resource = "arn:aws:lambda:${local.region}:${local.account_id}:function:*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Project" = "LiftLens"
            "aws:ResourceTag/Stack"   = "app"
          }
        }
      },
      {
        Sid      = "DisableAppDistributions"
        Effect   = "Allow"
        Action   = ["cloudfront:GetDistributionConfig", "cloudfront:UpdateDistribution"]
        Resource = "arn:aws:cloudfront::${local.account_id}:distribution/*"
        Condition = {
          StringEquals = {
            "aws:ResourceTag/Project" = "LiftLens"
            "aws:ResourceTag/Stack"   = "app"
          }
        }
      },
    ]
  })
}
