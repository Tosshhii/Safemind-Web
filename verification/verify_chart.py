from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the HTML file directly
        file_path = os.path.abspath('patient-profile.html')
        page.goto(f'file://{file_path}?id=mock-patient')

        # Wait for the loading state we added
        page.wait_for_selector('#progress-chart')

        # Take a screenshot of the initial state (should show "Loading progress history...")
        # Note: Since we don't have a real Firebase connection, it will likely stay in loading state or show empty/error
        # But we can verify the text is injected.

        # Check if the loading text is present
        content = page.inner_html('#progress-chart')
        print(f"Chart Content: {content}")

        # Take a screenshot
        page.screenshot(path='verification/chart_loading.png')

        # Also verify the findings card toggle
        # Click "Add Follow-up Findings"
        page.click('#add-findings-btn')

        # Check if card is visible (removed 'hidden' class)
        card = page.locator('#consultation-findings-card')
        is_hidden = 'hidden' in card.get_attribute('class')
        print(f"Card hidden after click: {is_hidden}")

        page.screenshot(path='verification/findings_card_visible.png')

        browser.close()

if __name__ == '__main__':
    run()
