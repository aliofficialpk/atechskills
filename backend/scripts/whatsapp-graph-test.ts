import "dotenv/config";

interface Args {
  token: string;
  appId: string;
  businessId: string;
  phoneNumberId?: string;
  version: string;
}

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const args: Record<string, string> = {};
  for (let i = 0; i < raw.length; i += 2) {
    const key = raw[i]?.replace(/^--/, "");
    const value = raw[i + 1];
    if (key && value) args[key] = value;
  }

  const token = args.token ?? process.env.WHATSAPP_TOKEN;
  const appId = args.appId ?? process.env.WHATSAPP_APP_ID;
  const businessId = args.businessId ?? process.env.WHATSAPP_BUSINESS_ID;

  if (!token || !appId || !businessId) {
    console.error(
      "Usage: npm run whatsapp:graph-test -- --token <TOKEN> --appId <APP_ID> --businessId <BUSINESS_ID>\n" +
      "Or set WHATSAPP_TOKEN, WHATSAPP_APP_ID, WHATSAPP_BUSINESS_ID in .env"
    );
    process.exit(1);
  }

  return {
    token,
    appId,
    businessId,
    phoneNumberId: args.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID,
    version: args.version ?? process.env.WHATSAPP_API_VERSION ?? "v17.0"
  };
}

const argv = parseArgs();
const baseUrl = `https://graph.facebook.com/${argv.version}`;

async function callGraph(path: string, description: string, optional = false) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${baseUrl}/${path}${separator}access_token=${encodeURIComponent(argv.token)}`;
  const displayUrl = url.replace(encodeURIComponent(argv.token), "<TOKEN>");

  console.log(`\n=== ${description} ===`);
  console.log(displayUrl);

  const response = await fetch(url, { method: "GET" });
  const body = await response.text();
  console.log(`Status: ${response.status}`);
  try {
    console.log(JSON.stringify(JSON.parse(body), null, 2));
  } catch {
    console.log(body);
  }
  if (!response.ok) {
    const msg = `Graph API call failed for ${description} (HTTP ${response.status})`;
    if (optional) { console.warn(`⚠ Skipping optional call: ${msg}`); return; }
    throw new Error(msg);
  }
}

async function main() {
  console.log(`Using App ID: ${argv.appId}`);
  console.log(`Using Business ID: ${argv.businessId}`);
  console.log(`Phone Number ID: ${argv.phoneNumberId ?? "not provided"}`);
  console.log(`API Version: ${argv.version}`);

  await callGraph(`me?fields=id,name`, "Public profile / me");
  await callGraph(
    `debug_token?input_token=${encodeURIComponent(argv.token)}`,
    "Debug token (permissions + expiry)"
  );
  await callGraph(`${argv.appId}?fields=id,name`, "App public profile");

  // WhatsApp Business Management permission: access phone number details
  if (argv.phoneNumberId) {
    await callGraph(
      `${argv.phoneNumberId}?fields=display_phone_number,status,quality_rating`,
      "WhatsApp business management (phone number)"
    );
  } else {
    console.log("\n⚠ No phone number ID provided — skipping WhatsApp business management API call.");
    console.log("Add --phoneNumberId <ID> to test that permission explicitly.");
  }

  console.log("\n✓ All test calls completed successfully.");
  console.log("Check the Meta App Review panel — public_profile and whatsapp_business_management should now show API calls.");
}

main().catch((error) => {
  console.error("\n✗ Error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
