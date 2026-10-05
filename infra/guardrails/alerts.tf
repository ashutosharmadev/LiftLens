# The budget publishes here; the kill switch listens.
resource "aws_sns_topic" "guardrail" {
  name = "liftlens-guardrail-alerts"
}

# Only AWS Budgets, acting for this account, may publish.
resource "aws_sns_topic_policy" "guardrail" {
  arn = aws_sns_topic.guardrail.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowBudgetsPublish"
      Effect    = "Allow"
      Principal = { Service = "budgets.amazonaws.com" }
      Action    = "SNS:Publish"
      Resource  = aws_sns_topic.guardrail.arn
      Condition = {
        StringEquals = { "aws:SourceAccount" = local.account_id }
        ArnLike      = { "aws:SourceArn" = "arn:aws:budgets::${local.account_id}:*" }
      }
    }]
  })
}

resource "aws_sns_topic_subscription" "kill_switch" {
  topic_arn = aws_sns_topic.guardrail.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.kill_switch.arn
}

# Lets this topic, and nothing else, invoke the kill switch.
resource "aws_lambda_permission" "sns_invoke_kill_switch" {
  statement_id  = "AllowGuardrailTopic"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.kill_switch.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.guardrail.arn
}
