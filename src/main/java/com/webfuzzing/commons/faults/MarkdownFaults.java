package com.webfuzzing.commons.faults;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

import static com.webfuzzing.commons.faults.FaultCategoryGroup.*;

/**
 * Create Markdown documentation based on selection of fault categories
 */
public class MarkdownFaults {

    public static void createMarkdown(String filePath, List<FaultCategory> faultCategories){

        String markdown = getMarkdown(faultCategories);

        try {
            Files.write(Paths.get(filePath), markdown.getBytes());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static String getMarkdown(List<FaultCategory> faultCategories) {

        StringBuilder sb = new StringBuilder();
        sb.append("# Fault Category Descriptions\n");
        sb.append("\n");
        sb.append("## Summary\n");
        long g1xx = faultCategories.stream().filter(it -> it.getGroup() == G_1XX).count();
        long g2xx = faultCategories.stream().filter(it -> it.getGroup() == G_2XX).count();
        long g3xx = faultCategories.stream().filter(it -> it.getGroup() == G_3XX).count();
        sb.append("Total: " + (g1xx + g2xx + g3xx)+"\n\n");
        sb.append("_" + G_1XX.description + "_ (1xx): "+ g1xx+"\n\n");
        sb.append("_" + G_2XX.description + "_ (2xx): "+ g2xx +"\n\n");
        sb.append("_" + G_3XX.description + "_ (3xx): "+ g3xx+"\n\n");

        sb.append("\n");
        sb.append("## Details\n");
        sb.append("|__Code__|__Name__|__Description__|\n");
        sb.append("|---:|:---|:---|\n");
        faultCategories.stream().sorted().forEach(it -> {
           sb.append("|");
           sb.append(it.getCode());
           sb.append("|");
           sb.append(it.getDescriptiveName());
           sb.append("|");
           sb.append(it.getFullDescription());
           sb.append("|");
           sb.append("\n");
        });

        return sb.toString();
    }
}
