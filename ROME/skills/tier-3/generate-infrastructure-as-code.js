/**
 * /generate-infrastructure-as-code skill (Tier 3)
 * Generates Infrastructure as Code (Terraform)
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateInfrastructureAsCode {
  static async execute(params, executionId) {
    const { design_directory, output_directory, cloud_provider = 'aws' } = params;

    try {
      const filesGenerated = [];
      let resourcesDefined = 0;

      console.log(`Generating Infrastructure as Code for ${cloud_provider}...\n`);

      if (cloud_provider === 'aws') {
        // 1. Main Terraform configuration
        console.log('  Creating main.tf...');
        const mainTf = this.generateMainTf();
        fs.writeFileSync(path.join(output_directory, 'main.tf'), mainTf);
        filesGenerated.push('main.tf');
        resourcesDefined += 5;
        console.log('    ✅ Created\n');

        // 2. Variables
        console.log('  Creating variables.tf...');
        const variablesTf = this.generateVariablesTf();
        fs.writeFileSync(path.join(output_directory, 'variables.tf'), variablesTf);
        filesGenerated.push('variables.tf');
        console.log('    ✅ Created\n');

        // 3. Outputs
        console.log('  Creating outputs.tf...');
        const outputsTf = this.generateOutputsTf();
        fs.writeFileSync(path.join(output_directory, 'outputs.tf'), outputsTf);
        filesGenerated.push('outputs.tf');
        console.log('    ✅ Created\n');

        // 4. Database
        console.log('  Creating database.tf...');
        const databaseTf = this.generateDatabaseTf();
        fs.writeFileSync(path.join(output_directory, 'database.tf'), databaseTf);
        filesGenerated.push('database.tf');
        resourcesDefined += 3;
        console.log('    ✅ Created\n');

        // 5. Compute
        console.log('  Creating compute.tf...');
        const computeTf = this.generateComputeTf();
        fs.writeFileSync(path.join(output_directory, 'compute.tf'), computeTf);
        filesGenerated.push('compute.tf');
        resourcesDefined += 4;
        console.log('    ✅ Created\n');
      }

      return {
        files_generated: filesGenerated,
        resources_defined: resourcesDefined
      };

    } catch (error) {
      throw new Error(`Infrastructure as Code generation failed: ${error.message}`);
    }
  }

  static generateMainTf() {
    return `terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "terraform-state-bucket"
    key    = "app/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
`;
  }

  static generateVariablesTf() {
    return `variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "app_instance_type" {
  description = "EC2 instance type for application"
  type        = string
  default     = "t3.small"
}
`;
  }

  static generateOutputsTf() {
    return `output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.app.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "elasticache_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}
`;
  }

  static generateDatabaseTf() {
    return `resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-${var.environment}-db"
  engine            = "postgres"
  engine_version    = "14.7"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_encrypted = true
  
  db_name  = "app_db"
  username = "postgres"
  password = random_password.db_password.result
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  
  backup_retention_period = 7
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final"
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project_name}-${var.environment}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}
`;
  }

  static generateComputeTf() {
    return `resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-${var.environment}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.app_instance_type
  
  vpc_security_group_ids = [aws_security_group.app.id]
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
  }))
  
  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "${var.project_name}-${var.environment}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  
  min_size         = 2
  max_size         = 10
  desired_capacity = 2
  
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
}

resource "aws_lb" "app" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "app" {
  name     = "${var.project_name}-${var.environment}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}
`;
  }
}

module.exports = GenerateInfrastructureAsCode;
