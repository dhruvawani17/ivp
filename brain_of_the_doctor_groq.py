import base64
import os
from io import BytesIO

from dotenv import load_dotenv
from groq import Groq
from PIL import Image


load_dotenv()


def encode_image_for_groq(filepath):
    image = Image.open(filepath)
    image.thumbnail((1024, 1024))

    buffer = BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=75)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


from clinical_vision import analyze_skin_image_py


def brain_of_the_doctor(patient_text, image_filepath=None, video_filepath=None):
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("Missing GROQ_API_KEY in .env or environment")

    if not image_filepath:
        raise ValueError("Groq vision requires an image. Please upload a skin image.")

    image_data = encode_image_for_groq(image_filepath)

    # Compute quantitative Computer Vision metrics
    try:
        cv_data = analyze_skin_image_py(image_filepath)
        cv_summary = (
            f"\nQuantitative Dermoscopic Measurements:\n"
            f"- Fitzpatrick Skin Phototype: {cv_data['fitzpatrick_type']} (ITA: {cv_data['ita_degrees']} deg, {cv_data['fitzpatrick_note']})\n"
            f"- Asymmetry: {cv_data['asymmetry_percent']}%, Border Compactness: {cv_data['border_compactness']}\n"
            f"- Estimated Diameter: {cv_data['estimated_diameter_mm']} mm, TDS Risk Score: {cv_data['tds_score']} ({cv_data['risk_tier']})\n"
        )
    except Exception:
        cv_summary = ""

    video_note = ""
    if video_filepath:
        video_note = "\nPatient provided sequential multi-angle surface video capture with specular glare reduction."

    prompt = (
        "You are an expert clinical dermatologist. Speak with reassurance, clarity, and authority. "
        "Limit your entire response to two or three sentences maximum. "
        "Do not use any special characters, symbols, asterisks, or markdown formatting in your response because it will be converted directly to audio.\n\n"
        f"Patient text: {patient_text}\n"
        f"{cv_summary}"
        f"{video_note}"
    )

    client = Groq(api_key=groq_api_key)
    response = client.chat.completions.create(
        model=os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b"),
        max_completion_tokens=1000,
        messages=[
            {
                "role": "system",
                "content": "You are a clinical dermatologist consultant. Give high-precision medical guidance, not a final legal diagnosis.",
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}",
                        },
                    },
                ],
            },
        ],
    )

    return response.choices[0].message.content


# OLD CODE KEPT FOR REFERENCE
# import base64
# import os
# from io import BytesIO
#
# from dotenv import load_dotenv
# from groq import Groq
# from PIL import Image
#
#
# folder = os.path.dirname(__file__)
# env_path = os.path.join(folder, ".env")
# load_dotenv(env_path)
#
# api_key = os.environ.get("GROQ_API_KEY")
# if not api_key:
#     raise ValueError("Missing GROQ_API_KEY in .env or environment")
#
#
# image_path = os.path.join(folder, "sample-image.png")
#
# image = Image.open(image_path)
# image.thumbnail((1024, 1024))
#
# buffer = BytesIO()
# image.convert("RGB").save(buffer, format="JPEG", quality=75)
# image_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
#
# client = Groq(api_key=api_key)
#
# response = client.chat.completions.create(
#     model=os.environ.get("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct"),
#     max_completion_tokens=1000,
#     messages=[
#         {
#             "role": "system",
#             "content": "You are a helpful medical assistant. Give general information, not a diagnosis.",
#         },
#         {
#             "role": "user",
#             "content": [
#                 {
#                     "type": "text",
#                     "text": "What do you see in this image? Give general skin care advice, not a diagnosis.",
#                 },
#                 {
#                     "type": "image_url",
#                     "image_url": {
#                         "url": f"data:image/jpeg;base64,{image_data}",
#                     },
#                 },
#             ],
#         },
#     ],
# )
#
# print(response.choices[0].message.content)
