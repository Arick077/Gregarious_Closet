/**
 * Extract raw text from PDF buffer supporting both pdf-parse v1 and v2
 * @param {Buffer} pdfBuffer
 * @returns {Promise<string>}
 */
async function extractRawPdfText(pdfBuffer) {
  let pdfParseModule;
  try {
    pdfParseModule = require('pdf-parse');
  } catch (err) {
    console.error('Failed to load pdf-parse:', err);
    throw new Error('PDF parsing library could not be loaded: ' + err.message);
  }

  if (typeof pdfParseModule === 'function') {
    const data = await pdfParseModule(pdfBuffer);
    return data.text || '';
  }
  
  if (pdfParseModule.PDFParse) {
    const uint8 = new Uint8Array(
      pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
    );
    const parser = new pdfParseModule.PDFParse(uint8);
    await parser.load();
    const result = await parser.getText();
    return result?.text || '';
  }

  if (typeof pdfParseModule.default === 'function') {
    const data = await pdfParseModule.default(pdfBuffer);
    return data.text || '';
  }

  throw new Error('Unsupported pdf-parse module format');
}

/**
 * Clean and structure raw PDF text into Markdown and chapter chunks.
 * @param {Buffer} pdfBuffer - The in-memory buffer of the uploaded PDF
 * @returns {Promise<{ contentMarkdown: String, chapters: Array, totalChapters: Number }>}
 */
async function convertPdfToMarkdown(pdfBuffer) {
  try {
    const rawText = await extractRawPdfText(pdfBuffer);

    if (!rawText || !rawText.trim()) {
      return { contentMarkdown: '', chapters: [], totalChapters: 0 };
    }

    // 1. Clean hyphenated line breaks (e.g. "phil- \n osophy" -> "philosophy")
    let cleaned = rawText.replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2');

    // 2. Remove repetitive running page numbers & common header/footer patterns
    cleaned = cleaned.replace(/\n\s*\d+\s*\n/g, '\n\n');
    cleaned = cleaned.replace(/\n\s*Page \d+( of \d+)?\s*\n/gi, '\n\n');

    // 3. Detect chapter headings using regex patterns
    // Matches: "CHAPTER 1", "Chapter I", "Part 2", "BOOK ONE", "Rule #1", etc.
    const chapterPattern = /(?:\n\s*)(?:#+\s*)?(CHAPTER\s+[0-9IVXLCDM]+|PART\s+[0-9IVXLCDM]+|BOOK\s+[0-9IVXLCDM]+|RULE\s+#[0-9IVXLCDM]+|RULE\s+[0-9IVXLCDM]+)(?:[:\s\-\.]*)([^\n]{0,60})(?=\r?\n)/gi;

    const chapters = [];
    let match;
    const splitIndices = [];

    while ((match = chapterPattern.exec(cleaned)) !== null) {
      const subtitle = match[2] ? match[2].trim() : '';
      splitIndices.push({
        index: match.index,
        title: `${match[1].trim()}${subtitle ? ' — ' + subtitle : ''}`
      });
    }

    if (splitIndices.length >= 2) {
      // If there is significant text before Chapter 1, include it as Introduction / Front Matter
      if (splitIndices[0].index > 500) {
        chapters.push({
          chapterNumber: 1,
          title: 'Introduction & Front Matter',
          content: cleaned.slice(0, splitIndices[0].index).trim()
        });
      }

      // Split text into detected chapters
      for (let i = 0; i < splitIndices.length; i++) {
        const start = splitIndices[i].index;
        const end = (i + 1 < splitIndices.length) ? splitIndices[i + 1].index : cleaned.length;
        const chapterText = cleaned.slice(start, end).trim();

        if (chapterText.length > 50) {
          chapters.push({
            chapterNumber: chapters.length + 1,
            title: splitIndices[i].title,
            content: chapterText
          });
        }
      }
    } else {
      // Fallback: If no explicit chapter keywords are found, split by ~2500 words per section
      const words = cleaned.split(/\s+/);
      const chunkSize = 2500;
      let chapterNum = 1;

      for (let i = 0; i < words.length; i += chunkSize) {
        const slice = words.slice(i, i + chunkSize).join(' ');
        chapters.push({
          chapterNumber: chapterNum,
          title: `Section ${chapterNum}`,
          content: slice
        });
        chapterNum++;
      }
    }

    // Combine into full markdown document
    const contentMarkdown = chapters.map((c) => `# ${c.title}\n\n${c.content}`).join('\n\n---\n\n');

    return {
      contentMarkdown,
      chapters,
      totalChapters: chapters.length
    };
  } catch (error) {
    console.error('PDF to Markdown conversion error:', error);
    return { contentMarkdown: '', chapters: [], totalChapters: 0 };
  }
}

module.exports = { convertPdfToMarkdown, extractRawPdfText };
