terraform {
  backend "gcs" {
    bucket = "sawa-explorer-terraform-state"
    prefix = "dev"
  }
}
