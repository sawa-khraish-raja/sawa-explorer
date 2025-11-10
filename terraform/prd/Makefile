export GOOGLE_APPLICATION_CREDENTIALS := $(CURDIR)/service-account-prd.json

.PHONY: init plan apply destroy

init:
	terraform init

plan:
	terraform plan

apply:
	terraform apply

destroy:
	terraform destroy
