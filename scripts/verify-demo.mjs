import { chromium } from "playwright-core";

const base = process.env.DEMO_URL ?? "http://127.0.0.1:3456";
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
const page = await context.newPage();
const failures = [];
const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(String(error)));
page.on("console", (message) => {
  const text = message.text();
  if (message.type() !== "error") return;
  if (text.includes("favicon") || text.includes("Failed to load resource")) return;
  consoleErrors.push(text);
});

function check(name, ok) {
  if (!ok) failures.push(name);
  console.log(`${ok ? "ok" : "FAIL"} ${name}`);
}

await page.goto(base);
await page.getByRole("heading", { name: "Meetings" }).waitFor();
check("product name", (await page.getByRole("link", { name: "Callnote, all meetings" }).innerText()) === "Callnote");
check("browser title", (await page.title()).includes("Callnote"));
check("dashboard title", await page.getByRole("link", { name: /Checkout outage review/ }).first().isVisible());
check("long meeting listed", await page.getByText("1 hr").first().isVisible());
check("processing meeting", await page.getByText("Processing").first().isVisible());

await page.getByLabel("Search meetings").fill("error budget");
await page.getByLabel("Search meetings").press("Enter");
await page.getByRole("heading", { name: /results for/ }).waitFor();
check("search hit", await page.getByRole("link", { name: /error budget/i }).first().isVisible());

await page.goto(`${base}/meetings/northwind-renewal/`);
await page.getByRole("heading", { name: "Northwind renewal" }).waitFor();
const line = page.getByRole("button", { name: /this year's rate held/i });
await line.click();
await page.waitForTimeout(400);
const active = page.locator("[data-active='true']");
check("transcript seek", (await active.innerText()).includes("this year's rate"));
check("play started", (await page.getByRole("button", { name: "Pause" }).count()) === 1);

await page.getByRole("button", { name: /Decision to renew/ }).filter({ hasText: "Jonah" }).click();
check("highlight seek", (await page.locator("[data-active='true']").innerText()).includes("don't announce"));

const action = page.getByRole("checkbox", { name: /Refresh the security questionnaire/ });
await action.check();
check("action item", await action.isChecked());

await page.getByPlaceholder("Find a line").fill("DPA");
check("transcript filter", (await page.getByText(/lines/).textContent())?.includes("line"));

const shareHref = await page.getByRole("link", { name: "Open shared clip" }).getAttribute("href");
check("share link", Boolean(shareHref && shareHref.includes("/share/northwind-decision")));
await page.getByRole("button", { name: "Copy clip link" }).click();
check("share copied", (await page.getByText(/Clip link copied|northwind-decision/).count()) >= 1);

await page.goto(`${base}/share/northwind-decision/`);
await page.getByRole("heading", { name: "Jonah's renewal decision" }).waitFor();
check("public clip", await page.getByText("Callnote clip", { exact: true }).isVisible());
check("clip title", (await page.title()).includes("Callnote"));

await page.setViewportSize({ width: 390, height: 800 });
await page.goto(`${base}/meetings/reliability-review/`);
await page.getByRole("heading", { name: "Checkout outage review" }).waitFor();
check("long meeting opens", await page.getByRole("button", { name: /Error budget spent/ }).filter({ hasText: "percent" }).isVisible());
check("many speakers", await page.getByText("Nora Ibrahim").first().isVisible());
check("recording label", await page.getByText("Recording", { exact: true }).first().isVisible());
const transcriptBox = await page.getByRole("region", { name: "Transcript" }).boundingBox();
const summaryBox = await page.getByRole("heading", { name: "Executive summary" }).boundingBox();
check("phone transcript above summary", Boolean(transcriptBox && summaryBox && transcriptBox.y < summaryBox.y));

await context.close();
await browser.close();
if (consoleErrors.length) {
  console.error(consoleErrors.join("\n"));
  process.exit(1);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("verified");
