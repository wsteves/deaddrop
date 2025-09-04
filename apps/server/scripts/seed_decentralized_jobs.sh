#!/usr/bin/env bash
# Seed 20 fake decentralized jobs via curl
# Usage: ./seed_decentralized_jobs.sh [BASE_URL]
# Example: ./seed_decentralized_jobs.sh http://localhost:4000

set -euo pipefail

BASE_URL=${1:-http://localhost:4000}
ENDPOINT="$BASE_URL/api/jobs/decentralized"

roles=("Frontend Engineer" "Backend Engineer" "Fullstack Developer" "Product Manager" "Data Scientist" "DevOps Engineer" "QA Engineer" "UX Designer" "Mobile Engineer" "Site Reliability Engineer")
companies=("Acme Co" "Brightside" "Cloudwave" "DataForge" "EdgeLabs" "Flux Systems" "GreenField" "Hyperion" "NovaWorks" "PulseTech")
locations=("Berlin, DE" "Remote" "London, UK" "New York, USA" "Lisbon, PT" "Amsterdam, NL" "Barcelona, ES" "Toronto, CA" "Sydney, AU" "Singapore")
skills=("JavaScript" "TypeScript" "Node.js" "React" "Postgres" "Docker" "Kubernetes" "AWS" "Rust" "Go")
tags=("remote" "full-time" "senior" "junior" "contract" "urgent")

rand() { echo $((RANDOM % $1)); }
escape() { printf '%s' "$1" | sed 's/"/\\"/g'; }

echo "Seeding 20 fake decentralized jobs to: $ENDPOINT"

for i in $(seq 1 20); do
  role=${roles[$(rand ${#roles[@]})]}
  comp=${companies[$(rand ${#companies[@]})]}
  loc=${locations[$(rand ${#locations[@]})]}
  skill1=${skills[$(rand ${#skills[@]})]}
  skill2=${skills[$(rand ${#skills[@]})]}
  tag=${tags[$(rand ${#tags[@]})]}

  title="$role @ $comp"
  description="We are looking for a ${role} to join ${comp}. You'll work on exciting problems and ship great software."

  # Build JSON payload (simple, predictable fields)
  json=$(cat <<JSON
{
  "title": "$(escape "$title")",
  "description": "$(escape "$description")",
  "companyId": "${comp// /_}",
  "location": "$(escape "$loc")",
  "salary": $((50000 + (RANDOM % 80000))),
  "salaryMin": $((40000 + (RANDOM % 30000))),
  "salaryMax": $((90000 + (RANDOM % 60000))),
  "tags": ["$(escape "$tag")"],
  "skills": ["$(escape "$skill1")","$(escape "$skill2")"],
  "employmentType": "full-time",
  "experienceLevel": "mid",
  "remote": "$( [ "$loc" = "Remote" ] && echo "remote" || echo "onsite" )",
  "applicationEmail": "jobs+seed@${comp// /}.example",
  "applicationMethod": "email",
  "benefits": ["Health insurance","Flexible hours"],
  "expiresAt": $(date -v+30d +%s)
}
JSON
)

  # Post and capture HTTP status
  echo "\n[$i] Posting: $title"
  response=$(curl -s -w "\n__HTTP_STATUS__:%{http_code}\n" -X POST -H "Content-Type: application/json" -d "$json" "$ENDPOINT") || true
  http_code=$(printf "%s" "$response" | awk -F"__HTTP_STATUS__:" '{print $2}' | tr -d '\r\n')
  body=$(printf "%s" "$response" | sed 's/__HTTP_STATUS__:[0-9]\{3\}$//')
  echo "Status: $http_code"
  echo "Response body: $body"
done

echo "\nSeeding complete."

exit 0
