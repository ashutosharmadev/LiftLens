output "api_url" {
  description = "Public Function URL (requests still need a valid token)."
  value       = module.api.function_url
}

output "api_function_name" {
  value = module.api.function_name
}
