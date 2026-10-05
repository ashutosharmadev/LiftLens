# The role every app deploy runs as. The budget action locks it at the limit.
resource "aws_iam_role" "deploy" {
  name        = "liftlens-deploy"
  description = "Runs Terraform for the LiftLens app stack. Locked by the budget action."

  # Only the SSO AdministratorAccess role in this account may switch into it.
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
      Action    = "sts:AssumeRole"
      Condition = {
        ArnLike = {
          "aws:PrincipalArn" = "arn:aws:iam::${local.account_id}:role/aws-reserved/sso.amazonaws.com/*/AWSReservedSSO_AdministratorAccess_*"
        }
      }
    }]
  })
}

# Broad for now; replaced with a least-privilege policy in M5 (see BACKLOG.md).
resource "aws_iam_role_policy_attachment" "deploy_admin" {
  role       = aws_iam_role.deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# Attached to the deploy role by the budget action. An explicit deny
# overrides every allow, so the role can do nothing until it is detached.
resource "aws_iam_policy" "deny_all" {
  name        = "liftlens-deny-all"
  description = "Attached by the budget action to stop all deploys."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Deny"
      Action   = "*"
      Resource = "*"
    }]
  })
}
