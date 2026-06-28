#!/bin/bash

# Script to update Twilio webhooks with new ngrok URL
# Run this whenever ngrok restarts and gives you a new URL

echo "🔄 Fetching ngrok URL..."

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
  echo "❌ Error: Could not fetch ngrok URL. Is ngrok running?"
  echo "   Start ngrok with: ngrok http 3000"
  exit 1
fi

echo "✅ Found ngrok URL: $NGROK_URL"
echo ""

# Update Twilio TwiML App
echo "🔄 Updating Twilio TwiML app..."
twilio api:core:applications:update \
  --sid APab9d2da1f0010da73de32e64ee9346fc \
  --voice-url "$NGROK_URL/api/voice/twiml" \
  --voice-method POST \
  --status-callback "$NGROK_URL/api/voice/status-callback" \
  --status-callback-method POST

if [ $? -eq 0 ]; then
  echo "✅ Twilio app updated!"
else
  echo "❌ Failed to update Twilio app"
  exit 1
fi

echo ""

# Update .env file
echo "🔄 Updating .env file..."
sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=\"$NGROK_URL\"|g" .env

if [ $? -eq 0 ]; then
  echo "✅ .env updated!"
else
  echo "❌ Failed to update .env"
  exit 1
fi

echo ""
echo "✅ All done! Configuration updated:"
echo "   🌐 ngrok URL: $NGROK_URL"
echo "   📞 Voice URL: $NGROK_URL/api/voice/twiml"
echo "   📊 Status Callback: $NGROK_URL/api/voice/status-callback"
echo ""
echo "🚀 Restart your dev server: npm run dev"
