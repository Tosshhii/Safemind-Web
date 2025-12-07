from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Access via localhost
        page.goto('http://localhost:8000/patient-profile.html?id=mock-patient')

        # Wait a bit for JS to execute
        page.wait_for_timeout(2000)

        # Check chart content
        content = page.inner_html('#progress-chart')
        print(f"Chart Content: {content}")

        # Click button
        page.click('#add-findings-btn')
        page.wait_for_timeout(500)

        # Check card class
        card = page.locator('#consultation-findings-card')
        classes = card.get_attribute('class')
        print(f"Card classes: {classes}")

        page.screenshot(path='verification/chart_http.png')

        browser.close()

if __name__ == '__main__':
    run()
