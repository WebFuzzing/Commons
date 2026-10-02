package com.webfuzzing.commons.report;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class WebReportResourcesTest {

    private static String readResource(String path) throws IOException {
        try (InputStream in = WebReportResourcesTest.class.getResourceAsStream(path)) {
            assertNotNull(in, "Missing resource on classpath: " + path);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int n;
            while ((n = in.read(buffer)) != -1) {
                out.write(buffer, 0, n);
            }
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    @Test
    public void testSummaryCliIsPackaged() throws IOException {
        String content = readResource("/webreport/wfc-summary.cjs");
        assertTrue(content.contains("<!-- wfc-summary:pr-comment -->"));
    }
}
