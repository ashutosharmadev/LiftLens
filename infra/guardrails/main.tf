# Cost guardrails: budget action, alert topic and kill switch.
# Kept in its own root so destroying the app never removes them.
# Always applied with the SSO admin profile, so it stays fixable
# while the deploy role is locked.

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.region
}
