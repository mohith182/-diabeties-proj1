"""
DiabeatEase — Advanced AI Diabetes Assistant
A medically-aware platform for analyzing sugar levels, providing personalized 
health plans, daily routines, and safety guidance.
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from datetime import datetime
import math

app = Flask(__name__)
CORS(app)

# ═══════════════════════════════════════════════════════════════
# Medical Knowledge & Logic
# ═══════════════════════════════════════════════════════════════

DIABETES_DATA = {
    "meal_plans": {
        "low": {
            "breakfast": "🥣 Oatmeal with walnuts and flaxseeds + 1 boiled egg",
            "lunch": "🥗 Large garden salad with grilled chicken/tofu + olive oil dressing",
            "snack": "🍎 Small apple with a handful of almonds",
            "dinner": "🐟 Baked salmon with roasted asparagus and a small sweet potato",
            "foods_to_eat": ["Fiber-rich vegetables", "Lean proteins", "Healthy fats (omega-3)", "Low-GI fruits"],
            "foods_to_avoid": ["Refined sugars", "White bread", "Sweetened drinks", "Large portions of carbs"]
        },
        "normal": {
            "breakfast": "🥑 Whole wheat toast with avocado and two eggs",
            "lunch": "🍱 Quinoa bowl with black beans, peppers, and grilled turkey",
            "snack": "🥦 Greek yogurt (plain) with a few berries",
            "dinner": "🍲 Stir-fried lean beef with colorful bell peppers and broccoli",
            "foods_to_eat": ["Whole grains", "Leafy greens", "Legumes", "Nuts/seeds"],
            "foods_to_avoid": ["Processed snacks", "Excessive sodium", "Trans fats", "High-sugar desserts"]
        },
        "prediabetic": {
            "breakfast": "🥤 Green smoothie (spinach, kale, unsweetened protein powder) + chia seeds",
            "lunch": "🥗 Mediterranean Chickpea Salad (cucumbers, tomatoes, feta, lemon dressing)",
            "snack": "🥒 Hummus with cucumber slices and celery",
            "dinner": "🍗 Lemon Herb Chicken Breast with sautéed kale and cauliflower rice",
            "foods_to_eat": ["High-fiber plants", "Plant-based proteins", "Healthy oils", "Berries"],
            "foods_to_avoid": ["All sugary beverages", "White rice/flour", "Fried foods", "High-fructose corn syrup"]
        },
        "high": {
            "breakfast": "🥚 Spinach and mushroom omelet (3 egg whites, 1 whole egg) — low carb",
            "lunch": "🥗 Tofu or Chicken salad with mixed greens and no starchy carbs",
            "snack": "🥜 Handful of roasted seeds or raw walnuts",
            "dinner": "🥘 Zucchini noodles (Zoodles) with pesto and grilled shrimp",
            "foods_to_eat": ["Non-starchy veggies", "Very lean proteins", "Water/Herbal tea", "Small amounts of monounsaturated fats"],
            "foods_to_avoid": ["Pies/Cakes", "White bread/Pasta", "Potatoes", "Any added sugar", "Alcohol"]
        }
    },
    "exercise_plans": {
        "sedentary": ["🚶 15-minute slow walk after meals", "🧘 10-minute deep breathing/yoga", "💪 Light stretching twice a day"],
        "moderate": ["🚶 30-minute brisk walk", "🚲 20-minute light cycling", "🏋️ Bodyweight squats and lunges (2 sets of 10)"],
        "active": ["🏃 30-40 minute jog or swim", "🏋️ 30-minute strength training", "🎾 Engaging in a favorite sport or HIIT session"]
    },
    "routines": {
        "standard": [
            {"time": "07:00 AM", "activity": "☀️ Wake up & Drink a glass of water"},
            {"time": "07:30 AM", "activity": "📊 Check Blood Sugar (Fasting)"},
            {"time": "08:00 AM", "activity": "🥣 Healthy Breakfast & Medication (if prescribed)"},
            {"time": "10:30 AM", "activity": "💧 Hydration Reminder & Light Stretch"},
            {"time": "01:00 PM", "activity": "🥗 Balanced Lunch"},
            {"time": "02:00 PM", "activity": "🚶 15-minute Post-meal Walk"},
            {"time": "04:30 PM", "activity": "🍎 Healthy Snack"},
            {"time": "07:30 PM", "activity": "🌙 Light Dinner (at least 3 hours before sleep)"},
            {"time": "08:30 PM", "activity": "🧘 Relaxation / Stress Management (Meditation)"},
            {"time": "10:30 PM", "activity": "😴 Sleep (aim for 7-8 hours)"}
        ]
    }
}

# ─────────────────────────────────────────────────────────────
# Core Logic Functions
# ─────────────────────────────────────────────────────────────

def get_sugar_category(reading, test_type):
    """Categorizes blood sugar level based on type of test."""
    reading = float(reading)
    if test_type == "fasting":
        if reading < 70: return "low"
        if 70 <= reading <= 100: return "normal"
        if 101 <= reading <= 125: return "prediabetic"
        return "high"
    elif test_type == "post_meal":
        if reading < 140: return "normal"
        if 140 <= reading <= 199: return "prediabetic"
        return "high"
    else: # random
        if reading < 140: return "normal"
        if 140 <= reading <= 199: return "prediabetic"
        return "high"

def calculate_bmi(weight, height):
    """Calculates BMI from weight (kg) and height (cm)."""
    if not weight or not height: return None
    height_m = float(height) / 100
    return round(float(weight) / (height_m * height_m), 1)

def get_bmi_category(bmi):
    if bmi < 18.5: return "Underweight"
    if 18.5 <= bmi < 25: return "Normal weight"
    if 25 <= bmi < 30: return "Overweight"
    return "Obese"

# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    try:
        age = int(data.get("age", 0))
        weight = float(data.get("weight", 0))
        height = float(data.get("height", 0))
        sugar_value = float(data.get("sugar_value", 0))
        test_type = data.get("test_type", "fasting") # fasting, post_meal, random
        habits = data.get("habits", "sedentary")
        meds = data.get("medications", "")
        symptoms = data.get("symptoms", "")

        # 1. Categorize Sugar
        category = get_sugar_category(sugar_value, test_type)
        
        # 2. BMI
        bmi = calculate_bmi(weight, height)
        bmi_cat = get_bmi_category(bmi) if bmi else "N/A"

        # 3. Emergency Alerts
        emergency = None
        if category == "low" and sugar_value < 55:
            emergency = "🚨 CRITICAL LOW: Seek medical help immediately. Use the 15-15 rule if conscious."
        elif category == "high" and sugar_value > 300:
            emergency = "🚨 CRITICAL HIGH: Risk of DKA. Seek emergency medical attention immediately."

        # 4. Generate Plans
        meal_plan = DIABETES_DATA["meal_plans"].get(category)
        exercise_plan = DIABETES_DATA["exercise_plans"].get(habits)
        routine = DIABETES_DATA["routines"]["standard"]

        return jsonify({
            "status": "success",
            "analysis": {
                "category": category,
                "meaning": f"Your sugar level ({sugar_value} mg/dL) is categorized as {category.upper()}.",
                "bmi": bmi,
                "bmi_category": bmi_cat,
                "emergency": emergency
            },
            "plans": {
                "meal": meal_plan,
                "exercise": exercise_plan,
                "routine": routine
            },
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/chat", methods=["POST"])
def chat():
    # Simple fallback chat for questions
    data = request.json
    msg = data.get("message", "").lower()
    
    # Generic responses related to the provided prompt context
    if "help" in msg:
        return jsonify({"response": "I can analyze your blood sugar, provide meal plans, and help with routines. Try the 'Health Assessment' tool!"})
    
    return jsonify({"response": "I'm here to help manage your diabetes. For a full analysis, please use the Health Assessment tool in the sidebar."})

if __name__ == "__main__":
    print("\n" + "=" * 55)
    print("  🩺 DiabeatEase — Advanced AI Diabetes Assistant")
    print("  🌐 Running at http://localhost:5000")
    print("=" * 55 + "\n")
    app.run(debug=True, port=5000)
