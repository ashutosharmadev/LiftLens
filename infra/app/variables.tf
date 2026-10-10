variable "region" {
  description = "AWS region for all LiftLens resources."
  type        = string
  default     = "ap-south-1"
}

variable "table_name" {
  description = "Measurement table created by the data stack."
  type        = string
  default     = "liftlens-measurements"
}

variable "user_pool_name" {
  description = "Cognito user pool created by the data stack."
  type        = string
  default     = "liftlens-users"
}

variable "web_client_name" {
  description = "Cognito app client the browser signs in with."
  type        = string
  default     = "liftlens-web"
}
