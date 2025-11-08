# Firebase Infrastructure as Code with Terraform

This directory contains Terraform configuration to manage Firebase infrastructure for both dev and prd environments.

## What This Manages

- Firebase Project Services (Firestore, Storage, Functions, Hosting, Auth)
- Firestore Database (test)
- Cloud Storage Buckets
- Firebase Web App Registration
- Firebase Hosting Sites

## Prerequisites

1. Install Terraform: `brew install terraform`
2. Install Google Cloud SDK: `brew install google-cloud-sdk`
3. Authenticate with Google Cloud:
   ```bash
   gcloud auth application-default login
   ```

## Directory Structure

```
terraform/
├── providers.tf       # Terraform and provider configuration
├── main.tf           # Firebase resource definitions
├── variables.tf      # Variable definitions
├── outputs.tf        # Output values
├── backend.tf        # Terraform state backend
├── dev.tfvars        # Dev environment values
├── prd.tfvars        # Prd environment values
└── README.md         # This file
```

## Usage

### Initialize Terraform

```bash
cd terraform
terraform init
```

### Plan Changes (Preview)

For Dev:
```bash
terraform plan -var-file="dev.tfvars"
```

For Prd:
```bash
terraform plan -var-file="prd.tfvars"
```

### Apply Changes (Create/Update Resources)

For Dev:
```bash
terraform apply -var-file="dev.tfvars"
```

For Prd:
```bash
terraform apply -var-file="prd.tfvars"
```

### View Current Resources

```bash
terraform state list
```

### Get Firebase Configuration

After applying, get the Firebase web app configuration:

For Dev:
```bash
terraform output -json firebase_config -var-file="dev.tfvars"
```

For Prd:
```bash
terraform output -json firebase_config -var-file="prd.tfvars"
```

### Destroy Resources (Use with Caution!)

```bash
terraform destroy -var-file="dev.tfvars"
```

## Important Notes

### For Existing Projects

Since your PRD project already has resources, you need to **import** them into Terraform state:

```bash
# Import web app
terraform import -var-file="prd.tfvars" google_firebase_web_app.web_app projects/sawa-explorer/webApps/1:643815524231:web:3d387c3619311c5c7ef522

# Import Firestore database
terraform import -var-file="prd.tfvars" google_firestore_database.database projects/sawa-explorer/databases/test

# Import storage bucket
terraform import -var-file="prd.tfvars" google_storage_bucket.firebase_default sawa-explorer.appspot.com

# Import hosting site
terraform import -var-file="prd.tfvars" google_firebase_hosting_site.default projects/sawa-explorer/sites/sawa-explorer
```

### Backend Configuration

Currently using local backend. For team collaboration, consider using:
- Google Cloud Storage backend
- Terraform Cloud

Update `backend.tf` accordingly.

## Workflow Integration

You can integrate this with GitHub Actions to automatically create dev resources:

```yaml
- name: Setup Terraform
  uses: hashicorp/setup-terraform@v2

- name: Terraform Init
  run: cd terraform && terraform init

- name: Terraform Apply Dev
  run: cd terraform && terraform apply -var-file="dev.tfvars" -auto-approve
  env:
    GOOGLE_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}
```

## Comparison with AWS

This is similar to managing AWS resources:

| AWS + Terraform | Firebase + Terraform |
|----------------|---------------------|
| aws_dynamodb_table | google_firestore_database |
| aws_s3_bucket | google_storage_bucket |
| aws_lambda_function | Deployed via Firebase CLI |
| terraform plan | terraform plan -var-file="dev.tfvars" |
| terraform apply | terraform apply -var-file="dev.tfvars" |
| terraform state list | terraform state list |

## Next Steps

1. Import existing PRD resources (see above)
2. Run `terraform plan -var-file="dev.tfvars"` to create dev resources
3. Run `terraform apply -var-file="dev.tfvars"` to provision dev environment
4. Use `terraform output firebase_config` to get Firebase config for `.env.dev`
