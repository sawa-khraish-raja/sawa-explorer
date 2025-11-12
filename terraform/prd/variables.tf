variable "credentials_file" {
  description = "Path to the service account credentials file"
  type        = string
  default     = ""
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prd)"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "firestore_database_id" {
  description = "Firestore database ID"
  type        = string
}

variable "firestore_location" {
  description = "Firestore database location"
  type        = string
}

variable "storage_location" {
  description = "Storage bucket location"
  type        = string
}

variable "web_app_display_name" {
  description = "Firebase web app display name"
  type        = string
}
