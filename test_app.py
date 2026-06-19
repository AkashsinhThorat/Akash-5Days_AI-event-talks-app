import unittest
import app

class TestBigQueryReleaseNotes(unittest.TestCase):
    def setUp(self):
        app.app.testing = True
        self.client = app.app.test_client()

    def test_clean_html_content(self):
        html_input = "<h3>Feature</h3><p>You can enable <a href='http://test'>links</a> on tables. Use <code>SELECT</code>.</p>"
        cleaned = app.clean_html_content(html_input)
        self.assertIn("Feature:", cleaned)
        self.assertIn("links (http://test)", cleaned)
        self.assertIn("SELECT", cleaned)
        self.assertNotIn("<p>", cleaned)
        self.assertNotIn("<a>", cleaned)

    def test_parse_feed_xml(self):
        sample_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Test Feed</title>
          <entry>
            <title>June 17, 2026</title>
            <id>tag:google.com,2016:bigquery-release-notes#June_17_2026</id>
            <link rel="alternate" href="https://docs.cloud.google.com/bigquery/docs/release-notes"/>
            <content type="html"><![CDATA[<h3>Feature</h3><p>First update text.</p><h3>Announcement</h3><p>Second update text.</p>]]></content>
          </entry>
        </feed>
        """
        entries = app.parse_feed_xml(sample_xml.encode('utf-8'))
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]['date'], 'June 17, 2026')
        self.assertEqual(entries[0]['type'], 'Feature')
        self.assertIn('First update text', entries[0]['content_text'])
        
        self.assertEqual(entries[1]['date'], 'June 17, 2026')
        self.assertEqual(entries[1]['type'], 'Announcement')
        self.assertIn('Second update text', entries[1]['content_text'])

if __name__ == '__main__':
    unittest.main()
