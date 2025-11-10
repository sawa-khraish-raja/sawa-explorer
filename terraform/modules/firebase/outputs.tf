output "project_id" {
  description = "Firebase project ID"
  value       = var.project_id
}

output "firestore_database_name" {
  description = "Firestore database name"
  value       = google_firestore_database.database.name
}

output "storage_bucket_name" {
  description = "Storage bucket name"
  value       = google_storage_bucket.firebase_default.name
}

output "web_app_id" {
  description = "Firebase web app ID"
  value       = google_firebase_web_app.web_app.app_id
}

output "firebase_config" {
  description = "Firebase configuration for web app"
  value = {
    apiKey             = data.google_firebase_web_app_config.web_app_config.api_key
    authDomain         = data.google_firebase_web_app_config.web_app_config.auth_domain
    projectId          = var.project_id
    storageBucket      = google_storage_bucket.firebase_default.name
    messagingSenderId  = data.google_firebase_web_app_config.web_app_config.messaging_sender_id
    appId              = google_firebase_web_app.web_app.app_id
    measurementId      = data.google_firebase_web_app_config.web_app_config.measurement_id
  }
  sensitive = true
}

output "hosting_site_id" {
  description = "Firebase Hosting site ID"
  value       = google_firebase_hosting_site.default.site_id
}
