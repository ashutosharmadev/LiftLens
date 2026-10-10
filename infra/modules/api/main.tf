# The measurements API: one Lambda behind a public Function URL.
# Anyone can reach the URL, but every request needs a valid Cognito token
# (checked in the handler); reserved concurrency caps how many run at once.

data "archive_file" "package" {
  type        = "zip"
  source_dir  = var.package_dir
  output_path = "${path.root}/.terraform/build/api.zip"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = 7
}

resource "aws_lambda_function" "api" {
  function_name    = var.function_name
  description      = "LiftLens measurements API (POST and GET /api/measurements)."
  role             = aws_iam_role.api.arn
  runtime          = "python3.13"
  architectures    = ["arm64"]
  handler          = "app.handler"
  filename         = data.archive_file.package.output_path
  source_code_hash = data.archive_file.package.output_base64sha256
  timeout          = 10
  memory_size      = 256

  # Caps concurrent runs, and so how fast a flood of requests can spend.
  reserved_concurrent_executions = 2

  environment {
    variables = {
      TABLE_NAME        = var.table_name
      COGNITO_ISSUER    = var.cognito_issuer
      COGNITO_CLIENT_ID = var.client_id
    }
  }

  depends_on = [aws_cloudwatch_log_group.api]
}

resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "NONE"
}

# Public Function URLs need both permissions: invoking via the URL, and the
# underlying invoke, each limited to requests that arrive through the URL.
resource "aws_lambda_permission" "public_url" {
  statement_id           = "AllowPublicFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.api.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "public_invoke_via_url" {
  statement_id             = "AllowInvokeViaFunctionUrl"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.api.function_name
  principal                = "*"
  invoked_via_function_url = true
}

resource "aws_iam_role" "api" {
  name = "${var.function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# Save and read measurements in this one table, and write its own logs. Nothing else.
resource "aws_iam_role_policy" "api" {
  name = "measurements-table-and-logs"
  role = aws_iam_role.api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "SaveAndReadMeasurements"
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:Query"]
        Resource = var.table_arn
      },
      {
        Sid      = "WriteOwnLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.api.arn}:*"
      },
    ]
  })
}
