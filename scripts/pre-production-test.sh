#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo "  Mr. Blu — Pre-Production Test Suite"
echo "========================================="
echo ""

STEP=0
TOTAL=7

step() {
  STEP=$((STEP + 1))
  echo ""
  echo "--- Step ${STEP}/${TOTAL}: $1..."
}

step "Type checking"
npm run check

step "Linting"
npm run lint

step "Unit tests"
npm run test:unit

step "Building application"
npm run build

step "Building Storybook"
npm run build-storybook

step "Visual regression tests"
npx playwright test --project=visual-mobile --project=visual-desktop

step "E2E tests"
npx playwright test --project='Desktop Chrome'

echo ""
echo "========================================="
echo "  All checks passed!"
echo "========================================="
