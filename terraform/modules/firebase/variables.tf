variable "credentials_file" {
  description = "Path to GCP service account credentials JSON file"
  type        = string
  default     = ""
}

variable "project_id" {
  description = "Firebase project ID"
  type        = string
  default     = "sawa-explorer-dev"
}

variable "environment" {
  description = "Environment name (dev or prd)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "us-central1"
}

variable "firestore_database_id" {
  description = "Firestore database ID"
  type        = string
  default     = "test"
}

variable "firestore_location" {
  description = "Firestore database location"
  type        = string
  default     = "us-central"
}

variable "storage_location" {
  description = "Cloud Storage bucket location"
  type        = string
  default     = "US"
}

variable "web_app_display_name" {
  description = "Display name for Firebase web app"
  type        = string
  default     = "Sawa Explorer Dev"
}
