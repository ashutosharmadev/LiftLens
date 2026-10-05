variable "region" {
  description = "AWS region for all LiftLens resources."
  type        = string
  default     = "ap-south-1"
}

variable "alert_email" {
  description = "Email that receives guardrail budget alerts. Set in terraform.tfvars (gitignored)."
  type        = string
}

variable "budget_limit_usd" {
  description = "Monthly spend (USD) at which the kill switch fires and the deploy role is locked."
  type        = number
  default     = 1
}
