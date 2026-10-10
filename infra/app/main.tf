# Application stack: everything here can be destroyed and recreated freely.
# Long-lived user data (table, user pool) lives in ../data and is looked up by name.

data "aws_dynamodb_table" "measurements" {
  name = var.table_name
}

data "aws_cognito_user_pools" "users" {
  name = var.user_pool_name
}

data "aws_cognito_user_pool_clients" "users" {
  user_pool_id = local.user_pool_id
}

locals {
  user_pool_id = one(data.aws_cognito_user_pools.users.ids)
  client_index = index(data.aws_cognito_user_pool_clients.users.client_names, var.web_client_name)
  client_id    = data.aws_cognito_user_pool_clients.users.client_ids[local.client_index]
}

module "api" {
  source = "../modules/api"

  table_name     = data.aws_dynamodb_table.measurements.name
  table_arn      = data.aws_dynamodb_table.measurements.arn
  cognito_issuer = "https://cognito-idp.${var.region}.amazonaws.com/${local.user_pool_id}"
  client_id      = local.client_id
  package_dir    = "${path.module}/../../backend/api/build/package"
}
