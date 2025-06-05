package com.webfuzzing.commons.report;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

public class ReportTest {

    @Test
    public void testGeneratedReportClasses() {

        Report report = new Report();
        assertNotNull(report);
    }
}
