import mechanicalsoup
import os
import sys
from urllib.parse import urljoin

BASE_URL = os.environ.get("BAIKAL_BASE_URL", "http://localhost/html/")
ADMIN_PASSWORD = "secret123"

def follow_link_containing(browser: mechanicalsoup.StatefulBrowser, text_substring: str):
    text_substring = text_substring.lower()
    page = browser.get_current_page()
    link = None
    for a in page.find_all("a"):
        text = " ".join(a.get_text().split()).lower()
        if text and text_substring in text:
            link = a
            break
    if link is None:
        raise RuntimeError(f"No link containing '{text_substring}' found on page")
    browser.follow_link(link)

def setup_admin_password(browser: mechanicalsoup.StatefulBrowser):
    browser.open(BASE_URL)
    page = browser.get_current_page()
    assert "baïkal initialization wizard" in page.text.lower()
    browser.select_form("form")
    browser["data[admin_passwordhash]"] = ADMIN_PASSWORD
    browser["data[admin_passwordhash_confirm]"] = ADMIN_PASSWORD
    browser.submit_selected()

def assert_installed(browser: mechanicalsoup.StatefulBrowser):
    # Confirmation page
    page = browser.get_current_page()
    assert "baïkal is now installed, and its database properly configured" in page.text.lower()

    # Landing page
    browser.open(BASE_URL)
    page = browser.get_current_page()
    assert "baïkal is running alright" in page.text.lower()
    follow_link_containing(browser, "login")

    # Login page
    browser.select_form("form")
    browser["login"] = "admin"
    browser["password"] = ADMIN_PASSWORD
    browser.submit_selected()

def assert_dashboard(browser: mechanicalsoup.StatefulBrowser):
    page = browser.get_current_page()
    assert "dashboard" in page.text.lower()
    assert "about this system" in page.text.lower()

def follow_meta_redirect(browser: mechanicalsoup.StatefulBrowser):
    page = browser.get_current_page()
    meta = page.find("meta", attrs={"http-equiv": lambda x: x and x.lower() == "refresh"})
    if meta:
        content = meta.get("content", "")
        if "url=" in content.lower():
            idx = content.lower().index("url=")
            url = content[idx + 4:].strip()
            url = urljoin(browser.get_url(), url)
            browser.open(url)

def find_and_follow_row_link(browser: mechanicalsoup.StatefulBrowser, row_text: str, link_text: str):
    page = browser.get_current_page()
    row_text_lower = row_text.lower()
    link_text_lower = link_text.lower()
    for tr in page.find_all("tr"):
        if row_text_lower in tr.get_text(strip=True).lower():
            for a in tr.find_all("a"):
                if a.get_text(strip=True) and link_text_lower in a.get_text(strip=True).lower():
                    browser.follow_link(a)
                    return
    raise RuntimeError(f"No row containing '{row_text}' with link '{link_text}' found on page")

def assert_upgrade(browser: mechanicalsoup.StatefulBrowser):
    browser.open(BASE_URL)
    page = browser.get_current_page()
    assert "baïkal upgrade wizard" in page.text.lower()
    browser.follow_link(text="Start upgrade")
    page = browser.get_current_page()
    assert "baïkal has been successfully upgraded" in page.text.lower()
    browser.follow_link(text="Access the Baïkal admin")
    # After upgrade the session is not authenticated; log in (supports legacy SHA-256 hashes)
    page = browser.get_current_page()
    if "authentication" in page.text.lower() or page.find("input", {"name": "password"}):
        browser.select_form("form")
        browser["login"] = "admin"
        browser["password"] = ADMIN_PASSWORD
        browser.submit_selected()
    assert_dashboard(browser)


def install_sqlite(browser: mechanicalsoup.StatefulBrowser):
    setup_admin_password(browser)

    page = browser.get_current_page()
    assert "baïkal database setup" in page.text.lower()

    browser.select_form("form")
    browser.submit_selected()

    assert_installed(browser)
    assert_dashboard(browser)


def install_mysql(browser: mechanicalsoup.StatefulBrowser):
    setup_admin_password(browser)

    page = browser.get_current_page()
    assert "baïkal database setup" in page.text.lower()
    browser.select_form("form")
    browser["data[backend]"] = "mysql"
    browser.submit_selected()

    page = browser.get_current_page()
    assert "mysql host" in page.text.lower()
    browser.select_form("form")
    browser["data[mysql_host]"] = "127.0.0.1"
    browser["data[mysql_dbname]"] = "baikal_test"
    browser["data[mysql_username]"] = "baikal"
    browser["data[mysql_password]"] = "baikal"
    browser.submit_selected()

    assert_installed(browser)
    assert_dashboard(browser)


def install_pgsql(browser: mechanicalsoup.StatefulBrowser):
    setup_admin_password(browser)

    page = browser.get_current_page()
    assert "baïkal database setup" in page.text.lower()
    browser.select_form("form")
    browser["data[backend]"] = "pgsql"
    browser.submit_selected()

    page = browser.get_current_page()
    assert "postgresql host" in page.text.lower()
    browser.select_form("form")
    browser["data[pgsql_host]"] = "127.0.0.1"
    browser["data[pgsql_dbname]"] = "baikal_test"
    browser["data[pgsql_username]"] = "baikal"
    browser["data[pgsql_password]"] = "baikal"
    browser.submit_selected()

    assert_installed(browser)
    assert_dashboard(browser)
