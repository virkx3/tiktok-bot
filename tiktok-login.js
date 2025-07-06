module.exports = async function login(page) {
  await page.goto('https://www.tiktok.com/login/phone-or-email/email', { timeout: 60000 });
  await page.fill('input[name="email"]', 'sociaixzl3s');
  await page.fill('input[name="password"]', 'Virksaab@12345');
  await page.click('button:has-text("Log in")');
  await page.waitForTimeout(5000);
};