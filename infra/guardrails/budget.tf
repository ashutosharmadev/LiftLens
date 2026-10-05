# Separate from the console budget (liftlens-1usd), which stays outside
# Terraform as an independent backup.
resource "aws_budgets_budget" "guardrail" {
  name         = "liftlens-guardrail"
  budget_type  = "COST"
  limit_amount = tostring(var.budget_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
    subscriber_sns_topic_arns  = [aws_sns_topic.guardrail.arn]
  }

  depends_on = [aws_sns_topic_policy.guardrail]
}

# At 100% of actual spend, attach the deny-all policy to the deploy role.
resource "aws_budgets_budget_action" "lock_deploy_role" {
  budget_name        = aws_budgets_budget.guardrail.name
  action_type        = "APPLY_IAM_POLICY"
  approval_model     = "AUTOMATIC"
  notification_type  = "ACTUAL"
  execution_role_arn = aws_iam_role.budget_action.arn

  action_threshold {
    action_threshold_type  = "PERCENTAGE"
    action_threshold_value = 100
  }

  definition {
    iam_action_definition {
      policy_arn = aws_iam_policy.deny_all.arn
      roles      = [aws_iam_role.deploy.name]
    }
  }

  subscriber {
    address           = var.alert_email
    subscription_type = "EMAIL"
  }
}

# The role AWS Budgets uses to run the action.
resource "aws_iam_role" "budget_action" {
  name = "liftlens-budget-action"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "budgets.amazonaws.com" }
      Action    = "sts:AssumeRole"
      Condition = {
        StringEquals = { "aws:SourceAccount" = local.account_id }
      }
    }]
  })
}

# It may only attach or detach the deny-all policy, and only on the deploy role.
resource "aws_iam_role_policy" "budget_action" {
  name = "attach-deny-all-to-deploy-role"
  role = aws_iam_role.budget_action.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["iam:AttachRolePolicy", "iam:DetachRolePolicy"]
      Resource = aws_iam_role.deploy.arn
      Condition = {
        ArnEquals = { "iam:PolicyARN" = aws_iam_policy.deny_all.arn }
      }
    }]
  })
}
