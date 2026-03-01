#!/bin/bash
set -e

KEYS_DIR="$(cd "$(dirname "$0")" && pwd)/.keys"
mkdir -p "$KEYS_DIR"

echo ""
echo "=========================================="
echo "  Mr. Blu — Mobile Store Credentials Setup"
echo "=========================================="
echo ""

# ─────────────────────────────────────────────
# APPLE — App Store Connect API Key
# ─────────────────────────────────────────────
echo "──── APPLE (App Store Connect) ────"
echo ""
echo "Account: ilnkostia-dev@proton.me"
echo ""
echo "You need an App Store Connect API Key."
echo "This avoids 2FA issues and is the recommended auth method."
echo ""
echo "Steps to create one:"
echo "  1. Go to https://appstoreconnect.apple.com/access/integrations/api"
echo "  2. Click '+' to create a new key"
echo "  3. Name: 'Mr Blu Fastlane'"
echo "  4. Access: 'App Manager' (or 'Admin' for full control)"
echo "  5. Download the .p8 file (you can only download it ONCE)"
echo "  6. Note the Key ID and Issuer ID shown on the page"
echo ""

if [ -f "$KEYS_DIR/AuthKey.p8" ] && [ -f "$KEYS_DIR/asc-api-key.json" ]; then
  echo "✓ Apple API key already configured"
  echo ""
else
  read -p "Do you have your .p8 file ready? (y/n): " HAS_P8

  if [ "$HAS_P8" = "y" ]; then
    read -p "Path to your AuthKey .p8 file: " P8_PATH
    cp "$P8_PATH" "$KEYS_DIR/AuthKey.p8"
    echo "✓ Copied .p8 key"

    read -p "Key ID (10 characters, e.g. ABC1234DEF): " KEY_ID
    read -p "Issuer ID (UUID, shown above the keys list): " ISSUER_ID

    cat > "$KEYS_DIR/asc-api-key.json" << EOF
{
  "key_id": "$KEY_ID",
  "issuer_id": "$ISSUER_ID"
}
EOF
    echo "✓ Apple API key configured"
  else
    echo ""
    echo "⚠ Skipping Apple setup. Run this script again after creating the key."
    echo "  Place your files manually:"
    echo "    $KEYS_DIR/AuthKey.p8"
    echo "    $KEYS_DIR/asc-api-key.json (copy from asc-api-key.example.json)"
  fi
fi

echo ""

# ─────────────────────────────────────────────
# APPLE — Team IDs
# ─────────────────────────────────────────────
if [ -z "$APPLE_TEAM_ID" ]; then
  echo "You also need your Apple Team ID and App Store Connect Team ID."
  echo "  - Team ID: https://developer.apple.com/account → Membership Details"
  echo "  - ITC Team ID: Usually the same, found in App Store Connect URL"
  echo ""
  read -p "Apple Developer Team ID (10 chars): " TEAM_ID
  read -p "App Store Connect Team ID (or press Enter if same): " ITC_ID
  ITC_ID=${ITC_ID:-$TEAM_ID}

  echo ""
  echo "Add these to your shell profile (~/.zshrc):"
  echo "  export APPLE_TEAM_ID=\"$TEAM_ID\""
  echo "  export ITC_TEAM_ID=\"$ITC_ID\""
  echo ""
fi

# ─────────────────────────────────────────────
# GOOGLE — Play Store Service Account
# ─────────────────────────────────────────────
echo "──── GOOGLE (Play Store) ────"
echo ""
echo "Account: ilnkostia@gmail.com"
echo ""
echo "You need a Google Cloud Service Account with Play Store API access."
echo ""
echo "Steps to create one:"
echo "  1. Go to https://play.google.com/console"
echo "  2. Settings → API access → Link a Google Cloud project"
echo "  3. Create a new service account (or use existing):"
echo "     a. In Google Cloud Console → IAM → Service Accounts"
echo "     b. Create account: 'mrblu-play-deploy'"
echo "     c. Grant role: 'Service Account User'"
echo "     d. Create a JSON key → Download it"
echo "  4. Back in Play Console → API access → Grant access to the service account"
echo "     a. Set permissions: 'Release to production' or 'Release apps to testing tracks'"
echo "  5. Add the app (com.mrblu.app) to the service account's access"
echo ""

if [ -f "$KEYS_DIR/google-play-key.json" ]; then
  echo "✓ Google Play key already configured"
else
  read -p "Do you have your Google Play JSON key file? (y/n): " HAS_KEY

  if [ "$HAS_KEY" = "y" ]; then
    read -p "Path to your JSON key file: " KEY_PATH
    cp "$KEY_PATH" "$KEYS_DIR/google-play-key.json"
    echo "✓ Google Play key configured"
  else
    echo ""
    echo "⚠ Skipping Google Play setup. Run this script again after creating the key."
    echo "  Place your key at: $KEYS_DIR/google-play-key.json"
  fi
fi

echo ""

# ─────────────────────────────────────────────
# ANDROID — Signing Keystore
# ─────────────────────────────────────────────
echo "──── ANDROID SIGNING KEYSTORE ────"
echo ""

KEYSTORE_PATH="$(cd "$(dirname "$0")" && pwd)/android/app/release.keystore"

if [ -f "$KEYSTORE_PATH" ]; then
  echo "✓ Release keystore already exists"
else
  read -p "Create a new signing keystore now? (y/n): " CREATE_KS

  if [ "$CREATE_KS" = "y" ]; then
    echo ""
    read -p "Keystore password: " -s KS_PASS
    echo ""
    read -p "Key alias (default: mrblu): " KEY_ALIAS
    KEY_ALIAS=${KEY_ALIAS:-mrblu}

    keytool -genkeypair \
      -v \
      -storetype PKCS12 \
      -keystore "$KEYSTORE_PATH" \
      -alias "$KEY_ALIAS" \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000 \
      -storepass "$KS_PASS" \
      -keypass "$KS_PASS" \
      -dname "CN=Mr. Blu, O=Mr. Blu, L=Unknown, ST=Unknown, C=US"

    # Create keystore.properties
    cat > "$(cd "$(dirname "$0")" && pwd)/android/keystore.properties" << EOF
storeFile=release.keystore
storePassword=$KS_PASS
keyAlias=$KEY_ALIAS
keyPassword=$KS_PASS
EOF

    echo "✓ Keystore created at: $KEYSTORE_PATH"
    echo "✓ keystore.properties written"
    echo ""
    echo "⚠ IMPORTANT: Back up your keystore! If you lose it, you can never"
    echo "  update your app on Google Play."
  else
    echo "⚠ Skipping keystore creation."
    echo "  Create one later with:"
    echo "  keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias mrblu -keyalg RSA -keysize 2048 -validity 10000"
  fi
fi

echo ""
echo "=========================================="
echo "  Setup Summary"
echo "=========================================="
echo ""
[ -f "$KEYS_DIR/AuthKey.p8" ] && echo "  ✓ Apple API Key (.p8)" || echo "  ✗ Apple API Key (.p8) — needed for TestFlight/App Store"
[ -f "$KEYS_DIR/asc-api-key.json" ] && echo "  ✓ Apple API Key config" || echo "  ✗ Apple API Key config — needed for TestFlight/App Store"
[ -f "$KEYS_DIR/google-play-key.json" ] && echo "  ✓ Google Play JSON key" || echo "  ✗ Google Play JSON key — needed for Play Store"
[ -f "$KEYSTORE_PATH" ] && echo "  ✓ Android signing keystore" || echo "  ✗ Android signing keystore — needed for release builds"
echo ""
echo "Commands:"
echo "  pnpm --filter web deploy:ios:beta      # Upload to TestFlight"
echo "  pnpm --filter web deploy:android:internal  # Upload to Play Store internal"
echo ""
