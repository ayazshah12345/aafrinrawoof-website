import io
import pandas as pd
from typing import List, Dict, Any

def generate_csv_report(data: List[Dict[str, Any]]) -> bytes:
    df = pd.DataFrame(data)
    output = io.StringIO()
    df.to_csv(output, index=False)
    return output.getvalue().encode('utf-8')

def generate_excel_report(data: List[Dict[str, Any]], sheet_name: str = "Sales Report") -> bytes:
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name=sheet_name, index=False)
    return output.getvalue()
