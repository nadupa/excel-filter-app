from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI(
    title="Excel Filter API",
    description="Backend for the Excel Filter App",
    version="1.0.0",
)

# Allow our React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://YOUR-CLOUDFLARE-DOMAIN"],
    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Excel Filter API is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/upload")
async def upload_excel(file: UploadFile = File(...)):

    if not file.filename.endswith((".xlsx", ".xls")):
        return {
            "success": False,
            "message": "Please upload an Excel file."
        }

    contents = await file.read()

    try:
        df = pd.read_excel(io.BytesIO(contents))

        # Remove completely empty rows
        df = df.dropna(how="all")

        # Replace NaN values with empty strings
        df = df.fillna("")

        # Convert column names to strings
        df.columns = df.columns.astype(str)

        # Get unique values for every column
        categories = {}

        for column in df.columns:
            values = (
                df[column]
                .astype(str)
                .str.strip()
                .replace("", pd.NA)
                .dropna()
                .unique()
                .tolist()
            )

            categories[column] = sorted(values)

        return {
            "success": True,
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": df.columns.tolist(),
            "categories": categories,
            "data": df.to_dict(orient="records"),
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"Could not process Excel file: {str(e)}"
        }
