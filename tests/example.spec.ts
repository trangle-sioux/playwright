import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('compare images', async ({ page }) => {
  test.setTimeout(60000);
  const pixelmatch = (await import('pixelmatch')).default;
  const { PNG } = await import('pngjs');
  // Navigate to the page
  await page.goto('https://www.google.com/');

  // Capture screenshot of the element
  const chooseAvatarElm = await page.locator('//img[@class="lnXdpd"]');
  const screenshotPath = path.join(__dirname, 'screenshots', 'actual_logo.png');
  await chooseAvatarElm.screenshot({ path: screenshotPath });

  await page.fill('textarea[name="q"]', 'Playwright testing');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#search');

  // Reference image path
  // const logoElm = await page.locator('//div[@class="logo"]');
  const logoElm = await page.locator('//div[@class="PZPZlf ssJ7i B5dxMb"]');
  const referenceImagePath = path.join(__dirname, 'screenshots', 'expected_logo.png');
  await logoElm.screenshot({ path: referenceImagePath });

  // // Ensure the reference image exists
  if (!fs.existsSync(referenceImagePath)) {
    console.warn('Reference image not found, saving current as reference.');
    fs.copyFileSync(screenshotPath, referenceImagePath);
    return;
  }

  // Load images for comparison
  const img1 = PNG.sync.read(fs.readFileSync(referenceImagePath));
  const img2 = PNG.sync.read(fs.readFileSync(screenshotPath));

  // Ensure dimensions match
  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error('Image dimensions do not match!');
  }

  // Create a diff image
  const diff = new PNG({ width: img1.width, height: img1.height });

  // Compare images
  const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
    threshold: 0.1, // Adjust sensitivity (0 = exact match, 1 = everything different)
  });

  // Save the diff image
  fs.writeFileSync(path.join(__dirname, 'screenshots', 'diff.png'), PNG.sync.write(diff));

  // Expect no significant differences
  expect(numDiffPixels).toBeLessThan(100); // Adjust tolerance
});
