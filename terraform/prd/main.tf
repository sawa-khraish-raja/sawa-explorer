terraform {
  backend "gcs" {
    bucket = "sawa-explorer-terraform-state"
    prefix = "prd"
  }
}

module "firebase" {
  source = "../modules/firebase"

  project_id            = var.project_id
  environment           = var.environment
  region                = var.region
  firestore_database_id = var.firestore_database_id
  firestore_location    = var.firestore_location
  storage_location      = var.storage_location
  web_app_display_name  = var.web_app_display_name
  credentials_file      = var.credentials_file
}

output "firebase_config" {
  value     = module.firebase.firebase_config
  sensitive = true
}

output "firestore_database_name" {
  value = module.firebase.firestore_database_name
}

output "storage_bucket_name" {
  value = module.firebase.storage_bucket_name
}

output "hosting_site_id" {
  value = module.firebase.hosting_site_id
}

output "web_app_id" {
  value = module.firebase.web_app_id
}

output "project_id" {
  value = module.firebase.project_id
}
