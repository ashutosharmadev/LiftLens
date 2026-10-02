# Credentials come from the environment (AWS_PROFILE locally, OIDC in CI),
# so no profile is named here.
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "LiftLens"
      ManagedBy = "terraform"
      Stack     = "guardrails"
    }
  }
}
