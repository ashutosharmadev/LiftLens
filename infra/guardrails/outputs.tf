output "deploy_role_arn" {
  description = "Role the app stack is deployed with (profile liftlens-deploy)."
  value       = aws_iam_role.deploy.arn
}

output "guardrail_topic_arn" {
  description = "SNS topic the budget publishes to."
  value       = aws_sns_topic.guardrail.arn
}

output "kill_switch_function_name" {
  description = "Invoke manually to test the kill switch."
  value       = aws_lambda_function.kill_switch.function_name
}
