package com.webfuzzing.commons;

import com.webfuzzing.commons.faults.VersionNumbers;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


/**
 * Needed to run if we do any modification on version numbers
 */
public class ReadmeUpdater {

    public static void main(String[] args) throws IOException {

        replaceBetweenMarkers("README.md", "M1", VersionNumbers.AUTHENTICATION);
        replaceBetweenMarkers("README.md", "M2", VersionNumbers.FAULTS);
        replaceBetweenMarkers("README.md", "M3", VersionNumbers.REPORT);
        replaceBetweenMarkers("README.md", "M4", VersionNumbers.WEB_REPORT);
    }

    public static void replaceBetweenMarkers(String filePath, String marker, String newText)
            throws IOException {

        File file = new File(filePath);
        String content = readFile(file);

        // Build the regex pattern: <!-- M1 --> (.*?) <!-- M1 -->
        // Using DOTALL flag to handle multiline content between markers
        String regex = "<!-- " + Pattern.quote(marker) + " -->(.*?)<!-- " + Pattern.quote(marker) + " -->";
        Pattern pattern = Pattern.compile(regex, Pattern.DOTALL);
        Matcher matcher = pattern.matcher(content);

        if (!matcher.find()) {
            throw new IllegalStateException("No marker found: " + marker);
        }

        matcher.reset();
        String replacement = "<!-- " + marker + " -->" + newText + "<!-- " + marker + " -->";
        String updatedContent = matcher.replaceAll(Matcher.quoteReplacement(replacement));

        writeFile(file, updatedContent);
    }

    private static String readFile(File file) throws IOException {
        StringBuilder content = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        }
        return content.toString();
    }

    private static void writeFile(File file, String content) throws IOException {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
            writer.write(content);
        }
    }
}