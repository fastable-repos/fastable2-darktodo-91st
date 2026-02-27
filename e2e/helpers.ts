import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const screenshotDir = path.join(process.cwd(), 'e2e', 'screenshots')

export async function captureScreenshot(page: Page, name: string): Promise<void> {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }
  await page.screenshot({
    path: path.join(screenshotDir, `${name}.png`),
    fullPage: true,
  })
}

export function assertNoConsoleErrors(page: Page): () => void {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  return () => {
    if (errors.length > 0) {
      throw new Error(`Console errors detected:\n${errors.join('\n')}`)
    }
  }
}
