# One item per measurement: userId (Cognito sub) + server timestamp.
# Provisioned capacity inside the always-free tier (25 RCU/WCU): requests over
# capacity are throttled, not billed. On-demand requests are never free.
resource "aws_dynamodb_table" "measurements" {
  name           = "liftlens-measurements"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  table_class    = "STANDARD" # the free tier only covers Standard

  hash_key  = "userId"
  range_key = "timestamp"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  # Refuses DeleteTable until switched off, from Terraform or the console.
  deletion_protection_enabled = true

  # Encryption at rest uses the AWS owned key (the default, no charge).
  # Point-in-time recovery stays off: continuous backups are billed per GB.
}
