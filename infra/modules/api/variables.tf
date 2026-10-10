variable "table_name" {
  type = string
}

variable "table_arn" {
  type = string
}

variable "cognito_issuer" {
  type = string
}

variable "client_id" {
  type = string
}

variable "package_dir" {
  description = "Directory built by backend/api/build.sh."
  type        = string
}

variable "function_name" {
  type    = string
  default = "liftlens-api"
}
