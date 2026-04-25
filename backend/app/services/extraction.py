from pypdf import PdfReader
from docx import Document as DocxDocument 
from io import BytesIO 
from fastapi import HTTPException
#fonction qui extrait le text dun pdf
def extract_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    text= ""
    for page in reader.pages:
        text+=page.extract_text() + "\n"
    return text

#fonction qui extrait le text dun word
def extract_docx(file_bytes: bytes) -> str:
    doc = DocxDocument(BytesIO(file_bytes))
    text = ""
    for paragraph in doc.paragraphs:
        text += paragraph.text +"\n"
    return text 


#fonction qui choisi le type d'extraction selon le type du fichier
def extract_text(filename: str,file_bytes: bytes) -> str:
    if filename.lower().endswith(".pdf"):
        return extract_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        return extract_docx(file_bytes)
    else:
        raise HTTPException(status_code=401,detail=f"Fromat du fichier {filename} n'est pas supporte")

