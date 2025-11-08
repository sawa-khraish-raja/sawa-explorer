.PHONY: help init plan-dev apply-dev plan-prd apply-prd output-dev output-prd import-prd

export GOOGLE_APPLICATION_CREDENTIALS := $(CURDIR)/service-account-dev.json

help:
	@echo "Firebase Terraform Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make init         - Initialize Terraform"
	@echo "  make plan-dev     - Plan changes for dev environment"
	@echo "  make apply-dev    - Apply changes to dev environment"
	@echo "  make plan-prd     - Plan changes for prd environment"
	@echo "  make apply-prd    - Apply changes to prd environment"
	@echo "  make output-dev   - Show dev environment outputs"
	@echo "  make output-prd   - Show prd environment outputs"
	@echo "  make import-prd   - Import existing prd resources"
	@echo "  make list         - List all Terraform resources"

init:
	terraform init

plan-dev:
	terraform plan -var-file="dev.tfvars"

apply-dev:
	terraform apply -var-file="dev.tfvars"

plan-prd:
	terraform plan -var-file="prd.tfvars"

apply-prd:
	terraform apply -var-file="prd.tfvars"

output-dev:
	terraform output -json

output-prd:
	terraform output -json

list:
	terraform state list

import-prd:
	@echo "Importing existing PRD resources..."
	terraform import -var-file="prd.tfvars" google_firebase_web_app.web_app projects/sawa-explorer/webApps/1:643815524231:web:3d387c3619311c5c7ef522 || true
	terraform import -var-file="prd.tfvars" google_firestore_database.database projects/sawa-explorer/databases/test || true
	terraform import -var-file="prd.tfvars" google_storage_bucket.firebase_default sawa-explorer.appspot.com || true
	terraform import -var-file="prd.tfvars" google_firebase_hosting_site.default projects/sawa-explorer/sites/sawa-explorer || true
	@echo "Import complete!"

fmt:
	terraform fmt -recursive

validate:
	terraform validate
