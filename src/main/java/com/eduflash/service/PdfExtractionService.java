package com.eduflash.service;

import com.eduflash.exception.PdfProcessingException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.io.MemoryUsageSetting;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class PdfExtractionService {

    /**
     * Extracts text from a local PDF file.
     *
     * @param localFilePath The absolute path to the PDF file.
     * @return The extracted text.
     * @throws PdfProcessingException if the file is corrupted or unreadable.
     */
    public String extractTextFromPdf(String localFilePath) {
        Path path = Paths.get(localFilePath);
        File file = path.toFile();

        try (PDDocument document = PDDocument.load(file, MemoryUsageSetting.setupTempFileOnly())) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        } catch (IOException e) {
            throw new PdfProcessingException("Failed to read or process the PDF file: " + localFilePath, e);
        }
    }

    /**
     * Safely truncates the text to a maximum number of characters to avoid massive payloads.
     *
     * @param fullText  The full extracted text.
     * @param maxTokens The maximum number of characters to keep.
     * @return The chunked/truncated text.
     */
    public String chunkText(String fullText, int maxTokens) {
        if (fullText == null) {
            return null;
        }
        if (fullText.length() <= maxTokens) {
            return fullText;
        }
        return fullText.substring(0, maxTokens);
    }
}
