output "table_name" {
  value = aws_dynamodb_table.measurements.name
}

output "user_pool_id" {
  value = aws_cognito_user_pool.users.id
}

output "web_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "cognito_issuer" {
  description = "Issuer URL the API checks tokens against."
  value       = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.users.id}"
}
