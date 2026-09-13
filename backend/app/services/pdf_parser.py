import os
import re

from pypdf import PdfReader
from pypdf.errors import PdfReadError

# A 4 GB VPS extracts text into memory before the LLM call, and the model only
# sees the first few thousand characters anyway. Cap both so one pathological
# upload cannot exhaust the box.
MAX_PAGES = 300
MAX_CHARS = 400_000


class DocumentParser:
    """Extracts plain text from an uploaded document.

    Every failure path raises ValueError with a message meant for the user, so the
    upload route can turn it into a 400 instead of a 500 stack trace.
    """

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        try:
            reader = PdfReader(file_path)
        except PdfReadError as e:
            raise ValueError(f"Not a readable PDF: {e}") from e

        if reader.is_encrypted:
            # An empty user password is common for "print-protected" files and
            # decrypts without input; anything else needs a password we do not have.
            try:
                if reader.decrypt("") == 0:
                    raise ValueError("This PDF is password-protected.")
            except (NotImplementedError, PdfReadError) as e:
                raise ValueError(f"This PDF uses unsupported encryption: {e}") from e

        pages = []
        total = 0
        for page in reader.pages[:MAX_PAGES]:
            try:
                text = page.extract_text() or ""
            except Exception:
                continue  # One malformed page must not lose the whole document.
            if not text:
                continue
            pages.append(text)
            total += len(text)
            if total >= MAX_CHARS:
                break

        return DocumentParser._normalise("\n\n".join(pages))

    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        if not os.path.exists(file_path):
            raise ValueError("Uploaded file is missing.")

        if file_path.lower().endswith(".pdf"):
            return DocumentParser.extract_text_from_pdf(file_path)

        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return DocumentParser._normalise(f.read(MAX_CHARS))

    @staticmethod
    def _normalise(raw: str) -> str:
        """Collapse whitespace but keep paragraph breaks.

        The previous `\\s+ -> ' '` flattened everything onto one line, which
        destroyed the structure the extractor uses to find headings and lists.
        """
        text = raw.replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"[ \t\f\v]+", " ", text)
        text = re.sub(r" *\n *", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


doc_parser = DocumentParser()
