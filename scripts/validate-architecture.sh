#!/bin/bash

# Architecture Validation Script
# This script verifies that the provider abstraction layer is correctly implemented
# per SRS Section 5.1 requirements

echo "🔍 Validating Aban Dialer Architecture..."
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

# Test 1: Check for Twilio imports outside provider directory
echo "📞 Test 1: Checking for Twilio imports outside provider directory..."
twilio_imports=$(grep -r "from.*twilio" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=lib/telephony/providers/twilio \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  . 2>/dev/null || true)

if [ -z "$twilio_imports" ]; then
  echo -e "${GREEN}✅ PASS${NC}: No Twilio imports found outside provider directory"
else
  echo -e "${RED}❌ FAIL${NC}: Found Twilio imports outside provider directory:"
  echo "$twilio_imports"
  errors=$((errors + 1))
fi
echo ""

# Test 2: Check for Supabase Storage imports outside provider directory
echo "💾 Test 2: Checking for Supabase Storage imports outside provider directory..."
supabase_imports=$(grep -r "from.*@supabase/supabase-js" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=lib/storage/providers/supabase \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  . 2>/dev/null || true)

if [ -z "$supabase_imports" ]; then
  echo -e "${GREEN}✅ PASS${NC}: No Supabase Storage imports found outside provider directory"
else
  echo -e "${RED}❌ FAIL${NC}: Found Supabase Storage imports outside provider directory:"
  echo "$supabase_imports"
  errors=$((errors + 1))
fi
echo ""

# Test 3: Check for direct fs imports outside local storage provider
echo "📁 Test 3: Checking for direct 'fs' imports outside local storage provider..."
fs_imports=$(grep -r "from ['\"]fs['\"]" \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=lib/storage/providers/local \
  --include="*.ts" \
  --include="*.tsx" \
  . 2>/dev/null || true)

if [ -z "$fs_imports" ]; then
  echo -e "${GREEN}✅ PASS${NC}: No direct 'fs' imports found outside local storage provider"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: Found direct 'fs' imports (may be acceptable in API routes):"
  echo "$fs_imports"
fi
echo ""

# Test 4: Verify required interface files exist
echo "🏗️  Test 4: Checking for required interface files..."
required_files=(
  "lib/telephony/types.ts"
  "lib/telephony/client-types.ts"
  "lib/telephony/factory.ts"
  "lib/storage/types.ts"
  "lib/storage/factory.ts"
)

all_files_exist=true
for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} Found: $file"
  else
    echo -e "${RED}❌${NC} Missing: $file"
    all_files_exist=false
    errors=$((errors + 1))
  fi
done

if [ "$all_files_exist" = true ]; then
  echo -e "${GREEN}✅ PASS${NC}: All required interface files exist"
else
  echo -e "${RED}❌ FAIL${NC}: Some required interface files are missing"
fi
echo ""

# Test 5: Verify provider implementations exist
echo "🔌 Test 5: Checking for provider implementations..."
provider_files=(
  "lib/telephony/providers/twilio/twilio-provider.ts"
  "lib/telephony/providers/twilio/twilio-dialer-client.ts"
  "lib/storage/providers/local/local-storage-provider.ts"
  "lib/storage/providers/supabase/supabase-storage-provider.ts"
)

all_providers_exist=true
for file in "${provider_files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} Found: $file"
  else
    echo -e "${RED}❌${NC} Missing: $file"
    all_providers_exist=false
    errors=$((errors + 1))
  fi
done

if [ "$all_providers_exist" = true ]; then
  echo -e "${GREEN}✅ PASS${NC}: All provider implementations exist"
else
  echo -e "${RED}❌ FAIL${NC}: Some provider implementations are missing"
fi
echo ""

# Test 6: Check that factories use switch statements (architecture smell test)
echo "🏭 Test 6: Checking factory pattern implementation..."
if grep -q "switch.*process.env.TELEPHONY_PROVIDER" lib/telephony/factory.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC}: Telephony factory uses switch statement"
else
  echo -e "${RED}❌ FAIL${NC}: Telephony factory does not use switch statement pattern"
  errors=$((errors + 1))
fi

if grep -q "switch.*process.env.STORAGE_PROVIDER" lib/storage/factory.ts 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC}: Storage factory uses switch statement"
else
  echo -e "${RED}❌ FAIL${NC}: Storage factory does not use switch statement pattern"
  errors=$((errors + 1))
fi
echo ""

# Final summary
echo "=========================================="
if [ $errors -eq 0 ]; then
  echo -e "${GREEN}🎉 All architecture validation tests passed!${NC}"
  echo -e "${GREEN}✅ Provider abstraction layer is correctly implemented.${NC}"
  echo ""
  echo "This means:"
  echo "  • Twilio can be swapped for another provider with minimal changes"
  echo "  • Storage backend can be changed via environment variable"
  echo "  • No vendor lock-in at the code level"
  exit 0
else
  echo -e "${RED}❌ $errors architecture validation test(s) failed.${NC}"
  echo -e "${RED}⚠️  Provider abstraction may not be correctly implemented.${NC}"
  exit 1
fi
