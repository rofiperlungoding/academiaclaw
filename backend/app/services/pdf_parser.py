from pypdf import PdfReader
from typing import Tuple
import re

class DocumentParser:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        reader = PdfReader(file_path)
        extracted_pages = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                extracted_pages.append(page_text)
        raw_text = "\n\n".join(extracted_pages)
        cleaned_text = re.sub(r'\s+', ' ', raw_text).strip()
        return cleaned_text

    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        if file_path.lower().endswith(".pdf"):
            return DocumentParser.extract_text_from_pdf(file_path)
        else:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            return re.sub(r'\s+', ' ', content).strip()

doc_parser = DocumentParser()
